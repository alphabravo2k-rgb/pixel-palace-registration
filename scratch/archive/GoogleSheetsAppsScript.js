/**
 * PIXEL PALACE PORTAL BACKEND — GOOGLE APPS SCRIPT v9.9
 *
 * INSTRUCTIONS:
 * 1. Open your Google Spreadsheet (e.g. Master Registration Sheet).
 * 2. Click Extensions > Apps Script.
 * 3. Delete any default code and paste this script.
 * 4. Create the following sheet tabs in your spreadsheet if they don't exist:
 *    - "InviteCodes" (Columns: Code, TournamentId, Used)
 *    - "BannedPlayers" (Column A: Steam64 ID)
 * 5. Run the `setupAdminSheet()` function once (select it from the toolbar and click Run).
 *    This will create the "Admin_Dashboard", "AuditLog", and the 5 session sheets.
 * 6. Click "Deploy" > "New deployment" > "Web app". Set "Execute as" to "Me", "Who has access" to "Anyone".
 * 7. Copy the Web App URL and paste it into `sheetsEndpoint` in your `src/config/tournaments.js`.
 */

const ADMIN_SECRET = ""; 
const SERVER_SECRET = "PixelPalaceSecretSalt2026"; // Server secret for fingerprint salting

function doPost(e) {
  try {
    const jsonString = e.postData.contents;
    const data = JSON.parse(jsonString);
    const endpoint = data.endpoint || "";

    // API Versioning Enforcement
    if (!endpoint.startsWith("/api/v1/")) {
      return jsonResponse({ error: "UNSUPPORTED_API_VERSION: Requests must target /api/v1/ endpoints." }, 400);
    }
    
    // Optional auth check
    if (ADMIN_SECRET && data._gateway_secret !== ADMIN_SECRET) {
      return jsonResponse({ error: "Unauthorized: Invalid gateway secret." }, 401);
    }

    // Check request idempotency (5 minutes cache)
    if (data.requestId) {
      const cacheKey = "req_" + data.requestId;
      const cached = CacheService.getScriptCache().get(cacheKey);
      if (cached) {
        return jsonResponse(JSON.parse(cached));
      }
    }

    let response;
    if (endpoint === "/api/v1/register") {
      response = handleRegister(data);
    } else if (endpoint === "/api/v1/saveDraft") {
      response = handleSaveDraft(data);
    } else if (endpoint === "/api/v1/renewLock") {
      response = handleRenewLock(data);
    } else if (endpoint === "/api/v1/logEvents") {
      response = handleLogEvents(data);
    } else if (endpoint === "/api/v1/logDiagnostics") {
      response = handleLogDiagnostics(data);
    } else {
      return jsonResponse({ error: "NOT_FOUND: Endpoint " + endpoint + " not found." }, 404);
    }

    // Store response in cache for idempotency (5 minutes)
    if (data.requestId && response && !response.error) {
      const cacheKey = "req_" + data.requestId;
      CacheService.getScriptCache().put(cacheKey, JSON.stringify(response), 300);
    }

    return jsonResponse(response);

  } catch (err) {
    return jsonResponse({ error: "SYSTEM_ERROR: " + err.toString() }, 500);
  }
}

function doGet(e) {
  try {
    const params = e.parameter;
    const endpoint = params.endpoint || "";

    // API Versioning Enforcement
    if (!endpoint.startsWith("/api/v1/")) {
      return jsonResponse({ error: "UNSUPPORTED_API_VERSION: Requests must target /api/v1/ endpoints." }, 400);
    }
    
    const tournamentId = params.tournamentId || "community-cup-2";

    if (endpoint === "/api/v1/capabilities") {
      return jsonResponse(handleGetCapabilities());
    }

    if (endpoint === "/api/v1/validateCode") {
      const isValid = checkInviteCode(tournamentId, params.validateCode, false);
      return jsonResponse({ valid: isValid });
    }

    if (endpoint === "/api/v1/getSlots") {
      const counts = getSlotCounts(tournamentId);
      return jsonResponse(counts);
    }

    if (endpoint === "/api/v1/getTeams") {
      const teams = getRegisteredTeams(tournamentId);
      return jsonResponse({ teams: teams });
    }

    if (endpoint === "/api/v1/checkBans") {
      const steamIds = (params.steamIds || "").split(",");
      const hasBans = checkPlayerBans(steamIds);
      return jsonResponse({ hasBans: hasBans });
    }

    if (endpoint === "/api/v1/getDraft") {
      return jsonResponse(handleGetDraft(params));
    }

    if (endpoint === "/api/v1/checkDuplicateDrafts") {
      return jsonResponse(handleCheckDuplicateDrafts(params));
    }

    if (endpoint === "/api/v1/getAllDrafts") {
      return jsonResponse(handleGetAllDrafts(params));
    }

    if (endpoint === "/api/v1/metrics") {
      return jsonResponse(handleGetMetrics(params));
    }

    return jsonResponse({ error: "NOT_FOUND: Endpoint " + endpoint + " not found." }, 404);

  } catch (err) {
    return jsonResponse({ error: "SYSTEM_ERROR: " + err.toString() }, 500);
  }
}

function jsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ==========================================
// ENDPOINT: SERVER CAPABILITIES NEGOTIATION
// ==========================================
function handleGetCapabilities() {
  return {
    success: true,
    schemaVersion: 2,
    features: {
      tracking: true,
      locking: true,
      recovery: true,
      diagnostics: true,
      revisions: true,
      duplicates: true
    },
    maxPayloadSize: 50000,
    maxBatchSize: 10,
    apiVersion: "2.0"
  };
}

// ==========================================
// ENDPOINT: REGISTER TEAM
// ==========================================
function handleRegister(data) {
  const tournamentId = data.tournament_id || "community-cup-2";
  const sheetName = "Registrations_" + tournamentId;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const headers = [
      "Team ID", "Submission ID", "Submitted At", "Status", "Team Name", "Team Tag", 
      "Region", "Logo URL", "Invite Code", "Sub Included", "Average Elo", "Roster Size",
      "P1 Role", "P1 ID", "P1 IGN", "P1 Discord", "P1 Steam", "P1 Steam64", "P1 Faceit", "P1 Faceit Lvl", "P1 Faceit Elo", "P1 CS2 Rank", "P1 Avatar", "P1 Wallet Address",
      "P2 Role", "P2 ID", "P2 IGN", "P2 Discord", "P2 Steam", "P2 Steam64", "P2 Faceit", "P2 Faceit Lvl", "P2 Faceit Elo", "P2 CS2 Rank", "P2 Avatar",
      "P3 Role", "P3 ID", "P3 IGN", "P3 Discord", "P3 Steam", "P3 Steam64", "P3 Faceit", "P3 Faceit Lvl", "P3 Faceit Elo", "P3 CS2 Rank", "P3 Avatar",
      "P4 Role", "P4 ID", "P4 IGN", "P4 Discord", "P4 Steam", "P4 Steam64", "P4 Faceit", "P4 Faceit Lvl", "P4 Faceit Elo", "P4 CS2 Rank", "P4 Avatar",
      "P5 Role", "P5 ID", "P5 IGN", "P5 Discord", "P5 Steam", "P5 Steam64", "P5 Faceit", "P5 Faceit Lvl", "P5 Faceit Elo", "P5 CS2 Rank", "P5 Avatar",
      "P6 Role", "P6 ID", "P6 IGN", "P6 Discord", "P6 Steam", "P6 Steam64", "P6 Faceit", "P6 Faceit Lvl", "P6 Faceit Elo", "P6 CS2 Rank", "P6 Avatar", 
      "P7 Role", "P7 ID", "P7 IGN", "P7 Discord", "P7 Steam", "P7 Steam64", "P7 Faceit", "P7 Faceit Lvl", "P7 Faceit Elo", "P7 CS2 Rank", "P7 Avatar"
    ];
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  const rows = sheet.getDataRange().getValues();
  const newTeamName = data.team_name.trim().toUpperCase();
  const newSteam64s = [];
  const newFaceitUrls = [];
  
  for (let p = 1; p <= 7; p++) {
    const steam64 = data[`p${p}Steam64`];
    const faceit = data[`p${p}Faceit`];
    if (steam64) newSteam64s.push(String(steam64).trim());
    if (faceit) newFaceitUrls.push(String(faceit).trim().toLowerCase());
  }

  for (let i = 1; i < rows.length; i++) {
    const existingStatus = rows[i][3];
    if (existingStatus === "REJECTED") continue;

    const existingTeamName = String(rows[i][4]).trim().toUpperCase();
    if (existingTeamName === newTeamName) {
      return { error: "DUPLICATE_TEAM_NAME: A team named '" + data.team_name + "' is already registered." };
    }

    for (let c = 12; c < rows[i].length; c++) {
      const cellVal = String(rows[i][c]).trim();
      if (!cellVal) continue;

      if (newSteam64s.indexOf(cellVal) !== -1) {
        return { error: "DUPLICATE_PLAYER_STEAM: One of your players (Steam64: " + cellVal + ") is already registered in another team." };
      }

      const cleanCellVal = cellVal.toLowerCase();
      if (newFaceitUrls.indexOf(cleanCellVal) !== -1) {
        return { error: "DUPLICATE_PLAYER_FACEIT: One of your players (FACEIT Profile: " + cellVal + ") is already registered in another team." };
      }
    }
  }

  const slotStats = getSlotCounts(tournamentId);
  const isInvite = !!data.invite_code;
  
  if (isInvite) {
    const inviteValid = checkInviteCode(tournamentId, data.invite_code, true);
    if (!inviteValid) {
      return { error: "INVALID_INVITE_CODE: The invite code is invalid, expired, or has already been used." };
    }
    if (slotStats.inviteConfirmed >= 6) {
      return { error: "INVITE_SLOTS_FULL: All 6 invite slots are filled." };
    }
  } else {
    if (slotStats.openConfirmed >= 26) {
      return { error: "OPEN_SLOTS_FULL: All 26 normal open registration slots are filled." };
    }
  }

  if (slotStats.inviteConfirmed + slotStats.openConfirmed >= 32) {
    return { error: "TOURNAMENT_FULL: The tournament is completely full (32/32 teams)." };
  }

  let eloSum = 0;
  let eloCount = 0;
  let rosterSize = 0;

  for (let p = 1; p <= 7; p++) {
    const eloVal = parseInt(data[`p${p}FaceitElo`]);
    const ign = data[`p${p}IGN`];
    if (ign && ign.trim() !== "") {
      rosterSize++;
      if (!isNaN(eloVal) && eloVal > 0) {
        eloSum += eloVal;
        eloCount++;
      }
    }
  }
  const averageElo = eloCount > 0 ? Math.round(eloSum / eloCount) : 0;

  const nextSerial = rows.length;
  const teamId = "PP-CC2-" + String(nextSerial).padStart(3, '0');

  const row = [
    teamId,
    data.submission_id,
    data.submitted_at || new Date().toISOString(),
    "PENDING",
    data.team_name,
    data.team_tag,
    data.region,
    data.logo_url,
    data.invite_code || "",
    data.sub_included ? "TRUE" : "FALSE",
    averageElo,
    rosterSize,
    
    data.p1Role || "CAPTAIN", data.p1Id || "", data.p1IGN || "", data.p1Discord || "", data.p1Steam || "", data.p1Steam64 || "", data.p1Faceit || "", data.p1FaceitLevel || "N/A", data.p1FaceitElo || "N/A", data.p1CS2Rank || "Not Linked", data.p1Avatar || "", data.p1WalletAddress || "",
    data.p2Role || "STARTER", data.p2Id || "", data.p2IGN || "", data.p2Discord || "", data.p2Steam || "", data.p2Steam64 || "", data.p2Faceit || "", data.p2FaceitLevel || "N/A", data.p2FaceitElo || "N/A", data.p2CS2Rank || "Not Linked", data.p2Avatar || "",
    data.p3Role || "STARTER", data.p3Id || "", data.p3IGN || "", data.p3Discord || "", data.p3Steam || "", data.p3Steam64 || "", data.p3Faceit || "", data.p3FaceitLevel || "N/A", data.p3FaceitElo || "N/A", data.p3CS2Rank || "Not Linked", data.p3Avatar || "",
    data.p4Role || "STARTER", data.p4Id || "", data.p4IGN || "", data.p4Discord || "", data.p4Steam || "", data.p4Steam64 || "", data.p4Faceit || "", data.p4FaceitLevel || "N/A", data.p4FaceitElo || "N/A", data.p4CS2Rank || "Not Linked", data.p4Avatar || "",
    data.p5Role || "STARTER", data.p5Id || "", data.p5IGN || "", data.p5Discord || "", data.p5Steam || "", data.p5Steam64 || "", data.p5Faceit || "", data.p5FaceitLevel || "N/A", data.p5FaceitElo || "N/A", data.p5CS2Rank || "Not Linked", data.p5Avatar || "",
    data.p6Role || "", data.p6Id || "", data.p6IGN || "", data.p6Discord || "", data.p6Steam || "", data.p6Steam64 || "", data.p6Faceit || "", data.p6FaceitLevel || "", data.p6FaceitElo || "", data.p6CS2Rank || "", data.p6Avatar || "",
    data.p7Role || "", data.p7Id || "", data.p7IGN || "", data.p7Discord || "", data.p7Steam || "", data.p7Steam64 || "", data.p7Faceit || "", data.p7FaceitLevel || "", data.p7FaceitElo || "", data.p7CS2Rank || "", data.p7Avatar || ""
  ];

  sheet.appendRow(row);

  logAuditEntry(sheetName, rows.length + 1, "REGISTRATION_SUBMITTED", "", "PENDING");

  if (data.sessionUuid) {
    updateDraftStatusAndAppendEvent(data.sessionUuid, "STATUS_SUBMITTED", "SUBMISSION_COMPLETED", "Roster Secured - Submission ID: " + data.submission_id);
  }

  updateDashboardStats();
  runValidationChecks(tournamentId);

  return { success: true, submissionId: data.submission_id, teamId: teamId };
}

// ==========================================
// ENDPOINT: SAVE DRAFT (AUTOSAVE WITH REVISIONS & OPTIMISTIC CONCURRENCY)
// ==========================================
function handleSaveDraft(data) {
  initDraftSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const catalogSheet = ss.getSheetByName("MASTER_DRAFT_REGISTRATIONS");
  
  const sessionUuid = data.sessionUuid;
  if (!sessionUuid) {
    return { error: "ERR_SCHEMA: Session UUID is required." };
  }

  const values = catalogSheet.getDataRange().getValues();
  let rowIndex = -1;
  let currentSheetRevision = 0;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === sessionUuid) {
      rowIndex = i + 1;
      currentSheetRevision = parseInt(values[i][1]) || 0; // Col 2: Current Revision
      break;
    }
  }

  // 1. Optimistic Concurrency Expected Revision check
  if (rowIndex !== -1 && data.expectedRevision !== undefined) {
    const expected = parseInt(data.expectedRevision) || 0;
    if (currentSheetRevision > expected) {
      return { 
        error: "ERR_REVISION_MISMATCH", 
        message: "Optimistic concurrency conflict. Server revision: " + currentSheetRevision + ", expected: " + expected, 
        errorCode: "409" 
      };
    }
  }

  const serverTime = new Date().toISOString();

  // 2. RAM-Based Lock checking (via CacheService)
  const cache = CacheService.getScriptCache();
  const lockKey = "lock_" + sessionUuid;
  const activeLockOwner = cache.get(lockKey);
  
  if (activeLockOwner && activeLockOwner !== data.lockOwner) {
    return { error: "ERR_LOCK_LOST", message: "Lock lease held by another browser window." };
  }

  // 3. State Machine Transition Checks
  const FSM_VALID_TRANSITIONS = {
    'STATUS_NEW': ['STATUS_ACTIVE'],
    'STATUS_ACTIVE': ['STATUS_IDLE', 'STATUS_VALIDATING', 'STATUS_EXPIRED'],
    'STATUS_IDLE': ['STATUS_RESUMED', 'STATUS_ABANDONED', 'STATUS_EXPIRED'],
    'STATUS_RESUMED': ['STATUS_ACTIVE', 'STATUS_VALIDATING', 'STATUS_EXPIRED'],
    'STATUS_ABANDONED': ['STATUS_RESUMED', 'STATUS_EXPIRED'],
    'STATUS_VALIDATING': ['STATUS_ACTIVE', 'STATUS_SUBMITTING'],
    'STATUS_SUBMITTING': ['STATUS_SUBMITTED', 'STATUS_ACTIVE'],
    'STATUS_SUBMITTED': ['STATUS_ARCHIVED'],
    'STATUS_ARCHIVED': ['STATUS_PURGED'],
    'STATUS_EXPIRED': ['STATUS_PURGED']
  };

  if (rowIndex !== -1) {
    const oldStatus = String(values[rowIndex - 1][25]); // Col 26: Draft Status
    const newStatus = data.draftStatus;
    
    if (oldStatus && newStatus && oldStatus !== newStatus) {
      const allowed = FSM_VALID_TRANSITIONS[oldStatus] || [];
      if (allowed.indexOf(newStatus) === -1) {
        return { error: "ERR_INVALID_TRANSITION", message: "Forbidden FSM state transition: " + oldStatus + " -> " + newStatus };
      }
    }

    // Rate Limiting Check (2 seconds limit)
    const lastActivity = new Date(values[rowIndex - 1][16]).getTime(); // Col 17: Last Activity Time
    if (Date.now() - lastActivity < 2000) {
      return { error: "ERR_RATE_LIMIT", message: "Saves are rate-limited to protect Apps Script quotas." };
    }
  }

  // 4. Overwrite Current Active State in MASTER_DRAFT_CURRENT_PAYLOADS
  const currentRevision = data.currentRevision || 1;
  const snapshotId = Utilities.getUuid();
  
  if (data.formData) {
    const currentPayloadsSheet = ss.getSheetByName("MASTER_DRAFT_CURRENT_PAYLOADS");
    const payValues = currentPayloadsSheet.getDataRange().getValues();
    let payRowIndex = -1;
    for (let p = 1; p < payValues.length; p++) {
      if (String(payValues[p][0]) === sessionUuid) {
        payRowIndex = p + 1;
        break;
      }
    }
    
    const payloadRow = [
      sessionUuid,
      currentRevision,
      serverTime,
      data.compression || "COMP_NONE",
      data.formData
    ];
    
    if (payRowIndex === -1) {
      currentPayloadsSheet.appendRow(payloadRow);
    } else {
      currentPayloadsSheet.getRange(payRowIndex, 1, 1, payloadRow.length).setValues([payloadRow]);
    }

    // 5. Append checkpoint snapshot to MASTER_DRAFT_HISTORY on milestones
    const isMilestone = data.draftStatus === "STATUS_VALIDATING" || 
                        data.draftStatus === "STATUS_SUBMITTING" || 
                        data.draftStatus === "STATUS_SUBMITTED" || 
                        (currentRevision % 10 === 0) || 
                        data.isMilestone;
    if (isMilestone) {
      const historySheet = ss.getSheetByName("MASTER_DRAFT_HISTORY");
      historySheet.appendRow([
        snapshotId,
        sessionUuid,
        currentRevision,
        serverTime,
        data.compression || "COMP_NONE",
        data.formData,
        data.draftStatus || "STATUS_ACTIVE"
      ]);
    }
  }

  // Salted Fingerprint Generation
  const fingerprintSource = SERVER_SECRET + (data.teamName || "") + (data.p1Steam64 || "") + (data.p1Faceit || "") + (data.p1Discord || "");
  const fingerprintHash = computeSha256(fingerprintSource);

  // Write catalog operational data
  const rowData = [
    sessionUuid,                                  // Session UUID
    currentRevision,                              // Current Revision
    data.tournamentId || "community-cup-2",       // Tournament ID
    data.teamName || "",                          // Team Name
    data.p1IGN || "",                             // Captain Name
    data.p1Discord || "",                         // Captain Discord
    data.p1Faceit || "",                          // Captain FACEIT
    data.country || "",                           // Country (Region)
    data.currentStep || "",                       // Current Step
    data.lastCompletedStep || "",                 // Last Completed Step
    data.frictionStage || "",                     // Friction Stage
    data.completedRequiredFieldsCount || 0,       // Completed Required Fields
    data.totalRequiredFieldsCount || 0,           // Total Required Fields
    data.missingFields || "",                     // Missing Fields
    data.totalPlayersAdded || 0,                  // Total Players Added
    data.timeStarted || serverTime,               // Time Started
    serverTime,                                   // Last Activity Time
    data.activeEditingTime || 0,                  // Active Editing Time
    data.idleTime || 0,                           // Idle Time
    data.offlineTime || 0,                        // Offline Time
    data.totalSessionDuration || 0,               // Total Session Duration
    data.referralSource || "REF_UNKNOWN",         // Referral Source
    data.utm_source || "",                        // utm_source
    data.utm_medium || "",                        // utm_medium
    data.utm_campaign || "",                      // utm_campaign
    data.draftStatus || "STATUS_ACTIVE",          // Draft Status
    data.draftExpiryReason || "",                 // Draft Expiry Reason
    data.dropOffReason || "",                     // Drop-off Reason
    data.lookupFailuresCount || 0,                // Lookup Failures Count
    data.validationFailuresCount || 0,            // Validation Failures Count
    data.resumeCount || 0,                        // Resume Count
    data.idleCount || 0,                          // Idle Count
    data.offlineCount || 0,                       // Offline Count
    fingerprintHash,                              // Registration Fingerprint
    data.sessionSource || "SRC_NEW_SESSION",      // Session Source
    data.lockOwner || "",                         // Lock Owner
    serverTime,                                   // Last Lock Renewal
    snapshotId                                    // Current Snapshot ID
  ];

  if (rowIndex === -1) {
    catalogSheet.appendRow(rowData);
  } else {
    catalogSheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  }

  // 6. Batch telemetries write
  if (data.events && Array.isArray(data.events)) {
    const eventsSheet = ss.getSheetByName("MASTER_DRAFT_EVENTS");
    data.events.forEach(evt => {
      eventsSheet.appendRow([
        evt.eventId || Utilities.getUuid(),
        sessionUuid,
        evt.batchId || "",
        evt.requestId || data.requestId || "",
        evt.timestamp || serverTime,
        evt.frictionStage || data.frictionStage || "",
        evt.eventType || "FIELD_UPDATED",
        evt.taxonomyVersion || "v1",
        evt.details ? JSON.stringify(evt.details) : ""
      ]);
    });
  }

  return { success: true, revision: currentRevision, serverTime: serverTime };
}

// ==========================================
// ENDPOINT: RENEW LEASE LOCK (Cache-Based Heartbeats)
// ==========================================
function handleRenewLock(data) {
  const sessionUuid = data.sessionUuid;
  const lockOwner = data.lockOwner;
  if (!sessionUuid || !lockOwner) return { error: "ERR_SCHEMA: Session UUID and lock owner required." };

  const cache = CacheService.getScriptCache();
  const lockKey = "lock_" + sessionUuid;
  const activeLock = cache.get(lockKey);

  if (!activeLock || activeLock === lockOwner) {
    cache.put(lockKey, lockOwner, 35); // Keep lock lease in RAM for 35s
    return { success: true };
  } else {
    return { success: false, errorCode: "ERR_LOCK_LOST", message: "Lease lock held by another tab." };
  }
}

// ==========================================
// GET ENDPOINT: GET DRAFT
// ==========================================
function handleGetDraft(params) {
  initDraftSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("MASTER_DRAFT_REGISTRATIONS");
  const sessionUuid = params.sessionUuid;
  
  if (!sessionUuid) return { error: "ERR_SCHEMA: Session UUID required." };

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === sessionUuid) {
      const status = values[i][25]; // Column 26: Draft Status
      const revision = values[i][1]; // Column 2: Current Revision
      
      let formData = "{}";
      const currentPayloadsSheet = ss.getSheetByName("MASTER_DRAFT_CURRENT_PAYLOADS");
      const payValues = currentPayloadsSheet.getDataRange().getValues();
      for (let p = 1; p < payValues.length; p++) {
        if (String(payValues[p][0]) === sessionUuid) {
          formData = payValues[p][4]; // Column E: Compressed JSON
          break;
        }
      }

      return {
        success: true,
        draft: {
          sessionUuid: sessionUuid,
          status: status,
          revision: revision,
          formData: JSON.parse(formData || "{}"),
          lastActivityTime: values[i][16],
          schemaVersion: params.schemaVersion || "v1"
        }
      };
    }
  }
  return { error: "ERR_SESSION_NOT_FOUND" };
}

// ==========================================
// GET ENDPOINT: DUPLICATE DETECTION WITH MATCH SCORING
// ==========================================
function handleCheckDuplicateDrafts(params) {
  initDraftSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("MASTER_DRAFT_REGISTRATIONS");
  const tournamentId = params.tournamentId || "community-cup-2";

  // Check fingerprint first
  const fingerprintSource = SERVER_SECRET + (params.teamName || "") + (params.steam64 || "") + (params.faceit || "") + (params.discord || "");
  const fingerprintHash = computeSha256(fingerprintSource);

  const values = sheet.getDataRange().getValues();
  let bestMatch = null;
  let highestConfidence = 0;

  for (let i = 1; i < values.length; i++) {
    const rowTourney = values[i][2];
    const status = values[i][25];
    
    // Ignore other tournaments or completed/purged drafts
    if (rowTourney !== tournamentId || status === "STATUS_SUBMITTED" || status === "STATUS_PURGED") {
      continue;
    }

    const rowFingerprint = values[i][33]; // Col 34: Fingerprint
    if (rowFingerprint && rowFingerprint === fingerprintHash) {
      return {
        duplicate: true,
        confidence: 100,
        session: {
          sessionUuid: values[i][0],
          teamName: values[i][3],
          captainName: values[i][4]
        }
      };
    }

    // Weighted match scoring fallback
    let matchScore = 0;
    const rowTeam = String(values[i][3]).trim().toUpperCase();
    const rowCaptainDiscord = String(values[i][5]).trim().toLowerCase();
    const rowCaptainFaceit = String(values[i][6]).trim().toLowerCase();

    if (params.teamName && rowTeam === params.teamName.trim().toUpperCase()) matchScore += 30;
    if (params.discord && rowCaptainDiscord === params.discord.trim().toLowerCase()) matchScore += 90;
    if (params.faceit && rowCaptainFaceit === params.faceit.trim().toLowerCase()) matchScore += 80;

    // Determine highest confidence score
    if (matchScore > highestConfidence) {
      highestConfidence = matchScore;
      bestMatch = {
        sessionUuid: values[i][0],
        teamName: values[i][3],
        captainName: values[i][4]
      };
    }
  }

  const matchPercent = Math.min(highestConfidence, 100);
  if (matchPercent >= 80) {
    return {
      duplicate: true,
      confidence: matchPercent,
      session: bestMatch
    };
  }

  return { duplicate: false };
}

// ==========================================
// GET ENDPOINT: GET ALL SESSIONS FOR INSPECTORS
// ==========================================
function handleGetAllDrafts(params) {
  initDraftSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const catalogSheet = ss.getSheetByName("MASTER_DRAFT_REGISTRATIONS");
  const eventsSheet = ss.getSheetByName("MASTER_DRAFT_EVENTS");
  const diagnosticsSheet = ss.getSheetByName("MASTER_DRAFT_DIAGNOSTICS");
  
  const tournamentId = params.tournamentId || "community-cup-2";
  const catalogValues = catalogSheet.getDataRange().getValues();
  const drafts = [];

  for (let i = 1; i < catalogValues.length; i++) {
    const rowTourney = catalogValues[i][2];
    if (rowTourney === tournamentId) {
      drafts.push({
        sessionUuid: catalogValues[i][0],
        revisionNumber: catalogValues[i][1],
        teamName: catalogValues[i][3],
        captainName: catalogValues[i][4],
        captainDiscord: catalogValues[i][5],
        captainFaceit: catalogValues[i][6],
        country: catalogValues[i][7],
        currentStep: catalogValues[i][8],
        lastCompletedStep: catalogValues[i][9],
        frictionStage: catalogValues[i][10],
        completedFieldsCount: catalogValues[i][11],
        totalRequiredFieldsCount: catalogValues[i][12],
        missingFields: catalogValues[i][13],
        totalPlayersAdded: catalogValues[i][14],
        timeStarted: catalogValues[i][15],
        lastActivityTime: catalogValues[i][16],
        activeEditingTime: catalogValues[i][17],
        idleTime: catalogValues[i][18],
        offlineTime: catalogValues[i][19],
        totalSessionDuration: catalogValues[i][20],
        referralSource: catalogValues[i][21],
        utmSource: catalogValues[i][22],
        utmMedium: catalogValues[i][23],
        utmCampaign: catalogValues[i][24],
        status: catalogValues[i][25],
        expiryReason: catalogValues[i][26],
        dropOffReason: catalogValues[i][27],
        lookupFailuresCount: catalogValues[i][28],
        validationFailuresCount: catalogValues[i][29],
        resumeCount: catalogValues[i][30],
        idleCount: catalogValues[i][31],
        offlineCount: catalogValues[i][32]
      });
    }
  }

  const eventValues = eventsSheet.getDataRange().getValues();
  const diagValues = diagnosticsSheet.getDataRange().getValues();

  return {
    success: true,
    drafts: drafts,
    eventsCount: eventValues.length - 1,
    diagnosticsCount: diagValues.length - 1
  };
}

// ==========================================
// GET ENDPOINT: METRICS COMPUTATION ENGINE (Cached for 60s)
// ==========================================
function handleGetMetrics(params) {
  const tournamentId = params.tournamentId || "community-cup-2";
  const cacheKey = "metrics_v2_" + tournamentId;
  const cached = CacheService.getScriptCache().get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  initDraftSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const catalogSheet = ss.getSheetByName("MASTER_DRAFT_REGISTRATIONS");
  const values = catalogSheet.getDataRange().getValues();
  
  const total = values.length - 1;
  let active = 0, idle = 0, abandoned = 0, submitted = 0;
  let totalEditingTime = 0;
  let editCount = 0;

  const funnel = {
    STAGE_TEAM_DETAILS: 0,
    STAGE_LOGO_UPLOAD: 0,
    STAGE_CAPTAIN_INFO: 0,
    STAGE_PLAYER_2: 0,
    STAGE_PLAYER_3: 0,
    STAGE_PLAYER_4: 0,
    STAGE_PLAYER_5: 0,
    STAGE_REVIEW: 0,
    STAGE_SUBMIT: 0
  };

  const dropoffs = {};

  for (let i = 1; i < values.length; i++) {
    const status = values[i][25]; // Column 26: Draft Status
    if (status === 'STATUS_ACTIVE' || status === 'ACTIVE') active++;
    else if (status === 'STATUS_IDLE' || status === 'IDLE') idle++;
    else if (status === 'STATUS_ABANDONED' || status === 'ABANDONED') abandoned++;
    else if (status === 'STATUS_SUBMITTED' || status === 'SUBMITTED') submitted++;

    const editTime = parseInt(values[i][17]) || 0; // Col 18: Active Editing Time
    if (editTime > 0) {
      totalEditingTime += editTime;
      editCount++;
    }

    const stage = values[i][10]; // Col 11: Friction Stage
    if (funnel[stage] !== undefined) {
      funnel[stage]++;
    }

    const dropoffReason = values[i][27]; // Col 28: Drop-off Reason
    if (dropoffReason) {
      dropoffs[dropoffReason] = (dropoffs[dropoffReason] || 0) + 1;
    }
  }

  // Calculate average diagnostic latencies from MASTER_DRAFT_DIAGNOSTICS
  const diagSheet = ss.getSheetByName("MASTER_DRAFT_DIAGNOSTICS");
  const diagValues = diagSheet.getDataRange().getValues();
  let totalSave = 0, totalLookup = 0, totalUpload = 0;
  let saveCount = 0, lookupCount = 0, uploadCount = 0;

  for (let j = 1; j < diagValues.length; j++) {
    const saveDur = parseInt(diagValues[j][4]) || 0; // Col 5: Save Duration
    const lookupDur = parseInt(diagValues[j][5]) || 0; // Col 6: Lookup Duration
    const uploadDur = parseInt(diagValues[j][6]) || 0; // Col 7: Upload Duration

    if (saveDur > 0) { totalSave += saveDur; saveCount++; }
    if (lookupDur > 0) { totalLookup += lookupDur; lookupCount++; }
    if (uploadDur > 0) { totalUpload += uploadDur; uploadCount++; }
  }

  const result = {
    success: true,
    total: total,
    active: active,
    idle: idle,
    abandoned: abandoned,
    submitted: submitted,
    avgEditingTime: editCount > 0 ? Math.round(totalEditingTime / editCount) : 0,
    funnel: funnel,
    dropoffs: dropoffs,
    avgSaveLatency: saveCount > 0 ? Math.round(totalSave / saveCount) : 0,
    avgLookupLatency: lookupCount > 0 ? Math.round(totalLookup / lookupCount) : 0,
    avgUploadLatency: uploadCount > 0 ? Math.round(totalUpload / uploadCount) : 0
  };

  // Cache calculated metrics for 60 seconds
  CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), 60);

  return result;
}

// ==========================================
// SYSTEM CRON / LIFECYCLE MANAGEMENT TRIGGERS
// ==========================================
function cleanupSessionLifecycle() {
  initDraftSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("MASTER_DRAFT_REGISTRATIONS");
  const eventsSheet = ss.getSheetByName("MASTER_DRAFT_EVENTS");
  
  const values = sheet.getDataRange().getValues();
  const now = Date.now();
  
  for (let i = 1; i < values.length; i++) {
    const sessionUuid = values[i][0];
    const status = values[i][25];
    const lastActivityTimeStr = values[i][16];
    const lastActivity = lastActivityTimeStr ? new Date(lastActivityTimeStr).getTime() : 0;
    
    if (!lastActivity) continue;
    
    const timeDelta = now - lastActivity;
    
    // ACTIVE/RESUMED -> IDLE (30 minutes of inactivity)
    if ((status === "STATUS_ACTIVE" || status === "STATUS_RESUMED") && timeDelta > 1800000) {
      sheet.getRange(i + 1, 26).setValue("STATUS_IDLE");
      sheet.getRange(i + 1, 32).setValue((parseInt(values[i][31]) || 0) + 1); // increment idleCount
      eventsSheet.appendRow([
        Utilities.getUuid(),
        sessionUuid,
        "CRON_TRIGGER",
        "CRON_TRIGGER",
        new Date().toISOString(),
        values[i][10] || "",
        "IDLE_TIMEOUT",
        "v1",
        JSON.stringify({ message: "Inactivity timeout reached" })
      ]);
    }
    
    // IDLE -> ABANDONED (24 hours of inactivity)
    else if (status === "STATUS_IDLE" && timeDelta > 86400000) {
      sheet.getRange(i + 1, 26).setValue("STATUS_ABANDONED");
      sheet.getRange(i + 1, 28).setValue("Idle Timeout"); // Set Drop-off Reason
      eventsSheet.appendRow([
        Utilities.getUuid(),
        sessionUuid,
        "CRON_TRIGGER",
        "CRON_TRIGGER",
        new Date().toISOString(),
        values[i][10] || "",
        "SESSION_ABANDONED",
        "v1",
        JSON.stringify({ message: "Transitioned to abandoned status" })
      ]);
    }
  }
}

/**
 * Archive finished draft events to a secondary spreadsheet workbook to preserve Sheets performance.
 */
function archiveSessionData(endedTournamentId, archiveSpreadsheetId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eventsSheet = ss.getSheetByName("MASTER_DRAFT_EVENTS");
  const payloadsSheet = ss.getSheetByName("MASTER_DRAFT_CURRENT_PAYLOADS");
  const historySheet = ss.getSheetByName("MASTER_DRAFT_HISTORY");
  const registrationsSheet = ss.getSheetByName("MASTER_DRAFT_REGISTRATIONS");
  
  if (!eventsSheet || !payloadsSheet) return;

  const regValues = registrationsSheet.getDataRange().getValues();
  const toArchiveSessions = [];

  for (let i = 1; i < regValues.length; i++) {
    const rowTourney = regValues[i][2];
    if (rowTourney === endedTournamentId) {
      toArchiveSessions.push(regValues[i][0]);
      registrationsSheet.getRange(i + 1, 26).setValue("STATUS_PURGED");
      registrationsSheet.getRange(i + 1, 27).setValue("EXP_TOURNAMENT_CLOSED");
      registrationsSheet.getRange(i + 1, 38).setValue(""); // Clear snapshot ID
    }
  }

  // Open secondary archive workbook if provided
  let archiveSS = null;
  if (archiveSpreadsheetId) {
    try {
      archiveSS = SpreadsheetApp.openById(archiveSpreadsheetId);
    } catch(e) {}
  }

  if (archiveSS) {
    let archivePayloads = archiveSS.getSheetByName("ARCHIVE_DRAFT_PAYLOADS");
    if (!archivePayloads) {
      archivePayloads = archiveSS.insertSheet("ARCHIVE_DRAFT_PAYLOADS");
      archivePayloads.appendRow(["Snapshot ID", "Session UUID", "Revision Number", "Timestamp", "Compression", "Compressed JSON"]);
    }

    const payValues = payloadsSheet.getDataRange().getValues();
    for (let p = payValues.length - 1; p >= 1; p--) {
      const sessionUuid = payValues[p][0];
      if (toArchiveSessions.indexOf(sessionUuid) !== -1) {
        archivePayloads.appendRow(payValues[p]);
        payloadsSheet.deleteRow(p + 1);
      }
    }
    
    // Clean history sheet too
    const histValues = historySheet.getDataRange().getValues();
    for (let h = histValues.length - 1; h >= 1; h--) {
      const sessionUuid = histValues[h][1];
      if (toArchiveSessions.indexOf(sessionUuid) !== -1) {
        historySheet.deleteRow(h + 1);
      }
    }
  } else {
    // Just delete old payloads to free space
    const payValues = payloadsSheet.getDataRange().getValues();
    for (let p = payValues.length - 1; p >= 1; p--) {
      const sessionUuid = payValues[p][0];
      if (toArchiveSessions.indexOf(sessionUuid) !== -1) {
        payloadsSheet.deleteRow(p + 1);
      }
    }
    
    const histValues = historySheet.getDataRange().getValues();
    for (let h = histValues.length - 1; h >= 1; h--) {
      const sessionUuid = histValues[h][1];
      if (toArchiveSessions.indexOf(sessionUuid) !== -1) {
        historySheet.deleteRow(h + 1);
      }
    }
  }

  SpreadsheetApp.flush();
}

// ==========================================
// HELPERS & DRAFT SHEETS SETUP
// ==========================================
function updateDraftStatusAndAppendEvent(sessionUuid, status, eventType, details) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const regSheet = ss.getSheetByName("MASTER_DRAFT_REGISTRATIONS");
  const eventsSheet = ss.getSheetByName("MASTER_DRAFT_EVENTS");
  
  if (!regSheet || !eventsSheet) return;

  const values = regSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === sessionUuid) {
      regSheet.getRange(i + 1, 26).setValue(status);
      regSheet.getRange(i + 1, 17).setValue(new Date().toISOString());
      
      eventsSheet.appendRow([
        Utilities.getUuid(),
        sessionUuid,
        "GATEWAY_CALLBACK",
        "GATEWAY_CALLBACK",
        new Date().toISOString(),
        values[i][10] || "",
        eventType,
        "v1",
        JSON.stringify({ details: details })
      ]);
      break;
    }
  }
}

function handleLogEvents(data) {
  initDraftSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eventsSheet = ss.getSheetByName("MASTER_DRAFT_EVENTS");
  const serverTime = new Date().toISOString();

  if (data.events && Array.isArray(data.events)) {
    data.events.forEach(evt => {
      eventsSheet.appendRow([
        evt.eventId || Utilities.getUuid(),
        data.sessionUuid,
        evt.batchId || "",
        evt.requestId || data.requestId || "",
        evt.timestamp || serverTime,
        evt.frictionStage || "",
        evt.eventType || "FIELD_UPDATED",
        evt.taxonomyVersion || "v1",
        evt.details ? JSON.stringify(evt.details) : ""
      ]);
    });
  }
  return { success: true };
}

function handleLogDiagnostics(data) {
  initDraftSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const diagSheet = ss.getSheetByName("MASTER_DRAFT_DIAGNOSTICS");
  const serverTime = new Date().toISOString();

  if (data.diagnostics && Array.isArray(data.diagnostics)) {
    data.diagnostics.forEach(d => {
      diagSheet.appendRow([
        d.diagnosticId || Utilities.getUuid(),
        data.sessionUuid || d.sessionUuid || "",
        d.requestId || "",
        d.timestamp || serverTime,
        d.saveDuration || 0,
        d.lookupDuration || 0,
        d.uploadDuration || 0,
        d.apiStatus || "STATUS_SUCCESS",
        d.retryCount || 0,
        d.networkStatus || "NET_ONLINE",
        d.deviceType || "",
        d.browser || "",
        d.os || "",
        d.screenWidth || 0,
        d.screenHeight || 0,
        d.errorDetails || ""
      ]);
    });
  }
  return { success: true };
}

function initDraftSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. MASTER_DRAFT_REGISTRATIONS
  if (!ss.getSheetByName("MASTER_DRAFT_REGISTRATIONS")) {
    const sheet = ss.insertSheet("MASTER_DRAFT_REGISTRATIONS");
    const headers = [
      "Session UUID", "Current Revision", "Tournament ID", "Team Name", "Captain Name", "Captain Discord", "Captain FACEIT", "Country", "Current Step", "Last Completed Step", "Friction Stage", "Completed Required Fields Count", "Total Required Fields Count", "Missing Fields", "Total Players Added", "Time Started", "Last Activity Time", "Active Editing Time", "Idle Time", "Offline Time", "Total Session Duration", "Referral Source", "utm_source", "utm_medium", "utm_campaign", "Draft Status", "Draft Expiry Reason", "Drop-off Reason", "Lookup Failures Count", "Validation Failures Count", "Resume Count", "Idle Count", "Offline Count", "Registration Fingerprint", "Session Source", "Lock Owner", "Last Lock Renewal", "Current Snapshot ID"
    ];
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  // 2. MASTER_DRAFT_EVENTS
  if (!ss.getSheetByName("MASTER_DRAFT_EVENTS")) {
    const sheet = ss.insertSheet("MASTER_DRAFT_EVENTS");
    const headers = ["Event ID", "Session UUID", "Batch ID", "Request ID", "Timestamp", "Friction Stage", "Event Type", "Taxonomy Version", "Details"];
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  // 3. MASTER_DRAFT_CURRENT_PAYLOADS
  if (!ss.getSheetByName("MASTER_DRAFT_CURRENT_PAYLOADS")) {
    const sheet = ss.insertSheet("MASTER_DRAFT_CURRENT_PAYLOADS");
    const headers = ["Session UUID", "Revision Number", "Timestamp", "Compression", "Compressed JSON"];
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  // 4. MASTER_DRAFT_HISTORY
  if (!ss.getSheetByName("MASTER_DRAFT_HISTORY")) {
    const sheet = ss.insertSheet("MASTER_DRAFT_HISTORY");
    const headers = ["Snapshot ID", "Session UUID", "Revision Number", "Timestamp", "Compression", "Compressed JSON", "Milestone Type"];
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  // 5. MASTER_DRAFT_DIAGNOSTICS
  if (!ss.getSheetByName("MASTER_DRAFT_DIAGNOSTICS")) {
    const sheet = ss.insertSheet("MASTER_DRAFT_DIAGNOSTICS");
    const headers = ["Diagnostic ID", "Session UUID", "Request ID", "Timestamp", "Save Duration", "Lookup Duration", "Upload Duration", "API Status", "Retry Count", "Network Status", "Device Type", "Browser", "OS", "Screen Width", "Screen Height", "Error Details"];
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
}

function computeSha256(value) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.CharSet.UTF_8);
  let result = "";
  for (let i = 0; i < digest.length; i++) {
    let byteVal = digest[i];
    if (byteVal < 0) byteVal += 256;
    let byteString = byteVal.toString(16);
    if (byteString.length === 1) byteString = "0" + byteString;
    result += byteString;
  }
  return result;
}

function getSlotCounts(tournamentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Registrations_" + tournamentId);
  if (!sheet) {
    return { inviteConfirmed: 0, openConfirmed: 0, isFull: false };
  }

  const rows = sheet.getDataRange().getValues();
  let inviteConfirmed = 0;
  let openConfirmed = 0;

  for (let i = 1; i < rows.length; i++) {
    const inviteCode = rows[i][8];
    const status = rows[i][3];
    
    if (status === "APPROVED" || status === "PENDING") {
      if (inviteCode && inviteCode.trim() !== "") {
        inviteConfirmed++;
      } else {
        openConfirmed++;
      }
    }
  }

  const isFull = (inviteConfirmed >= 6 && openConfirmed >= 26) || (inviteConfirmed + openConfirmed >= 32);

  return {
    inviteConfirmed: inviteConfirmed,
    openConfirmed: openConfirmed,
    isFull: isFull
  };
}

function checkInviteCode(tournamentId, code, consume = false) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("InviteCodes");
  if (!sheet) return false;

  const range = sheet.getDataRange();
  const values = range.getValues();
  const cleanCode = code.trim().toUpperCase();

  for (let i = 1; i < values.length; i++) {
    const rowCode = String(values[i][0]).trim().toUpperCase();
    const rowTourney = String(values[i][1]).trim();
    const used = String(values[i][2]).trim().toUpperCase();

    if (rowCode === cleanCode && rowTourney === tournamentId) {
      if (used === "TRUE" || used === "YES") {
        return false;
      }
      
      if (consume) {
        sheet.getRange(i + 1, 3).setValue("TRUE");
      }
      return true;
    }
  }

  return false;
}

function getRegisteredTeams(tournamentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Registrations_" + tournamentId);
  if (!sheet) return [];

  const rows = sheet.getDataRange().getValues();
  const teams = [];

  for (let i = 1; i < rows.length; i++) {
    const status = rows[i][3];
    if (status !== "APPROVED" && status !== "PENDING") continue;

    const team = {
      name: rows[i][4],
      tag: rows[i][5],
      logo: rows[i][7],
      status: status === "APPROVED" ? "VERIFIED" : "PENDING REVIEW",
      averageElo: parseInt(rows[i][10]) || 0,
      roster: []
    };

    for (let p = 0; p < 7; p++) {
      const offset = 12 + (p * 11);
      if (offset >= rows[i].length) break;

      const role = rows[i][offset];
      const ign = rows[i][offset + 2];
      const faceitLvl = rows[i][offset + 7];
      const faceitElo = rows[i][offset + 8];
      const avatar = rows[i][offset + 10];

      if (ign && ign.trim() !== "") {
        team.roster.push({
          role: role,
          ign: ign,
          faceitLevel: faceitLvl || "N/A",
          faceitElo: faceitElo || "N/A",
          avatar: avatar || ""
        });
      }
    }

    teams.push(team);
  }

  return teams;
}

function checkPlayerBans(steamIds) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("BannedPlayers");
  if (!sheet || steamIds.length === 0) return false;

  const bannedIds = sheet.getDataRange().getValues().map(row => String(row[0]).trim());
  
  for (let i = 0; i < steamIds.length; i++) {
    const id = String(steamIds[i]).trim();
    if (id && bannedIds.indexOf(id) !== -1) {
      return true;
    }
  }

  return false;
}

function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  
  if (sheetName.startsWith("Registrations_")) {
    const col = range.getColumn();
    
    if (col === 4) {
      const oldValue = e.oldValue ? String(e.oldValue).trim().toUpperCase() : "";
      const newValue = e.value ? String(e.value).trim().toUpperCase() : "";
      
      if (oldValue === newValue) return;
      
      const validTransitions = {
        "PENDING": ["UNDER_REVIEW", "APPROVED", "REJECTED"],
        "UNDER_REVIEW": ["APPROVED", "REJECTED"],
        "APPROVED": ["ROSTER_LOCKED", "REJECTED"],
        "ROSTER_LOCKED": ["CHECKED_IN", "REJECTED"],
        "CHECKED_IN": ["QUALIFIED", "ELIMINATED"],
        "QUALIFIED": ["CHAMPION", "ELIMINATED"],
        "REJECTED": [],
        "ELIMINATED": [],
        "CHAMPION": []
      };
      
      const currentOld = oldValue || "PENDING";
      const allowed = validTransitions[currentOld] || [];
      
      if (allowed.indexOf(newValue) === -1 && oldValue !== "") {
        range.setValue(e.oldValue);
        return;
      }
      
      logAuditEntry(sheetName, range.getRow(), "STATUS_CHANGE", oldValue, newValue);
      
      const tournamentId = sheetName.replace("Registrations_", "");
      updateDashboardStats();
      runValidationChecks(tournamentId);
    }
  }
}

function updateDashboardStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboard = ss.getSheetByName("Admin_Dashboard");
  if (dashboard) {
    SpreadsheetApp.flush();
  }
}

function runValidationChecks(tournamentId = "community-cup-2") {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const regsSheet = ss.getSheetByName("Registrations_" + tournamentId);
  const adminSheet = ss.getSheetByName("Admin_Dashboard");
  
  if (!regsSheet || !adminSheet) return;

  const regData = regsSheet.getDataRange().getValues();
  const lastAdminRow = adminSheet.getLastRow();
  if (lastAdminRow < 13) return;

  const validationRange = adminSheet.getRange(13, 12, lastAdminRow - 12, 1);
  const validationValues = [];

  const teamNamesCount = {};
  const steamIdsCount = {};
  const faceitUrlsCount = {};

  for (let i = 1; i < regData.length; i++) {
    const status = regData[i][3];
    if (status === "REJECTED") continue;

    const teamName = String(regData[i][4]).trim().toUpperCase();
    if (teamName) {
      teamNamesCount[teamName] = (teamNamesCount[teamName] || 0) + 1;
    }

    for (let p = 0; p < 7; p++) {
      const offset = 12 + (p * 11);
      if (offset >= regData[i].length) break;

      const ign = String(regData[i][offset + 2]).trim();
      const steam64 = String(regData[i][offset + 5]).trim();
      const faceitUrl = String(regData[i][offset + 6]).trim().toLowerCase();

      if (ign !== "") {
        if (steam64) steamIdsCount[steam64] = (steamIdsCount[steam64] || 0) + 1;
        if (faceitUrl) faceitUrlsCount[faceitUrl] = (faceitUrlsCount[faceitUrl] || 0) + 1;
      }
    }
  }

  const dashboardTeams = adminSheet.getRange(13, 1, lastAdminRow - 12, 11).getValues();

  for (let r = 0; r < dashboardTeams.length; r++) {
    const teamId = dashboardTeams[r][0];
    const teamName = String(dashboardTeams[r][2]).trim().toUpperCase();
    const rosterSize = parseInt(dashboardTeams[r][6]) || 0;
    const logoUrl = String(dashboardTeams[r][9]).trim();
    
    let idx = -1;
    for (let i = 1; i < regData.length; i++) {
      if (regData[i][0] === teamId) {
        idx = i;
        break;
      }
    }

    const errors = [];

    if (idx !== -1) {
      if (teamNamesCount[teamName] > 1) {
        errors.push("Duplicate Team Name");
      }

      if (!logoUrl || logoUrl === "" || logoUrl.includes("placeholder")) {
        errors.push("Missing Team Logo");
      }

      if (rosterSize < 5) {
        errors.push("Invalid Team Size (< 5)");
      }

      let hasDuplicatePlayer = false;
      let hasMissingInfo = false;

      for (let p = 0; p < 7; p++) {
        const offset = 12 + (p * 11);
        if (offset >= regData[idx].length) break;

        const ign = String(regData[idx][offset + 2]).trim();
        const discord = String(regData[idx][offset + 3]).trim();
        const steam = String(regData[idx][offset + 4]).trim();
        const steam64 = String(regData[idx][offset + 5]).trim();
        const faceit = String(regData[idx][offset + 6]).trim();

        if (p < 5) {
          if (!ign || !discord || !steam || !steam64 || !faceit) {
            hasMissingInfo = true;
          }
        }

        if (ign !== "") {
          if (steam64 && steamIdsCount[steam64] > 1) hasDuplicatePlayer = true;
          if (faceit && faceitUrlsCount[faceit.toLowerCase()] > 1) hasDuplicatePlayer = true;
        }
      }

      if (hasDuplicatePlayer) {
        errors.push("Duplicate Player (Steam/FACEIT)");
      }
      if (hasMissingInfo) {
        errors.push("Incomplete Roster Info");
      }

    } else {
      errors.push("Data Unsynchronized");
    }

    validationValues.push([errors.length > 0 ? "⚠️ " + errors.join(" | ") : "OK"]);
  }

  validationRange.setValues(validationValues);
}

function setupAdminSheet(tournamentId = "community-cup-2") {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup Admin Dashboard
  let adminSheet = ss.getSheetByName("Admin_Dashboard_" + tournamentId);
  if (!adminSheet) {
    adminSheet = ss.insertSheet("Admin_Dashboard_" + tournamentId, 0);
  } else {
    adminSheet.clear();
  }
  adminSheet.setHideGridlines(false);
  
  adminSheet.getRange("A1:L1").merge().setValue("PIXEL PALACE - TOURNAMENT CONTROL HUB").setFontWeight("bold").setFontSize(16).setBackground("#0b0f19").setFontColor("#00f0ff").setHorizontalAlignment("center");
  adminSheet.setRowHeight(1, 40);
  
  adminSheet.getRange("A3").setValue("TOURNAMENT INFO").setFontWeight("bold").setBackground("#131a26").setFontColor("#ffffff");
  adminSheet.getRange("A4").setValue("Tournament Name");
  adminSheet.getRange("B4").setValue("Pixel Palace " + tournamentId);
  adminSheet.getRange("A5").setValue("Game / Format");
  adminSheet.getRange("B5").setValue("CS2 5v5 (Akros Anti-Cheat)");
  adminSheet.getRange("A6").setValue("Registration Deadline");
  adminSheet.getRange("B6").setValue("2026-07-26");
  adminSheet.getRange("A7").setValue("Tournament Dates");
  adminSheet.getRange("B7").setValue("July 31 – August 03, 2026");
  adminSheet.getRange("A8").setValue("Prize Pool");
  adminSheet.getRange("B8").setValue("1st: $2000 | 2nd: $750");

  adminSheet.getRange("D3:E3").merge().setValue("REGISTRATION STATS").setFontWeight("bold").setBackground("#131a26").setFontColor("#ffffff");
  adminSheet.getRange("D4").setValue("Total Applications");
  adminSheet.getRange("E4").setFormula("=COUNTA(Registrations_" + tournamentId + "!A:A)-1");
  adminSheet.getRange("D5").setValue("Approved Teams");
  adminSheet.getRange("E5").setFormula('=COUNTIF(Registrations_' + tournamentId + '!D:D, "APPROVED")');
  adminSheet.getRange("D6").setValue("Pending Teams");
  adminSheet.getRange("E6").setFormula('=COUNTIF(Registrations_' + tournamentId + '!D:D, "PENDING")');
  adminSheet.getRange("D7").setValue("Rejected Teams");
  adminSheet.getRange("E7").setFormula('=COUNTIF(Registrations_' + tournamentId + '!D:D, "REJECTED")');

  adminSheet.getRange("F3:G3").merge().setValue("SLOT ALLOCATION").setFontWeight("bold").setBackground("#131a26").setFontColor("#ffffff");
  adminSheet.getRange("F4").setValue("Max Teams Limit");
  adminSheet.getRange("G4").setValue(32);
  adminSheet.getRange("F5").setValue("Open Registration Slots");
  adminSheet.getRange("G5").setValue(26);
  adminSheet.getRange("F6").setValue("Invite-Only Slots");
  adminSheet.getRange("G6").setValue(6);
  adminSheet.getRange("F7").setValue("Remaining Slots");
  adminSheet.getRange("G7").setFormula("=G4-E5");
  adminSheet.getRange("F8").setValue("Progress (%)");
  adminSheet.getRange("G8").setFormula("=E5/G4").setNumberFormat("0.0%");

  adminSheet.getRange("A11:L11").merge().setValue("TEAM MANAGEMENT LISTING").setFontWeight("bold").setFontSize(12).setBackground("#0b0f19").setFontColor("#00f0ff").setHorizontalAlignment("left");
  
  const headers = [
    "Team ID", "Submitted At", "Team Name", "Tag", "Region", "Captain IGN", "Roster Size", "Avg ELO", "Invite Code", "Logo Link", "Status", "Validation Check"
  ];
  
  const headerRange = adminSheet.getRange(12, 1, 1, headers.length);
  headerRange.setValues([headers]).setFontWeight("bold").setBackground("#131a26").setFontColor("#ffffff").setHorizontalAlignment("center");
  
  adminSheet.getRange(13, 1).setFormula(
    `=IFERROR(QUERY(Registrations_${tournamentId}!A:K, "SELECT A, C, E, F, G, M, L, K, I, H, D WHERE A IS NOT NULL", 1), "No registrations recorded.")`
  );
  adminSheet.autoResizeColumns(1, headers.length);
  applyFormattingRules(adminSheet);

  // 2. Setup Audit Log
  let logSheet = ss.getSheetByName("AuditLog");
  if (!logSheet) {
    logSheet = ss.insertSheet("AuditLog");
    logSheet.appendRow(["Timestamp", "Editor", "Target Table", "Record Row", "Action", "Old Value", "New Value"]);
    logSheet.setFrozenRows(1);
    logSheet.setHideGridlines(false);
  }
  
  // 3. Initialize Normalized Draft Tables
  initDraftSheets();
  
  runValidationChecks(tournamentId);
}

function applyFormattingRules(sheet) {
  let approvedRule = SpreadsheetApp.newConditionalFormattingRule()
    .whenTextEqualTo("APPROVED")
    .setBackground("#d4edda")
    .setFontColor("#155724")
    .setRanges([sheet.getRange("K13:K100")])
    .build();

  let pendingRule = SpreadsheetApp.newConditionalFormattingRule()
    .whenTextEqualTo("PENDING")
    .setBackground("#fff3cd")
    .setFontColor("#856404")
    .setRanges([sheet.getRange("K13:K100")])
    .build();

  let rejectedRule = SpreadsheetApp.newConditionalFormattingRule()
    .whenTextEqualTo("REJECTED")
    .setBackground("#f8d7da")
    .setFontColor("#721c24")
    .setRanges([sheet.getRange("K13:K100")])
    .build();

  let warningRule = SpreadsheetApp.newConditionalFormattingRule()
    .whenTextContains("⚠️")
    .setBackground("#f8d7da")
    .setFontColor("#721c24")
    .setRanges([sheet.getRange("L13:L100")])
    .build();

  const rules = sheet.getConditionalFormattingRules();
  rules.push(approvedRule, pendingRule, rejectedRule, warningRule);
  sheet.setConditionalFormattingRules(rules);
}

function logAuditEntry(sheetName, rowNum, action, oldValue, newValue) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName("AuditLog");
    if (!logSheet) {
      logSheet = ss.insertSheet("AuditLog");
      logSheet.appendRow(["Timestamp", "Editor", "Target Table", "Record Row", "Action", "Old Value", "New Value"]);
      logSheet.setFrozenRows(1);
    }
    const timestamp = new Date().toISOString();
    const editor = Session.getActiveUser().getEmail() || "System Admin";
    logSheet.appendRow([timestamp, editor, sheetName, rowNum, action, oldValue, newValue]);
  } catch (err) {}
}

/**
 * Run this function from the Apps Script toolbar to initialize any custom or new tournament.
 * Change the string to your new tournament ID (e.g. "winter-showdown-2026").
 */
function setupNewTournament() {
  const newTournamentId = "winter-showdown-2026"; 
  setupAdminSheet(newTournamentId);
}
