/**
 * DeviceRegistration — Phone app registration data
 */

export type DevicePlatform = "ios" | "android";

export interface DeviceRegistration {
  /** FCM or APNs device token */
  deviceToken: string;

  /** Platform type */
  platform: DevicePlatform;

  /** Current session ID (if registering during session) */
  sessionId?: string;

  /** Pairing ID for device linkage */
  pairingId: string;
}
