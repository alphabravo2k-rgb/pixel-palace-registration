/**
 * Infrastructure Event Store and Snapshot Engine
 * Streams and snapshots are persisted to localStorage so synced data
 * is visible to the spectator view after an admin sync.
 */
import { ConcurrencyConflictError, SnapshotFailureError } from '../shared/kernel/Errors.js';
import { Logger } from '../shared/kernel/Logger.js';

const LS_STREAMS_KEY = 'pp_mc_event_streams';
const LS_SNAPSHOTS_KEY = 'pp_mc_snapshots';

function lsLoad(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function lsSave(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    Logger.warn(`EventStore: localStorage write failed (${key}): ${e.message}`);
  }
}

export class EventStore {
  constructor() {
    // Hydrate from localStorage on construction so spectator pages see synced data
    const streamsObj = lsLoad(LS_STREAMS_KEY);
    this.streams = new Map(Object.entries(streamsObj));

    const snapshotsObj = lsLoad(LS_SNAPSHOTS_KEY);
    this.snapshots = new Map(Object.entries(snapshotsObj));
  }

  _persistStreams() {
    lsSave(LS_STREAMS_KEY, Object.fromEntries(this.streams));
  }

  _persistSnapshots() {
    lsSave(LS_SNAPSHOTS_KEY, Object.fromEntries(this.snapshots));
  }

  /**
   * Appends events to an aggregate stream with optimistic concurrency version checking.
   * @param {string} streamId Unique aggregate stream key
   * @param {Array<Object>} events Enveloped events to commit
   * @param {number} expectedVersion The version check tag
   */
  async append(streamId, events, expectedVersion) {
    const stream = this.streams.get(streamId) || [];
    const currentVersion = stream.length;

    if (expectedVersion !== -1 && currentVersion !== expectedVersion) {
      throw new ConcurrencyConflictError(
        `Optimistic concurrency check failed for stream [${streamId}]. Expected: ${expectedVersion}, Current: ${currentVersion}`
      );
    }

    const validatedEvents = events.map((evt, idx) => {
      const targetVersion = currentVersion + idx + 1;
      return { ...evt, aggregateVersion: targetVersion };
    });

    this.streams.set(streamId, [...stream, ...validatedEvents]);
    this._persistStreams();
    Logger.debug(`EventStore: Appended ${validatedEvents.length} events to stream [${streamId}] (New Version: ${stream.length + validatedEvents.length})`);
  }

  /**
   * Loads all events for a target stream.
   * @param {string} streamId
   * @returns {Promise<Array<Object>>}
   */
  async getEvents(streamId) {
    return this.streams.get(streamId) || [];
  }

  /**
   * Computes a simple SHA-like string hash for integrity checks.
   */
  computeHash(stringData) {
    let hash = 0;
    for (let i = 0; i < stringData.length; i++) {
      const char = stringData.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `hash-${Math.abs(hash)}`;
  }

  /**
   * Saves an aggregate state snapshot along with its integrity hash.
   * @param {string} streamId
   * @param {Object} aggregateState Raw state object
   * @param {number} version Snapshot point version
   */
  async saveSnapshot(streamId, aggregateState, version) {
    try {
      const serialized = JSON.stringify(aggregateState);
      const integrityHash = this.computeHash(serialized);

      this.snapshots.set(streamId, {
        version,
        data: serialized,
        integrityHash,
        timestamp: new Date().toISOString(),
      });
      this._persistSnapshots();

      Logger.info(`EventStore: Saved snapshot for stream [${streamId}] at version [${version}]`);
    } catch (err) {
      throw new SnapshotFailureError(`Failed to serialize aggregate snapshot for ${streamId}: ${err.message}`);
    }
  }

  /**
   * Loads the latest valid snapshot for an aggregate stream.
   * @param {string} streamId
   * @returns {Promise<Object|null>} Decoded state payload or null
   */
  async loadSnapshot(streamId) {
    const record = this.snapshots.get(streamId);
    if (!record) {
      return null;
    }

    try {
      // Integrity hash verification
      const computed = this.computeHash(record.data);
      if (computed !== record.integrityHash) {
        Logger.error(`EventStore: Snapshot integrity hash verification failed for [${streamId}]. Corruption detected.`);
        return null;
      }

      return {
        version: record.version,
        state: JSON.parse(record.data),
      };
    } catch (err) {
      Logger.error(`EventStore: Failed to load snapshot for stream [${streamId}] - ${err.message}`);
      return null;
    }
  }
}

// Export single shared platform instance
export const platformEventStore = new EventStore();
