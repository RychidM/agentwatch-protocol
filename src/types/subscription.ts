/**
 * Subscription type definitions (v2)
 */

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

export type FeatureFlag = 'unlimited_approvals' | 'priority_support' | 'custom_branding';

export interface SubscriptionStatus {
  /** User's current plan */
  plan: SubscriptionPlan;
  
  /** Current approval count in period */
  approvalCount: number;
  
  /** Approval limit for current plan (null = unlimited) */
  approvalLimit: number | null;
  
  /** ISO 8601 timestamp when approval count resets */
  resetDate: string;
  
  /** Number of paired devices */
  deviceCount: number;
  
  /** Enabled feature flags */
  featureFlags: FeatureFlag[];
}

export interface EntitlementRequest {
  /** Pairing ID making the request */
  pairingId: string;
  
  /** Account ID for the user */
  accountId: string;
  
  /** Action type being checked */
  actionType: string;
}

export type EntitlementDecision = 'allowed' | 'denied' | 'soft_limit_warning';

export type EntitlementErrorCode = 
  | 'limit_exceeded' 
  | 'plan_downgraded' 
  | 'account_suspended' 
  | 'invalid_pairing';

export interface EntitlementResponse {
  /** Whether action is allowed */
  decision: EntitlementDecision;
  
  /** Error code if denied */
  errorCode?: EntitlementErrorCode;
  
  /** Current count in period */
  count: number;
  
  /** Limit for current plan (null = unlimited) */
  limit: number | null;
  
  /** ISO 8601 timestamp when count resets */
  resetDate: string;
}

export type SubscriptionEventType = 
  | 'limit_reached' 
  | 'limit_warning' 
  | 'plan_upgraded' 
  | 'plan_downgraded';

export type LimitType = 'daily' | 'monthly';

export interface SubscriptionEvent {
  /** Type of subscription event */
  eventType: SubscriptionEventType;
  
  /** Limit type (for limit events) */
  limitType?: LimitType;
  
  /** Current count (for limit events) */
  count?: number;
  
  /** Limit value (for limit events) */
  limit?: number;
  
  /** ISO 8601 timestamp when count resets */
  resetDate?: string;
  
  /** New plan (for upgrade/downgrade events) */
  newPlan?: SubscriptionPlan;
}
