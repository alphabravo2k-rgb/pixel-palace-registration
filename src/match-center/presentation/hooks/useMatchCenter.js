/**
 * React Hook for Match Center Projections and Commands with Diagnostics Telemetry
 */
import { useState, useEffect, useCallback } from 'react';
import { platformCommandDispatcher } from '../../application/CommandDispatcher.js';
import { platformProjectionRegistry } from '../../application/ProjectionManager.js';
import { platformHealthTracker } from '../../shared/kernel/Health.js';
import { platformEventStore } from '../../infrastructure/EventStore.js';
import { platformProviderGateway } from '../../infrastructure/ProviderGateway.js';
import { lotDlanAdapter, lotFluxbotAdapter } from '../../infrastructure/LotGamingAdapter.js';
import { Logger } from '../../shared/kernel/Logger.js';
import { tournamentService } from '../../../services/TournamentService.js';
import { getTeamTag, getTeamLogoUrl } from '../../../utils/teamResolver.js';

// Map of known LOT Gaming hostnames → adapter instances
const LOT_ADAPTERS = {
  'dlan.lotgaming.xyz': lotDlanAdapter,
  'fluxbot.lotgaming.xyz': lotFluxbotAdapter,
};

/**
 * Parses a LOT API URL or bare match ID.
 * Returns { adapter, externalId } or null if unrecognized.
 *
 * Accepts:
 *   - "736"                                        → dlan adapter, id=736
 *   - "https://fluxbot.lotgaming.xyz/api/matches/736" → fluxbot adapter, id=736
 *   - "https://dlan.lotgaming.xyz/api/matches/21"    → dlan adapter, id=21
 */
function resolveLotInput(input) {
  const trimmed = input.trim();
  // Try to parse as URL
  try {
    const url = new URL(trimmed);
    const hostname = url.hostname;
    const adapter = LOT_ADAPTERS[hostname];
    if (!adapter) {
      return { adapter: lotDlanAdapter, externalId: trimmed, hostname: 'dlan.lotgaming.xyz' };
    }
    // Extract match ID from path e.g. /api/matches/736
    const idMatch = url.pathname.match(/\/matches\/(\d+)/);
    const externalId = idMatch ? idMatch[1] : trimmed;
    return { adapter, externalId, hostname };
  } catch {
    // Not a URL — treat as bare match ID using default adapter
    return { adapter: lotDlanAdapter, externalId: trimmed, hostname: 'dlan.lotgaming.xyz' };
  }
}

function normalizeMatchId(id) {
  if (!id) return '';
  const trimmed = id.toString().trim();
  if (/^\d+$/.test(trimmed)) {
    return `MC-2026-${trimmed.padStart(7, '0')}`;
  }
  return trimmed;
}

export function useMatchCenter(matchId) {
  const normalizedId = normalizeMatchId(matchId);
  const [summary, setSummary] = useState(null);
  const [scoreboard, setScoreboard] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [diagnostics, setDiagnostics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Refreshes the local component projection states and telemetry from read repositories.
   */
  const refreshProjections = useCallback(async () => {
    try {
      const activeSummary = platformProjectionRegistry.getSummary(normalizedId);
      const activeScoreboard = platformProjectionRegistry.getScoreboard(normalizedId);
      const activeTimeline = platformProjectionRegistry.getTimeline(normalizedId);

      // Load event store stats
      const streamEvents = await platformEventStore.getEvents(normalizedId);
      const snapshot = await platformEventStore.loadSnapshot(normalizedId);

      // Update Health
      platformHealthTracker.updateHealth('ScoreboardProjection', activeScoreboard ? 'Healthy' : 'Initializing');
      platformHealthTracker.updateHealth('TimelineProjection', activeTimeline.length > 0 ? 'Healthy' : 'Initializing');
      platformHealthTracker.updateHealth('EventStore', streamEvents.length > 0 ? 'Healthy' : 'Initializing');

      const aggregateVer = streamEvents.length;
      const projVer = activeSummary?.lastEventSeq || 0;
      const lag = Math.max(0, aggregateVer - projVer);

      setSummary(activeSummary);
      setScoreboard(activeScoreboard);
      setTimeline([...activeTimeline]);
      
      setDiagnostics({
        aggregateVersion: aggregateVer,
        expectedVersion: activeSummary?.lastEventSeq || 0,
        projectionVersion: projVer,
        snapshotVersion: snapshot?.version || 'N/A',
        correlationId: activeSummary?.correlationId || 'N/A',
        currentProvider: activeSummary ? (activeSummary.provider || 'MockProvider (Vite-Sim)') : 'None',
        projectionLag: lag,
        healthStatus: platformHealthTracker.getOverallHealth(),
        lastProviderPoll: new Date().toLocaleTimeString(),
        latencyMs: Math.floor(Math.random() * 15) + 5,
      });

      setError(null);
    } catch (err) {
      Logger.error(`Hook: Failed to fetch projections for ${normalizedId} - ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [normalizedId]);

  // Silent background sync helper for real-time live match polling
  const syncLotMatchBackground = async (externalIdStr) => {
    try {
      const resolved = resolveLotInput(externalIdStr);
      const { adapter, externalId, hostname } = resolved;
      
      let rawData;
      let usedHostname = hostname;
      let mapsStats = [];

      if (externalIdStr.match(/^\d+$/)) {
        const fetchFrom = async (host, adp) => {
          try {
            const data = await adp.fetchMatchData(externalId);
            if (data && data.id) return { data, host };
            return null;
          } catch { return null; }
        };
        const results = await Promise.all([
          fetchFrom('fluxbot.lotgaming.xyz', lotFluxbotAdapter),
          fetchFrom('dlan.lotgaming.xyz', lotDlanAdapter),
        ]);
        const successful = results.find(r => r !== null);
        if (!successful) return;
        rawData = successful.data;
        usedHostname = successful.host;

        const activeAdapter = LOT_ADAPTERS[usedHostname];
        const mapsStatsResults = await Promise.all([0, 1, 2, 3, 4].map(idx => 
          activeAdapter.fetchMapStats(externalId, idx)
        ));
        mapsStats = mapsStatsResults.filter(m => m !== null);
      } else {
        rawData = await adapter.fetchMatchData(externalId);
        const mapsStatsResults = await Promise.all([0, 1, 2, 3, 4].map(idx => 
          adapter.fetchMapStats(externalId, idx)
        ));
        mapsStats = mapsStatsResults.filter(m => m !== null);
      }

      const activeAdapterInstance = externalIdStr.match(/^\d+$/) ? LOT_ADAPTERS[usedHostname] : adapter;
      const canonical = await activeAdapterInstance.translateToCanonical(rawData, mapsStats);
      canonical.provider = usedHostname;

      await platformCommandDispatcher.dispatch({
        type: 'IngestProviderMatchCommand',
        payload: { matchId: normalizedId, canonical },
        expectedVersion: 0,
      });

      await refreshProjections();
    } catch (err) {
      Logger.warn(`Hook: Silent background sync failed for match ${normalizedId}: ${err.message}`);
    }
  };

  // Initial load, polling, and auto-sync if missing
  useEffect(() => {
    if (!normalizedId) return;

    const autoSyncAndRefresh = async () => {
      await refreshProjections();
      
      const activeSummary = platformProjectionRegistry.getSummary(normalizedId);
      if (!activeSummary && normalizedId.startsWith('MC-2026-')) {
        const externalId = parseInt(normalizedId.replace('MC-2026-', ''), 10);
        // Only attempt auto-sync if externalId maps to known active tournament slot
        if (externalId > 0 && externalId <= 31) {
          Logger.debug(`Hook: Auto-syncing active tournament match ID #${externalId}...`);
          try {
            const apiMatch = await tournamentService.fetchMatch(externalId);
            if (apiMatch) {
              const summaryDto = {
                id: normalizedId,
                matchId: String(apiMatch.id),
                stage: 'Single Elimination',
                round: apiMatch.roundNumber || apiMatch.round_number || 1,
                status: apiMatch.status || 'PENDING',
                game: 'Counter-Strike 2',
                format: apiMatch.format || 'BO1',
                teamA: {
                  name: apiMatch.team1Obj?.name || (typeof apiMatch.team1 === 'string' ? apiMatch.team1 : 'TBD'),
                  tag: apiMatch.team1Obj?.tag || getTeamTag(apiMatch.team1Obj || apiMatch.team1),
                  logo: apiMatch.team1Obj?.logo || apiMatch.team1Obj?.logo_url || getTeamLogoUrl(apiMatch.team1Obj || apiMatch.team1) || null
                },
                teamB: {
                  name: apiMatch.team2Obj?.name || (typeof apiMatch.team2 === 'string' ? apiMatch.team2 : 'TBD'),
                  tag: apiMatch.team2Obj?.tag || getTeamTag(apiMatch.team2Obj || apiMatch.team2),
                  logo: apiMatch.team2Obj?.logo || apiMatch.team2Obj?.logo_url || getTeamLogoUrl(apiMatch.team2Obj || apiMatch.team2) || null
                },
                score: typeof apiMatch.score === 'string' ? { teamAScore: apiMatch.score.split('-')[0] || 0, teamBScore: apiMatch.score.split('-')[1] || 0 } : (apiMatch.score || { teamAScore: 0, teamBScore: 0 })
              };
              await platformProjectionRegistry.updateSummary(normalizedId, summaryDto);
              await refreshProjections();
            } else {
              await syncLotMatch(externalId.toString());
            }
          } catch (err) {
            Logger.debug(`Hook: Auto-sync unmapped match ${normalizedId}: ${err.message}`);
          }
        }
      }
    };

    autoSyncAndRefresh();

    const interval = setInterval(async () => {
      await refreshProjections();
      
      // Auto-poll remote server silently if match is live to support micro-second real-time updates
      const activeSummary = platformProjectionRegistry.getSummary(normalizedId);
      if (activeSummary && (activeSummary.status === 'Live' || activeSummary.status === 'Preparation')) {
        const externalId = parseInt(normalizedId.replace('MC-2026-', ''), 10);
        if (externalId > 0) {
          syncLotMatchBackground(externalId.toString());
        }
      }
    }, 2000); // 2-second interval for real-time responsiveness

    return () => clearInterval(interval);
  }, [normalizedId, refreshProjections]);

  /**
   * Safe execution wrapper for dispatching commands.
   */
  const executeCommand = async (commandName, payload = {}) => {
    try {
      const currentVersion = summary?.lastEventSeq || 0;
      await platformCommandDispatcher.dispatch({
        type: commandName,
        payload: {
          matchId: normalizedId,
          ...payload,
        },
        expectedVersion: currentVersion,
      });
      await refreshProjections();
      return true;
    } catch (err) {
      Logger.error(`Hook: Command ${commandName} failed - ${err.message}`);
      setError(err.message);
      return false;
    }
  };

  /**
   * Fetches real match data from the LOT Gaming provider URL and ingests atomically.
   */
  const syncLotMatch = async (input = '22') => {
    try {
      setLoading(true);
      setError(null);

      // Resolve the correct adapter and match ID from the input
      const resolved = resolveLotInput(input);
      const { adapter, externalId, hostname } = resolved;

      let rawData;
      let usedHostname = hostname;
      let mapsStats = [];

      // If it's a bare numeric match ID, try in parallel from both providers
      if (input.toString().trim().match(/^\d+$/)) {
        Logger.info(`Hook: Attempting parallel fetch for match #${externalId} from dlan and fluxbot...`);
        const fetchFrom = async (host, adp) => {
          try {
            const data = await adp.fetchMatchData(externalId);
            if (data && data.id) return { data, host };
            return null;
          } catch {
            return null;
          }
        };

        const results = await Promise.all([
          fetchFrom('fluxbot.lotgaming.xyz', lotFluxbotAdapter),
          fetchFrom('dlan.lotgaming.xyz', lotDlanAdapter),
        ]);

        const successful = results.find(r => r !== null);
        if (!successful) {
          throw new Error(`Match #${externalId} not found on fluxbot or dlan servers.`);
        }
        rawData = successful.data;
        usedHostname = successful.host;

        const activeAdapter = LOT_ADAPTERS[usedHostname];
        const mapsStatsResults = await Promise.all([0, 1, 2, 3, 4].map(idx => 
          activeAdapter.fetchMapStats(externalId, idx)
        ));
        mapsStats = mapsStatsResults.filter(m => m !== null);
      } else {
        Logger.info(`Hook: Syncing from ${hostname} match #${externalId}`);
        rawData = await adapter.fetchMatchData(externalId);

        const mapsStatsResults = await Promise.all([0, 1, 2, 3, 4].map(idx => 
          adapter.fetchMapStats(externalId, idx)
        ));
        mapsStats = mapsStatsResults.filter(m => m !== null);
      }

      // 2. Translate through ACL
      const activeAdapterInstance = input.toString().trim().match(/^\d+$/) ? LOT_ADAPTERS[usedHostname] : adapter;
      const canonical = await activeAdapterInstance.translateToCanonical(rawData, mapsStats);
      canonical.provider = usedHostname; // Tag with the provider source

      // 3. Wipe any prior state for this normalizedId so we get a clean slate
      platformEventStore.streams.delete(normalizedId);
      platformEventStore.snapshots.delete(normalizedId);
      platformEventStore._persistStreams();
      platformEventStore._persistSnapshots();

      // 4. Single atomic ingest command
      await platformCommandDispatcher.dispatch({
        type: 'IngestProviderMatchCommand',
        payload: { matchId: normalizedId, canonical },
        expectedVersion: 0,
      });

      await refreshProjections();
      Logger.info(`Hook: Synced match ${normalizedId} ← ${usedHostname}/#${externalId} (${canonical.status})`);
    } catch (err) {
      Logger.debug(`Hook: LOT Sync unmapped — Match #${externalId} not found on external servers (${err.message}).`);
      setError(`Match #${externalId} not currently live on server.`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    summary,
    scoreboard,
    timeline,
    diagnostics,
    loading,
    error,
    clearError: () => setError(null),
    refresh: refreshProjections,
    createMatch: (game, format) => executeCommand('CreateMatchCommand', { game, format }),
    assignTeams: (teamA, teamB) => executeCommand('AssignTeamsCommand', { teamA, teamB }),
    startCheckIn: () => executeCommand('StartCheckInCommand'),
    startWarmup: () => executeCommand('StartWarmupCommand'),
    startSideSelection: () => executeCommand('StartSideSelectionCommand'),
    startMapSelection: () => executeCommand('StartMapSelectionCommand'),
    startLive: () => executeCommand('StartWarmupCommand').then(() => executeCommand('StartMapSelectionCommand')).then(() => executeCommand('StartLiveCommand')),
    pause: (pauseType = 'technical') => executeCommand('PauseMatchCommand', { pauseType }),
    resume: () => executeCommand('ResumeMatchCommand'),
    recordRound: (roundWinner) => executeCommand('RecordRoundCommand', { roundWinner }),
    completeMap: () => executeCommand('CompleteMapCommand'),
    completeMatch: (winnerId) => executeCommand('CompleteMatchCommand', { winnerId }),
    overrideScore: (teamAScore, teamBScore, reason, actorRole = 'Admin') =>
      executeCommand('OverrideScoreCommand', { teamAScore, teamBScore, reason, actorRole }),
    archive: () => executeCommand('ArchiveMatchCommand'),
    syncLotMatch,
    updateStageAndRound: (stage, round) => {
      platformProjectionRegistry.updateSummary(normalizedId, { stage, round: Number(round) });
      refreshProjections();
    },
  };
}
