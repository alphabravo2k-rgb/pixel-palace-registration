/**
 * PIXEL PALACE PORTAL BACKEND — GOOGLE APPS SCRIPT
 *
 * INSTRUCTIONS:
 * 1. Open your Google Spreadsheet (e.g. Master Registration Sheet).
 * 2. Click Extensions > Apps Script.
 * 3. Delete any default code and paste this script.
 * 4. Create the following sheet tabs in your spreadsheet if they don't exist:
 *    - "InviteCodes" (Columns: Code, TournamentId, Used)
 *    - "BannedPlayers" (Column A: Steam64 ID)
 *    - "Registrations_community-cup-2" (Or let the script auto-generate it on first submission)
 * 5. Click "Deploy" > "New deployment".
 * 6. Select "Web app". Set "Execute as" to "Me", and "Who has access" to "Anyone".
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

    const tournamentId = data.tournament_id || "unknown";
    const sheetName = "Registrations_" + tournamentId;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    // Auto-create registration tab if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Create headers
      const headers = [
        "Submission ID", "Submitted At", "Status", "Team Name", "Team Tag", 
        "Region", "Logo URL", "Invite Code", "Sub Included",
        "P1 Role", "P1 ID", "P1 IGN", "P1 Discord", "P1 Steam", "P1 Steam64", "P1 Faceit", "P1 Faceit Lvl", "P1 Faceit Elo", "P1 CS2 Rank", "P1 Wallet Address",
        "P2 Role", "P2 ID", "P2 IGN", "P2 Discord", "P2 Steam", "P2 Steam64", "P2 Faceit", "P2 Faceit Lvl", "P2 Faceit Elo", "P2 CS2 Rank",
        "P3 Role", "P3 ID", "P3 IGN", "P3 Discord", "P3 Steam", "P3 Steam64", "P3 Faceit", "P3 Faceit Lvl", "P3 Faceit Elo", "P3 CS2 Rank",
        "P4 Role", "P4 ID", "P4 IGN", "P4 Discord", "P4 Steam", "P4 Steam64", "P4 Faceit", "P4 Faceit Lvl", "P4 Faceit Elo", "P4 CS2 Rank",
        "P5 Role", "P5 ID", "P5 IGN", "P5 Discord", "P5 Steam", "P5 Steam64", "P5 Faceit", "P5 Faceit Lvl", "P5 Faceit Elo", "P5 CS2 Rank",
        "P6 Role", "P6 ID", "P6 IGN", "P6 Discord", "P6 Steam", "P6 Steam64", "P6 Faceit", "P6 Faceit Lvl", "P6 Faceit Elo", "P6 CS2 Rank", // Sub 1
        "P7 Role", "P7 ID", "P7 IGN", "P7 Discord", "P7 Steam", "P7 Steam64", "P7 Faceit", "P7 Faceit Lvl", "P7 Faceit Elo", "P7 CS2 Rank"  // Sub 2
      ];
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }

    // Check if tournament is full (slot limits)
    // Limits: Max 32 (26 Open + 6 Invite-based)
    const slotStats = getSlotCounts(tournamentId);
    const isInvite = !!data.invite_code;
    
    if (isInvite) {
      // Validate invite code
      const inviteValid = checkInviteCode(tournamentId, data.invite_code, true);
      if (!inviteValid) {
        return jsonResponse({ error: "INVALID_INVITE_CODE: The invite code is invalid or has already been used." });
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

    // Build the row array matching the headers
    const row = [
      data.submission_id,
      data.submitted_at || new Date().toISOString(),
      data.status || "VERIFIED",
      data.team_name,
      data.team_tag,
      data.region,
      data.logo_url,
      data.invite_code || "",
      data.sub_included ? "TRUE" : "FALSE",
      
      // P1 (Captain)
      data.p1Role || "CAPTAIN", data.p1Id || "", data.p1IGN || "", data.p1Discord || "", data.p1Steam || "", data.p1Steam64 || "", data.p1Faceit || "", data.p1FaceitLevel || "N/A", data.p1FaceitElo || "N/A", data.p1CS2Rank || "Not Linked", data.p1WalletAddress || "",
      // P2
      data.p2Role || "STARTER", data.p2Id || "", data.p2IGN || "", data.p2Discord || "", data.p2Steam || "", data.p2Steam64 || "", data.p2Faceit || "", data.p2FaceitLevel || "N/A", data.p2FaceitElo || "N/A", data.p2CS2Rank || "Not Linked",
      // P3
      data.p3Role || "STARTER", data.p3Id || "", data.p3IGN || "", data.p3Discord || "", data.p3Steam || "", data.p3Steam64 || "", data.p3Faceit || "", data.p3FaceitLevel || "N/A", data.p3FaceitElo || "N/A", data.p3CS2Rank || "Not Linked",
      // P4
      data.p4Role || "STARTER", data.p4Id || "", data.p4IGN || "", data.p4Discord || "", data.p4Steam || "", data.p4Steam64 || "", data.p4Faceit || "", data.p4FaceitLevel || "N/A", data.p4FaceitElo || "N/A", data.p4CS2Rank || "Not Linked",
      // P5
      data.p5Role || "STARTER", data.p5Id || "", data.p5IGN || "", data.p5Discord || "", data.p5Steam || "", data.p5Steam64 || "", data.p5Faceit || "", data.p5FaceitLevel || "N/A", data.p5FaceitElo || "N/A", data.p5CS2Rank || "Not Linked",
      // P6 (Sub 1)
      data.p6Role || "", data.p6Id || "", data.p6IGN || "", data.p6Discord || "", data.p6Steam || "", data.p6Steam64 || "", data.p6Faceit || "", data.p6FaceitLevel || "", data.p6FaceitElo || "", data.p6CS2Rank || "",
      // P7 (Sub 2)
      data.p7Role || "", data.p7Id || "", data.p7IGN || "", data.p7Discord || "", data.p7Steam || "", data.p7Steam64 || "", data.p7Faceit || "", data.p7FaceitLevel || "", data.p7FaceitElo || "", data.p7CS2Rank || ""
    ];

    sheet.appendRow(row);

    return jsonResponse({ success: true, submissionId: data.submission_id });

  } catch (err) {
    return jsonResponse({ error: "SYSTEM_ERROR: " + err.toString() }, 500);
  }
}

function doGet(e) {
  try {
    const params = e.parameter;
    const tournamentId = params.tournamentId || "unknown";

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

    // 5. Fetch Brackets & Schedule
    if (params.action === "getBracket") {
      return jsonResponse({
        bracketUrl: "https://challonge.com/ppcc2_2026/module", // Replace with your bracket embed link if needed
        schedule: [
          "Group Stage: July 31, 2026 @ 18:00 PKT",
          "Playoffs: August 01-02, 2026 @ 18:00 PKT",
          "Grand Finals: August 03, 2026 @ 20:00 PKT"
        ]
      });
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
    const inviteCode = rows[i][7]; // Column H
    const status = rows[i][2];     // Column C
    
    if (status === "VERIFIED" || status === "PENDING REVIEW") {
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
    const status = rows[i][2]; // Column C
    if (status !== "VERIFIED" && status !== "PENDING REVIEW") continue;

    const team = {
      name: rows[i][3], // Column D
      tag: rows[i][4],  // Column E
      logo: rows[i][6], // Column G
      status: status,
      roster: []
    };

    // Parse Roster Players: P1 to P7
    // Roster start column is index 9 (Column J)
    // Each player has 10 columns for P1 (J to S), then 9 columns for others
    // Let's grab names and FACEIT stats for active players
    for (let p = 0; p < 7; p++) {
      const offset = 9 + (p * 10) - (p > 0 ? p : 0); // P1 has Wallet Address, others don't
      if (offset >= rows[i].length) break;

      const role = rows[i][offset];
      const ign = rows[i][offset + 2];
      const faceitLvl = rows[i][offset + 7];
      const faceitElo = rows[i][offset + 8];

      if (ign && ign.trim() !== "") {
        team.roster.push({
          role: role,
          ign: ign,
          faceitLevel: faceitLvl || "N/A",
          faceitElo: faceitElo || "N/A"
        });
      }
    }

    // Calculate Average ELO if numbers are available
    let totalElo = 0;
    let count = 0;
    team.roster.forEach(player => {
      const elo = parseInt(player.faceitElo);
      if (!isNaN(elo)) {
        totalElo += elo;
        count++;
      }
    });
    team.averageElo = count > 0 ? Math.round(totalElo / count) : 0;

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
