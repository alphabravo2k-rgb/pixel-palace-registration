export const SYSTEM_CONFIG = {
  AUTO_SAVE_INTERVAL: 25000,      // Autosave interval (25s)
  SESSION_LOCK_TIMEOUT: 30000,    // Lock lease expiration (30s)
  LOCK_HEARTBEAT_INTERVAL: 20000, // Client lock renewal frequency (20s)
  IDLE_TIMEOUT: 1800000,          // Time to transition to IDLE (30 mins)
  ABANDON_TIMEOUT: 86400000,      // Time to transition to ABANDONED (24 hours)
  MAX_REVISIONS: 5,               // Maximum rollback snapshots to retain per session
  MAX_JSON_SIZE: 50000,           // Safety boundary for snapshot payloads (50KB)
  EVENT_BATCH_SIZE: 10,           // Batch size for client telemetry flushes
  MAX_EVENT_BUFFER: 50,           // Maximum queue capacity before dropping telemetry
  MAX_RETRY: 3,                   // Server retry attempts for failed HTTP posts
  RATE_LIMIT_MAX_SAVES: 10,       // Maximum draft saves per minute per session
  LOCK_EXPIRY_THRESHOLD: 30000    // Lock expiry duration on the server side (30s)
};

export const SESSION_FEATURES = {
  tracking: true,
  locking: true,
  recovery: true,
  diagnostics: true,
  revisions: true,
  duplicates: true
};

export const FEATURES = {
  sessionTracking: SESSION_FEATURES.tracking,
  draftRecovery: SESSION_FEATURES.recovery,
  eventTelemetry: SESSION_FEATURES.tracking,
  diagnostics: SESSION_FEATURES.diagnostics,
  revisionSnapshots: SESSION_FEATURES.revisions,
  duplicateDetection: SESSION_FEATURES.duplicates
};
