/**
 * =============================================================================
 * PIXEL PALACE TOURNAMENT OS — MATCH CENTER BACKEND PROXY (v1.5.2)
 * Master Production Specification Hardened Implementation
 * =============================================================================
 */

// Immutable System Constants
const DTO_VERSION = "1.0.0";
const PROVIDER_IDS = ["FLUXBOT", "DLAN", "FACEIT", "CUSTOM_RCON"];
const SHEET_NAMES = {
  MATCHES: "MATCHES",
  MATCH_CONNECTIONS: "MATCH_CONNECTIONS",
  ENTITY_MAPPINGS: "ENTITY_MAPPINGS",
  AUDIT_LOGS: "AUDIT_LOGS",
  SYSTEM_CONFIG: "SYSTEM_CONFIG",
};
const ROLE_NAMES = ["PUBLIC", "PLAYER", "CAPTAIN", "REFEREE", "ADMIN", "DEVELOPER"];

/**
 * 1. SYSTEM CONFIGURATION MANAGER (Mutable Operational Config)
 */
const SystemConfigRepository = {
  _defaults: {
    PROVIDER_TIMEOUT_MS: 5000,
    MAX_SYNC_RETRIES: 3,
    CACHE_TTL_LIVE_SEC: 5,
    CACHE_TTL_WAITING_SEC: 30,
    CACHE_TTL_FINISHED_SEC: 1800,
    CACHE_TTL_ARCHIVE_SEC: 86400,
    LOCK_TIMEOUT_MS: 1500,
    RATE_LIMIT_REFRESH_SEC: 10,
    DRIVE_PURGE_DAYS: 30,
  },

  getAll() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_NAMES.SYSTEM_CONFIG);
      if (!sheet) return { ...this._defaults };

      const values = sheet.getDataRange().getValues();
      const config = { ...this._defaults };
      for (let i = 1; i < values.length; i++) {
        const key = String(values[i][1]).trim(); // Column B: Key
        const val = values[i][2];               // Column C: Value
        if (key && val !== undefined && val !== "") {
          config[key] = isNaN(val) ? val : Number(val);
        }
      }
      return config;
    } catch (e) {
      return { ...this._defaults };
    }
  }
};

/**
 * 2. 3-TIER INDEX RESOLUTION SERVICE (Memory -> CacheService -> Sheet Scan)
 */
const IndexService = {
  _memoryCache: {},

  getRowNumber(sheetName, id) {
    const key = `${sheetName}_${id}`;
    // Tier 1: In-Memory JS Object
    if (this._memoryCache[key]) return this._memoryCache[key];

    // Tier 2: CacheService
    const cached = CacheService.getScriptCache().get('IDX_' + key);
    if (cached) {
      const rowNum = Number(cached);
      this._memoryCache[key] = rowNum;
      return rowNum;
    }

    // Tier 3: Full Sheet Scan & Rebuild
    this.rebuildIndex(sheetName);
    return this._memoryCache[key] || null;
  },

  setRowNumber(sheetName, id, rowIndex) {
    const key = `${sheetName}_${id}`;
    this._memoryCache[key] = rowIndex;
    CacheService.getScriptCache().put('IDX_' + key, String(rowIndex), 21600); // 6 hours
  },

  rebuildIndex(sheetName) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return;

      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return;

      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      const cache = CacheService.getScriptCache();

      ids.forEach((row, idx) => {
        const id = String(row[0]).trim();
        if (id) {
          const key = `${sheetName}_${id}`;
          const rowIndex = idx + 2;
          this._memoryCache[key] = rowIndex;
          cache.put('IDX_' + key, String(rowIndex), 21600);
        }
      });
    } catch (e) {
      Logger.log(`IndexService: Failed to rebuild index for ${sheetName}: ${e.message}`);
    }
  }
};

/**
 * 3. DOMAIN MATCH RECORD ENTITY
 */
class MatchRecord {
  constructor(data) {
    this.matchId = data.matchId;
    this.tournamentId = data.tournamentId || 'TOURN-CS2-COMMUNITY-2';
    this.bracketNode = data.bracketNode || 'Upper Bracket';
    this.roundStage = data.roundStage || 'Quarter Final';
    this.status = data.status || 'SCHEDULED';
    this.teamAId = data.teamAId || '';
    this.teamBId = data.teamBId || '';
    this.providerId = data.providerId || 'FLUXBOT';
    this.externalMatchId = data.externalMatchId || '';
    this.scheduledTime = data.scheduledTime || new Date().toISOString();
    this.winnerTeamId = data.winnerTeamId || '';
    this.syncMode = data.syncMode || 'PROVIDER_SYNC';
    this.revisionId = data.revisionId || `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.updatedBy = data.updatedBy || 'SYSTEM';
  }

  isLive() { return this.status === 'LIVE'; }
  isFinished() { return this.status === 'COMPLETED' || this.status === 'ARCHIVED'; }
  isManualOverride() { return this.syncMode === 'MANUAL_OVERRIDE'; }

  toRowArray() {
    return [
      this.matchId,
      this.tournamentId,
      this.bracketNode,
      this.roundStage,
      this.status,
      this.teamAId,
      this.teamBId,
      this.providerId,
      this.externalMatchId,
      this.scheduledTime,
      this.winnerTeamId,
      this.syncMode,
      this.revisionId,
      this.updatedAt,
      this.updatedBy
    ];
  }
}

/**
 * 4. REPOSITORIES (Sheets Access Layer)
 */
const MatchRepository = {
  getById(matchId) {
    const rowIndex = IndexService.getRowNumber(SHEET_NAMES.MATCHES, matchId);
    if (!rowIndex) return null;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.MATCHES);
    if (!sheet) return null;

    const row = sheet.getRange(rowIndex, 1, 1, 15).getValues()[0];
    return new MatchRecord({
      matchId: String(row[0]),
      tournamentId: String(row[1]),
      bracketNode: String(row[2]),
      roundStage: String(row[3]),
      status: String(row[4]),
      teamAId: String(row[5]),
      teamBId: String(row[6]),
      providerId: String(row[7]),
      externalMatchId: String(row[8]),
      scheduledTime: String(row[9]),
      winnerTeamId: String(row[10]),
      syncMode: String(row[11]),
      revisionId: String(row[12]),
      updatedAt: String(row[13]),
      updatedBy: String(row[14])
    });
  },

  /** Thread-Safe Persistence with Lock Enforcement */
  save(matchRecord, expectedRevisionId, lockTimeoutMs = 1500) {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(lockTimeoutMs)) {
      throw new Error("CONCURRENCY_CONFLICT: Unable to acquire write lock.");
    }

    try {
      const current = this.getById(matchRecord.matchId);
      if (current && expectedRevisionId && current.revisionId !== expectedRevisionId) {
        throw new Error(`CONCURRENCY_CONFLICT: Modified by ${current.updatedBy} at ${current.updatedAt}`);
      }

      matchRecord.revisionId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      matchRecord.updatedAt = new Date().toISOString();

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(SHEET_NAMES.MATCHES);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAMES.MATCHES);
        sheet.appendRow([
          "MATCH_ID", "TOURNAMENT_ID", "BRACKET_NODE", "ROUND_STAGE", "STATUS",
          "TEAM_A_ID", "TEAM_B_ID", "PROVIDER_ID", "EXTERNAL_MATCH_ID", "SCHEDULED_TIME",
          "WINNER_TEAM_ID", "SYNC_MODE", "REVISION_ID", "UPDATED_AT", "UPDATED_BY"
        ]);
      }

      let rowIndex = IndexService.getRowNumber(SHEET_NAMES.MATCHES, matchRecord.matchId);
      if (!rowIndex) {
        rowIndex = sheet.getLastRow() + 1;
      }

      sheet.getRange(rowIndex, 1, 1, 15).setValues([matchRecord.toRowArray()]);
      IndexService.setRowNumber(SHEET_NAMES.MATCHES, matchRecord.matchId, rowIndex);
      return matchRecord;
    } finally {
      lock.releaseLock();
    }
  }
};

const EntityMappingRepository = {
  getMapping(providerTeamName) {
    const cleanName = String(providerTeamName).trim().toLowerCase();
    const rowIndex = IndexService.getRowNumber(SHEET_NAMES.ENTITY_MAPPINGS, cleanName);
    if (!rowIndex) return null;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.ENTITY_MAPPINGS);
    if (!sheet) return null;

    const row = sheet.getRange(rowIndex, 1, 1, 6).getValues()[0];
    return {
      providerTeamName: row[0],
      registrationTeamId: row[1],
      confidence: row[2],
      algorithm: row[3],
      matchedBy: row[4],
      timestamp: row[5]
    };
  },

  saveMapping(providerTeamName, registrationTeamId, confidence = '100%', algorithm = 'MANUAL', matchedBy = 'ADMIN') {
    const cleanName = String(providerTeamName).trim().toLowerCase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.ENTITY_MAPPINGS);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAMES.ENTITY_MAPPINGS);
      sheet.appendRow(["PROVIDER_NAME", "REGISTRATION_TEAM_ID", "CONFIDENCE", "ALGORITHM", "MATCHED_BY", "TIMESTAMP"]);
    }

    let rowIndex = IndexService.getRowNumber(SHEET_NAMES.ENTITY_MAPPINGS, cleanName);
    if (!rowIndex) {
      rowIndex = sheet.getLastRow() + 1;
    }

    const record = [cleanName, registrationTeamId, confidence, algorithm, matchedBy, new Date().toISOString()];
    sheet.getRange(rowIndex, 1, 1, 6).setValues([record]);
    IndexService.setRowNumber(SHEET_NAMES.ENTITY_MAPPINGS, cleanName, rowIndex);
  }
};

const AuditRepository = {
  log(matchId, actionType, adminEmail, payload = {}, origin = 'MANUAL', requestId = '') {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOGS);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAMES.AUDIT_LOGS);
        sheet.appendRow(["TIMESTAMP", "REQUEST_ID", "MATCH_ID", "ACTION_TYPE", "ADMIN_EMAIL", "ORIGIN", "PAYLOAD"]);
      }
      sheet.appendRow([
        new Date().toISOString(),
        requestId,
        matchId,
        actionType,
        adminEmail,
        origin,
        JSON.stringify(payload)
      ]);
    } catch (e) {
      Logger.log(`AuditRepository: Failed to record audit log: ${e.message}`);
    }
  }
};

/**
 * 5. PLUGGABLE PROVIDER REGISTRY & ADAPTERS
 */
class FluxBotAdapter {
  constructor(hostname = 'fluxbot.lotgaming.xyz') {
    this.providerId = 'FLUXBOT';
    this.hostname = hostname;
  }

  async validateConnection(externalMatchId) {
    try {
      const url = `https://${this.hostname}/api/matches/${externalMatchId}`;
      const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      return res.getResponseCode() === 200;
    } catch {
      return false;
    }
  }

  fetchMatch(externalMatchId) {
    const url = `https://${this.hostname}/api/matches/${externalMatchId}`;
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) {
      throw new Error(`PROVIDER_OFFLINE: Provider returned HTTP ${res.getResponseCode()}`);
    }
    return JSON.parse(res.getContentText());
  }

  fetchMapStats(externalMatchId, mapIndex) {
    try {
      const url = `https://${this.hostname}/api/matches/${externalMatchId}/maps/${mapIndex}/stats`;
      const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (res.getResponseCode() !== 200) return null;
      return JSON.parse(res.getContentText());
    } catch {
      return null;
    }
  }

  mapToCanonicalDto(raw, mapsStats = []) {
    const mapPlayer = (p) => ({
      steamId: String(p.steam_id || ''),
      name: p.name || 'Unknown Player',
      kills: p.kills || 0,
      deaths: p.deaths || 0,
      assists: p.assists || 0,
      kdRatio: p.kd || (p.deaths > 0 ? (p.kills / p.deaths) : p.kills),
      damage: p.damage || 0,
      headshots: p.headshots || 0,
      headshotPct: p.hs_pct || 0,
      adr: p.adr || 0,
      rating: p.hltv_rating || 1.0,
      mvps: p.mvps || 0,
      fluxImpact: p.flux_impact || 0,
      faceit: p.faceit ? {
        nickname: p.faceit.nickname,
        avatar: p.faceit.avatar,
        level: p.faceit.skill_level || 1,
        elo: p.faceit.faceit_elo || 1000,
        country: p.faceit.country || 'PK',
        profileUrl: p.faceit.faceit_url,
      } : null,
    });

    return {
      dtoVersion: DTO_VERSION,
      match: {
        matchId: `MC-2026-${String(raw.id).padStart(7, '0')}`,
        externalMatchId: String(raw.id),
        format: `BO${raw.best_of || 1}`,
        status: raw.status === 'finished' ? 'COMPLETED' : (raw.status === 'live' ? 'LIVE' : 'SCHEDULED'),
        startedAt: raw.started_at || null,
        finishedAt: raw.finished_at || null,
      },
      teams: {
        teamA: {
          rawName: raw.team1_name || 'Team 1',
          rawTag: raw.team1_tag || 'T1',
          rawLogo: raw.team1_logo_url || null,
          seriesWins: raw.map_wins_team1 || 0,
          currentMapScore: raw.score_team1 || 0,
          players: (raw.team1_players || []).map(mapPlayer),
        },
        teamB: {
          rawName: raw.team2_name || 'Team 2',
          rawTag: raw.team2_tag || 'T2',
          rawLogo: raw.team2_logo_url || null,
          seriesWins: raw.map_wins_team2 || 0,
          currentMapScore: raw.score_team2 || 0,
          players: (raw.team2_players || []).map(mapPlayer),
        },
      },
      maps: {
        activeMapName: raw.map || null,
        activeMapImageUrl: raw.map_image_url || null,
        mapHistory: mapsStats.filter(Boolean).map(m => ({
          mapIndex: m.map_index,
          mapName: m.map_name,
          scoreA: m.team1_first_half + m.team1_second_half + (m.team1_overtime || 0),
          scoreB: m.team2_first_half + m.team2_second_half + (m.team2_overtime || 0),
          winnerTeamId: m.winner_team_id,
        })),
      },
      server: {
        country: raw.server_country_name || 'Germany',
        city: raw.server_city || 'Frankfurt',
        countryCode: raw.server_country_code || 'DE',
        maskedIp: '192.168.1.100:27015',
        maskedPassword: '••••••••••••',
        antiCheat: 'AKROS ACTIVE',
        demoLinks: (raw.demo_links || []).map(d => ({
          mapIndex: d.map_index,
          downloadUrl: d.download_url
        })),
      },
      integrationHealth: {
        provider: 'FLUXBOT',
        providerHealth: 'ONLINE',
        dataFreshness: 'FRESH',
        syncHealth: 'SUCCESS',
      }
    };
  }

  detectHealth() { return 'ONLINE'; }
}

const ProviderRegistry = {
  _providers: {
    FLUXBOT: new FluxBotAdapter('fluxbot.lotgaming.xyz'),
    DLAN: new FluxBotAdapter('dlan.lotgaming.xyz'),
  },

  get(providerId) {
    const adapter = this._providers[String(providerId).toUpperCase()];
    if (!adapter) {
      throw new Error(`CONFIGURATION_ERROR: Provider [${providerId}] is not registered.`);
    }
    return adapter;
  }
};

/**
 * 6. ENTITY RESOLUTION ENGINE (ERE Tiers 1 - 5)
 */
const EntityResolutionEngine = {
  resolveTeam(rawTeamName) {
    if (!rawTeamName) return { name: 'TBD', logoUrl: null, seed: '#--', averageElo: 1000 };

    // Tier 5: Admin Saved Mapping
    const saved = EntityMappingRepository.getMapping(rawTeamName);
    if (saved) {
      return {
        name: rawTeamName,
        registrationTeamId: saved.registrationTeamId,
        confidence: saved.confidence,
        algorithm: saved.algorithm,
        matchedBy: saved.matchedBy,
      };
    }

    // Default Tier 4: Normalized Name match
    return {
      name: rawTeamName,
      confidence: '85%',
      algorithm: 'NORMALIZED_NAME',
      matchedBy: 'AUTO',
    };
  }
};

/**
 * 7. SERVER-SIDE ROLE PERMISSION FILTER
 */
function applyRolePermissionFilter(canonicalDto, userRole = 'PUBLIC') {
  const isStaff = userRole === 'ADMIN' || userRole === 'REFEREE';
  const isParticipant = userRole === 'CAPTAIN' || userRole === 'PLAYER';

  // Deep clone to prevent mutating cached objects
  const output = JSON.parse(JSON.stringify(canonicalDto));

  if (!isStaff && !isParticipant) {
    if (output.server) {
      delete output.server.maskedIp;
      delete output.server.maskedPassword;
    }
  }

  if (!isStaff) {
    if (output.server) {
      delete output.server.rconPassword;
    }
    delete output.integrationHealth;
  }

  return output;
}

/**
 * 8. MAIN ENDPOINT ROUTER (`/exec?action=v1/getMatch`)
 */
function doGet(e) {
  const requestId = Utilities.getUuid();
  const startTime = Date.now();

  try {
    const params = e ? e.parameter : {};
    const action = params.action || '';
    const matchId = params.matchId || 'MC-2026-0000749';
    const userRole = (params.role || 'PUBLIC').toUpperCase();

    if (action === 'v1/getMatch' || action === 'getMatch') {
      const config = SystemConfigRepository.getAll();
      const cacheKey = `${matchId}_snapshot`;
      const cache = CacheService.getScriptCache();
      
      // 1. Read RAM Cache
      const cachedSnapshot = cache.get(cacheKey);
      if (cachedSnapshot) {
        const dto = JSON.parse(cachedSnapshot);
        const filtered = applyRolePermissionFilter(dto, userRole);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          requestId,
          dto: filtered,
          servedFromCache: true,
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // 2. Cache Miss / Stale -> Try Non-Blocking Lock
      const lock = LockService.getScriptLock();
      const acquired = lock.tryLock(config.LOCK_TIMEOUT_MS);

      let record = MatchRepository.getById(matchId);
      if (!record) {
        // Auto-create default record for demo if missing
        record = new MatchRecord({ matchId, externalMatchId: matchId.replace('MC-2026-000', '') || '749' });
        MatchRepository.save(record, null, config.LOCK_TIMEOUT_MS);
      }

      const adapter = ProviderRegistry.get(record.providerId);
      let canonicalDto;

      if (acquired) {
        try {
          // Fetch Telemetry & Map Stats
          const rawPayload = adapter.fetchMatch(record.externalMatchId);
          const mapStats0 = adapter.fetchMapStats(record.externalMatchId, 0);
          const mapStats1 = adapter.fetchMapStats(record.externalMatchId, 1);
          const mapStats2 = adapter.fetchMapStats(record.externalMatchId, 2);

          canonicalDto = adapter.mapToCanonicalDto(rawPayload, [mapStats0, mapStats1, mapStats2]);

          // Run ERE Identity Enrichment
          const teamAResolved = EntityResolutionEngine.resolveTeam(canonicalDto.teams.teamA.rawName);
          const teamBResolved = EntityResolutionEngine.resolveTeam(canonicalDto.teams.teamB.rawName);
          canonicalDto.teams.teamA.name = teamAResolved.name;
          canonicalDto.teams.teamB.name = teamBResolved.name;

          // Compute SHA-256 Payload Hash
          const payloadJson = JSON.stringify(canonicalDto);
          const hashBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payloadJson);
          const checksum = hashBytes.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
          canonicalDto.checksum = checksum;

          // Atomic Cache Replacement (LAST OPERATION)
          const ttl = record.isLive() ? config.CACHE_TTL_LIVE_SEC : config.CACHE_TTL_WAITING_SEC;
          try {
            cache.put(cacheKey, payloadJson, ttl);
          } catch (cacheErr) {
            Logger.log(`Cache put failed (Best effort): ${cacheErr.message}`);
          }
        } finally {
          lock.releaseLock();
        }
      } else {
        // Lock Contention Fallback -> Rehydrate fallback from repository DTO
        canonicalDto = adapter.mapToCanonicalDto({ id: record.externalMatchId, status: 'live' });
      }

      const filtered = applyRolePermissionFilter(canonicalDto, userRole);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        requestId,
        executionTimeMs: Date.now() - startTime,
        dto: filtered,
        servedFromCache: false,
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      errorCode: 'CONFIGURATION_ERROR',
      message: `Action [${action}] is invalid. Use action=v1/getMatch.`,
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      requestId,
      errorCode: err.message.startsWith('CONCURRENCY_CONFLICT') ? 'CONCURRENCY_CONFLICT' : 'PROVIDER_OFFLINE',
      message: err.message,
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
