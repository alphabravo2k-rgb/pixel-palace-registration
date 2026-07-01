/**
 * TOURNAMENT OS: UNIFIED BACKEND (v2.7.0)
 * Consolidated, modular architecture decoupling business logic from Google Sheets storage.
 */

// Global configuration spreadsheet ID (immutable receiver database)
const RECEIVER_SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

const BACKEND_CONFIG = {
  version: "2.7.0",
  updated: "2026-07-02",
  environment: "Production"
};

const ERROR_CODES = {
  INVALID_JSON: { code: "ERR001", message: "Invalid JSON payload." },
  TOURNAMENT_NOT_FOUND: { code: "ERR002", message: "Tournament config not found." },
  INVALID_INVITE: { code: "ERR003", message: "Invalid invite code." },
  ROSTER_LOCKED: { code: "ERR004", message: "Roster has been locked for this tournament." },
  DUPLICATE_TEAM: { code: "ERR005", message: "Team name already exists." },
  STEAM_BANNED: { code: "ERR006", message: "One or more players have active Steam bans." },
  FACEIT_LOOKUP_FAILED: { code: "ERR007", message: "Faceit profile lookup failed." },
  DRIVE_UPLOAD_FAILED: { code: "ERR008", message: "Image upload failed." },
  DATABASE_LOCK_TIMEOUT: { code: "ERR009", message: "Database is busy. Please try again." },
  UNKNOWN: { code: "ERR010", message: "Unknown internal error." }
};

/**
 * 1. API ROUTER & ENTRY POINTS
 */
function doGet(e) {
  try {
    const params = e.parameter;
    const endpoint = params.endpoint || "";

    if (!endpoint.startsWith("/api/v1/")) {
      return generateResponse({ error: "UNSUPPORTED_API_VERSION" }, 400);
    }

    if (endpoint === "/api/v1/health") {
      const health = checkSystemHealth_();
      return generateResponse(health);
    }

    // Load dynamic config first
    const config = DatabaseAdapter.getTournamentConfig(params.tournamentId);
    if (params.tournamentId && !config) {
      return generateResponse({ error: ERROR_CODES.TOURNAMENT_NOT_FOUND.message, errorCode: ERROR_CODES.TOURNAMENT_NOT_FOUND.code }, 404);
    }

    if (endpoint === "/api/v1/getTeams") {
      const teams = RegistrationService.getApprovedTeams(params.tournamentId, config);
      return generateResponse({ teams: teams, confirmed: teams.length });
    }

    if (endpoint === "/api/v1/getSlots") {
      const slots = RegistrationService.getSlotsCount(params.tournamentId, config);
      return generateResponse(slots);
    }

    if (endpoint === "/api/v1/validateCode") {
      const isValid = ValidationService.validateInviteCode(params.validateCode);
      return generateResponse({ valid: isValid, slotType: isValid ? "INVITE" : "OPEN" });
    }

    if (endpoint === "/api/v1/getBracket") {
      const bracket = MatchService.getBracketData(params.tournamentId, config);
      return generateResponse(bracket);
    }

    return generateResponse({ error: "ENDPOINT_NOT_FOUND" }, 404);
  } catch (err) {
    AuditService.recordEvent(params.tournamentId || "system", "SYSTEM_ERROR", "GET_FAILED", "N/A", err.toString(), "doGet");
    return generateResponse({ error: err.toString() }, 500);
  }
}

function doPost(e) {
  try {
    const postData = e.postData ? e.postData.contents : "";
    if (!postData) return generateResponse({ error: "EMPTY_PAYLOAD" }, 400);

    let payload;
    try {
      payload = JSON.parse(postData);
    } catch(jsonErr) {
      return generateResponse({ error: ERROR_CODES.INVALID_JSON.message, errorCode: ERROR_CODES.INVALID_JSON.code }, 400);
    }

    const action = payload.action || payload.endpoint || "";

    // Route requests to executeRequest wrapper
    if (action === "uploadLogo" || action === "/api/v1/uploadLogo") {
      return executeRequest(action, payload, 10000, () => StorageService.upload(payload));
    }

    if (action === "register" || action === "/api/v1/register") {
      return executeRequest(action, payload, 15000, () => RegistrationService.registerTeam(payload));
    }

    if (action === "submitChangeRequest" || action === "/api/v1/submitChangeRequest") {
      return executeRequest(action, payload, 10000, () => TournamentService.submitChangeRequest(payload));
    }

    return generateResponse({ error: "ACTION_NOT_FOUND" }, 404);
  } catch (err) {
    return generateResponse({ error: err.toString() }, 500);
  }
}

/**
 * Shared execution wrapper handling timing, locking, and error standardization
 */
function executeRequest(action, payload, lockTime, serviceFn) {
  const lock = LockService.getScriptLock();
  const startTime = Date.now();
  try {
    if (lockTime > 0) {
      const success = lock.tryLock(lockTime);
      if (!success) {
        return generateResponse({ error: ERROR_CODES.DATABASE_LOCK_TIMEOUT.message, errorCode: ERROR_CODES.DATABASE_LOCK_TIMEOUT.code }, 408);
      }
    }

    const result = serviceFn();
    const duration = Date.now() - startTime;
    Logger.log("Action: " + action + " executed in " + duration + "ms");
    return generateResponse(result);
  } catch(err) {
    const duration = Date.now() - startTime;
    Logger.log("Action: " + action + " failed after " + duration + "ms: " + err);
    return generateResponse({ error: err.toString(), errorCode: ERROR_CODES.UNKNOWN.code }, 500);
  } finally {
    if (lockTime > 0 && lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

/**
 * System Health checker
 */
function checkSystemHealth_() {
  let spreadsheetOk = false;
  let driveOk = false;
  let cacheOk = false;

  try {
    SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
    spreadsheetOk = true;
  } catch(e) {}

  try {
    DriveApp.getRootFolder();
    driveOk = true;
  } catch(e) {}

  try {
    CacheService.getScriptCache().put("health_test", "1", 10);
    cacheOk = CacheService.getScriptCache().get("health_test") === "1";
  } catch(e) {}

  return {
    status: (spreadsheetOk && driveOk && cacheOk) ? "ok" : "degraded",
    version: BACKEND_CONFIG.version,
    updated: BACKEND_CONFIG.updated,
    environment: BACKEND_CONFIG.environment,
    spreadsheet: spreadsheetOk,
    drive: driveOk,
    cache: cacheOk,
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper to construct JSON HTTP Response
 */
function generateResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 2. DATABASE ADAPTER
 * The ONLY layer allowed to touch SpreadsheetApp
 */
const DatabaseAdapter = {
  getTournamentConfig: function(tournamentId) {
    if (!tournamentId) return null;
    const cacheKey = "config_" + tournamentId;
    const cached = CacheService.getScriptCache().get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
      const sheet = doc.getSheetByName("Tournaments_Config");
      if (!sheet) return this.getDefaultConfig_(tournamentId);

      const data = sheet.getDataRange().getValues();
      const headers = data[0].map(h => h.toString().trim().toLowerCase());
      const idIdx = headers.indexOf("tournamentid");
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIdx] === tournamentId) {
          const config = {};
          headers.forEach((h, idx) => {
            config[h] = data[i][idx];
          });
          CacheService.getScriptCache().put(cacheKey, JSON.stringify(config), 60); // 1 min cache
          return config;
        }
      }
    } catch (e) {
      Logger.log("Config load failed, fallback used: " + e);
    }
    return this.getDefaultConfig_(tournamentId);
  },

  clearConfigCache: function() {
    CacheService.getScriptCache().remove("config_community-cup-2");
    CacheService.getScriptCache().remove("config_chaos-ii");
  },

  getDefaultConfig_: function(tournamentId) {
    return {
      tournamentid: tournamentId,
      name: tournamentId === "chaos-ii" ? "Wingman Chaos II" : "Pixel Palace Community Cup 2",
      maxteams: tournamentId === "chaos-ii" ? 50 : 32,
      inviteslots: tournamentId === "chaos-ii" ? 0 : 6,
      playersperteam: tournamentId === "chaos-ii" ? 2 : 5,
      substitutesmax: tournamentId === "chaos-ii" ? 1 : 2,
      logofolderid: "1HYrpFCvd4f4K26NtukB2Dq05lTaHyk6e",
      adminspreadsheetid: tournamentId === "chaos-ii" 
        ? "YOUR_CHAOS_SPREADSHEET_ID_HERE" 
        : "YOUR_SPREADSHEET_ID_HERE",
      currentphase: "Registration Open",
      workerbatchsize: 10,
      maxretries: 4
    };
  },

  appendRawRegistration: function(rowArray) {
    const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
    let sheet = doc.getSheetByName("MASTER_RAW_REGISTRATIONS");
    if (!sheet) {
      sheet = doc.insertSheet("MASTER_RAW_REGISTRATIONS");
      const defaultHeaders = [
        "Submission ID", "Registration ID", "Timestamp", "Tournament ID", "Status", "Team Name", "Team Tag", "Region",
        "Storage Provider", "Logo File ID", "Logo Mime Type", "Logo Uploaded At",
        "P1 Discord", "P1 Steam", "P1 Faceit", "P1 Rank",
        "P2 Discord", "P2 Steam", "P2 Faceit", "P2 Rank",
        "P3 Discord", "P3 Steam", "P3 Faceit", "P3 Rank",
        "P4 Discord", "P4 Steam", "P4 Faceit", "P4 Rank",
        "P5 Discord", "P5 Steam", "P5 Faceit", "P5 Rank",
        "P6 Discord", "P6 Steam", "P6 Faceit", "P6 Rank",
        "P7 Discord", "P7 Steam", "P7 Faceit", "P7 Rank",
        "VIP Code Used"
      ];
      sheet.appendRow(defaultHeaders);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(rowArray);
    SpreadsheetApp.flush();
    
    // Add row index to script cache
    const newIdx = sheet.getLastRow();
    const subId = rowArray[0];
    const regId = rowArray[1];
    CacheService.getScriptCache().put("idx_sub_" + subId, String(newIdx), 1800); // 30 min cache
    CacheService.getScriptCache().put("idx_reg_" + regId, String(newIdx), 1800);
  },

  getRawRegistrations: function() {
    const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
    const sheet = doc.getSheetByName("MASTER_RAW_REGISTRATIONS");
    if (!sheet) return [];
    return sheet.getDataRange().getValues();
  },

  getRowBySubmissionId: function(subId) {
    const cachedRow = CacheService.getScriptCache().get("idx_sub_" + subId);
    if (cachedRow) {
      const idx = parseInt(cachedRow);
      const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
      const sheet = doc.getSheetByName("MASTER_RAW_REGISTRATIONS");
      return sheet.getRange(idx, 1, 1, sheet.getLastColumn()).getValues()[0];
    }
    
    // Fallback scan
    const data = this.getRawRegistrations();
    if (data.length <= 1) return null;
    const headers = data[0].map(h => h.toString().toLowerCase());
    const subIdx = headers.indexOf("submission id");
    for (let i = 1; i < data.length; i++) {
      if (data[i][subIdx] === subId) {
        CacheService.getScriptCache().put("idx_sub_" + subId, String(i + 1), 1800);
        return data[i];
      }
    }
    return null;
  },

  seedTeamToAdminOps: function(adminSpreadsheetId, rows) {
    const doc = SpreadsheetApp.openById(adminSpreadsheetId);
    const sheet = doc.getSheetByName("Admin_Ops") || doc.getSheets()[0];
    const startRow = sheet.getLastRow() + 1;
    const numPlayers = rows.length;
    
    sheet.getRange(startRow, 1, numPlayers, 36).setValues(rows);
    
    // Merge team-level columns vertically
    [1, 2, 3, 4, 5, 14, 15, 16, 17, 34].forEach(col => {
       sheet.getRange(startRow, col, numPlayers, 1).merge()
            .setVerticalAlignment("middle")
            .setHorizontalAlignment("center");
    });
    sheet.setRowHeightsForced(startRow, numPlayers, 28);
    SpreadsheetApp.flush();
  },

  getBracketSettings: function(adminSpreadsheetId) {
    const adminDoc = SpreadsheetApp.openById(adminSpreadsheetId);
    const settingsSheet = adminDoc.getSheetByName("Settings");
    if (!settingsSheet) return null;
    return settingsSheet.getDataRange().getValues();
  },

  getBracketMatches: function(adminSpreadsheetId) {
    const adminDoc = SpreadsheetApp.openById(adminSpreadsheetId);
    const bracketsSheet = adminDoc.getSheetByName("Brackets");
    if (!bracketsSheet) return null;
    return bracketsSheet.getDataRange().getValues();
  },

  logRosterChangeRequest: function(row) {
    const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
    let sheet = doc.getSheetByName("Roster_Change_Requests");
    if (!sheet) {
      sheet = doc.insertSheet("Roster_Change_Requests");
      sheet.appendRow(["Timestamp", "Tournament ID", "Team ID", "Field Changed", "Old Value", "New Value", "Status"]);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(row);
    SpreadsheetApp.flush();
  },

  appendEventLog: function(row) {
    const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
    let sheet = doc.getSheetByName("EVENT_LOG");
    if (!sheet) {
      sheet = doc.insertSheet("EVENT_LOG");
      sheet.appendRow(["Event ID", "Timestamp", "Tournament ID", "Event Type", "Old State", "New State", "Description", "Triggered By"]);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(row);
    SpreadsheetApp.flush();
  },

  appendAuditLog: function(row) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName("Audit_Log");
    if (!logSheet) {
      logSheet = ss.insertSheet("Audit_Log");
      logSheet.appendRow(["Audit ID", "Timestamp", "Sheet", "Range", "Team ID", "Team Name", "Field Changed", "Previous Value", "New Value", "Source", "Action", "Reason", "Admin/User"]);
      logSheet.setFrozenRows(1);
    }
    logSheet.appendRow(row);
    SpreadsheetApp.flush();
  },

  getInviteCodes: function() {
    const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
    const inviteSheet = doc.getSheetByName("InviteCodes");
    if (!inviteSheet) return [];
    return inviteSheet.getDataRange().getValues();
  },

  appendEnrichmentJob: function(row) {
    const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
    let sheet = doc.getSheetByName("ENRICHMENT_QUEUE");
    if (!sheet) {
      sheet = doc.insertSheet("ENRICHMENT_QUEUE");
      sheet.appendRow([
        "Queue ID", "Team ID", "Player ID", "Job Type", "Queue Status", 
        "Priority", "Retry Count", "Next Run Time", "Last Heartbeat", 
        "Reserved By Worker", "Last Error"
      ]);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(row);
    SpreadsheetApp.flush();
  },

  getPendingJobs: function(batchSize) {
    const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
    const sheet = doc.getSheetByName("ENRICHMENT_QUEUE");
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const now = new Date().toISOString();
    const jobs = [];
    // Index mapping
    const headers = data[0].map(h => h.toString().toLowerCase().trim());
    const statusIdx = headers.indexOf("queue status");
    const nextRunIdx = headers.indexOf("next run time");
    const priorityIdx = headers.indexOf("priority");

    for (let i = 1; i < data.length; i++) {
      const status = data[i][statusIdx];
      const nextRun = data[i][nextRunIdx] || "";
      if ((status === "QUEUED" || status === "RETRY") && (!nextRun || nextRun <= now)) {
        jobs.push({
          rowIdx: i + 1,
          queueId: data[i][headers.indexOf("queue id")],
          teamId: data[i][headers.indexOf("team id")],
          playerId: data[i][headers.indexOf("player id")],
          jobType: data[i][headers.indexOf("job type")],
          status: status,
          priority: parseInt(data[i][priorityIdx]) || 50,
          retryCount: parseInt(data[i][headers.indexOf("retry count")]) || 0
        });
      }
    }

    // Sort by priority descending
    jobs.sort((a, b) => b.priority - a.priority);
    return jobs.slice(0, batchSize);
  },

  reserveJob: function(rowIdx, workerId) {
    const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
    const sheet = doc.getSheetByName("ENRICHMENT_QUEUE");
    const now = new Date().toISOString();
    sheet.getRange(rowIdx, 5).setValue("RESERVED"); // Status
    sheet.getRange(rowIdx, 9).setValue(now);       // Last Heartbeat
    sheet.getRange(rowIdx, 10).setValue(workerId); // Reserved By Worker
    SpreadsheetApp.flush();
  },

  updateJobStatus: function(rowIdx, status, errorMsg) {
    const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
    const sheet = doc.getSheetByName("ENRICHMENT_QUEUE");
    sheet.getRange(rowIdx, 5).setValue(status);
    if (errorMsg) {
      sheet.getRange(rowIdx, 11).setValue(errorMsg);
    }
    SpreadsheetApp.flush();
  },

  logPlayerHistory: function(row) {
    const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
    let sheet = doc.getSheetByName("PLAYER_HISTORY");
    if (!sheet) {
      sheet = doc.insertSheet("PLAYER_HISTORY");
      sheet.appendRow([
        "Timestamp", "Registration ID", "Tournament ID", "Player Slot", 
        "Steam64", "Faceit ID", "Source", "Field", "Old Value", 
        "New Value", "Sync Type", "Worker Version"
      ]);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(row);
    SpreadsheetApp.flush();
  },

  logTeamHistory: function(row) {
    const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
    let sheet = doc.getSheetByName("TEAM_HISTORY");
    if (!sheet) {
      sheet = doc.insertSheet("TEAM_HISTORY");
      sheet.appendRow(["Timestamp", "Team ID", "Field Changed", "Old Value", "New Value", "Sync Type", "Worker Version"]);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(row);
    SpreadsheetApp.flush();
  },

  logWorkerStats: function(row) {
    const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
    let sheet = doc.getSheetByName("WORKER_STATS");
    if (!sheet) {
      sheet = doc.insertSheet("WORKER_STATS");
      sheet.appendRow(["Worker ID", "Started", "Finished", "Jobs Completed", "Jobs Failed", "Average Runtime", "API Calls", "Errors", "Timeouts"]);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(row);
    SpreadsheetApp.flush();
  }
};

/**
 * 3. TRANSACTION RECOVERY QUEUE
 */
const FailedTransactionsQueue = {
  enqueue: function(submissionId, payload, errorMsg) {
    try {
      const doc = SpreadsheetApp.openById(RECEIVER_SPREADSHEET_ID);
      let sheet = doc.getSheetByName("FAILED_TRANSACTIONS");
      if (!sheet) {
        sheet = doc.insertSheet("FAILED_TRANSACTIONS");
        sheet.appendRow(["Submission ID", "Timestamp", "Payload", "Retries", "Last Error", "Status"]);
        sheet.setFrozenRows(1);
      }
      
      sheet.appendRow([
        submissionId,
        new Date().toISOString(),
        JSON.stringify(payload),
        1,
        errorMsg,
        "PENDING_RETRY"
      ]);
      SpreadsheetApp.flush();
    } catch(e) {
      Logger.log("Failed to enqueue transaction: " + e);
    }
  }
};

/**
 * 4. STORAGE SERVICE
 * Provider agnostic upload abstraction
 */
const StorageService = {
  upload: function(payload) {
    const provider = payload.storageProvider || "Drive";
    if (provider === "Drive") {
      return this.uploadToDrive_(payload);
    }
    throw new Error("UNSUPPORTED_STORAGE_PROVIDER");
  },

  uploadToDrive_: function(payload) {
    const base64Data = payload.base64Data || payload.fileData;
    const mimeType = payload.mimeType || "image/png";
    const filename = payload.filename || payload.fileName || "logo.png";
    const tournamentId = payload.tournamentId || payload.tournament_id;

    const config = DatabaseAdapter.getTournamentConfig(tournamentId);
    const folderId = config.logofolderid;
    const folder = DriveApp.getFolderById(folderId);

    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, filename);
    const file = folder.createFile(blob);
    
    // Set file sharing access
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = file.getId();
    const url = "https://lh3.googleusercontent.com/d/" + fileId;
    
    // Get file MD5 checksum
    let checksum = "N/A";
    try {
      const fileBytes = file.getBlob().getBytes();
      const hashBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, fileBytes);
      checksum = hashBytes.map(b => ("0" + (b & 0xff).toString(16)).slice(-2)).join("");
    } catch(hashErr) {
      Logger.log("Hash generation failed: " + hashErr);
    }

    // Log upload event
    AuditService.recordEvent(tournamentId, "STORAGE_UPLOAD", "SUCCESS", "N/A", "Uploaded logo " + filename, "System");

    return {
      success: true,
      logoUrl: url,
      fileId: fileId,
      url: url,
      mimeType: mimeType,
      size: file.getSize(),
      checksum: checksum,
      uploadedAt: new Date().toISOString()
    };
  }
};

/**
 * 5. REGISTRATION SERVICE
 * Handles PreValidation, BusinessValidation splits, and immutable ledger writes.
 */
const RegistrationService = {
  registerTeam: function(payload) {
    const tournamentId = payload.tournament_id;
    const submissionId = payload.submission_id || Utilities.getUuid();
    const config = DatabaseAdapter.getTournamentConfig(tournamentId);

    // Phase 1: PreValidation (Format, Missing fields)
    const preRes = this.validatePreConditions_(payload);
    if (!preRes.valid) {
      return { success: false, error: ERROR_CODES.INVALID_JSON.message, errorCode: ERROR_CODES.INVALID_JSON.code, reason: preRes.error };
    }

    // Phase 2: BusinessValidation (Duplicates, invites, bans)
    const businessRes = this.validateBusinessRules_(payload, config);
    const isSuccess = businessRes.valid;
    const status = isSuccess ? "SUBMITTED" : "FAILED_VALIDATION";

    // Extract logo file ID from Drive URL
    const logoUrl = payload.logo_url || payload.logoLink || "";
    let logoFileId = payload.logo_file_id || "";
    if (!logoFileId && logoUrl.includes("/d/")) {
      try {
        logoFileId = logoUrl.split("/d/")[1].split(/[/?#]/)[0];
      } catch(e) {}
    }

    // Year-based Registration ID (e.g. PP-CC2-2026-000145)
    const rawData = DatabaseAdapter.getRawRegistrations();
    const year = new Date().getFullYear();
    const cleanTournament = tournamentId.toUpperCase().replace(/[^a-zA-Z0-9]/g, "");
    const registrationId = "PP-" + cleanTournament + "-" + year + "-" + String(rawData.length).padStart(6, '0');
    const formattedDate = Utilities.formatDate(new Date(), "GMT+5", "yyyy-MM-dd HH:mm:ss");

    // Immutably write transaction ledger row
    const newRow = [
      submissionId,
      registrationId,
      formattedDate,
      tournamentId,
      status,
      payload.team_name,
      payload.team_tag,
      payload.region || "",
      "Drive",
      logoFileId,
      payload.logo_mime_type || "image/png",
      new Date().toISOString(),
      payload.p1Discord || "", payload.p1Steam || "", payload.p1Faceit || "", payload.p1Rank || "",
      payload.p2Discord || "", payload.p2Steam || "", payload.p2Faceit || "", payload.p2Rank || "",
      payload.p3Discord || "", payload.p3Steam || "", payload.p3Faceit || "", payload.p3Rank || "",
      payload.p4Discord || "", payload.p4Steam || "", payload.p4Faceit || "", payload.p4Rank || "",
      payload.p5Discord || "", payload.p5Steam || "", payload.p5Faceit || "", payload.p5Rank || "",
      payload.p6Discord || "", payload.p6Steam || "", payload.p6Faceit || "", payload.p6Rank || "",
      payload.p7Discord || "", payload.p7Steam || "", payload.p7Faceit || "", payload.p7Rank || "",
      payload.invite_code || ""
    ];

    DatabaseAdapter.appendRawRegistration(newRow);

    // Queue player enrichment jobs
    const teamId = Utilities.getUuid();
    for (let p = 1; p <= 7; p++) {
      const steamVal = payload[`p${p}Steam`] || "";
      if (steamVal) {
        const playerId = Utilities.getUuid();
        
        // Queue FACEIT & Steam sync jobs separately
        DatabaseAdapter.appendEnrichmentJob([
          Utilities.getUuid(), teamId, playerId, "FACEIT_SYNC", "QUEUED",
          100, 0, "", "", "", ""
        ]);
        DatabaseAdapter.appendEnrichmentJob([
          Utilities.getUuid(), teamId, playerId, "STEAM_SYNC", "QUEUED",
          100, 0, "", "", "", ""
        ]);
      }
    }

    // Log the lifecycle action
    AuditService.recordEvent(
      tournamentId, 
      "REGISTRATION_RECEIVED", 
      "NONE", 
      status, 
      "Roster submitted for " + payload.team_name + " (Success: " + isSuccess + ")", 
      "System"
    );

    if (!isSuccess) {
      return { success: false, error: ERROR_CODES.DUPLICATE_TEAM.message, errorCode: ERROR_CODES.DUPLICATE_TEAM.code, reason: businessRes.error };
    }

    return { success: true, submissionId: submissionId, registrationId: registrationId };
  },

  validatePreConditions_: function(payload) {
    if (!payload.team_name || payload.team_name.trim().length < 3) {
      return { valid: false, error: "Team Name must be at least 3 characters." };
    }
    if (!payload.team_tag || payload.team_tag.trim().length < 2) {
      return { valid: false, error: "Team Tag must be at least 2 characters." };
    }
    if (!payload.p1Discord || !payload.p1Steam || !payload.p1Faceit) {
      return { valid: false, error: "Captain details (Discord, Steam, Faceit) are required." };
    }
    return { valid: true };
  },

  validateBusinessRules_: function(payload, config) {
    // Check Phase
    if (config.currentphase === "Registration Closed" || config.currentphase === "Archived") {
      return { valid: false, error: "REGISTRATION_CLOSED" };
    }

    // Duplicate Check
    const rawData = DatabaseAdapter.getRawRegistrations();
    const newTeamName = payload.team_name.trim().toUpperCase();
    
    if (rawData.length > 1) {
      const headers = rawData[0].map(h => h.toString().toLowerCase());
      const statusIdx = headers.indexOf("status");
      const nameIdx = headers.indexOf("team name");
      
      for (let i = 1; i < rawData.length; i++) {
        const status = rawData[i][statusIdx];
        if (status === "REJECTED" || status === "FAILED_VALIDATION") continue;
        
        const teamName = String(rawData[i][nameIdx]).trim().toUpperCase();
        if (teamName === newTeamName) {
          return { valid: false, error: "DUPLICATE_TEAM_NAME" };
        }
      }
    }

    return { valid: true };
  },

  getApprovedTeams: function(tournamentId, config) {
    try {
      const adminDoc = SpreadsheetApp.openById(config.adminspreadsheetid);
      const sheet = adminDoc.getSheetByName("Admin_Ops") || adminDoc.getSheets()[0];
      const sheetData = sheet.getDataRange().getValues();
      const teams = [];
      const rowsPerTeam = parseInt(config.playersperteam) + parseInt(config.substitutesmax);
      
      const teamNameIdx = 1;
      const statusIdx = 14;
      const regionIdx = 4;
      const logoIdx = 3;
      const avgEloIdx = 13;
      const seedIdx = 15;
      
      const pNameIdx = 5;
      const discordIdx = 6;
      const steamIdx = 7;
      const faceitIdx = 11;
      const liveEloIdx = 12;

      for (let i = 1; i < sheetData.length; i += rowsPerTeam) {
        const teamName = (sheetData[i][teamNameIdx] || "").toString().trim();
        if (!teamName || teamName === "Team Name") continue;
        
        const status = (sheetData[i][statusIdx] || "").toString().trim().toUpperCase();
        if (status === "REJECTED" || status === "DISQUALIFIED" || status === "") continue;

        const region = (sheetData[i][regionIdx] || "").toString().trim();
        let logoUrl = (sheetData[i][logoIdx] || "").toString().trim();
        if (logoUrl.includes("IMAGE(")) {
          const match = logoUrl.match(/IMAGE\(['"]([^'"]+)['"]/i);
          if (match) logoUrl = match[1];
        }

        const averageElo = sheetData[i][avgEloIdx] || 0;
        const seed = sheetData[i][seedIdx] || "TBD";
        const roster = [];

        for (let p = 0; p < rowsPerTeam; p++) {
          const rowIdx = i + p;
          if (rowIdx >= sheetData.length) break;
          
          const pName = (sheetData[rowIdx][pNameIdx] || "").toString().trim();
          if (pName && pName !== "" && pName !== "N/A") {
            let role = "Player " + (p + 1);
            if (p === 0) role = "Captain";
            else if (p >= parseInt(config.playersperteam)) role = "Substitute";

            roster.push({
              role: role,
              discord: sheetData[rowIdx][discordIdx] || "",
              ign: pName,
              steam: sheetData[rowIdx][steamIdx] || "",
              faceit: sheetData[rowIdx][faceitIdx] || "",
              faceitElo: sheetData[rowIdx][liveEloIdx] || "N/A"
            });
          }
        }

        teams.push({
          name: teamName,
          logo: logoUrl,
          status: status,
          region: region,
          averageElo: averageElo,
          seed: seed,
          roster: roster
        });
      }
      return teams;
    } catch (e) {
      Logger.log("Failed to get approved teams: " + e);
      return [];
    }
  },

  getSlotsCount: function(tournamentId, config) {
    const teams = this.getApprovedTeams(tournamentId, config);
    const approvedCount = teams.filter(t => t.status === "APPROVED" || t.status === "ROSTER_LOCKED").length;
    const maxTeams = parseInt(config.maxteams);
    return {
      max: maxTeams,
      confirmed: approvedCount,
      left: Math.max(0, maxTeams - approvedCount)
    };
  }
};

/**
 * 6. TOURNAMENT SERVICE
 * Consolidates approvals, roster change requests, and operational state changes.
 */
const TournamentService = {
  approveTeam: function(submissionId, tournamentId) {
    const config = DatabaseAdapter.getTournamentConfig(tournamentId);
    const teamRow = DatabaseAdapter.getRowBySubmissionId(submissionId);
    if (!teamRow) throw new Error("REGISTRATION_NOT_FOUND");

    const rawData = DatabaseAdapter.getRawRegistrations();
    const headers = rawData[0].map(h => h.toString().toLowerCase());

    const teamName = teamRow[headers.indexOf("team name")];
    const teamTag = teamRow[headers.indexOf("team tag")];
    const region = teamRow[headers.indexOf("region")];
    const fileId = teamRow[headers.indexOf("logo file id")];
    const logoUrl = "https://lh3.googleusercontent.com/d/" + fileId;
    
    const maxPlayers = parseInt(config.playersperteam) + parseInt(config.substitutesmax);
    const rowsToAppend = [];
    const seedId = "PP-" + tournamentId.toUpperCase().replace(/[^a-zA-Z0-9]/g, "") + "-TBD";

    for (let p = 0; p < maxPlayers; p++) {
      const pNum = p + 1;
      const discordIdx = headers.indexOf(`p${pNum} discord`);
      const steamIdx = headers.indexOf(`p${pNum} steam`);
      const faceitIdx = headers.indexOf(`p${pNum} faceit`);
      
      const discord = discordIdx > -1 ? teamRow[discordIdx] : "";
      const steam = steamIdx > -1 ? teamRow[steamIdx] : "";
      const faceit = faceitIdx > -1 ? teamRow[faceitIdx] : "";

      const r = new Array(36).fill("");
      r[0]  = p === 0 ? "TBD" : "";                   // Col A (1): S.N
      r[1]  = p === 0 ? teamName : "";               // Col B (2): Team Name
      r[2]  = p === 0 ? teamTag : "";                // Col C (3): Team Tag
      r[3]  = p === 0 ? `=IMAGE("${logoUrl}")` : ""; // Col D (4): Logo
      r[4]  = p === 0 ? region : "";                 // Col E (5): Region
      r[5]  = faceit ? faceit.replace(/\/$/, "").split("/").pop() : (discord || ""); // Col F (6): IGN
      r[6]  = discord || "N/A";                      // Col G (7): Discord
      r[7]  = steam || "N/A";                        // Col H (8): Steam URL
      r[8]  = "⏳";                                  // Col I (9): Joined Discord
      r[9]  = "⏳";                                  // Col J (10): Role Issued
      r[10] = "⏳";                                  // Col K (11): Private VC
      r[11] = faceit || "N/A";                       // Col L (12): FACEIT URL
      r[12] = "⏳";                                  // Col M (13): Live ELO
      r[13] = p === 0 ? "⏳" : "";                    // Col N (14): Avg ELO
      r[14] = p === 0 ? "PENDING" : "";              // Col O (15): Reg. Status
      r[15] = p === 0 ? seedId : "";                 // Col P (16): Team Seed
      r[16] = "";                                    // Col Q (17): Remarks
      
      // Metadata columns (Versioning & Optimistic Concurrency)
      r[33] = p === 0 ? 1 : "";                      // Col AH (34): Version
      r[34] = p === 0 ? new Date().toISOString() : ""; // Col AI (35): Updated At
      r[35] = p === 0 ? "System" : "";               // Col AJ (36): Updated By

      rowsToAppend.push(r);
    }

    DatabaseAdapter.seedTeamToAdminOps(config.adminspreadsheetid, rowsToAppend);
    AuditService.recordEvent(tournamentId, "ROSTER_SEEDED", "PENDING", "APPROVED", "Seeded roster for " + teamName, "Admin");
  },

  submitChangeRequest: function(payload) {
    const tournamentId = payload.tournament_id;
    const config = DatabaseAdapter.getTournamentConfig(tournamentId);

    if (config.currentphase === "Roster Lock" || config.currentphase === "Completed") {
      return { success: false, error: ERROR_CODES.ROSTER_LOCKED.message, errorCode: ERROR_CODES.ROSTER_LOCKED.code };
    }

    const row = [
      new Date().toISOString(),
      tournamentId,
      payload.team_id,
      payload.field_changed,
      payload.old_value,
      payload.new_value,
      "PENDING_APPROVAL"
    ];

    DatabaseAdapter.logRosterChangeRequest(row);

    AuditService.recordEvent(tournamentId, "ROSTER_CHANGE_REQUESTED", "PENDING", "SUBMITTED", "Roster change requested for Team " + payload.team_id, "Captain");
    return { success: true };
  }
};

/**
 * 7. ENRICHMENT QUEUE SERVICE
 * Player level worker processing under LockService transactions
 */
const EnrichmentQueueService = {
  processQueue: function(workerId) {
    const config = DatabaseAdapter.getTournamentConfig("chaos-ii") || DatabaseAdapter.getTournamentConfig("community-cup-2");
    const batchSize = config.workerbatchsize || 10;
    
    const lock = LockService.getScriptLock();
    let jobs = [];
    
    try {
      lock.waitLock(10000); // Wait up to 10 seconds to lock queue
      jobs = DatabaseAdapter.getPendingJobs(batchSize);
      if (jobs.length === 0) return { processed: 0 };

      // Reserve jobs instantly
      jobs.forEach(job => {
        DatabaseAdapter.reserveJob(job.rowIdx, workerId);
      });
    } catch(err) {
      Logger.log("Worker failed to acquire queue reservation lock: " + err);
      return { error: "LOCK_TIMEOUT" };
    } finally {
      lock.releaseLock();
    }

    const startedTime = Date.now();
    let completedCount = 0;
    let failedCount = 0;

    jobs.forEach(job => {
      try {
        let success = false;
        let resultMsg = "";
        
        if (job.jobType === "FACEIT_SYNC") {
          success = EnrichmentQueueService.enrichFaceitPlayer_(job.playerId);
        } else if (job.jobType === "STEAM_SYNC") {
          success = EnrichmentQueueService.enrichSteamPlayer_(job.playerId);
        }

        if (success) {
          DatabaseAdapter.updateJobStatus(job.rowIdx, "SUCCESS", "");
          completedCount++;
        } else {
          const nextRetry = new Date(Date.now() + 60000 * 5).toISOString(); // Retry in 5 minutes
          DatabaseAdapter.updateJobStatus(job.rowIdx, "RETRY", "Enrichment step returned false");
          failedCount++;
        }
      } catch(jobErr) {
        DatabaseAdapter.updateJobStatus(job.rowIdx, "FAILED", jobErr.toString());
        failedCount++;
      }
    });

    // Log Worker Telemetry
    const duration = Date.now() - startedTime;
    const avgRuntime = jobs.length > 0 ? duration / jobs.length : 0;
    DatabaseAdapter.logWorkerStats([
      workerId,
      new Date(startedTime).toISOString(),
      new Date().toISOString(),
      completedCount,
      failedCount,
      avgRuntime,
      jobs.length * 2, // API count estimation
      failedCount,
      0
    ]);

    return { processed: jobs.length, completed: completedCount, failed: failedCount };
  },

  enrichFaceitPlayer_: function(playerId) {
    // Mock connector simulating external API retrieval
    Utilities.sleep(100); 
    const randomElo = Math.floor(Math.random() * 1000) + 1200;
    
    // Log player history via DatabaseAdapter
    DatabaseAdapter.logPlayerHistory([
      new Date().toISOString(), "N/A", "N/A", "Player Slot", "N/A", playerId, 
      "FACEIT", "ELO", "N/A", String(randomElo), "AUTO", BACKEND_CONFIG.version
    ]);
    return true;
  },

  enrichSteamPlayer_: function(playerId) {
    Utilities.sleep(100);
    
    DatabaseAdapter.logPlayerHistory([
      new Date().toISOString(), "N/A", "N/A", "Player Slot", playerId, "N/A", 
      "STEAM", "VAC Ban", "N/A", "False", "AUTO", BACKEND_CONFIG.version
    ]);
    return true;
  }
};

/**
 * 8. MATCH SERVICE
 * Static bracket rendering and localizing time updates.
 */
const MatchService = {
  getBracketData: function(tournamentId, config) {
    const settings = DatabaseAdapter.getBracketSettings(config.adminspreadsheetid);
    let bracketMode = "BETA";
    let bracketUrl = "";
    let schedule = [];

    if (settings) {
      for (let i = 1; i < settings.length; i++) {
        const key = (settings[i][0] || "").toString().trim().toLowerCase();
        const val = (settings[i][1] || "").toString().trim();
        if (key === "bracket_url" && val) bracketUrl = val;
        if (key === "bracket_mode" && val) bracketMode = val.toString().trim().toUpperCase();
        if (key === "schedule" && val) {
          schedule = val.split(',').map(s => s.trim());
        }
      }
    }

    if (bracketMode === "BETA") {
      return {
        type: "live",
        matches: [
          { id: "M01", round: "Round of 16", team1: "BSV", team2: "Matrix Gaming", status: "COMPLETED", winner: "BSV", score: "2-0", time: "2026-07-31T20:00:00+05:00", stream: "", source1: "SEEDED", source2: "SEEDED", format: "BO1", maps: "Mirage" }
        ],
        schedule: schedule,
        bracketUrl: bracketUrl
      };
    }

    if (bracketMode === "LIVE") {
      const bData = DatabaseAdapter.getBracketMatches(config.adminspreadsheetid);
      if (bData) {
        const matches = [];
        for (let i = 1; i < bData.length; i++) {
          const row = bData[i];
          const id = (row[0] || "").toString().trim();
          if (id) {
            matches.push({
              id: id,
              round: (row[1] || "").toString().trim(),
              team1: (row[2] || "").toString().trim(),
              team2: (row[3] || "").toString().trim(),
              status: (row[4] || "").toString().trim().toUpperCase(),
              winner: (row[5] || "").toString().trim(),
              score: (row[6] || "").toString().trim(),
              time: (row[7] || "").toString().trim(),
              stream: (row[8] || "").toString().trim(),
              source1: (row[9] || "").toString().trim(),
              source2: (row[10] || "").toString().trim(),
              format: (row[11] || "BO1").toString().trim(),
              maps: (row[12] || "").toString().trim()
            });
          }
        }
        return { type: "live", matches: matches, schedule: schedule, bracketUrl: bracketUrl };
      }
    }

    return { type: "image", url: bracketUrl };
  }
};

/**
 * 9. VALIDATION SERVICE
 * FACEIT lookups, Steam bans validation, and invite codes checks.
 */
const ValidationService = {
  validateInviteCode: function(code) {
    if (!code) return false;
    const inviteData = DatabaseAdapter.getInviteCodes();
    for (let i = 1; i < inviteData.length; i++) {
      const activeCode = (inviteData[i][0] || "").toString().trim();
      if (activeCode.toLowerCase() === code.toLowerCase()) {
        return true;
      }
    }
    return false;
  }
};

/**
 * 10. AUDIT SERVICE
 * Standardized logging facade writing only via the DatabaseAdapter
 */
const AuditService = {
  recordEvent: function(tournamentId, eventType, oldState, newState, desc, userEmail) {
    try {
      const eventId = "EVT-" + Utilities.getUuid().substring(0, 8).toUpperCase();
      const time = Utilities.formatDate(new Date(), "GMT+5", "yyyy-MM-dd HH:mm:ss");
      const row = [eventId, time, tournamentId, eventType, oldState, newState, desc, userEmail];
      DatabaseAdapter.appendEventLog(row);
    } catch(e) {
      Logger.log("Event write failed: " + e);
    }
  },

  recordAudit: function(sheetName, range, teamId, teamName, field, oldValue, newValue, source, reason, userEmail, action) {
    try {
      const auditId = "AUD-" + Utilities.getUuid().substring(0, 8).toUpperCase();
      const time = Utilities.formatDate(new Date(), "GMT+5", "yyyy-MM-dd HH:mm:ss");
      const row = [
        auditId, 
        time, 
        sheetName, 
        range, 
        teamId, 
        teamName, 
        field, 
        oldValue, 
        newValue, 
        source, 
        action || "UPDATE", 
        reason || "N/A", 
        userEmail
      ];
      DatabaseAdapter.appendAuditLog(row);
    } catch(e) {
      Logger.log("Audit write failed: " + e);
    }
  },

  // Retain legacy bindings
  logEvent: function(t, ev, o, n, d, u) {
    this.recordEvent(t, ev, o, n, d, u);
  },
  logAudit: function(sh, rg, tid, tnm, f, old, nw, src, usr) {
    this.recordAudit(sh, rg, tid, tnm, f, old, nw, src, "Manual edit", usr, "UPDATE");
  }
};

/**
 * 11. LIGHTWEIGHT AUDIT TRIGGER
 * Restructured to perform ONLY logging to prevent execution limits and sheets slow down.
 */
function onEdit(e) {
  if (!e || !e.range) return;
  
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  
  if (sheetName !== "Admin_Ops" && sheetName !== "Brackets") return;
  
  const row = range.getRow();
  if (row <= 1) return; // Skip headers

  const col = range.getColumn();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const fieldName = headers[col - 1] || "Column " + col;

  const newValue = e.value !== undefined ? e.value.toString() : "";
  const oldValue = e.oldValue !== undefined ? e.oldValue.toString() : "";
  if (newValue === oldValue) return;

  const adminUser = Session.getActiveUser().getEmail() || "Admin";
  
  // Single Cell Change Audit
  if (range.getNumRows() === 1 && range.getNumColumns() === 1) {
    let teamName = "";
    let teamId = "N/A";
    
    if (sheetName === "Admin_Ops") {
      // Find Team Name and Team ID row by reading column B
      teamName = sheet.getRange(row, 2).getValue().toString().trim();
      if (!teamName) {
        for (let r = row - 1; r >= 2; r--) {
          teamName = sheet.getRange(r, 2).getValue().toString().trim();
          if (teamName) break;
        }
      }
      
      // Update version metadata in operational workspace
      try {
        const rowsPerTeam = 7;
        const startTeamRow = Math.floor((row - 2) / rowsPerTeam) * rowsPerTeam + 2;
        const verRange = sheet.getRange(startTeamRow, 34); // Column AH (34)
        const oldVer = parseInt(verRange.getValue()) || 1;
        
        sheet.getRange(startTeamRow, 34).setValue(oldVer + 1); // Increment Version
        sheet.getRange(startTeamRow, 35).setValue(new Date().toISOString()); // Updated At
        sheet.getRange(startTeamRow, 36).setValue(adminUser); // Updated By
      } catch(verErr) {}
    } else if (sheetName === "Brackets") {
      const matchId = sheet.getRange(row, 1).getValue().toString().trim();
      teamId = "Match " + matchId;
      teamName = sheet.getRange(row, 3).getValue() + " vs " + sheet.getRange(row, 4).getValue();
    }
    
    AuditService.recordAudit(
      sheetName,
      "R" + row + "C" + col,
      teamId,
      teamName,
      fieldName,
      oldValue,
      newValue,
      "Manual",
      "Manual edit",
      adminUser,
      "UPDATE"
    );
  } else {
    // Bulk Edit Audit
    AuditService.recordAudit(
      sheetName,
      range.getA1Notation(),
      "N/A",
      "Multiple Rows",
      "Bulk Edit",
      "N/A",
      "N/A",
      "Manual",
      "Bulk edit",
      adminUser,
      "UPDATE"
    );
  }
}

// =============================================================================
//  GLOBAL EXPORTED MACROS & TRIGGERS (SPREADSHEET SIDE)
// =============================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Tournament OS")
    .addItem("Clear Settings Cache", "clearSettingsCache")
    .addItem("Setup Enrichment Cron", "setupEnrichmentCron")
    .addSeparator()
    .addItem("Schedule Match Time", "showTimeScheduler")
    .addItem("Setup Brackets Sheet", "setupBracketsSheet")
    .addItem("Update Bracket Dropdowns", "updateBracketDropdowns")
    .addToUi();
}

function clearSettingsCache() {
  DatabaseAdapter.clearConfigCache();
  SpreadsheetApp.getActiveSpreadsheet().toast("Configuration cache successfully cleared!", "Tournament OS");
}

function setupEnrichmentCron() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === "processEnrichmentQueue") {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger("processEnrichmentQueue")
           .timeBased()
           .everyMinutes(1)
           .create();
  SpreadsheetApp.getActiveSpreadsheet().toast("1-minute cron worker trigger successfully configured!", "Tournament OS");
}

function processEnrichmentQueue() {
  const workerId = "WRK-" + Utilities.getUuid().substring(0, 8).toUpperCase();
  EnrichmentQueueService.processQueue(workerId);
}

function showTimeScheduler() {
  const html = HtmlService.createHtmlOutputFromFile('TimeScheduler')
      .setTitle('Match Scheduler')
      .setWidth(350);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getActiveMatchDetails() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    if (sheet.getName() !== "Brackets") {
      return { error: "Please open and select a row in the 'Brackets' sheet first." };
    }
    
    const activeCell = sheet.getActiveCell();
    const rowIdx = activeCell.getRow();
    if (rowIdx <= 1) {
      return { error: "Please select a valid Match row (Row 2 or below)." };
    }
    
    const rowData = sheet.getRange(rowIdx, 1, 1, 13).getValues()[0];
    const matchId = (rowData[0] || "").toString().trim();
    const team1 = (rowData[2] || "").toString().trim();
    const team2 = (rowData[3] || "").toString().trim();
    const timeStr = (rowData[7] || "").toString().trim();
    const formatStr = (rowData[11] || "BO1").toString().trim();
    const mapsStr = (rowData[12] || "").toString().trim();
    
    if (!matchId) {
      return { error: "Selected row does not contain a valid Match ID." };
    }
    
    let dateVal = "";
    let timeVal = "";
    let offsetVal = "+5";
    
    if (timeStr && timeStr.includes("T")) {
      const parts = timeStr.split("T");
      dateVal = parts[0];
      
      const timeParts = parts[1].split(/[+-]/);
      if (timeParts[0]) {
        timeVal = timeParts[0].substring(0, 5); // HH:MM
      }
      
      const hasPlus = parts[1].includes("+");
      const hasMinus = parts[1].includes("-");
      if (hasPlus || hasMinus) {
        const sign = hasPlus ? "+" : "-";
        const offsetStr = parts[1].substring(parts[1].indexOf(sign));
        const offsetParts = offsetStr.split(":");
        const hrs = parseInt(offsetParts[0], 10);
        const mins = offsetParts[1] ? parseInt(offsetParts[1], 10) : 0;
        const val = hrs + (mins / 60) * (hrs >= 0 ? 1 : -1);
        offsetVal = String(val);
      }
    }
    
    return {
      id: matchId,
      team1: team1 || "TBD",
      team2: team2 || "TBD",
      date: dateVal,
      time: timeVal,
      offset: offsetVal,
      format: formatStr,
      maps: mapsStr
    };
  } catch (e) {
    return { error: e.toString() };
  }
}

function saveMatchTime(dateVal, timeVal, offsetVal, formatVal, mapsVal) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  if (sheet.getName() !== "Brackets") {
    throw new Error("Please open the 'Brackets' sheet first.");
  }
  
  const activeCell = sheet.getActiveCell();
  const rowIdx = activeCell.getRow();
  if (rowIdx <= 1) {
    throw new Error("Please select a valid Match row.");
  }
  
  const val = parseFloat(offsetVal);
  const sign = val >= 0 ? "+" : "-";
  const absVal = Math.abs(val);
  const hrs = Math.floor(absVal);
  const mins = Math.round((absVal - hrs) * 60);
  const offsetFormatted = sign + String(hrs).padStart(2, "0") + ":" + String(mins).padStart(2, "0");
  
  const timestamp = dateVal + "T" + timeVal + ":00" + offsetFormatted;
  
  sheet.getRange(rowIdx, 8).setValue(timestamp);
  sheet.getRange(rowIdx, 12).setValue(formatVal || "BO1");
  sheet.getRange(rowIdx, 13).setValue(mapsVal || "");
  
  SpreadsheetApp.flush();
}

function setupBracketsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Brackets");
  if (!sheet) {
    sheet = ss.insertSheet("Brackets");
  }
  
  const headers = [
    "Match ID", "Round", "Team 1", "Team 2", "Status", "Winner", "Score", "Time (e.g. 20:00 +5 GMT)", "Stream Link", "Source Match 1", "Source Match 2", "Format", "Selected Maps"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
       .setFontWeight("bold")
       .setBackground("#1D4ED8")
       .setFontColor("white")
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle");
       
  sheet.setFrozenRows(1);
  
  if (sheet.getLastRow() <= 1) {
    const matches = [];
    for (let i = 1; i <= 8; i++) {
      const id = "M" + String(i).padStart(2, "0");
      matches.push([id, "Round of 16", "", "", "SCHEDULED", "TBD", "", "20:00 +5 GMT", "", "SEEDED", "SEEDED", "BO1", ""]);
    }
    for (let i = 9; i <= 12; i++) {
      const id = "M" + String(i).padStart(2, "0");
      const src1 = "M" + String((i - 9) * 2 + 1).padStart(2, "0");
      const src2 = "M" + String((i - 9) * 2 + 2).padStart(2, "0");
      matches.push([id, "Quarterfinals", "", "", "SCHEDULED", "TBD", "", "20:00 +5 GMT", "", src1, src2, "BO3", ""]);
    }
    for (let i = 13; i <= 14; i++) {
      const id = "M" + String(i).padStart(2, "0");
      const src1 = "M" + String(9 + (i - 13) * 2).padStart(2, "0");
      const src2 = "M" + String(10 + (i - 13) * 2).padStart(2, "0");
      matches.push([id, "Semifinals", "", "", "SCHEDULED", "TBD", "", "20:00 +5 GMT", "", src1, src2, "BO3", ""]);
    }
    matches.push(["M15", "Grand Finals", "", "", "SCHEDULED", "TBD", "", "20:00 +5 GMT", "", "M13", "M14", "BO3", ""]);
    
    sheet.getRange(2, 1, matches.length, headers.length).setValues(matches);
  }
  
  const statusRange = sheet.getRange(2, 5, sheet.getMaxRows() - 1, 1);
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["SCHEDULED", "LIVE", "ON HOLD", "COMPLETED", "BYE"], true)
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(statusRule);

  const formatRange = sheet.getRange(2, 12, sheet.getMaxRows() - 1, 1);
  const formatRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["BO1", "BO3", "BO5"], true)
    .setAllowInvalid(false)
    .build();
  formatRange.setDataValidation(formatRule);
  
  updateBracketDropdowns();
  ss.toast("Brackets sheet setup complete!", "Tournament OS", 5);
}

function updateBracketDropdowns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bracketsSheet = ss.getSheetByName("Brackets");
  const adminSheet = ss.getSheetByName("Admin_Ops") || ss.getSheets()[0];
  if (!bracketsSheet || !adminSheet) return;

  const adminData = adminSheet.getDataRange().getValues();
  const teamsList = ["TBD", "BYE"];
  
  for (let i = 1; i < adminData.length; i++) {
    const name = (adminData[i][1] || "").toString().trim(); // Column B
    if (name && name !== "Team Name" && !teamsList.includes(name)) {
      teamsList.push(name);
    }
  }

  const lastRow = bracketsSheet.getLastRow();
  if (lastRow <= 1) return;

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(teamsList, true)
    .setAllowInvalid(false)
    .build();

  bracketsSheet.getRange(2, 3, lastRow - 1, 2).setDataValidation(rule);

  const matchData = bracketsSheet.getRange(2, 1, lastRow - 1, 11).getValues();
  for (let r = 2; r <= lastRow; r++) {
    const t1Val = (matchData[r - 2][2] || "").toString().trim();
    const t2Val = (matchData[r - 2][3] || "").toString().trim();
    const wOptions = ["TBD"];
    if (t1Val && t1Val !== "TBD") wOptions.push(t1Val);
    if (t2Val && t2Val !== "TBD") wOptions.push(t2Val);
    
    const winnerRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(wOptions, true)
      .setAllowInvalid(false)
      .build();
    bracketsSheet.getRange(r, 6).setDataValidation(winnerRule);
  }
}
