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
const LOGO_FOLDER_ID = "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE";

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
          const status = data[i][4];
          if (status !== "APPROVED" && status !== "PENDING") continue;

          const roster = [];
          for (let p = 1; p <= 7; p++) {
            const offset = 9 + (p - 1) * 4;
            if (offset >= data[i].length) break;

            const discord = data[i][offset] ? data[i][offset].toString().trim() : "";
            const steam = data[i][offset + 1] ? data[i][offset + 1].toString().trim() : "";
            const faceit = data[i][offset + 2] ? data[i][offset + 2].toString().trim() : "";
            const rank = data[i][offset + 3] ? data[i][offset + 3].toString().trim() : "";

            if (discord || steam || faceit) {
              roster.push({
                role: p === 1 ? "Captain" : p >= 6 ? "Substitute" : "Member",
                discord: discord,
                ign: steam || discord.split('#')[0] || ("Player " + p),
                faceitLevel: rank || "N/A",
                faceitElo: "N/A"
              });
            }
          }

          teams.push({
            name: data[i][5] || "Unnamed Team",
            tag: data[i][6] || "TEAM",
            logo: data[i][8] || "",
            status: status === "APPROVED" ? "VERIFIED" : "PENDING REVIEW",
            region: data[i][7] || "PAK / ME",
            roster: roster
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
