/**
 * PIXEL PALACE PORTAL BACKEND — GOOGLE APPS SCRIPT v3.0
 *
 * INSTRUCTIONS:
 * 1. Open your Google Spreadsheet (e.g. Master Registration Sheet).
 * 2. Click Extensions > Apps Script.
 * 3. Delete any default code and paste this script.
 * 4. Create the following sheet tabs in your spreadsheet if they don't exist:
 *    - "InviteCodes" (Columns: Code, TournamentId, Used)
 *    - "BannedPlayers" (Column A: Steam64 ID)
 * 5. Run the `setupAdminSheet()` function once (select it from the toolbar and click Run).
 *    This will create the "Admin_Dashboard" sheet tab with layout, stats, and query formulas.
 * 6. Click "Deploy" > "New deployment" > "Web app". Set "Execute as" to "Me", "Who has access" to "Anyone".
 * 7. Copy the Web App URL and paste it into `sheetsEndpoint` in your `src/config/tournaments.js`.
 */

// Simple Authentication Token (Matches VITE_GATEWAY_AUTH_SECRET if set)
const ADMIN_SECRET = ""; 

function doPost(e) {
  try {
    const jsonString = e.postData.contents;
    const data = JSON.parse(jsonString);

    // Optional auth check
    if (ADMIN_SECRET && data._gateway_secret !== ADMIN_SECRET) {
      return jsonResponse({ error: "Unauthorized: Invalid gateway secret." }, 401);
    }

    const tournamentId = data.tournament_id || "community-cup-2";
    const sheetName = "Registrations_" + tournamentId;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    // Auto-create registration tab if it doesn't exist
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
        "P6 Role", "P6 ID", "P6 IGN", "P6 Discord", "P6 Steam", "P6 Steam64", "P6 Faceit", "P6 Faceit Lvl", "P6 Faceit Elo", "P6 CS2 Rank", "P6 Avatar", // Sub 1
        "P7 Role", "P7 ID", "P7 IGN", "P7 Discord", "P7 Steam", "P7 Steam64", "P7 Faceit", "P7 Faceit Lvl", "P7 Faceit Elo", "P7 CS2 Rank", "P7 Avatar"  // Sub 2
      ];
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }

    // Read existing registrations to check duplicates & assign Team ID
    const rows = sheet.getDataRange().getValues();
    
    // --- 1. Duplicate Verification at the Gate ---
    const newTeamName = data.team_name.trim().toUpperCase();
    const newSteam64s = [];
    const newFaceitUrls = [];
    
    // Extract player identifiers from post body
    for (let p = 1; p <= 7; p++) {
      const steam64 = data[`p${p}Steam64`];
      const faceit = data[`p${p}Faceit`];
      if (steam64) newSteam64s.push(String(steam64).trim());
      if (faceit) newFaceitUrls.push(String(faceit).trim().toLowerCase());
    }

    // Check against existing rows (row index 1 onwards, since index 0 is header)
    for (let i = 1; i < rows.length; i++) {
      const existingStatus = rows[i][3]; // Column D
      if (existingStatus === "REJECTED") continue; // Ignore rejected entries

      // Check duplicate Team Name
      const existingTeamName = String(rows[i][4]).trim().toUpperCase(); // Column E
      if (existingTeamName === newTeamName) {
        return jsonResponse({ error: "DUPLICATE_TEAM_NAME: A team named '" + data.team_name + "' is already registered." });
      }

      // Check player columns (J onwards)
      // J = index 9. Let's scan all cells in the row for matching steam64 or faceit
      for (let c = 12; c < rows[i].length; c++) {
        const cellVal = String(rows[i][c]).trim();
        if (!cellVal) continue;

        // Check Steam64 duplicate
        if (newSteam64s.indexOf(cellVal) !== -1) {
          return jsonResponse({ error: "DUPLICATE_PLAYER_STEAM: One of your players (Steam64: " + cellVal + ") is already registered in another team." });
        }

        // Check FACEIT duplicate
        const cleanCellVal = cellVal.toLowerCase();
        if (newFaceitUrls.indexOf(cleanCellVal) !== -1) {
          return jsonResponse({ error: "DUPLICATE_PLAYER_FACEIT: One of your players (FACEIT Profile: " + cellVal + ") is already registered in another team." });
        }
      }
    }

    // --- 2. Live Slot Calculation & Gatekeeper ---
    const slotStats = getSlotCounts(tournamentId);
    const isInvite = !!data.invite_code;
    
    if (isInvite) {
      const inviteValid = checkInviteCode(tournamentId, data.invite_code, true);
      if (!inviteValid) {
        return jsonResponse({ error: "INVALID_INVITE_CODE: The invite code is invalid, expired, or has already been used." });
      }
      if (slotStats.inviteConfirmed >= 6) {
        return jsonResponse({ error: "INVITE_SLOTS_FULL: All 6 invite slots are filled." });
      }
    } else {
      if (slotStats.openConfirmed >= 26) {
        return jsonResponse({ error: "OPEN_SLOTS_FULL: All 26 normal open registration slots are filled." });
      }
    }

    if (slotStats.inviteConfirmed + slotStats.openConfirmed >= 32) {
      return jsonResponse({ error: "TOURNAMENT_FULL: The tournament is completely full (32/32 teams)." });
    }

    // --- 3. Compute Averages & Roster Size ---
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

    // --- 4. Assign Sequential Team ID ---
    const nextSerial = rows.length; // Row count acts as serial (headers are row 1)
    const teamId = "PP-CC2-" + String(nextSerial).padStart(3, '0');

    // Build the row array matching the new headers
    const row = [
      teamId,
      data.submission_id,
      data.submitted_at || new Date().toISOString(),
      "PENDING", // Status defaults to PENDING (Approved / Pending / Rejected)
      data.team_name,
      data.team_tag,
      data.region,
      data.logo_url,
      data.invite_code || "",
      data.sub_included ? "TRUE" : "FALSE",
      averageElo,
      rosterSize,
      
      // P1 (Captain)
      data.p1Role || "CAPTAIN", data.p1Id || "", data.p1IGN || "", data.p1Discord || "", data.p1Steam || "", data.p1Steam64 || "", data.p1Faceit || "", data.p1FaceitLevel || "N/A", data.p1FaceitElo || "N/A", data.p1CS2Rank || "Not Linked", data.p1Avatar || "", data.p1WalletAddress || "",
      // P2
      data.p2Role || "STARTER", data.p2Id || "", data.p2IGN || "", data.p2Discord || "", data.p2Steam || "", data.p2Steam64 || "", data.p2Faceit || "", data.p2FaceitLevel || "N/A", data.p2FaceitElo || "N/A", data.p2CS2Rank || "Not Linked", data.p2Avatar || "",
      // P3
      data.p3Role || "STARTER", data.p3Id || "", data.p3IGN || "", data.p3Discord || "", data.p3Steam || "", data.p3Steam64 || "", data.p3Faceit || "", data.p3FaceitLevel || "N/A", data.p3FaceitElo || "N/A", data.p3CS2Rank || "Not Linked", data.p3Avatar || "",
      // P4
      data.p4Role || "STARTER", data.p4Id || "", data.p4IGN || "", data.p4Discord || "", data.p4Steam || "", data.p4Steam64 || "", data.p4Faceit || "", data.p4FaceitLevel || "N/A", data.p4FaceitElo || "N/A", data.p4CS2Rank || "Not Linked", data.p4Avatar || "",
      // P5
      data.p5Role || "STARTER", data.p5Id || "", data.p5IGN || "", data.p5Discord || "", data.p5Steam || "", data.p5Steam64 || "", data.p5Faceit || "", data.p5FaceitLevel || "N/A", data.p5FaceitElo || "N/A", data.p5CS2Rank || "Not Linked", data.p5Avatar || "",
      // P6 (Sub 1)
      data.p6Role || "", data.p6Id || "", data.p6IGN || "", data.p6Discord || "", data.p6Steam || "", data.p6Steam64 || "", data.p6Faceit || "", data.p6FaceitLevel || "", data.p6FaceitElo || "", data.p6CS2Rank || "", data.p6Avatar || "",
      // P7 (Sub 2)
      data.p7Role || "", data.p7Id || "", data.p7IGN || "", data.p7Discord || "", data.p7Steam || "", data.p7Steam64 || "", data.p7Faceit || "", data.p7FaceitLevel || "", data.p7FaceitElo || "", data.p7CS2Rank || "", data.p7Avatar || ""
    ];

    sheet.appendRow(row);

    // Auto-update stats and execute audit checks
    updateDashboardStats();
    runValidationChecks(tournamentId);

    return jsonResponse({ success: true, submissionId: data.submission_id, teamId: teamId });

  } catch (err) {
    return jsonResponse({ error: "SYSTEM_ERROR: " + err.toString() }, 500);
  }
}

function doGet(e) {
  try {
    const params = e.parameter;
    const tournamentId = params.tournamentId || "community-cup-2";

    // 1. Validate Invite Code
    if (params.validateCode) {
      const isValid = checkInviteCode(tournamentId, params.validateCode, false);
      return jsonResponse({ valid: isValid });
    }

    // 2. Fetch Live Slot Counters
    if (params.action === "getSlots") {
      const counts = getSlotCounts(tournamentId);
      return jsonResponse(counts);
    }

    // 3. Fetch Registered Team Roster
    if (params.action === "getTeams") {
      const teams = getRegisteredTeams(tournamentId);
      return jsonResponse({ teams: teams });
    }

    // 4. Soft Ban Check
    if (params.action === "checkBans") {
      const steamIds = (params.steamIds || "").split(",");
      const hasBans = checkPlayerBans(steamIds);
      return jsonResponse({ hasBans: hasBans });
    }

    return jsonResponse({ error: "Invalid action parameter." }, 400);

  } catch (err) {
    return jsonResponse({ error: "SYSTEM_ERROR: " + err.toString() }, 500);
  }
}

// --- HELPER FUNCTIONS ---

function jsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Counts normal vs invite-based teams registered for a tournament
 */
function getSlotCounts(tournamentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Registrations_" + tournamentId);
  if (!sheet) {
    return { inviteConfirmed: 0, openConfirmed: 0, isFull: false };
  }

  const rows = sheet.getDataRange().getValues();
  let inviteConfirmed = 0;
  let openConfirmed = 0;

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const inviteCode = rows[i][8]; // Column I (Invite Code)
    const status = rows[i][3];     // Column D (Status)
    
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

/**
 * Validates and optionally consumes an invite code
 */
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
        return false; // Code already used
      }
      
      if (consume) {
        sheet.getRange(i + 1, 3).setValue("TRUE"); // Mark as used
      }
      return true;
    }
  }

  return false;
}

/**
 * Returns clean team/player list for the UI tracker tab
 */
function getRegisteredTeams(tournamentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Registrations_" + tournamentId);
  if (!sheet) return [];

  const rows = sheet.getDataRange().getValues();
  const teams = [];

  for (let i = 1; i < rows.length; i++) {
    const status = rows[i][3]; // Column D (Status)
    if (status !== "APPROVED" && status !== "PENDING") continue;

    const team = {
      name: rows[i][4], // Column E (Team Name)
      tag: rows[i][5],  // Column F (Team Tag)
      logo: rows[i][7], // Column H (Logo URL)
      status: status === "APPROVED" ? "VERIFIED" : "PENDING REVIEW",
      averageElo: parseInt(rows[i][10]) || 0, // Column K (Average Elo)
      roster: []
    };

    // Parse Roster Players: P1 to P7
    // Roster start column is index 12 (Column M)
    // P1: M to X (12 columns)
    // P2 to P7: Y onwards (11 columns each)
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

/**
 * Check a list of steam IDs against BannedPlayers tab
 */
function checkPlayerBans(steamIds) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("BannedPlayers");
  if (!sheet || steamIds.length === 0) return false;

  const bannedIds = sheet.getDataRange().getValues().map(row => String(row[0]).trim());
  
  for (let i = 0; i < steamIds.length; i++) {
    const id = String(steamIds[i]).trim();
    if (id && bannedIds.indexOf(id) !== -1) {
      return true; // Found a banned player ID
    }
  }

  return false;
}

/**
 * Triggered on edits to check approvals / rejections and update dashboard
 */
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  
  if (sheetName.startsWith("Registrations_")) {
    if (range.getColumn() === 4) { // Column D (Status)
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

// --- AUDIT & OPERATIONS VALIDATION ENGINE ---

function runValidationChecks(tournamentId = "community-cup-2") {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const regsSheet = ss.getSheetByName("Registrations_" + tournamentId);
  const adminSheet = ss.getSheetByName("Admin_Dashboard");
  
  if (!regsSheet || !adminSheet) return;

  const regData = regsSheet.getDataRange().getValues();
  const lastAdminRow = adminSheet.getLastRow();
  if (lastAdminRow < 13) return; // No registrations populated yet

  const validationRange = adminSheet.getRange(13, 12, lastAdminRow - 12, 1);
  const validationValues = [];

  const teamNamesCount = {};
  const steamIdsCount = {};
  const faceitUrlsCount = {};

  // 1. Build lookup tables for duplicates across all active (non-rejected) applications
  for (let i = 1; i < regData.length; i++) {
    const status = regData[i][3]; // Column D
    if (status === "REJECTED") continue;

    const teamName = String(regData[i][4]).trim().toUpperCase(); // Column E
    if (teamName) {
      teamNamesCount[teamName] = (teamNamesCount[teamName] || 0) + 1;
    }

    // Scan all player cells in current row (Steam64 at offset + 5, FACEIT at offset + 6)
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

  // 2. Scan dashboard rows and audit team integrity
  const dashboardTeams = adminSheet.getRange(13, 1, lastAdminRow - 12, 11).getValues();

  for (let r = 0; r < dashboardTeams.length; r++) {
    const teamId = dashboardTeams[r][0];
    const teamName = String(dashboardTeams[r][2]).trim().toUpperCase();
    const rosterSize = parseInt(dashboardTeams[r][6]) || 0;
    const logoUrl = String(dashboardTeams[r][9]).trim();
    
    // Find matching record index
    let idx = -1;
    for (let i = 1; i < regData.length; i++) {
      if (regData[i][0] === teamId) {
        idx = i;
        break;
      }
    }

    const errors = [];

    if (idx !== -1) {
      // Check duplicate Team Name
      if (teamNamesCount[teamName] > 1) {
        errors.push("Duplicate Team Name");
      }

      // Check missing logo
      if (!logoUrl || logoUrl === "" || logoUrl.includes("placeholder")) {
        errors.push("Missing Team Logo");
      }

      // Check roster size limits (Esports grade: Min 5 core players)
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

        // Core Roster validation
        if (p < 5) {
          if (!ign || !discord || !steam || !steam64 || !faceit) {
            hasMissingInfo = true;
          }
        }

        // Duplicate checks
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

// --- ADMIN MANAGEMENT SHEET SETUP ---

function setupAdminSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let adminSheet = ss.getSheetByName("Admin_Dashboard");
  
  if (!adminSheet) {
    adminSheet = ss.insertSheet("Admin_Dashboard", 0);
  } else {
    adminSheet.clear();
  }
  
  adminSheet.setHideGridlines(false);
  
  // Apply Dashboard Titles & Theme
  adminSheet.getRange("A1:L1").merge().setValue("PIXEL PALACE - TOURNAMENT CONTROL HUB").setFontWeight("bold").setFontSize(16).setBackground("#0b0f19").setFontColor("#00f0ff").setHorizontalAlignment("center");
  adminSheet.setRowHeight(1, 40);
  
  // SECTION 1: TOURNAMENT DETAILS
  adminSheet.getRange("A3").setValue("TOURNAMENT INFO").setFontWeight("bold").setBackground("#131a26").setFontColor("#ffffff");
  adminSheet.getRange("A4").setValue("Tournament Name");
  adminSheet.getRange("B4").setValue("Pixel Palace Community Cup 2");
  adminSheet.getRange("A5").setValue("Game / Format");
  adminSheet.getRange("B5").setValue("CS2 5v5 (Akros Anti-Cheat)");
  adminSheet.getRange("A6").setValue("Registration Deadline");
  adminSheet.getRange("B6").setValue("2026-07-26");
  adminSheet.getRange("A7").setValue("Tournament Dates");
  adminSheet.getRange("B7").setValue("July 31 – August 03, 2026");
  adminSheet.getRange("A8").setValue("Prize Pool");
  adminSheet.getRange("B8").setValue("1st: $2000 | 2nd: $750");

  // SECTION 2: LIVE METRICS DASHBOARD
  adminSheet.getRange("D3:E3").merge().setValue("REGISTRATION STATS").setFontWeight("bold").setBackground("#131a26").setFontColor("#ffffff");
  adminSheet.getRange("D4").setValue("Total Applications");
  adminSheet.getRange("E4").setFormula("=COUNTA(Registrations_community-cup-2!A:A)-1");
  adminSheet.getRange("D5").setValue("Approved Teams");
  adminSheet.getRange("E5").setFormula('=COUNTIF(Registrations_community-cup-2!D:D, "APPROVED")');
  adminSheet.getRange("D6").setValue("Pending Teams");
  adminSheet.getRange("E6").setFormula('=COUNTIF(Registrations_community-cup-2!D:D, "PENDING")');
  adminSheet.getRange("D7").setValue("Rejected Teams");
  adminSheet.getRange("E7").setFormula('=COUNTIF(Registrations_community-cup-2!D:D, "REJECTED")');

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

  // SECTION 3: TEAM MANAGEMENT LISTING
  adminSheet.getRange("A11:L11").merge().setValue("TEAM MANAGEMENT LISTING").setFontWeight("bold").setFontSize(12).setBackground("#0b0f19").setFontColor("#00f0ff").setHorizontalAlignment("left");
  
  const headers = [
    "Team ID", "Submitted At", "Team Name", "Tag", "Region", "Captain IGN", "Roster Size", "Avg ELO", "Invite Code", "Logo Link", "Status", "Validation Check"
  ];
  
  const headerRange = adminSheet.getRange(12, 1, 1, headers.length);
  headerRange.setValues([headers]).setFontWeight("bold").setBackground("#131a26").setFontColor("#ffffff").setHorizontalAlignment("center");
  
  // Dynamically populate Team List using a QUERY formula
  adminSheet.getRange(13, 1).setFormula(
    `=IFERROR(QUERY(Registrations_community-cup-2!A:K, "SELECT A, C, E, F, G, M, L, K, I, H, D WHERE A IS NOT NULL", 1), "No registrations recorded.")`
  );

  adminSheet.autoResizeColumns(1, headers.length);
  applyFormattingRules(adminSheet);
  
  // Run initial checks if registrations are already populated
  runValidationChecks("community-cup-2");
}

function applyFormattingRules(sheet) {
  // APPROVED formatting -> Green
  let approvedRule = SpreadsheetApp.newConditionalFormattingRule()
    .whenTextEqualTo("APPROVED")
    .setBackground("#d4edda")
    .setFontColor("#155724")
    .setRanges([sheet.getRange("K13:K100")])
    .build();

  // PENDING formatting -> Yellow
  let pendingRule = SpreadsheetApp.newConditionalFormattingRule()
    .whenTextEqualTo("PENDING")
    .setBackground("#fff3cd")
    .setFontColor("#856404")
    .setRanges([sheet.getRange("K13:K100")])
    .build();

  // REJECTED formatting -> Red
  let rejectedRule = SpreadsheetApp.newConditionalFormattingRule()
    .whenTextEqualTo("REJECTED")
    .setBackground("#f8d7da")
    .setFontColor("#721c24")
    .setRanges([sheet.getRange("K13:K100")])
    .build();

  // Validation Warnings -> Red warning background
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
