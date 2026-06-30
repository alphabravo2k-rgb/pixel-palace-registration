/**
 * PIXEL PALACE — MASTER RAW REGISTRATIONS SCRIPT v4.0 (RECEIVER)
 *
 * Deployed in: Pixel Palace | Raw Registrations Spreadsheet
 * Web App URL: https://script.google.com/macros/s/AKfycby0ryeemIms7XhpnEohHms0Cm3k2gUIgl0_XBDhz7gjJfGH5Hi7Qhm12l-ERNd9C7ACgw/exec
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const ADMIN_SECRET = ""; // Optional gateway secret matching VITE_GATEWAY_AUTH_SECRET

// Google Drive folder where team logos are stored.
// To create: Drive → New Folder → name it "PP_Logos" → share as Anyone with link → Viewer
// Then paste the folder ID from the URL here:
const LOGO_FOLDER_ID = "1HYrpFCvd4f4K26NtukB2Dq05lTaHyk6e";

/**
 * RECEIVE REGISTRATIONS (POST)
 */
function doPost(e) {
  ensureInviteCodesSheet();
  try {
    const payload = JSON.parse(e.postData.contents);
    const endpoint = payload.endpoint || "";

    // API Versioning Validation
    if (!endpoint.startsWith("/api/v1/")) {
      return generateResponse({ error: "UNSUPPORTED_API_VERSION: Requests must target /api/v1/ endpoints." }, 400);
    }
    
    // ── Logo Upload Endpoint ──────────────────────────────────────────────────
    if (endpoint === "/api/v1/uploadLogo") {
      try {
        const base64Data = payload.fileData;    // raw base64 string (no data: prefix)
        const fileName   = payload.fileName || ("logo_" + Date.now() + ".png");
        const mimeType   = payload.mimeType  || "image/png";

        if (!base64Data) {
          return generateResponse({ error: "Missing fileData in payload" }, 400);
        }
        if (!LOGO_FOLDER_ID || LOGO_FOLDER_ID === "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE") {
          return generateResponse({ error: "LOGO_FOLDER_ID is not configured on the server." }, 500);
        }

        const folder = DriveApp.getFolderById(LOGO_FOLDER_ID);
        const bytes  = Utilities.base64Decode(base64Data);
        const blob   = Utilities.newBlob(bytes, mimeType, fileName);
        const file   = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        const fileId  = file.getId();
        const logoUrl = "https://drive.google.com/uc?export=view&id=" + fileId;
        return generateResponse({ success: true, fileId: fileId, logoUrl: logoUrl });
      } catch (uploadErr) {
        return generateResponse({ error: "Logo upload failed: " + uploadErr.toString() }, 500);
      }
    }

    if (endpoint !== "/api/v1/register") {
      return generateResponse({ error: "NOT_FOUND: Endpoint " + endpoint + " not found." }, 404);
    }

    if (ADMIN_SECRET && payload._gateway_secret !== ADMIN_SECRET) {
      return generateResponse({ error: "Unauthorized: Invalid gateway secret." }, 401);
    }

    const doc = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 1. IDEMPOTENCY CHECK
    const cache = CacheService.getScriptCache();
    if (payload.submission_id && cache.get(payload.submission_id)) {
      return generateResponse({ "success": true, "note": "Duplicate intercepted", "teamId": "PP-INTERCEPTED" });
    }
    
    // 2. VIP CODE LOGIC
    const codeSheet = doc.getSheetByName("Codes");
    let codeValid = true;
    let codeRowIndex = -1;
    
    if (codeSheet && payload.invite_code) {
      codeValid = false;
      const codeData = codeSheet.getDataRange().getValues();
      for (let i = 1; i < codeData.length; i++) {
        if (codeData[i][0] == payload.invite_code) {
          if (codeData[i][1] && codeData[i][1].toString().trim() !== "") {
            return generateResponse({ "error": "This Access Code has already been claimed." });
          }
          codeValid = true;
          codeRowIndex = i + 1;
          break;
        }
      }
      if (!codeValid) return generateResponse({ "error": "Invalid Access Code." });
    }

    // 3. DUPLICATE VERIFICATION (STEAM & FACEIT AT GATE)
    let rawSheet = doc.getSheetByName("Sheet1");
    if (!rawSheet) throw new Error("Could not find Sheet1.");
    
    const rows = rawSheet.getDataRange().getValues();
    const newTeamName = payload.team_name.trim().toUpperCase();
    const newSteam64s = [];
    const newFaceitUrls = [];
    
    for (let p = 1; p <= 7; p++) {
      const steam64 = payload[`p${p}Steam64`];
      const faceit = payload[`p${p}Faceit`];
      if (steam64) newSteam64s.push(String(steam64).trim());
      if (faceit) newFaceitUrls.push(String(faceit).trim().toLowerCase());
    }

    for (let i = 1; i < rows.length; i++) {
      const existingStatus = rows[i][4]; // Column E (Status)
      if (existingStatus === "REJECTED") continue;

      const existingTeamName = String(rows[i][5]).trim().toUpperCase(); // Column F (Team Name)
      if (existingTeamName === newTeamName) {
        return generateResponse({ error: "DUPLICATE_TEAM_NAME: A team named '" + payload.team_name + "' is already registered." });
      }

      // Scan all cells in the row for matching steam64 or faceit url
      for (let c = 7; c < rows[i].length; c++) {
        const cellVal = String(rows[i][c]).trim();
        if (!cellVal) continue;

        if (newSteam64s.indexOf(cellVal) !== -1) {
          return generateResponse({ error: "DUPLICATE_PLAYER_STEAM: One of your players (Steam64: " + cellVal + ") is already registered." });
        }

        const cleanCellVal = cellVal.toLowerCase();
        if (newFaceitUrls.indexOf(cleanCellVal) !== -1) {
          return generateResponse({ error: "DUPLICATE_PLAYER_FACEIT: One of your players (FACEIT: " + cellVal + ") is already registered." });
        }
      }
    }

    // 4. GENERATE SEQUENTIAL TEAM ID
    const nextSerial = rows.length;
    const teamId = "PP-CC2-" + String(nextSerial).padStart(3, '0');

    // 5. SECURE APPEND
    if (rawSheet.getLastRow() === 0) {
      rawSheet.appendRow([
        "Team ID", "Timestamp", "Tournament ID", "Submission ID", "Status", "Team Name", "Team Tag", "Region", "Logo URL",
        "P1 Discord", "P1 Steam", "P1 Faceit", "P1 Rank",
        "P2 Discord", "P2 Steam", "P2 Faceit", "P2 Rank",
        "P3 Discord", "P3 Steam", "P3 Faceit", "P3 Rank",
        "P4 Discord", "P4 Steam", "P4 Faceit", "P4 Rank",
        "P5 Discord", "P5 Steam", "P5 Faceit", "P5 Rank",
        "P6 Discord", "P6 Steam", "P6 Faceit", "P6 Rank",
        "P7 Discord", "P7 Steam", "P7 Faceit", "P7 Rank",
        "VIP Code Used"
      ]);
      rawSheet.setFrozenRows(1);
    }

    let formattedDate = Utilities.formatDate(new Date(), "GMT+5", "MM/dd/yyyy HH:mm:ss");
    
    rawSheet.appendRow([
        teamId, formattedDate, payload.tournament_id || "unknown", payload.submission_id || "", 
        "PENDING", payload.team_name || "", payload.team_tag || "", payload.region || "", payload.logo_url || "", 
        payload.p1Discord || "", payload.p1Steam || "", payload.p1Faceit || "", payload.p1Rank || "", 
        payload.p2Discord || "", payload.p2Steam || "", payload.p2Faceit || "", payload.p2Rank || "", 
        payload.p3Discord || "", payload.p3Steam || "", payload.p3Faceit || "", payload.p3Rank || "", 
        payload.p4Discord || "", payload.p4Steam || "", payload.p4Faceit || "", payload.p4Rank || "", 
        payload.p5Discord || "", payload.p5Steam || "", payload.p5Faceit || "", payload.p5Rank || "", 
        payload.p6Discord || "", payload.p6Steam || "", payload.p6Faceit || "", payload.p6Rank || "", 
        payload.p7Discord || "", payload.p7Steam || "", payload.p7Faceit || "", payload.p7Rank || "", 
        payload.invite_code || ""
    ]);

    if (codeRowIndex > -1) codeSheet.getRange(codeRowIndex, 2).setValue(payload.team_name);
    if (payload.submission_id) cache.put(payload.submission_id, "processed", 60 * 60 * 24); 

    // Log registration in audit sheet
    logAuditEntry("Sheet1", rows.length + 1, "REGISTRATION_SUBMITTED", "", "PENDING");

    // Real-time write-through sync to Admin Operations Sheet
    appendToAdminSheet(payload, teamId);

    return generateResponse({ "success": true, "teamId": teamId });
  } catch (error) {
    return generateResponse({ "error": error.toString() });
  }
}

/**
 * READ QUERIES (GET)
 */
function doGet(e) {
  ensureInviteCodesSheet();
  try {
    const doc = SpreadsheetApp.openById(SPREADSHEET_ID);
    const params = e.parameter;
    const endpoint = params.endpoint || "";

    // API Versioning Enforcement
    if (!endpoint.startsWith("/api/v1/")) {
      return generateResponse({ error: "UNSUPPORTED_API_VERSION: Requests must target /api/v1/ endpoints." }, 400);
    }
    
    const tournamentId = params.tournamentId || "";
    
    // ── Validate Invite Code ────────────────────────────────────────────────
    if (endpoint === "/api/v1/validateCode") {
      const codeToCheck = (params.validateCode || "").toString().trim();
      let isValid = false;
      let slotType = "OPEN"; // default if not found in either sheet

      // 1. Check new InviteCodes sheet (preferred)
      const inviteSheet = doc.getSheetByName("InviteCodes");
      if (inviteSheet && codeToCheck) {
        const inviteData = inviteSheet.getDataRange().getValues();
        for (let i = 1; i < inviteData.length; i++) {
          const code     = (inviteData[i][0] || "").toString().trim();
          const tid      = (inviteData[i][1] || "").toString().trim();
          const maxUses  = parseInt(inviteData[i][3] || "999") || 999;
          const timesUsed = parseInt(inviteData[i][4] || "0") || 0;
          if (code.toLowerCase() === codeToCheck.toLowerCase() &&
              (!tid || tid === tournamentId) &&
              timesUsed < maxUses) {
            isValid = true;
            slotType = (inviteData[i][2] || "INVITE").toString().trim();
            break;
          }
        }
      }

      // 2. Fallback: check legacy "Codes" sheet (unclaimed code = claimed field empty)
      if (!isValid) {
        const codeSheet = doc.getSheetByName("Codes");
        if (codeSheet && codeToCheck) {
          const codeData = codeSheet.getDataRange().getValues();
          for (let i = 1; i < codeData.length; i++) {
            if (codeData[i][0] == codeToCheck && (!codeData[i][1] || codeData[i][1].toString().trim() === "")) {
              isValid = true;
              slotType = "INVITE";
              break;
            }
          }
        }
      }

      return generateResponse({ valid: isValid, slotType: slotType });
    }
    
    // ── Get Registered Teams ────────────────────────────────────────────────
    if (endpoint === "/api/v1/getTeams") {
      try {
        let adminDocId = "";
        if (tournamentId === "community-cup-2") {
          adminDocId = "1_B_ovDmGuA1rAityrgAz_G3csBtLl4OFfwJUMWXXe_E";
        } else if (tournamentId === "chaos-ii") {
          adminDocId = "1htkH0PQWbWefE5XFIdf2AGqTxpWMwLyGDMZMfOOL-2E";
        }
        
        if (!adminDocId) {
          // Fallback to legacy raw Sheet1 reading if no Admin sheet config is present
          let rawSheet = doc.getSheetByName("Sheet1");
          if (!rawSheet) return generateResponse({ teams: [] });
          const data = rawSheet.getDataRange().getValues();
          if (data.length < 1) return generateResponse({ teams: [] });

          const cols = getRawColMap_(data[0]);
          const firstDataRow = isHeaderRow_(data[0]) ? 1 : 0;

          const teams = [];
          for (let i = firstDataRow; i < data.length; i++) {
            const row = data[i];
            const tid = (row[cols.tournament] || "").toString().trim();
            if (tid !== tournamentId) continue;

            const status = (row[cols.status] || "").toString().trim().toUpperCase();
            if (status === "REJECTED" || status === "ELIMINATED" || status === "") continue;

            const teamName = (row[cols.teamName] || "").toString().trim();
            const teamTag  = (row[cols.teamTag]  || "").toString().trim();
            const region   = (row[cols.region]   || "").toString().trim();
            const logoUrl  = (row[cols.logo]     || "").toString().trim();

            const roster = [];
            for (let p = 0; p < 7; p++) {
              const base    = cols.playerBase + p * 4;
              const discord = row[base]     ? row[base].toString().trim()     : "";
              const steam   = row[base + 1] ? row[base + 1].toString().trim() : "";
              const faceit  = row[base + 2] ? row[base + 2].toString().trim() : "";
              const rank    = row[base + 3] ? row[base + 3].toString().trim() : "";

              if (discord || steam || faceit) {
                roster.push({
                  role: p === 0 ? "Captain" : p >= 5 ? "Substitute" : "Member",
                  discord: discord,
                  ign: (faceit ? faceit.replace(/\/$/, "").split("/").pop() : "") ||
                       discord.split("#")[0] || ("Player " + (p + 1)),
                  faceitLevel: rank || "N/A",
                  faceitElo: "N/A"
                });
              }
            }

            const displayStatus = status === "APPROVED" || status === "ROSTER_LOCKED" || status === "CHECKED_IN" || status === "QUALIFIED" || status === "CHAMPION"
              ? "VERIFIED" : "PENDING REVIEW";

            teams.push({
              name:   teamName,
              tag:    teamTag,
              logo:   logoUrl,
              status: displayStatus,
              region: region,
              roster: roster
            });
          }
          return generateResponse({ teams: teams, confirmed: teams.length });
        }

        // Open Admin Sheet and read Admin_Ops
        const adminDoc = SpreadsheetApp.openById(adminDocId);
        const adminSheet = adminDoc.getSheetByName("Admin_Ops") || adminDoc.getSheets()[0];
        const data = adminSheet.getDataRange().getValues();
        
        const rawTagMap = getRawTagMap_(doc);
        const teams = [];
        
        // Loop through rows in blocks of 7 (each team starts on a row and spans 7 rows)
        for (let i = 1; i < data.length; i += 7) {
          const teamName = (data[i][10] || "").toString().trim(); // Column K
          if (!teamName || teamName === "Team Name") continue;
          
          const status = (data[i][12] || "").toString().trim().toUpperCase(); // Column M
          if (status === "REJECTED" || status === "ELIMINATED" || status === "") continue;
          
          const region = (data[i][1] || "").toString().trim(); // Column B
          
          // Logo URL in Column C. If it has a formula (=IMAGE("url")), extract it
          let logoUrl = "";
          try {
            const logoFormula = adminSheet.getRange(i + 1, 3).getFormula();
            if (logoFormula) {
              const match = logoFormula.match(/=IMAGE\("([^"]+)"\)/i);
              if (match) logoUrl = match[1];
            }
          } catch(e) {}
          if (!logoUrl) {
            logoUrl = (data[i][2] || "").toString().trim();
          }
          
          const averageElo = parseInt(data[i][11]) || 0; // Column L
          const seed = (data[i][13] || "").toString().trim(); // Column N
          
          const roster = [];
          for (let p = 0; p < 7; p++) {
            const rowIdx = i + p;
            if (rowIdx >= data.length) break;
            
            const pName = (data[rowIdx][5] || "").toString().trim(); // Column F
            const discord = (data[rowIdx][4] || "").toString().trim(); // Column E
            const steam = (data[rowIdx][3] || "").toString().trim(); // Column D
            const faceit = (data[rowIdx][6] || "").toString().trim(); // Column G
            const liveEloVal = data[rowIdx][7]; // Column H
            
            let liveElo = "N/A";
            if (liveEloVal !== "" && liveEloVal !== undefined && liveEloVal !== null) {
              const parsedElo = parseInt(liveEloVal);
              if (!isNaN(parsedElo) && parsedElo > 0) {
                liveElo = parsedElo.toString();
              } else if (liveEloVal.toString().trim() === "Fetching...") {
                liveElo = "Fetching...";
              }
            }
            
            if (pName && pName !== "" && pName !== "N/A") {
              let role = "Member";
              let cleanName = pName;
              if (pName.endsWith(" (C)")) {
                role = "Captain";
                cleanName = pName.replace(" (C)", "");
              } else if (pName.endsWith(" (Sub)")) {
                role = "Substitute";
                cleanName = pName.replace(" (Sub)", "");
              } else if (p === 0) {
                role = "Captain";
              } else if (p >= 5) {
                role = "Substitute";
              }
              
              roster.push({
                role: role,
                discord: discord === "N/A" ? "" : discord,
                ign: cleanName,
                steam: steam === "N/A" ? "" : steam,
                faceit: faceit === "N/A" ? "" : faceit,
                faceitElo: liveElo,
                faceitLevel: getLevelFromElo_(liveElo)
              });
            }
          }
          
          const displayStatus = status === "APPROVED" || status === "ROSTER_LOCKED" || status === "CHECKED_IN" || status === "QUALIFIED" || status === "CHAMPION"
            ? "VERIFIED" : "PENDING REVIEW";
            
          const tag = rawTagMap[teamName.toLowerCase()] || teamName.substring(0, 4).toUpperCase();
          
          teams.push({
            name: teamName,
            tag: tag,
            logo: logoUrl,
            status: displayStatus,
            region: region,
            averageElo: averageElo ? averageElo.toString() : "N/A",
            seed: seed || "TBD",
            roster: roster
          });
        }
        
        return generateResponse({ teams: teams, confirmed: teams.length });
      } catch (err) {
        return generateResponse({ error: "ADMIN_OPS_SYNC_ERROR: " + err.toString() }, 500);
      }
    }

    // ── Get Slot Counts ─────────────────────────────────────────────────────
    if (endpoint === "/api/v1/getSlots") {
      let rawSheet = doc.getSheetByName("Sheet1");
      if (!rawSheet) return generateResponse({ inviteConfirmed: 0, openConfirmed: 0 });
      const data = rawSheet.getDataRange().getValues();
      if (data.length < 1) return generateResponse({ inviteConfirmed: 0, openConfirmed: 0 });

      const cols = getRawColMap_(data[0]);
      const firstDataRow = isHeaderRow_(data[0]) ? 1 : 0;

      let invite = 0, open = 0;
      // Also check InviteCodes sheet for valid codes
      const inviteSheet = doc.getSheetByName("InviteCodes");
      const validCodes = new Set();
      if (inviteSheet) {
        const inviteData = inviteSheet.getDataRange().getValues();
        for (let i = 1; i < inviteData.length; i++) {
          const code = (inviteData[i][0] || "").toString().trim();
          const tid  = (inviteData[i][1] || "").toString().trim();
          if (code && (!tid || tid === tournamentId)) validCodes.add(code.toLowerCase());
        }
      }

      for (let i = firstDataRow; i < data.length; i++) {
        const row = data[i];
        const tid    = (row[cols.tournament] || "").toString().trim();
        const status = (row[cols.status]     || "").toString().trim().toUpperCase();
        if (tid !== tournamentId) continue;
        if (status === "REJECTED") continue;

        // Get the invite code used — it's the last column (VIP Code Used)
        const inviteCode = (row[cols.inviteCode] || "").toString().trim();
        // Count as invite slot only if the code used was a valid/registered invite code
        if (inviteCode && validCodes.size > 0 && validCodes.has(inviteCode.toLowerCase())) {
          invite++;
        } else if (inviteCode && validCodes.size === 0) {
          // Fallback: if no InviteCodes sheet, any code = invite slot
          invite++;
        } else {
          open++;
        }
      }
      return generateResponse({ inviteConfirmed: invite, openConfirmed: open });
    }

    return generateResponse({ "error": "Unknown Endpoint" }, 404);
  } catch(error) {
    return generateResponse({ "error": error.toString() });
  }
}

function generateResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}

/**
 * Detects raw sheet column positions from the header row.
 * Works for both Layout A (with Team ID column) and Layout B (without).
 */
function getRawColMap_(headerRow) {
  var map = {};
  for (var h = 0; h < headerRow.length; h++) {
    var k = headerRow[h].toString().trim().toLowerCase()
              .replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
    map[k] = h;
  }
  var get = function(keys, fallback) {
    for (var x = 0; x < keys.length; x++) {
      if (map[keys[x]] !== undefined) return map[keys[x]];
    }
    return fallback;
  };
  return {
    teamId:     get(['team_id'],                        0),
    timestamp:  get(['timestamp'],                      1),
    tournament: get(['tournament_id', 'tournament'],    2),
    subId:      get(['submission_id'],                  3),
    status:     get(['status'],                         4),
    teamName:   get(['team_name', 'team name'],         5),
    teamTag:    get(['team_tag', 'team tag'],           6),
    region:     get(['region'],                         7),
    logo:       get(['logo_url', 'logo url'],           8),
    playerBase: get(['p1_discord', 'p1 discord'],       9),
    inviteCode: get(['vip_code_used', 'vip code used'], 36)
  };
}

/**
 * Returns true if the given row looks like a header row.
 */
function isHeaderRow_(row) {
  var first = (row[0] || "").toString().trim().toLowerCase();
  return first === "team id" || first === "timestamp" || first === "team_id";
}

/**
 * Creates or returns the InviteCodes sheet.
 * Structure: Code | Tournament ID | Slot Type (INVITE/OPEN) | Max Uses | Times Used | Notes
 */
function getOrCreateInviteCodesSheet_(doc) {
  var sheet = doc.getSheetByName("InviteCodes");
  if (!sheet) {
    sheet = doc.insertSheet("InviteCodes");
    sheet.appendRow(["Code", "Tournament ID", "Slot Type", "Max Uses", "Times Used", "Notes"]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#1a1a2e").setFontColor("#00f0ff");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 160);
    sheet.setColumnWidth(3, 120);
    // Seed with a demo code for community-cup-2
    sheet.appendRow(["PP-INVITE-DEMO", "community-cup-2", "INVITE", 1, 0, "Demo invite code — replace with real codes"]);
  }
  return sheet;
}

/**
 * Triggered on edits to check approvals / rejections and enforce state transitions
 */
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  
  if (sheetName === "Sheet1") {
    const col = range.getColumn();
    
    // Column E (index 5) is the Status column (after inserting Team ID column)
    if (col === 5) {
      const oldValue = e.oldValue ? String(e.oldValue).trim().toUpperCase() : "";
      const newValue = e.value ? String(e.value).trim().toUpperCase() : "";
      
      if (oldValue === newValue) return;
      
      const validTransitions = {
        "PENDING": ["UNDER_REVIEW", "REJECTED"],
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
        try {
          SpreadsheetApp.getUi().alert("⚠️ INVALID STATE TRANSITION\n\nThe status transition from '" + oldValue + "' to '" + newValue + "' is forbidden by the tournament state machine.");
        } catch (uiErr) {}
        return;
      }
      
      logAuditEntry(sheetName, range.getRow(), "STATUS_CHANGE", oldValue, newValue);

      // Real-time status sync back to Admin Operations Sheet
      const teamName = sheet.getRange(range.getRow(), 6).getValue().toString().trim();
      if (teamName) {
        syncStatusToAdmin(teamName, newValue);
      }
    }
  }
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
 * Real-time write-through sync to Admin Operations Sheet
 */
function appendToAdminSheet(payload, teamId) {
  const tournamentId = payload.tournament_id || "community-cup-2";
  let adminSheetId = "";
  let maxPlayers = 7;
  let isChaos = false;
  
  if (tournamentId === "community-cup-2") {
    adminSheetId = "1_B_ovDmGuA1rAityrgAz_G3csBtLl4OFfwJUMWXXe_E";
    maxPlayers = 7;
  } else if (tournamentId === "chaos-ii") {
    adminSheetId = "1htkH0PQWbWefE5XFIdf2AGqTxpWMwLyGDMZMfOOL-2E";
    maxPlayers = 3;
    isChaos = true;
  } else {
    return; // Fallback or unsupported tournament
  }

  try {
    const adminDoc = SpreadsheetApp.openById(adminSheetId);
    const adminSheet = adminDoc.getSheetByName("Admin_Ops") || adminDoc.getSheetByName("Sheet1") || adminDoc.getSheets()[0];
    
    const adminData = adminSheet.getDataRange().getValues();
    const existingTeams = new Set();
    const nameIdx = isChaos ? 1 : 10; // Chaos II uses Col B (index 1), CC2 uses Col K (index 10)
    for (let i = 1; i < adminData.length; i++) {
      if (adminData[i][nameIdx]) existingTeams.add(adminData[i][nameIdx].toString().toLowerCase().trim());
    }
    
    const teamName = payload.team_name ? payload.team_name.trim() : "";
    if (!teamName || existingTeams.has(teamName.toLowerCase())) return;

    const sn = "TEAM " + (existingTeams.size + 1);
    const startRowIndex = adminSheet.getLastRow() + 1;
    const rowsToAppend = [];
    
    const teamTag = payload.team_tag ? payload.team_tag.trim() : "";
    const region = payload.region ? payload.region.trim() : "";
    const logoUrl = payload.logo_url ? payload.logo_url.trim() : "";
    
    let eloSum = 0;
    let eloCount = 0;
    for (let p = 1; p <= maxPlayers; p++) {
      const eloVal = parseInt(payload[`p${p}FaceitElo`]);
      const ign = payload[`p${p}IGN`];
      if (ign && ign.trim() !== "") {
        if (!isNaN(eloVal) && eloVal > 0) {
          eloSum += eloVal;
          eloCount++;
        }
      }
    }
    const averageElo = eloCount > 0 ? Math.round(eloSum / eloCount) : 0;

    if (isChaos) {
      // Chaos II format (33 columns structure)
      const roleTags = [" ©", " (Partner)", " (Sub)"];
      const roles = ["Captain", "Partner", "Substitute"];
      
      for (let p = 0; p < 3; p++) {
        const pNum = p + 1;
        const discord = payload[`p${pNum}Discord`] || "N/A";
        const steam = payload[`p${pNum}Steam`] || "N/A";
        const faceit = payload[`p${pNum}Faceit`] || "N/A";
        const pName = faceit
          ? faceit.replace(/\/$/, "").split("/").pop() + roleTags[p]
          : (discord ? discord + roleTags[p] : "N/A");
          
        const r = new Array(33).fill("");
        r[0]  = p === 0 ? sn : "";                     // Col A (1): S.N
        r[1]  = p === 0 ? teamName : "";               // Col B (2): Team Name
        r[2]  = p === 0 ? teamTag : "";                // Col C (3): Team Tag
        r[3]  = p === 0 ? `=IMAGE("${logoUrl}")` : ""; // Col D (4): Logo
        r[4]  = p === 0 ? region : "";                 // Col E (5): Region
        r[5]  = pName;                                 // Col F (6): Player Name
        r[6]  = discord || "N/A";                      // Col G (7): Discord
        r[7]  = steam || "N/A";                        // Col H (8): Steam URL
        r[8]  = "";                                    // Col I (9): Joined Discord
        r[9]  = "";                                    // Col J (10): Role Issued
        r[10] = "";                                    // Col K (11): Private VC
        r[11] = faceit || "N/A";                       // Col L (12): FACEIT URL
        r[12] = "⏳";                                  // Col M (13): Live ELO
        r[13] = p === 0 ? "⏳" : "";                    // Col N (14): Avg ELO
        r[14] = p === 0 ? "Pending" : "";              // Col O (15): Reg. Status
        r[15] = p === 0 ? "TBD" : "";                  // Col P (16): Team Seed
        r[16] = "";                                    // Col Q (17): Remarks
        r[17] = roles[p];                              // Col R (18): Role
        r[32] = p === 0 ? "⏳" : "";                    // Col AG (33): Risk Flag
        
        rowsToAppend.push(r);
      }
      
      adminSheet.getRange(startRowIndex, 1, 3, 33).setValues(rowsToAppend);
      [1, 2, 3, 4, 5, 14, 15, 16, 17, 33].forEach(col => {
         adminSheet.getRange(startRowIndex, col, 3, 1).merge().setVerticalAlignment("middle").setHorizontalAlignment("center");
      });
      adminSheet.setRowHeightsForced(startRowIndex, 3, 28);
      
    } else {
      // Community Cup 2 format (15 columns structure)
      let seed = averageElo <= 1200 ? "LOW" : averageElo <= 1800 ? "MID" : averageElo <= 2200 ? "NORMAL" : averageElo <= 2500 ? "AVG" : averageElo <= 3000 ? "GOOD" : "BEST";

      for (let p = 0; p < 7; p++) {
        const pNum = p + 1;
        const discord = payload[`p${pNum}Discord`] || "N/A";
        const steam = payload[`p${pNum}Steam`] || "N/A";
        const faceit = payload[`p${pNum}Faceit`] || "N/A";
        
        const pRole = p === 0 ? " ©" : (p >= 5 ? " (Sub)" : "");
        const pName = faceit !== "N/A" ? faceit.split('/').filter(Boolean).pop() + pRole : discord + pRole;
        
        const r = new Array(15).fill("");
        r[0]  = p === 0 ? sn : "";                     // Col A: S.N
        r[1]  = p === 0 ? region : "";                 // Col B: Region
        r[2]  = p === 0 && logoUrl ? `=IMAGE("${logoUrl}")` : ""; // Col C: Logo URL
        r[3]  = steam || "N/A";                        // Col D: Steam Profile
        r[4]  = discord || "N/A";                      // Col E: Discord ID
        r[5]  = pName;                                 // Col F: Player Name
        r[6]  = faceit || "N/A";                       // Col G: Faceit Profile
        r[7]  = payload[`p${pNum}FaceitElo`] || "N/A"; // Col H: Live FACE IT ELO
        r[8]  = "";                                    // Col I: Joined Discord
        r[9]  = "";                                    // Col J: Role Issued
        r[10] = p === 0 ? teamName : "";               // Col K: Team Name
        r[11] = p === 0 ? averageElo : "";             // Col L: AVERAGE ELO
        r[12] = p === 0 ? "PENDING" : "";              // Col M: Registration status
        r[13] = p === 0 ? seed : "";                   // Col N: Team Seed
        r[14] = "";                                    // Col O: Admin Remarks
        rowsToAppend.push(r);
      }
      
      adminSheet.getRange(startRowIndex, 1, 7, 15).setValues(rowsToAppend);
      [1, 2, 3, 11, 12, 13, 14, 15].forEach(col => {
         adminSheet.getRange(startRowIndex, col, 7, 1).merge().setVerticalAlignment("middle").setHorizontalAlignment("center");
      });
      
      const seedRange = adminSheet.getRange(startRowIndex, 14);
      seedRange.setBackground(seed==="LOW"?"#d9d9d9":seed==="MID"?"#b6d7a8":seed==="NORMAL"?"#ffe599":seed==="AVG"?"#f9cb9c":seed==="GOOD"?"#00ffff":"#ff00ff")
               .setFontWeight("bold");
    }
             
  } catch (err) {
    console.error("Failed to append to admin sheet:", err);
  }
}

/**
 * Real-time status sync back to Admin Operations Sheet
 */
function syncStatusToAdmin(teamName, newStatus) {
  const adminSheets = [
    { id: "1_B_ovDmGuA1rAityrgAz_G3csBtLl4OFfwJUMWXXe_E", teamNameIdx: 10, statusCol: 13 }, // CC2
    { id: "1htkH0PQWbWefE5XFIdf2AGqTxpWMwLyGDMZMfOOL-2E", teamNameIdx: 1, statusCol: 15 }   // Chaos II
  ];
  
  adminSheets.forEach(cfg => {
    try {
      const adminDoc = SpreadsheetApp.openById(cfg.id);
      const adminSheet = adminDoc.getSheetByName("Admin_Ops") || adminDoc.getSheetByName("Sheet1") || adminDoc.getSheets()[0];
      const data = adminSheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        const existingTeamName = data[i][cfg.teamNameIdx] ? data[i][cfg.teamNameIdx].toString().trim() : "";
        if (existingTeamName.toLowerCase() === teamName.toLowerCase()) {
          const currentStatus = data[i][cfg.statusCol - 1] ? data[i][cfg.statusCol - 1].toString().trim() : "";
          if (currentStatus.toUpperCase() !== newStatus.toUpperCase()) {
            adminSheet.getRange(i + 1, cfg.statusCol).setValue(newStatus);
          }
          break;
        }
      }
    } catch (err) {
      console.error("Failed to sync status to Admin ID " + cfg.id + ":", err);
    }
  });
}

/**
 * Generates a set of invite codes and appends them to the InviteCodes sheet.
 * Each code follows the pattern PP-CCII-XXXX where XXXX is a random 4‑character alphanumeric string.
 *
 * @param {number} count - Number of codes to generate (e.g., 6).
 */
function generateInviteCodes(count) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('InviteCodes');
  if (!sheet) return;
  const prefix = 'PP-CCII-';
  const codes = [];
  for (let i = 0; i < count; i++) {
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push([prefix + suffix, '', '']); // VIP Codes | Used By | Reference/Allocation
  }
  // Append after header row (row 1)
  sheet.getRange(sheet.getLastRow() + 1, 1, codes.length, 3).setValues(codes);
}

/**
 * If the InviteCodes sheet has only the header row, generate 6 initial codes.
 */
function ensureInviteCodes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('InviteCodes');
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) { // only header
    generateInviteCodes(6);
  }
}

function ensureInviteCodesSheet() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateInviteCodesSheet_(doc);
  ensureInviteCodes();
}

// Ensure codes exist on script load
ensureInviteCodesSheet();

function getLevelFromElo_(elo) {
  if (!elo || elo === "N/A" || elo === "Fetching...") return "N/A";
  const val = parseInt(elo);
  if (isNaN(val) || val <= 0) return "N/A";
  if (val <= 500) return "1";
  if (val <= 750) return "2";
  if (val <= 1000) return "3";
  if (val <= 1150) return "4";
  if (val <= 1350) return "5";
  if (val <= 1530) return "6";
  if (val <= 1720) return "7";
  if (val <= 1910) return "8";
  if (val <= 2000) return "9";
  return "10";
}

function getRawTagMap_(doc) {
  const map = {};
  const rawSheet = doc.getSheetByName("Sheet1");
  if (!rawSheet) return map;
  const data = rawSheet.getDataRange().getValues();
  if (data.length < 2) return map;
  
  const header = data[0];
  let teamNameCol = 5;
  let teamTagCol = 6;
  for (let h = 0; h < header.length; h++) {
    const val = header[h].toString().trim().toLowerCase();
    if (val === "team name") teamNameCol = h;
    if (val === "team tag") teamTagCol = h;
  }
  
  for (let i = 1; i < data.length; i++) {
    const name = (data[i][teamNameCol] || "").toString().trim().toLowerCase();
    const tag = (data[i][teamTagCol] || "").toString().trim();
    if (name) {
      map[name] = tag;
    }
  }
  return map;
}
