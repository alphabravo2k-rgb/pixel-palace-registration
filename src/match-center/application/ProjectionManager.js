/**
 * Projection Manager and Read-Model Registry
 * Summaries, scoreboards, and timelines are persisted to localStorage
 * so data survives navigation between admin and spectator views.
 */
import { Logger } from '../shared/kernel/Logger.js';

const LS_SUMMARIES_KEY = 'pp_mc_summaries';
const LS_SCOREBOARDS_KEY = 'pp_mc_scoreboards';
const LS_TIMELINES_KEY = 'pp_mc_timelines';

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
    Logger.warn(`ProjectionRegistry: localStorage write failed (${key}): ${e.message}`);
  }
}

export class ProjectionRegistry {
  constructor() {
    // Hydrate from localStorage on construction
    this.summaries = new Map(Object.entries(lsLoad(LS_SUMMARIES_KEY)));
    this.scoreboards = new Map(Object.entries(lsLoad(LS_SCOREBOARDS_KEY)));
    this.timelines = new Map(Object.entries(lsLoad(LS_TIMELINES_KEY)));
  }

  _persistSummaries() {
    lsSave(LS_SUMMARIES_KEY, Object.fromEntries(this.summaries));
  }

  _persistScoreboards() {
    lsSave(LS_SCOREBOARDS_KEY, Object.fromEntries(this.scoreboards));
  }

  _persistTimelines() {
    lsSave(LS_TIMELINES_KEY, Object.fromEntries(this.timelines));
  }

  async updateSummary(matchId, summaryUpdate) {
    const existing = this.summaries.get(matchId) || {};
    this.summaries.set(matchId, { ...existing, ...summaryUpdate });
    this._persistSummaries();
    Logger.debug(`ProjectionRegistry: updated summary for ${matchId}`);
  }

  async updateScoreboard(matchId, scoreboardUpdate) {
    const existing = this.scoreboards.get(matchId) || { score: { teamAScore: 0, teamBScore: 0 } };
    this.scoreboards.set(matchId, { ...existing, ...scoreboardUpdate });
    this._persistScoreboards();
    Logger.debug(`ProjectionRegistry: updated scoreboard for ${matchId}`);
  }

  async appendTimeline(matchId, timelineEvent) {
    const events = this.timelines.get(matchId) || [];
    events.push(timelineEvent);
    this.timelines.set(matchId, events);
    this._persistTimelines();
    Logger.debug(`ProjectionRegistry: appended timeline event for ${matchId}`);
  }

  // --- Read Pathways ---

  getSummary(matchId) {
    return this.summaries.get(matchId) || null;
  }

  getScoreboard(matchId) {
    return this.scoreboards.get(matchId) || null;
  }

  getTimeline(matchId) {
    return this.timelines.get(matchId) || [];
  }
}

export class ProjectionManager {
  constructor(projectionRegistry) {
    this.registry = projectionRegistry;
    this.rebuildsActive = new Map(); // projectionName -> boolean
  }

  /**
   * Rebuilds a read model by executing an event replay strategy.
   * @param {string} projectionName
   * @param {Array<Object>} events Chronological list of events to replay
   */
  async rebuild(projectionName, events = []) {
    if (this.rebuildsActive.get(projectionName)) {
      Logger.warn(`Rebuild already active for projection: ${projectionName}`);
      return;
    }

    Logger.info(`Starting rebuild for projection: ${projectionName}`);
    this.rebuildsActive.set(projectionName, true);

    try {
      // Re-initialize the registry data for the target projection
      if (projectionName === 'summary') {
        this.registry.summaries.clear();
      } else if (projectionName === 'scoreboard') {
        this.registry.scoreboards.clear();
      } else if (projectionName === 'timeline') {
        this.registry.timelines.clear();
      }

      // Replay all events chronologically
      for (const event of events) {
        if (projectionName === 'summary') {
          // Stub replay simulations
          await this.registry.updateSummary(event.aggregateId, {
            status: event.eventType === 'Match.Completed' ? 'Completed' : 'Live',
            lastEventSeq: event.aggregateVersion,
          });
        }
      }

      Logger.info(`Rebuild completed for projection: ${projectionName}`);
    } catch (err) {
      Logger.error(`Rebuild failed for projection ${projectionName}: ${err.message}`);
    } finally {
      this.rebuildsActive.set(projectionName, false);
    }
  }

  getProjectionStatus() {
    return {
      activeRebuilds: Object.fromEntries(this.rebuildsActive),
    };
  }
}

// Export single shared platform instances
export const platformProjectionRegistry = new ProjectionRegistry();
export const platformProjectionManager = new ProjectionManager(platformProjectionRegistry);
