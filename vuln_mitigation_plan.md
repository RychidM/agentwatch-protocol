# AgentWatch Relay — Vulnerability Mitigation Plan

**Source:** Strix source code security scan — 2026-03-29  
**Full reports:** `vuln-0001.md`, `vuln-0002.md`, `vuln-0003.md`  
**Overall posture:** MODERATE — 3 confirmed vulnerabilities, all major security controls verified working  
**Target for resolution:** Before v1.0 public release

---

## What the scan confirmed is working

Before the fixes — these controls passed and do not need attention:

- SSRF protection — two-layer defence, validation at registration time and before forwarding
- Authentication — `requireApiKey` middleware applied to all authenticated routes
- Rate limiting — per-API-key sliding window correctly implemented
- Authorisation — pairing ID scoping enforced, cross-pairing access denied
- Input validation — full protocol schema with `additionalProperties: false` and `maxLength` on `/action`, `/register`, `/resolve`
- Credential handling — all secrets from environment variables, no hardcoded values
- Health endpoint — returns only version and uptime, no sensitive data
- Session management — background crash detection task working correctly
- Logging — no `encryptedBlob` or credentials logged anywhere

---

## Vulnerability summary

| ID | Location | Severity | Effort |
|----|---------|----------|--------|
| VULN-0001 | `src/http/routes/heartbeat.ts` lines 20–35 | High | ~1 hour |
| VULN-0002 | `src/routing/SessionRouter.ts` lines 120–124 and 130–136 | High | ~2 hours |
| VULN-0003 | `src/store/DisconnectStore.ts` lines 21–37 | High | ~2 hours |

Fix order: VULN-0003 first (can crash the relay process), then VULN-0001 (security consistency), then VULN-0002 (long-term stability).

---

## VULN-0001 — Missing schema validation on POST /session/heartbeat

**CWE-20 | CVSS 7.5**

### What the code actually does

```typescript
// src/http/routes/heartbeat.ts lines 20–35 — current code
router.post('/session/heartbeat', (req: Request, res: Response) => {
  const { sessionId } = req.body as { sessionId?: unknown };

  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    res.status(400).json({ error: 'sessionId must be a non-empty string' });
    return;
  }

  const found = sessionRouter.recordHeartbeat(sessionId);
  if (!found) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  res.status(200).json({ ok: true });
});
```

Every other endpoint uses `validate.pushPayload()`, `validate.deviceRegistration()`, and `validate.approvalResponse()` from `@agentwatch/protocol`. This endpoint uses a bare `typeof` check. It does not enforce `maxLength`, does not reject extra fields (`additionalProperties: false`), and does not follow the protocol schema pattern required by the agent instructions.

### Step 1 — Add SessionHeartbeat type to the protocol package

```typescript
// @agentwatch/protocol — src/types/heartbeat.ts (new file)
export interface SessionHeartbeat {
  /** Session to keep alive — maxLength 128 */
  sessionId: string;
}
```

```json
// @agentwatch/protocol — schemas/heartbeat.schema.json (new file)
{
  "$id": "SessionHeartbeat",
  "type": "object",
  "properties": {
    "sessionId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 128
    }
  },
  "required": ["sessionId"],
  "additionalProperties": false
}
```

Export `validate.sessionHeartbeat` from the package's validate index alongside the existing validators. Bump the protocol package **patch** version — this is a new type, nothing existing changed.

### Step 2 — Fix the heartbeat handler

```diff
+ import { validate } from "@agentwatch/protocol";
  import { Router } from 'express';
  import type { Request, Response } from 'express';

  router.post('/session/heartbeat', (req: Request, res: Response) => {
-   const { sessionId } = req.body as { sessionId?: unknown };
-
-   if (typeof sessionId !== 'string' || sessionId.length === 0) {
-     res.status(400).json({ error: 'sessionId must be a non-empty string' });
-     return;
-   }
+   const result = validate.sessionHeartbeat(req.body);
+   if (!result.success) {
+     res.status(400).json({ error: 'Invalid request body' });
+     // Do not expose result.errors to clients in production
+     return;
+   }
+
+   const { sessionId } = result.data;

    const found = sessionRouter.recordHeartbeat(sessionId);
    if (!found) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.status(200).json({ ok: true });
  });
```

### Tests to add

```typescript
describe('POST /session/heartbeat — schema validation', () => {
  it('rejects missing sessionId', async () => {
    const res = await request(app)
      .post('/session/heartbeat')
      .set('Authorization', `Bearer ${testApiKey}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects sessionId exceeding maxLength', async () => {
    const res = await request(app)
      .post('/session/heartbeat')
      .set('Authorization', `Bearer ${testApiKey}`)
      .send({ sessionId: 'a'.repeat(129) });
    expect(res.status).toBe(400);
  });

  it('rejects extra fields (additionalProperties: false)', async () => {
    const res = await request(app)
      .post('/session/heartbeat')
      .set('Authorization', `Bearer ${testApiKey}`)
      .send({ sessionId: 'sess-001', extra: 'field' });
    expect(res.status).toBe(400);
  });

  it('rejects empty string sessionId', async () => {
    const res = await request(app)
      .post('/session/heartbeat')
      .set('Authorization', `Bearer ${testApiKey}`)
      .send({ sessionId: '' });
    expect(res.status).toBe(400);
  });

  it('accepts valid heartbeat', async () => {
    const res = await request(app)
      .post('/session/heartbeat')
      .set('Authorization', `Bearer ${testApiKey}`)
      .send({ sessionId: 'sess-001' });
    expect(res.status).toBe(200);
  });
});
```

---

## VULN-0002 — Rate limiter memory leak

**CWE-400 | CVSS 7.5**

### What the code actually does

The `evict(key: string)` method exists in `RateLimiter.ts` and takes a single key to remove. Two specific locations in `SessionRouter.ts` handle token-invalid push failures — one for APNs and one for FCM — and both call `this.store.remove(session.sessionId)` but never call `evict()`. The `RateLimiter` is not currently a dependency of `SessionRouter`.

### The fix — two parts

**Part 1 — Pass RateLimiter to SessionRouter**

```diff
  // src/routing/SessionRouter.ts
  constructor(
    private readonly store: SessionStore,
    private readonly apns: ApnsProvider | null,
    private readonly fcm: FcmProvider | null,
+   private readonly rateLimiter?: RateLimiter,
  ) {}
```

**Part 2 — Evict on token-invalid in both push paths**

```diff
  // APNs path — lines 120–124
        const result = await this.apns.sendPush(
          session.deviceToken,
          payload,
          pushType,
        );
-       if (!result.ok && result.tokenInvalid)
-         this.store.remove(session.sessionId);
+       if (!result.ok && result.tokenInvalid) {
+         this.store.remove(session.sessionId);
+         this.rateLimiter?.evict(session.pairingId);
+       }
        return result.ok ? { ok: true } : { ok: false, error: result.error };
```

```diff
  // FCM path — lines 130–136
      const result = await this.fcm.sendPush(
        session.deviceToken,
        payload,
        pushType,
      );
-     if (!result.ok && result.tokenInvalid) this.store.remove(session.sessionId);
+     if (!result.ok && result.tokenInvalid) {
+       this.store.remove(session.sessionId);
+       this.rateLimiter?.evict(session.pairingId);
+     }
      return result.ok ? { ok: true } : { ok: false, error: result.error };
```

**Part 3 — Add periodic cleanup as belt-and-suspenders**

The token-invalid path covers the most common case. Add a periodic cleanup in `src/index.ts` to catch anything the token-invalid path misses (inactivity expiry, edge cases):

```typescript
// src/index.ts
const EVICTION_INTERVAL_MS = 10 * 60 * 1000;  // every 10 minutes
const EVICTION_TTL_MS      = 60 * 60 * 1000;  // evict if inactive > 1 hour

setInterval(() => {
  // Evict keys where all timestamps are outside the sliding window
  rateLimiter.cleanExpired(EVICTION_TTL_MS);
}, EVICTION_INTERVAL_MS).unref();
// .unref() prevents this timer from keeping the process alive in tests
```

This requires adding a `cleanExpired(ttlMs: number)` method to `RateLimiter` that iterates the map and removes entries whose last timestamp is older than `ttlMs`:

```typescript
// src/auth/RateLimiter.ts — add alongside existing evict()
cleanExpired(ttlMs: number): void {
  const cutoff = Date.now() - ttlMs;
  for (const [key, timestamps] of this.windows) {
    const lastActivity = timestamps.at(-1) ?? 0;
    if (lastActivity < cutoff) {
      this.windows.delete(key);
    }
  }
}
```

### Tests to add

```typescript
describe('RateLimiter memory management', () => {
  it('evict() removes the specified key', () => {
    const limiter = new RateLimiter(100, 60_000);
    limiter.check('pairing-a');
    limiter.check('pairing-b');
    expect(limiter.size()).toBe(2);

    limiter.evict('pairing-a');
    expect(limiter.size()).toBe(1);
  });

  it('cleanExpired() removes keys inactive beyond TTL', () => {
    const limiter = new RateLimiter(100, 60_000);
    limiter.check('pairing-a');
    limiter.check('pairing-b');

    // Evict anything inactive for 0ms — everything qualifies
    limiter.cleanExpired(0);
    expect(limiter.size()).toBe(0);
  });

  it('cleanExpired() keeps recently active keys', () => {
    const limiter = new RateLimiter(100, 60_000);
    limiter.check('pairing-a');

    // 1-hour TTL — pairing-a was just active, should survive
    limiter.cleanExpired(60 * 60 * 1000);
    expect(limiter.size()).toBe(1);
  });

  it('SessionRouter evicts rate limiter on tokenInvalid', async () => {
    const evictSpy = jest.spyOn(rateLimiter, 'evict');
    mockApns.sendPush.mockResolvedValueOnce({ ok: false, tokenInvalid: true });

    await sessionRouter.routeAction(validSession, validPayload);

    expect(evictSpy).toHaveBeenCalledWith(validSession.pairingId);
  });
});
```

---

## VULN-0003 — Missing Redis error handling in DisconnectStore

**CWE-400 | CVSS 7.5**

### What the code actually does

```typescript
// src/store/DisconnectStore.ts — current code

async setDisconnected(pairingId: string): Promise<void> {
  await this.redis.set(`disconnected:${pairingId}`, "1");  // no try-catch
}

async clearDisconnected(pairingId: string): Promise<void> {
  await this.redis.del(`disconnected:${pairingId}`);       // no try-catch
}

async isDisconnected(pairingId: string): Promise<boolean> {
  const val = await this.redis.get(`disconnected:${pairingId}`);  // no try-catch
  return val !== null;
}
```

And in `src/http/routes/action.ts` line 99:

```typescript
const disconnected = await disconnectStore.isDisconnected(req.pairingId);
// No try-catch — if Redis throws, the unhandled exception crashes the handler
```

### The fail-open vs fail-closed decision

Strix recommends **fail-closed** (`return true` — assume disconnected). The reasoning is preventing unintended push delivery.

**We choose fail-open** (`return false` — assume connected) for these reasons:

The disconnected flag is a user convenience feature. Redis unavailability is an infrastructure event completely unrelated to the user's intent. During an outage, fail-closed means every single agent action silently drops its push notification for the entire outage duration — the developer has no idea why approvals stopped arriving. Fail-open means the developer receives an unexpected push when they thought their phone was paused — a minor surprise.

If the user genuinely disconnected before the Redis outage, the flag is still in Redis and will be read correctly as soon as Redis recovers. The fail-open behaviour applies only to the narrow window where Redis is actually down.

**This decision must be documented in the code explicitly**, as required by the security rules.

### The fix

```diff
  // src/store/DisconnectStore.ts

  async isDisconnected(pairingId: string): Promise<boolean> {
+   try {
      const val = await this.redis.get(`disconnected:${pairingId}`);
      return val !== null;
+   } catch (err) {
+     // Redis is unavailable. Deliberate choice: FAIL OPEN.
+     //
+     // Rationale: the disconnected flag is a user convenience feature.
+     // Redis unavailability is an infrastructure event, not a user action.
+     // Fail-open = unexpected push sent to user (minor annoyance).
+     // Fail-closed = all pushes silently dropped for the entire outage
+     //               duration (developer has no idea why approvals stopped).
+     //
+     // The flag is durable in Redis — it survives the outage and is read
+     // correctly on the next request once Redis recovers.
+     logger.warn({
+       event: 'redis_unavailable',
+       operation: 'isDisconnected',
+       pairingId,
+       err: err instanceof Error ? err.message : String(err),
+       decision: 'fail_open',
+     });
+     return false;
+   }
  }

  async setDisconnected(pairingId: string): Promise<void> {
+   try {
      await this.redis.set(`disconnected:${pairingId}`, "1");
+   } catch (err) {
+     // Cannot persist the disconnect flag — Redis is unavailable.
+     // Throw so the HTTP handler can return 503 and the client can retry.
+     logger.error({
+       event: 'redis_unavailable',
+       operation: 'setDisconnected',
+       pairingId,
+       err: err instanceof Error ? err.message : String(err),
+     });
+     throw err;
+   }
  }

  async clearDisconnected(pairingId: string): Promise<void> {
+   try {
      await this.redis.del(`disconnected:${pairingId}`);
+   } catch (err) {
+     // Cannot clear the disconnect flag — Redis is unavailable.
+     // Throw so the HTTP handler can return 503 and the client can retry.
+     logger.error({
+       event: 'redis_unavailable',
+       operation: 'clearDisconnected',
+       pairingId,
+       err: err instanceof Error ? err.message : String(err),
+     });
+     throw err;
+   }
  }
```

**Handle the thrown error in the disconnect and connect route handlers:**

```typescript
// src/http/routes/disconnect.ts
export async function disconnectHandler(req: Request, res: Response) {
  try {
    await disconnectStore.setDisconnected(req.pairingId);
    res.status(200).json({ ok: true });
  } catch {
    res.status(503).json({ error: 'Service temporarily unavailable. Please try again.' });
  }
}

// src/http/routes/connect.ts
export async function connectHandler(req: Request, res: Response) {
  try {
    await disconnectStore.clearDisconnected(req.pairingId);
    res.status(200).json({ ok: true });
  } catch {
    res.status(503).json({ error: 'Service temporarily unavailable. Please try again.' });
  }
}
```

**`isDisconnected` never throws — no change needed in `action.ts`.**

**Add a global Express error handler** as a final safety net for any unhandled rejections that slip through in future code:

```typescript
// src/http/server.ts — register AFTER all routes
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({
    event: 'unhandled_error',
    path: req.path,
    method: req.method,
    err: err.message,
  });
  // Never expose internal error details to clients
  res.status(500).json({ error: 'Internal server error' });
});
```

### Tests to add

```typescript
describe('DisconnectStore Redis error handling', () => {
  it('isDisconnected returns false (fail-open) when Redis unavailable', async () => {
    jest.spyOn(redis, 'get').mockRejectedValueOnce(new Error('Connection refused'));

    const result = await disconnectStore.isDisconnected('test-pairing-001');

    expect(result).toBe(false); // fail-open — push proceeds
  });

  it('setDisconnected throws when Redis unavailable', async () => {
    jest.spyOn(redis, 'set').mockRejectedValueOnce(new Error('Connection refused'));

    await expect(
      disconnectStore.setDisconnected('test-pairing-001')
    ).rejects.toThrow();
  });

  it('POST /disconnect returns 503 when Redis unavailable', async () => {
    jest.spyOn(redis, 'set').mockRejectedValueOnce(new Error('Connection refused'));

    const res = await request(app)
      .post('/disconnect')
      .set('Authorization', `Bearer ${testApiKey}`);

    expect(res.status).toBe(503);
  });

  it('POST /action proceeds when Redis unavailable (fail-open)', async () => {
    jest.spyOn(redis, 'get').mockRejectedValueOnce(new Error('Connection refused'));

    const res = await request(app)
      .post('/action')
      .set('Authorization', `Bearer ${testApiKey}`)
      .send(validActionPayload);

    // Should not return 503 — fail-open means push attempt proceeds
    expect(res.status).not.toBe(503);
    expect(res.status).not.toBe(500);
  });
});
```

---

## Implementation checklist

Fix in this order:

- [ ] **VULN-0003** — Add `try-catch` to all three `DisconnectStore` methods. Document fail-open decision with rationale in comments. Handle thrown errors in disconnect/connect handlers with 503. Add global Express error handler. Write four tests. ~2 hours.

- [ ] **VULN-0001** — Add `SessionHeartbeat` type and schema to `@agentwatch/protocol`. Bump protocol package patch version. Replace bare type check in heartbeat handler with `validate.sessionHeartbeat()`. Write five tests. ~1 hour.

- [ ] **VULN-0002** — Add `RateLimiter` as optional dependency to `SessionRouter`. Call `this.rateLimiter?.evict(session.pairingId)` in both tokenInvalid branches. Add `cleanExpired()` method to `RateLimiter`. Add periodic cleanup timer with `.unref()` in `index.ts`. Write four tests. ~2 hours.

---

## Re-scan after fixes

```bash
strix -n \
  --target ./src \
  --instruction-file roe_relay_source.md \
  --scan-mode quick
```

Confirm all three findings are resolved and no regressions appear. Also run:

```bash
npm test && npm run type-check
```

---

*AgentWatch relay — vulnerability mitigation plan*  
*Source: Strix scan 2026-03-29 | Reports: vuln-0001.md, vuln-0002.md, vuln-0003.md*
