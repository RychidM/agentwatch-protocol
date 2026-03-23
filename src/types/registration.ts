/**
 * DeviceRegistration — Phone app registration data
 */

export type DevicePlatform = "ios" | "android";

export interface DeviceRegistration {
  /** FCM or APNs device token */
  deviceToken: string;

  /** Platform type */
  platform: DevicePlatform;

  /** Session ID to subscribe to. */
  sessionId: string;

  /** Pairing ID for device linkage */
  pairingId: string;
}
