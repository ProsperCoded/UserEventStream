export enum UserEventType {
  USER_CREATED = 'user.created',
  USER_LOGGED_IN = 'user.logged_in',
  USER_LOGGED_OUT = 'user.logged_out',
  USER_LOGIN_FAILED = 'user.login_failed',
  USER_PASSWORD_CHANGED = 'user.password_changed',
  USER_IP_CHANGED = 'user.ip_changed',
  USER_SUSPENDED = 'user.suspended',
  USER_FLAGGED = 'user.flagged',
}

export interface EventPayload {
  email?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  reason?: string;
  previousIp?: string;
  riskScore?: number;
}

export interface UserEvent {
  eventId: string;
  eventType: UserEventType;
  aggregateId: string; // userId
  occurredAt: string; // ISO timestamp
  receivedAt: string; // ISO timestamp
  payload: EventPayload;
}
