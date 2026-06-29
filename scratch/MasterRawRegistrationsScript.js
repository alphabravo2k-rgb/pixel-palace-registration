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
  const ADMIN_SHEET_ID = "1_B_ovDmGuA1rAityrgAz_G3csBtLl4OFfwJUMWXXe_E";
  try {
    const adminDoc = SpreadsheetApp.openById(ADMIN_SHEET_ID);
    const adminSheet = adminDoc.getSheetByName("Admin_Ops") || adminDoc.getSheets()[0];
    
    const adminData = adminSheet.getDataRange().getValues();
    const existingTeams = new Set();
    for (let i = 1; i < adminData.length; i++) {
      if (adminData[i][1]) existingTeams.add(adminData[i][1].toString().toLowerCase().trim());
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
    for (let p = 1; p <= 7; p++) {
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
    let seed = averageElo <= 1200 ? "LOW" : averageElo <= 1800 ? "MID" : averageElo <= 2200 ? "NORMAL" : averageElo <= 2500 ? "AVG" : averageElo <= 3000 ? "GOOD" : "BEST";

    for (let p = 0; p < 7; p++) {
      const pNum = p + 1;
      const discord = payload[`p${pNum}Discord`] || "N/A";
      const steam = payload[`p${pNum}Steam`] || "N/A";
      const faceit = payload[`p${pNum}Faceit`] || "N/A";
      
      const pRole = p === 0 ? " ©" : (p >= 5 ? " (Sub)" : "");
      const pName = faceit !== "N/A" ? faceit.split('/').filter(Boolean).pop() + pRole : discord + pRole;
      
      rowsToAppend.push([
        p === 0 ? sn : "",                 // Col A: S.N
        p === 0 ? teamName : "",           // Col B: Team Name
        p === 0 ? teamTag : "",            // Col C: Team Tag
        p === 0 ? logoUrl : "",            // Col D: Team Logo Url
        p === 0 ? region : "",             // Col E: Region
        pName,                             // Col F: Player Name
        discord,                           // Col G: Discord ID
        steam,                             // Col H: Steam Profile
        "",                                // Col I: Joined Discord
        "",                                // Col J: Role Issued
        "",                                // Col K: VC Created
        faceit,                            // Col L: Faceit Profile
        payload[`p${pNum}FaceitElo`] || "N/A", // Col M: Live FACE IT ELO
        p === 0 ? averageElo : "",         // Col N: AVERAGE ELO
        p === 0 ? "PENDING" : "",          // Col O: Registration status
        p === 0 ? seed : "",               // Col P: Team Seed
        ""                                 // Col Q: Admin Remarks
      ]);
    }
    
    adminSheet.getRange(startRowIndex, 1, 7, 17).setValues(rowsToAppend);
    [1, 2, 3, 4, 5, 14, 15, 16, 17].forEach(col => {
       adminSheet.getRange(startRowIndex, col, 7, 1).merge().setVerticalAlignment("middle").setHorizontalAlignment("center");
    });
    
    const seedRange = adminSheet.getRange(startRowIndex, 16);
    seedRange.setBackground(seed==="LOW"?"#d9d9d9":seed==="MID"?"#b6d7a8":seed==="NORMAL"?"#ffe599":seed==="AVG"?"#f9cb9c":seed==="GOOD"?"#00ffff":"#ff00ff")
             .setFontWeight("bold");
             
  } catch (err) {
    console.error("Failed to append to admin sheet:", err);
  }
}

/**
 * Real-time status sync back to Admin Operations Sheet
 */
function syncStatusToAdmin(teamName, newStatus) {
  const ADMIN_SHEET_ID = "1_B_ovDmGuA1rAityrgAz_G3csBtLl4OFfwJUMWXXe_E";
  try {
    const adminDoc = SpreadsheetApp.openById(ADMIN_SHEET_ID);
    const adminSheet = adminDoc.getSheetByName("Admin_Ops") || adminDoc.getSheets()[0];
    const data = adminSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const existingTeamName = data[i][1] ? data[i][1].toString().trim() : ""; // Col B (index 1) is Team Name
      if (existingTeamName.toLowerCase() === teamName.toLowerCase()) {
        const currentStatus = data[i][14] ? data[i][14].toString().trim() : ""; // Col O (index 14) is Status
        if (currentStatus.toUpperCase() !== newStatus.toUpperCase()) {
          adminSheet.getRange(i + 1, 15).setValue(newStatus); // Col O is Column 15
        }
        break;
      }
    }
  } catch (err) {
    console.error("Failed to sync status to Admin:", err);
  }
}
