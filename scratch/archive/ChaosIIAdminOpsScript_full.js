<USER_REQUEST>
raw sheet details
https://docs.google.com/spreadsheets/d/18v5CFox5pRSRNhEtx9kmkVJHNDwH2K84hvMIH-KZyEc/edit?gid=0#gid=0

https://script.google.com/u/0/home/projects/1otj9GJO8tIrZpggR7jmnpU-zY1cYFhc6udOweF826gT4DsIsDiEKClkH/edit

/**
 * PIXEL PALACE — MASTER RAW REGISTRATIONS SCRIPT v4.0 (RECEIVER)
 *
 * Deployed in: Pixel Palace | Raw Registrations Spreadsheet
 * Web App URL: https://script.google.com/macros/s/AKfycby0ryeemIms7XhpnEohHms0Cm3k2gUIgl0_XBDhz7gjJfGH5Hi7Qhm12l-ERNd9C7ACgw/exec
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const ADMIN_SECRET = ""; // Optional gateway secret matching VITE_GATEWAY_AUTH_SECRET

/**
 * RECEIVE REGISTRATIONS (POST)
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const endpoint = payload.endpoint || "";

    // API Versioning Validation
    if (!endpoint.startsWith("/api/v1/")) {
      return generateResponse({ error: "UNSUPPORTED_API_VERSION: Requests must target /api/v1/ endpoints." }, 400);
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
      const existingStatus = rows[i][3]; // Column D (Status)
      if (existingStatus === "REJECTED") continue;

      const existingTeamName = String(rows[i][3]).trim().toUpperCase(); // Column D (Team Name)
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
    logAuditEntry(sheetName, rows.length + 1, "REGISTRATION_SUBMITTED", "", "PENDING");

    return generateResponse({ "success": true, "teamId": teamId });
  } catch (error) {
    return generateResponse({ "error": error.toString() });
  }
}

/**
 * READ QUERIES (GET)
 */
function doGet(e) {
  try {
    const doc = SpreadsheetApp.openById(SPREADSHEET_ID);
    const params = e.parameter;
    const endpoint = params.endpoint || "";

    // API Versioning Enforcement
    if (!endpoint.startsWith("/api/v1/")) {
      return generateResponse({ error: "UNSUPPORTED_API_VERSION: Requests must target /api/v1/ endpoints." }, 400);
    }
    
    const tournamentId = params.tournamentId || "";
    
    if (endpoint === "/api/v1/validateCode") {
      const codeSheet = doc.getSheetByName("Codes");
      let isValid = false;
      if (codeSheet) {
        const codeData = codeSheet.getDataRange().getValues();
        for (let i = 1; i < codeData.length; i++) {
          if (codeData[i][0] == params.validateCode && (!codeData[i][1] || codeData[i][1].toString().trim() === "")) {
            isValid = true; break;
          }
        }
      }
      return generateResponse({ valid: isValid });
    }
    
    if (endpoint === "/api/v1/getTeams") {
      let rawSheet = doc.getSheetByName("Sheet1");
      if (!rawSheet) return generateResponse({ teams: [] });
      const data = rawSheet.getDataRange().getValues();
      const teams = [];
      for (let i = 1; i < data.length; i++) {
        if (data[i][2] && data[i][2].toString().trim() === tournamentId) {
          teams.push({
            name: data[i][5] || "Unnamed Team",
            tag: data[i][6] || "TEAM",
            logo: data[i][8] || "",
            status: data[i][4] === "APPROVED" ? "VERIFIED" : "PENDING REVIEW"
          });
        }
      }
      return generateResponse({ teams: teams, confirmed: teams.length });
    }

    if (endpoint === "/api/v1/getSlots") {
      let rawSheet = doc.getSheetByName("Sheet1");
      if (!rawSheet) return generateResponse({ inviteConfirmed: 0, openConfirmed: 0 });
      const data = rawSheet.getDataRange().getValues();
      let invite = 0, open = 0;
      for (let i = 1; i < data.length; i++) {
        if (data[i][2] && data[i][2].toString().trim() === tournamentId) {
          // Column 37 (index 36) represents invite code used
          if (data[i][36]) invite++; else open++;
        }
      }
      return generateResponse({ inviteConfirmed: invite, openConfirmed: open });
    }

    return generateResponse({ "error": "Unknown Endpoint" }, 404);
  } catch(error) {
    return generateResponse({ "error": error.toString() });
  }
}

function generateResponse(data, statusCode = 200) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
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


new community cup 2 sheet details
https://docs.google.com/spreadsheets/d/1_B_ovDmGuA1rAityrgAz_G3csBtLl4OFfwJUMWXXe_E/edit?gid=0#gid=0

https://script.google.com/u/0/home/projects/1CbppdglkE0PRCP1PoX6H_18FI24oZ9YJ8_YaUxEdhaU-ZDP4cnYPVIFY/edit

/**
 * PIXEL PALACE — ADMIN OPERATIONS SCRIPT v2.0 (7-PLAYER FORMAT)
 *
 * Deployed in: Pixel Palace Community Cup 2 Admin Sheet
 * Spreadsheet URL: https://docs.google.com/spreadsheets/d/1_B_ovDmGuA1rAityrgAz_G3csBtLl4OFfwJUMWXXe_E/edit?gid=0#gid=0
 */

const RAW_SHEET_ID = "1peKx1a0_Tl1vwkoFc7ZcrWQR5T0LfF_7b9nP_B_QCLw"; // ID of the Pixel Palace | Raw Registrations spreadsheet
const FACEIT_API_KEY = "a77d0763-5fdd-4bde-a8a5-6e840408de2e";

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚡ Admin Tools')
    .addItem('📥 Manual Sync & Fetch ELOs', 'syncAndFetch')
    .addSeparator()
    .addItem('⏰ Enable Auto-Sync (Every 30 Mins)', 'createTimeTriggers')
    .addToUi();
}

function syncAndFetch() {
  syncRawToAdmin();
  updateFaceitElo();
}

function createTimeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) ScriptApp.deleteTrigger(triggers[i]);
  ScriptApp.newTrigger('syncAndFetch').timeBased().everyMinutes(30).create();
  SpreadsheetApp.getUi().alert("✅ Auto-sync Enabled (Every 30 Minutes).");
}

function syncRawToAdmin() {
  const sourceDoc = SpreadsheetApp.openById(RAW_SHEET_ID);
  const rawSheet = sourceDoc.getSheetByName("Sheet1") || sourceDoc.getSheets()[0];
  const adminSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Admin_Ops") || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  
  const rawData = rawSheet.getDataRange().getValues();
  const adminData = adminSheet.getDataRange().getValues();
  
  const existingTeams = new Set();
  for (let i = 1; i < adminData.length; i++) {
    if (adminData[i][1]) existingTeams.add(adminData[i][1].toString().toLowerCase().trim());
  }

  let teamsSynced = 0;
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    const teamName = row[5] ? row[5].toString().trim() : ""; // Column F (Team Name)
    if (!teamName || existingTeams.has(teamName.toLowerCase())) continue;

    const sn = "TEAM " + (existingTeams.size + teamsSynced + 1);
    const startRowIndex = adminSheet.getLastRow() + 1;
    const rowsToAppend = [];

    // Loop through all 7 potential players (Captain, 4 Starters, 2 Subs)
    for (let p = 0; p < 7; p++) {
      let dataStartCol = 9 + (p * 4); // P1 Discord starts at Column J (index 9)
      if (dataStartCol >= row.length) break;

      let discord = row[dataStartCol] || "N/A";
      let steam = row[dataStartCol + 1] || "N/A";
      let faceit = row[dataStartCol + 2] || "N/A";
      
      let pRole = p === 0 ? " ©" : (p >= 5 ? " (Sub)" : "");
      let pName = faceit !== "N/A" ? faceit.split('/').filter(Boolean).pop() + pRole : discord + pRole;

      // Aligned exactly to Columns A through Q (17 elements)
      rowsToAppend.push([
        p === 0 ? sn : "",                 // Col A: S.N
        p === 0 ? teamName : "",           // Col B: Team Name
        p === 0 ? row[6] : "",             // Col C: Team Tag
        p === 0 ? row[8] : "",             // Col D: Team Logo Url
        p === 0 ? row[7] : "",             // Col E: Region
        pName,                             // Col F: Player Name
        discord,                           // Col G: Discord ID
        steam,                             // Col H: Steam Profile
        "",                                // Col I: Joined Discord (Admin fills this)
        "",                                // Col J: Role Issued (Admin fills this)
        "",                                // Col K: VC Created (Admin fills this)
        faceit,                            // Col L: Faceit Profile
        "Fetching...",                     // Col M: Live FACE IT ELO
        p === 0 ? "Pending" : "",          // Col N: AVERAGE ELO
        p === 0 ? "Under Review" : "",     // Col O: Registration status
        p === 0 ? "TBD" : "",              // Col P: Team Seed
        ""                                 // Col Q: Admin Remarks
      ]);
    }

    // Push 7 rows at once
    adminSheet.getRange(startRowIndex, 1, 7, 17).setValues(rowsToAppend);
    
    // Merge the Team-level cells vertically so it looks clean
    [1, 2, 3, 4, 5, 14, 15, 16, 17].forEach(col => {
       adminSheet.getRange(startRowIndex, col, 7, 1).merge().setVerticalAlignment("middle").setHorizontalAlignment("center");
    });
    
    teamsSynced++;
  }
}

function updateFaceitElo() {
  const adminSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Admin_Ops") || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = adminSheet.getDataRange().getValues();
  const options = { "method": "get", "headers": { "Authorization": "Bearer " + FACEIT_API_KEY }, "muteHttpExceptions": true };
  let teamStartIdx = 1, eloSum = 0, count = 0;

  for (let i = 1; i < data.length; i++) {
    // If we hit a new team name, finalize the stats for the previous team
    if (adminSheet.getRange(i + 1, 1).getValue() !== "" && i !== 1) {
      finalizeTeamStats(adminSheet, teamStartIdx, eloSum, count);
      teamStartIdx = i; 
      eloSum = 0; 
      count = 0;
    }
    
    let url = data[i][11]; // Col L (Faceit Profile)
    if (url && url.includes("faceit.com")) {
      try {
        let res = UrlFetchApp.fetch(`https://open.faceit.com/data/v4/players?nickname=${url.split('/').pop()}`, options);
        if (res.getResponseCode() === 200) {
          let json = JSON.parse(res.getContentText());
          let elo = json.games.cs2 ? json.games.cs2.faceit_elo : (json.games.csgo ? json.games.csgo.faceit_elo : 0);
          adminSheet.getRange(i + 1, 13).setValue(elo); // Col M
          eloSum += elo; 
          count++;
        }
      } catch (e) {}
    }
  }
  // Finalize the very last team in the sheet
  finalizeTeamStats(adminSheet, teamStartIdx, eloSum, count);
}

function finalizeTeamStats(sheet, teamStartIdx, eloSum, count) {
  if (count === 0) return;
  let avg = Math.round(eloSum / count);
  let seed = avg <= 1200 ? "LOW" : avg <= 1800 ? "MID" : avg <= 2200 ? "NORMAL" : avg <= 2500 ? "AVG" : avg <= 3000 ? "GOOD" : "BEST";
  
  // Col N (14) - Average ELO
  sheet.getRange(teamStartIdx + 1, 14).setValue(avg);
  
  // Col P (16) - Team Seed
  sheet.getRange(teamStartIdx + 1, 16)
       .setValue(seed)
       .setBackground(seed==="LOW"?"#d9d9d9":seed==="MID"?"#b6d7a8":seed==="NORMAL"?"#ffe599":seed==="AVG"?"#f9cb9c":seed==="GOOD"?"#00ffff":"#ff00ff")
       .setFontWeight("bold");
}



vs

the other last hosted tournament details
Pixel Palace | Wingman Chaos 2026 | Admin View
https://docs.google.com/spreadsheets/d/1GeEyWg_PwiF8bSWMFjYZJu55ZBgeAoBWWZ7VFrU67Zs/edit?gid=0#gid=0

https://script.google.com/u/0/home/projects/1iUrTZ51obFuOqYjyUTAdXoYzhBiUh54gO4jRCC75I42jYeLLkL_X0oD0/edit

/* =============================================================================
   ⚡ PIXEL PALACE — ADMIN OPS BOARD v3.0 (MASTER INTEL ENGINE)
   ============================================================================ */

/**
 * CORS Wrapper for all responses
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 🛰️ GET Uplink Handler
 */
function doGet(e) {
  const action = e.parameter.action;
  const tournamentId = e.parameter.tournamentId;
  
  try {
    if (e.parameter.validateCode) {
      return createJsonResponse({ valid: e.parameter.validateCode.toUpperCase() === 'ADMIN' });
    }

    switch (action) {
      case 'getSlots':
        return createJsonResponse({ 
          inviteConfirmed: 12, 
          openConfirmed: 30, 
          isFull: false 
        });
        
      case 'getTeams':
        // REPLACE THIS with your actual sheet-fetching logic
        return createJsonResponse({ 
          teams: [
            { name: "Team Pixel", tag: "PP", status: "VERIFIED", logo: "https://i.imgur.com/logo.png" }
          ] 
        });
        
      case 'getBracket':
        return createJsonResponse({
          bracketUrl: "https://challonge.com/ppwc2026/module",
          schedule: [
            "Day 1: Round 1 & 2 (18:00 PKT)",
            "Day 2: Quarterfinals (18:00 PKT)",
            "Day 3: Semifinals (20:00 PKT)",
            "Day 4: Grand Finals (22:00 PKT)"
          ]
        });

      default:
        return createJsonResponse({ error: "Invalid action: " + action });
    }
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

/**
 * 📡 POST Submission Handler
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    // ... your logic to append to sheet ...
    return createJsonResponse({ success: true, received: payload.team_name });
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}



and its version 2.0
https://docs.google.com/spreadsheets/d/1htkH0PQWbWefE5XFIdf2AGqTxpWMwLyGDMZMfOOL-2E/edit

https://script.google.com/u/0/home/projects/1EnrWXahQ5Yh8SvmyVFWAcy44_BzqOvi7fLs88pCwKI5D7eC8FPxCk26K/edit

/* =============================================================================
   ⚡ PIXEL PALACE — ADMIN OPS BOARD v3.0 (COMPLETE INTEL ENGINE)

   KEY FIXES vs v2:
   ✅ Column map now matches your EXISTING 17-col structure (no offset bugs)
   ✅ FACEIT API returns steam_id_64 directly — no Steam URL parsing needed
   ✅ Steam bans/summaries fetched in ONE batch call (100 IDs at a time)
   ✅ Role col + 15 new intel cols added at positions 18-33
   ✅ setupNewColumns() adds all missing headers to existing sheet
   ✅ CS2 rank badge derived from FACEIT skill level
   ✅ CSGO lifetime stats fallback if CS2 stats endpoint returns empty
   ============================================================================= */

// ── CONFIGURATION ─────────────────────────────────────────────────────────────
const RAW_SHEET_ID   = "18v5CFox5pRSRNhEtx9kmkVJHNDwH2K84hvMIH-KZyEc";
const FACEIT_API_KEY = "a77d0763-5fdd-4bde-a8a5-6e840408de2e";
const STEAM_API_KEY  = "B0B73613E7724F046A860E9CC1DCF86B";
const TARGET_TOURNAMENT = "chaos-ii";
const CS2_APP_ID     = 730;

// ── COLUMN MAP ────────────────────────────────────────────────────────────────
// EXISTING columns 1-17 match your current sheet exactly — DO NOT reorder.
// New intel columns are appended at 18-33.
const C = {
  // ── Existing ──
  SN: 1, TEAM_NAME: 2, TEAM_TAG: 3, LOGO: 4, REGION: 5,
  PLAYER_NAME: 6, DISCORD: 7, STEAM_URL: 8,
  JOINED: 9, ROLE_ISSUED: 10, PRIVATE_VC: 11,
  FACEIT_URL: 12, LIVE_ELO: 13, AVG_ELO: 14,
  REG_STATUS: 15, SEED: 16, REMARKS: 17,
  // ── New Intel ──
  ROLE:        18,   // Captain / Partner / Substitute
  SKILL_LVL:   19,   // FACEIT Skill Level (1–10)
  RANK_BADGE:  20,   // CS2 rank label mapped from skill level
  WIN_RATE:    21,   // Lifetime Win Rate %
  KD:          22,   // Lifetime K/D Ratio
  HS_PCT:      23,   // Lifetime HS %
  MATCHES:     24,   // Total FACEIT Matches
  FACEIT_TIER: 25,   // Free / Premium
  COUNTRY:     26,   // Country code (from FACEIT)
  STEAM64:     27,   // SteamID64 — pulled directly from FACEIT API
  VAC_BAN:     28,   // VAC Ban status
  GAME_BAN:    29,   // Game Ban count
  STEAM_LVL:   30,   // Steam Account Level
  CS2_HRS:     31,   // CS2 Total Hours
  STEAM_AGE:   32,   // Steam Account Age (years)
  RISK_FLAG:   33,   // Team risk assessment
};
const TOTAL_COLS = 33;

// Columns that merge across all 3 player rows (team-level data):
const TEAM_MERGE_COLS = [
  C.SN, C.TEAM_NAME, C.TEAM_TAG, C.LOGO, C.REGION,
  C.AVG_ELO, C.REG_STATUS, C.SEED, C.REMARKS, C.RISK_FLAG
];

// ── HEADERS ───────────────────────────────────────────────────────────────────
const BASE_HEADERS = [
  "S.N","Team Name","Team Tag","Logo","Region",
  "Player Name","Discord","Steam URL",
  "Joined Discord","Role Issued","Private VC",
  "FACEIT URL","Live ELO","Avg ELO",
  "Reg. Status","Team Seed","Admin Remarks"
];
const NEW_HEADERS = {
  18:"Role", 19:"Skill Lvl", 20:"CS2 Rank Badge",
  21:"Win Rate %", 22:"K/D Ratio", 23:"HS %",
  24:"Matches", 25:"FACEIT Tier", 26:"Country",
  27:"Steam64 ID", 28:"VAC Ban", 29:"Game Ban",
  30:"Steam Lvl", 31:"CS2 Hrs", 32:"Steam Age (yrs)",
  33:"Risk Flag"
};

// ── MENU ──────────────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("⚡ Admin Tools")
    .addItem("📥 Full Sync — All Sources",      "syncAndFetch")
    .addSeparator()
    .addItem("🔧 Setup / Fix Column Headers",   "setupNewColumns")
    .addItem("👤 Fill Roles from Player Names", "fillRolesFromNames")
    .addItem("🔄 Sync New Teams Only",          "syncRawToAdmin")
    .addItem("🎮 Refresh FACEIT Data",          "updateFaceitData")
    .addItem("🛡️ Refresh Steam Data",           "updateSteamData")
    .addSeparator()
    .addItem("🚩 Re-run Risk Flags",            "flagAtRiskPlayers")
    .addItem("📊 Rebuild Summary Sheet",        "buildSummarySheet")
    .addSeparator()
    .addItem("⏲️ Enable Auto-Sync (30 min)",    "setupTrigger")
    .addItem("🚫 Disable Auto-Sync",            "removeTrigger")
    .addToUi();
}

function setupTrigger() {
  removeTrigger();
  ScriptApp.newTrigger("syncAndFetch").timeBased().everyMinutes(30).create();
  SpreadsheetApp.getUi().alert("✅ Auto-Sync enabled: every 30 minutes.");
}
function removeTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
}

// ── MASTER ENTRY POINT ────────────────────────────────────────────────────────
function syncAndFetch() {
  setupNewColumns();
  syncRawToAdmin();
  fillRolesFromNames();
  updateFaceitData();
  updateSteamData();    // calls flagAtRiskPlayers() internally at the end
  buildSummarySheet();
}

// ── STEP 0: WRITE MISSING COLUMN HEADERS (18-33) ─────────────────────────────
// Safe to run multiple times — only writes if the cell is empty or wrong.
function setupNewColumns() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  if (!sheet) return;

  // Write base headers if sheet is brand new
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(BASE_HEADERS);
    sheet.getRange(1, 1, 1, 17)
      .setFontWeight("bold").setBackground("#1D4ED8")
      .setFontColor("white").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }

  const headerRow = sheet.getRange(1, 1, 1, TOTAL_COLS).getValues()[0];

  Object.entries(NEW_HEADERS).forEach(([colStr, label]) => {
    const col = parseInt(colStr);
    if (headerRow[col - 1] === label) return; // already set
    sheet.getRange(1, col)
      .setValue(label)
      .setFontWeight("bold")
      .setBackground("#1D4ED8")
      .setFontColor("white")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

    // Column widths for readability
    const widths = { 20:140, 27:150, 28:90, 29:90, 32:110 };
    sheet.setColumnWidth(col, widths[col] || 85);
  });
}

// ── STEP 1: FILL ROLES FROM PLAYER NAME COLUMN ───────────────────────────────
// Reads col 6 (Player Name) and parses © / (Partner) / (Sub) markers.
// Writes to col 18 (Role). Safe to run on existing data.
function fillRolesFromNames() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  if (!sheet || sheet.getLastRow() <= 1) return;
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const name = (data[i][C.PLAYER_NAME - 1] || "").toString();
    if (!name || name === "N/A") continue;
    const existing = (data[i][C.ROLE - 1] || "").toString();
    const role = parseRole(name);
    if (role !== "—" && existing !== role) {
      sheet.getRange(i + 1, C.ROLE).setValue(role);
    }
  }
}

// ── STEP 2: PULL NEW TEAMS FROM RAW SHEET ────────────────────────────────────
function syncRawToAdmin() {
  const rawSheet   = SpreadsheetApp.openById(RAW_SHEET_ID).getSheetByName("Sheet1");
  const adminSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  if (!rawSheet || !adminSheet) return;

  setupNewColumns(); // ensure headers exist

  const rawData   = rawSheet.getDataRange().getValues();
  const adminData = adminSheet.getDataRange().getValues();
  const existing  = new Set(
    adminData.slice(1).map(r => r[C.TEAM_NAME - 1]?.toString().toLowerCase().trim()).filter(Boolean)
  );
  let teamCount = adminData.slice(1).filter(r => r[C.SN - 1]?.toString().startsWith("TEAM")).length;
  const roleTags = [" ©", " (Partner)", " (Sub)"];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (row[1] !== TARGET_TOURNAMENT) continue;
    const nameKey = row[3]?.toString().toLowerCase().trim();
    if (!nameKey || existing.has(nameKey)) continue;

    teamCount++;
    const startRow = adminSheet.getLastRow() + 1;
    const block = [];

    for (let p = 0; p < 3; p++) {
      const dc      = 7 + (p * 4); // raw sheet player offset
      const discord = (row[dc]     || "").toString();
      const steam   = (row[dc + 1] || "").toString();
      const faceit  = (row[dc + 2] || "").toString();
      const pName   = faceit
        ? faceit.replace(/\/$/, "").split("/").pop() + roleTags[p]
        : (discord ? discord + roleTags[p] : "N/A");
      const roles   = ["Captain", "Partner", "Substitute"];

      const r = new Array(TOTAL_COLS).fill("");
      r[C.SN - 1]          = p === 0 ? `TEAM ${teamCount}` : "";
      r[C.TEAM_NAME - 1]   = p === 0 ? row[3] : "";
      r[C.TEAM_TAG - 1]    = p === 0 ? row[4] : "";
      r[C.LOGO - 1]        = p === 0 ? `=IMAGE("${row[6]}")` : "";
      r[C.REGION - 1]      = p === 0 ? row[5] : "";
      r[C.PLAYER_NAME - 1] = pName;
      r[C.DISCORD - 1]     = discord || "N/A";
      r[C.STEAM_URL - 1]   = steam   || "N/A";
      r[C.FACEIT_URL - 1]  = faceit  || "N/A";
      r[C.LIVE_ELO - 1]    = "⏳";
      r[C.AVG_ELO - 1]     = p === 0 ? "⏳" : "";
      r[C.REG_STATUS - 1]  = p === 0 ? "Pending" : "";
      r[C.SEED - 1]        = p === 0 ? "TBD" : "";
      r[C.ROLE - 1]        = roles[p];
      r[C.RISK_FLAG - 1]   = p === 0 ? "⏳" : "";
      block.push(r);
    }

    adminSheet.getRange(startRow, 1, 3, TOTAL_COLS).setValues(block);
    TEAM_MERGE_COLS.forEach(col =>
      adminSheet.getRange(startRow, col, 3, 1)
                .merge().setVerticalAlignment("middle").setHorizontalAlignment("center")
    );
    adminSheet.setRowHeightsForced(startRow, 3, 28);
    existing.add(nameKey);
  }
}

// ── STEP 3: FACEIT FULL DATA FETCH ────────────────────────────────────────────
// Per player: ELO, Skill Level, CS2 Rank Badge, Win Rate, K/D, HS%, Matches,
//             FACEIT Tier, Country, Steam64 ID (directly from FACEIT API).
function updateFaceitData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  if (!sheet || sheet.getLastRow() <= 1) return;

  const data = sheet.getDataRange().getValues();
  const opts = {
    method: "get",
    headers: { "Authorization": "Bearer " + FACEIT_API_KEY },
    muteHttpExceptions: true
  };

  let teamStartIdx = 1, teamElos = [];

  for (let i = 1; i < data.length; i++) {
    // Detect start of new team (merged SN cell returns "" for rows 2-3 of each team)
    const sn = data[i][C.SN - 1];
    if (sn !== "" && i !== 1) {
      finalizeTeamStats(sheet, teamStartIdx, teamElos);
      teamStartIdx = i;
      teamElos = [];
    }

    const faceitUrl = (data[i][C.FACEIT_URL - 1] || "").toString().trim();

    if (!faceitUrl || faceitUrl === "N/A" || !faceitUrl.includes("faceit.com")) {
      if (i === data.length - 1) finalizeTeamStats(sheet, teamStartIdx, teamElos);
      continue;
    }

    const nickname = faceitUrl.replace(/\/$/, "").split("/").pop();

    try {
      // ── Player base data ──
      const pRes = UrlFetchApp.fetch(
        `https://open.faceit.com/data/v4/players?nickname=${encodeURIComponent(nickname)}`, opts
      );

      if (pRes.getResponseCode() !== 200) {
        sheet.getRange(i + 1, C.LIVE_ELO).setValue("Not Found");
        if (i === data.length - 1) finalizeTeamStats(sheet, teamStartIdx, teamElos);
        continue;
      }

      const player   = JSON.parse(pRes.getContentText());
      const gameData = player.games?.cs2 || player.games?.csgo || {};
      const elo      = parseInt(gameData.faceit_elo) || 0;
      const skillLvl = parseInt(gameData.skill_level) || 0;
      const country  = (player.country || "—").toUpperCase();
      const tier     = capitalize(player.membership_type || "free");

      // ★ Steam64 ID is returned directly by FACEIT API — no URL parsing needed
      const steam64  = (player.steam_id_64 || player.steam_id || "").toString().trim();
      const pid      = player.player_id;

      if (elo > 0) teamElos.push(elo);

      // Write base player data
      const row = i + 1;
      sheet.getRange(row, C.LIVE_ELO).setValue(elo > 0 ? elo : "No ELO");
      sheet.getRange(row, C.SKILL_LVL).setValue(skillLvl || "—");
      sheet.getRange(row, C.RANK_BADGE).setValue(getCS2RankBadge(skillLvl, elo));
      sheet.getRange(row, C.FACEIT_TIER).setValue(tier);
      sheet.getRange(row, C.COUNTRY).setValue(country);
      if (steam64 && steam64.length === 17) sheet.getRange(row, C.STEAM64).setValue(steam64);

      colorSkillCell(sheet.getRange(row, C.SKILL_LVL), skillLvl);

      // ── Lifetime stats (try CS2 first, fall back to CSGO) ──
      if (pid) {
        for (const game of ["cs2", "csgo"]) {
          try {
            const sRes = UrlFetchApp.fetch(
              `https://open.faceit.com/data/v4/players/${pid}/stats/${game}`, opts
            );
            if (sRes.getResponseCode() !== 200) continue;

            const lt = JSON.parse(sRes.getContentText()).lifetime || {};
            const kd  = parseFloat(lt["Average K/D Ratio"]);
            const wr  = parseFloat(lt["Win Rate %"]);
            const hs  = parseFloat(lt["Average Headshots %"]);
            const m   = lt["Matches"];

            if (!isNaN(kd) && kd > 0) {
              sheet.getRange(row, C.WIN_RATE).setValue(isNaN(wr) ? "—" : wr.toFixed(1) + "%");
              sheet.getRange(row, C.KD).setValue(kd.toFixed(2));
              sheet.getRange(row, C.HS_PCT).setValue(isNaN(hs) ? "—" : hs.toFixed(1) + "%");
              sheet.getRange(row, C.MATCHES).setValue(m || "—");
              break; // stop at whichever game returned valid data
            }
          } catch(e) {}
        }
      }

    } catch(e) {
      sheet.getRange(i + 1, C.LIVE_ELO).setValue("Error");
    }

    if (i === data.length - 1) finalizeTeamStats(sheet, teamStartIdx, teamElos);
  }
}

// ── STEP 4: STEAM DATA FETCH (BATCHED) ────────────────────────────────────────
// Bans and profile summaries fetched in ONE call per 100 IDs.
// Steam Level and CS2 Hours still need individual calls (no batch endpoint).
function updateSteamData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  if (!sheet || sheet.getLastRow() <= 1) return;
  const data = sheet.getDataRange().getValues();

  // ── Collect all player rows + resolve Steam64 IDs ──
  const players = []; // { rowIdx, steam64 }

  for (let i = 1; i < data.length; i++) {
    // First preference: Steam64 fetched from FACEIT (col 27)
    let s64 = (data[i][C.STEAM64 - 1] || "").toString().trim();

    // Fallback: parse directly from Steam URL (col 8)
    if (!isValidSteam64(s64)) {
      const url = (data[i][C.STEAM_URL - 1] || "").toString().trim();
      s64 = resolveFromUrl(url) || "";
    }

    if (!isValidSteam64(s64)) continue;

    // Store the resolved ID back if it wasn't already there
    if ((data[i][C.STEAM64 - 1] || "").toString() !== s64) {
      sheet.getRange(i + 1, C.STEAM64).setValue(s64);
    }
    players.push({ rowIdx: i, steam64: s64 });
  }

  if (players.length === 0) {
    SpreadsheetApp.getUi().alert("No valid Steam64 IDs found. Run FACEIT refresh first.");
    return;
  }

  const allIds = players.map(p => p.steam64);

  // ── BATCH: Bans (1 call per 100 players) ──
  const banMap     = fetchBansBatch(allIds);
  // ── BATCH: Profile summaries (1 call per 100 players) ──
  const profileMap = fetchSummariesBatch(allIds);

  // ── Individual: Steam Level + CS2 Hours ──
  for (const { rowIdx, steam64 } of players) {
    const row     = rowIdx + 1;
    const ban     = banMap[steam64]     || {};
    const profile = profileMap[steam64] || {};

    // ── VAC & Game Bans ──
    const vacBanned  = ban.VACBanned  || false;
    const gameBanned = (ban.NumberOfGameBans || 0) > 0;
    const vacCell    = sheet.getRange(row, C.VAC_BAN);
    const gameCell   = sheet.getRange(row, C.GAME_BAN);

    vacCell.setValue(vacBanned  ? "BANNED ⚠" : "Clean");
    gameCell.setValue(gameBanned
      ? `BANNED (${ban.NumberOfGameBans})` : "Clean");

    if (vacBanned) vacCell.setBackground("#EA4335").setFontColor("white").setFontWeight("bold");
    else           vacCell.setBackground("#C8E6C9").setFontColor("#1B5E20");

    if (gameBanned) gameCell.setBackground("#FF6D00").setFontColor("white").setFontWeight("bold");
    else            gameCell.setBackground("#C8E6C9").setFontColor("#1B5E20");

    // ── Account Age (from profile summary) ──
    if (profile.timecreated) {
      const ageYrs = ((Date.now() - profile.timecreated * 1000) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
      sheet.getRange(row, C.STEAM_AGE).setValue(ageYrs);
    }

    // ── Steam Level ──
    try {
      const r = UrlFetchApp.fetch(
        `https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${STEAM_API_KEY}&steamid=${steam64}`,
        { muteHttpExceptions: true }
      );
      if (r.getResponseCode() === 200) {
        const lvl = JSON.parse(r.getContentText()).response?.player_level;
        if (lvl !== undefined) sheet.getRange(row, C.STEAM_LVL).setValue(lvl);
      }
    } catch(e) {}

    // ── CS2 Hours ──
    try {
      const r = UrlFetchApp.fetch(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steam64}&include_played_free_games=1&format=json`,
        { muteHttpExceptions: true }
      );
      if (r.getResponseCode() === 200) {
        const games = JSON.parse(r.getContentText()).response?.games || [];
        const cs2   = games.find(g => g.appid === CS2_APP_ID);
        sheet.getRange(row, C.CS2_HRS).setValue(cs2 ? Math.round(cs2.playtime_forever / 60) : 0);
      }
    } catch(e) {}
  }

  // Risk flags are derived from all Steam + FACEIT data, so run last
  flagAtRiskPlayers();
}

// ── BATCH HELPERS ─────────────────────────────────────────────────────────────
function fetchBansBatch(ids) {
  const map  = {};
  const key  = STEAM_API_KEY;
  const CHUNK = 100;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK).join(",");
    try {
      const r = UrlFetchApp.fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${key}&steamids=${chunk}`,
        { muteHttpExceptions: true }
      );
      if (r.getResponseCode() === 200) {
        (JSON.parse(r.getContentText()).players || []).forEach(p => map[p.SteamId] = p);
      }
    } catch(e) {}
  }
  return map;
}

function fetchSummariesBatch(ids) {
  const map  = {};
  const key  = STEAM_API_KEY;
  const CHUNK = 100;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK).join(",");
    try {
      const r = UrlFetchApp.fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${key}&steamids=${chunk}`,
        { muteHttpExceptions: true }
      );
      if (r.getResponseCode() === 200) {
        (JSON.parse(r.getContentText()).response?.players || []).forEach(p => map[p.steamid] = p);
      }
    } catch(e) {}
  }
  return map;
}

// ── TEAM ELO AVERAGE + SEED ───────────────────────────────────────────────────
function finalizeTeamStats(sheet, teamStartIdx, teamElos) {
  if (!teamElos || teamElos.length === 0) return;
  const avgElo = Math.round(teamElos.reduce((a, b) => a + b, 0) / teamElos.length);

  const SEEDS = [
    { max: 800,      label: "IRON",     bg: "#607D8B", fg: "#fff" },
    { max: 1200,     label: "BRONZE",   bg: "#A0522D", fg: "#fff" },
    { max: 1600,     label: "SILVER",   bg: "#9E9E9E", fg: "#fff" },
    { max: 2000,     label: "GOLD",     bg: "#FFC107", fg: "#333" },
    { max: 2400,     label: "PLATINUM", bg: "#00ACC1", fg: "#fff" },
    { max: 2800,     label: "DIAMOND",  bg: "#7B1FA2", fg: "#fff" },
    { max: Infinity, label: "ELITE",    bg: "#E91E63", fg: "#fff" },
  ];
  const seed    = SEEDS.find(s => avgElo <= s.max);
  const teamRow = teamStartIdx + 1; // 1-based row of first player in this team

  sheet.getRange(teamRow, C.AVG_ELO).setValue(avgElo);
  sheet.getRange(teamRow, C.SEED)
       .setValue(seed.label)
       .setBackground(seed.bg)
       .setFontColor(seed.fg)
       .setFontWeight("bold")
       .setHorizontalAlignment("center");
}

// ── RISK FLAG ENGINE ──────────────────────────────────────────────────────────
// Checks all five conditions per player; flags the TEAM if any player trips one.
// Conditions: VAC ban, game ban, <50 CS2 hours, account <6 months old, <10 FACEIT matches.
function flagAtRiskPlayers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  if (!sheet || sheet.getLastRow() <= 1) return;
  const data = sheet.getDataRange().getValues();

  let teamStartRow = 1, flags = [];

  function applyFlag(startRow, reasons) {
    const unique = [...new Set(reasons)];
    const cell   = sheet.getRange(startRow + 1, C.RISK_FLAG);
    if (unique.length > 0) {
      cell.setValue("⚠ " + unique.slice(0, 4).join(" | "))
          .setBackground("#EA4335").setFontColor("white").setFontWeight("bold");
    } else {
      cell.setValue("✅ OK")
          .setBackground("#34A853").setFontColor("white").setFontWeight("bold");
    }
  }

  for (let i = 1; i < data.length; i++) {
    const sn = data[i][C.SN - 1];
    if (sn !== "" && i !== 1) {
      applyFlag(teamStartRow, flags);
      teamStartRow = i;
      flags = [];
    }

    const vac     = (data[i][C.VAC_BAN  - 1] || "").toString();
    const gameBan = (data[i][C.GAME_BAN  - 1] || "").toString();
    const cs2hrs  = parseFloat(data[i][C.CS2_HRS  - 1]) || 0;
    const acctAge = parseFloat(data[i][C.STEAM_AGE - 1]) || 0;
    const matches = parseInt(data[i][C.MATCHES - 1])     || 0;

    if (vac.includes("BANNED"))     flags.push("VAC");
    if (gameBan.includes("BANNED")) flags.push("GameBan");
    if (cs2hrs > 0  && cs2hrs  < 50)  flags.push("LowCS2Hrs");
    if (acctAge > 0 && acctAge < 0.5) flags.push("NewAcct");
    if (matches > 0 && matches < 10)  flags.push("FewMatches");

    // Also highlight the individual player row name cell if directly flagged
    if (vac.includes("BANNED") || gameBan.includes("BANNED")) {
      sheet.getRange(i + 1, C.PLAYER_NAME).setBackground("#FFCDD2");
    }
  }
  applyFlag(teamStartRow, flags); // finalize last team
}

// ── SUMMARY SHEET ─────────────────────────────────────────────────────────────
function buildSummarySheet() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  let sum    = ss.getSheetByName("📊 Summary");
  if (!sum) sum = ss.insertSheet("📊 Summary");
  sum.clearContents().clearFormats();
  [1, 2].forEach(c => sum.setColumnWidth(c, c === 1 ? 220 : 140));

  const sheet = ss.getSheetByName("Sheet1");
  if (!sheet) return;
  const data  = sheet.getDataRange().getValues();

  let teams = 0, vacBans = 0, gameBans = 0, riskTeams = 0, eloSum = 0, eloN = 0;
  const seeds = {}, regions = {}, countries = new Set();

  for (let i = 1; i < data.length; i++) {
    const sn = data[i][C.SN - 1];
    if (sn && sn.toString().startsWith("TEAM")) {
      teams++;
      const seed   = (data[i][C.SEED      - 1] || "TBD").toString();
      const region = (data[i][C.REGION    - 1] || "?").toString();
      const avg    = parseFloat(data[i][C.AVG_ELO - 1]);
      const risk   = (data[i][C.RISK_FLAG - 1] || "").toString();
      seeds[seed]     = (seeds[seed]     || 0) + 1;
      regions[region] = (regions[region] || 0) + 1;
      if (!isNaN(avg)) { eloSum += avg; eloN++; }
      if (risk.includes("⚠")) riskTeams++;
    }
    if ((data[i][C.VAC_BAN  - 1] || "").toString().includes("BANNED")) vacBans++;
    if ((data[i][C.GAME_BAN - 1] || "").toString().includes("BANNED")) gameBans++;
    const cc = (data[i][C.COUNTRY - 1] || "").toString();
    if (cc && cc !== "—" && cc.length > 0) countries.add(cc);
  }

  const avgElo = eloN > 0 ? Math.round(eloSum / eloN) : "—";

  const rows = [
    ["⚡ PIXEL PALACE — Tournament Intel", ""],
    ["Tournament", TARGET_TOURNAMENT],
    ["", ""],
    ["── OVERVIEW ──", ""],
    ["Total Teams", teams],
    ["Avg Team ELO", avgElo],
    ["Unique Countries", countries.size],
    ["Teams Flagged for Review", riskTeams],
    ["VAC Banned Players", vacBans],
    ["Game Banned Players", gameBans],
    ["", ""],
    ["── SEED DISTRIBUTION ──", ""],
    ...Object.entries(seeds).sort((a, b) => {
      const order = ["IRON","BRONZE","SILVER","GOLD","PLATINUM","DIAMOND","ELITE","TBD"];
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    }).map(([k, v]) => [k, v]),
    ["", ""],
    ["── REGION BREAKDOWN ──", ""],
    ...Object.entries(regions).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
    ["", ""],
    ["── COUNTRIES REPRESENTED ──", ""],
    [[...countries].sort().join(", "), ""],
  ];

  sum.getRange(1, 1, rows.length, 2).setValues(rows);

  // Styling
  sum.getRange(1, 1, 1, 2).merge()
     .setFontWeight("bold").setFontSize(13)
     .setBackground("#1D4ED8").setFontColor("white").setHorizontalAlignment("center");

  [4, 12, 16, 20].forEach(r => {
    if (rows[r - 1] && rows[r - 1][0].startsWith("──")) {
      sum.getRange(r, 1, 1, 2).merge()
         .setFontWeight("bold").setBackground("#E8EAED").setFontColor("#444");
    }
  });

  if (vacBans > 0) {
    const vRow = rows.findIndex(r => r[0] === "VAC Banned Players") + 1;
    sum.getRange(vRow, 2).setBackground("#FFCDD2").setFontWeight("bold").setFontColor("#B71C1C");
  }
  if (riskTeams > 0) {
    const rRow = rows.findIndex(r => r[0] === "Teams Flagged for Review") + 1;
    sum.getRange(rRow, 2).setBackground("#FFE0B2").setFontWeight("bold");
  }
}

// ── UTILITY FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Resolve a Steam64 ID from a community URL.
 * Handles /profiles/STEAMID64 and /id/vanityname formats.
 * NOTE: In v3 we primarily get Steam64 from FACEIT API directly.
 * This is only a fallback for players where FACEIT fetch failed.
 */
function resolveFromUrl(url) {
  if (!url || url === "N
<truncated 3315 bytes>

NOTE: The output was truncated because it was too long. Use a more targeted query or a smaller range to get the information you need.