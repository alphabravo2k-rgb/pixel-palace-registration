/**
 * PIXEL PALACE — ADMIN OPERATIONS SCRIPT v2.0 (7-PLAYER FORMAT)
 *
 * Deployed in: Pixel Palace Community Cup 2 Admin Sheet
 * Spreadsheet URL: https://docs.google.com/spreadsheets/d/1_B_ovDmGuA1rAityrgAz_G3csBtLl4OFfwJUMWXXe_E/edit?gid=0#gid=0
 */

const RAW_SHEET_ID = "18v5CFox5pRSRNhEtx9kmkVJHNDwH2K84hvMIH-KZyEc"; // ID of the Pixel Palace | Raw Registrations spreadsheet
const FACEIT_API_KEY = "a77d0763-5fdd-4bde-a8a5-6e840408de2e";

// ── COLUMN MAP (15-Column Layout) ─────────────────────────────────────────────
const C = {
  SN: 1,          // Col A: S.N
  REGION: 2,      // Col B: Region
  LOGO: 3,        // Col C: Logo URL
  STEAM_URL: 4,   // Col D: Steam Profile
  DISCORD: 5,     // Col E: Discord ID
  PLAYER_NAME: 6, // Col F: Player Name
  FACEIT_URL: 7,  // Col G: Faceit Profile
  LIVE_ELO: 8,    // Col H: Live FACE IT ELO
  JOINED: 9,      // Col I: Joined Discord
  ROLE_ISSUED: 10,// Col J: Role Issued
  TEAM_NAME: 11,  // Col K: Team Name
  AVG_ELO: 12,    // Col L: AVERAGE ELO
  REG_STATUS: 13, // Col M: Registration status
  SEED: 14,       // Col N: Team Seed
  REMARKS: 15     // Col O: Admin Remarks
};
const TOTAL_COLS = 15;

// Columns that merge across all 7 player rows (team-level data):
const TEAM_MERGE_COLS = [
  C.SN, C.REGION, C.LOGO, C.TEAM_NAME, C.AVG_ELO, C.REG_STATUS, C.SEED, C.REMARKS
];

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
    // Column K (index 10) is the Team Name column
    if (adminData[i][C.TEAM_NAME - 1]) {
      existingTeams.add(adminData[i][C.TEAM_NAME - 1].toString().toLowerCase().trim());
    }
  }

  let teamsSynced = 0;
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    // Check if tournament is community-cup-2
    const tournamentId = row[2] ? row[2].toString().trim() : "";
    if (tournamentId !== "community-cup-2") continue;

    const teamName = row[5] ? row[5].toString().trim() : ""; // Column F (Team Name)
    if (!teamName || existingTeams.has(teamName.toLowerCase())) continue;

    const sn = "TEAM " + (existingTeams.size + teamsSynced + 1);
    const startRowIndex = adminSheet.getLastRow() + 1;
    const rowsToAppend = [];
    
    const teamTag = row[6] ? row[6].toString().trim() : "";
    const region = row[7] ? row[7].toString().trim() : "";
    const logoUrl = row[8] ? row[8].toString().trim() : "";

    // Loop through all 7 potential players (Captain, 4 Starters, 2 Subs)
    for (let p = 0; p < 7; p++) {
      let dataStartCol = 9 + (p * 4); // P1 Discord starts at Column J (index 9)
      if (dataStartCol >= row.length) break;

      let discord = row[dataStartCol] || "N/A";
      let steam = row[dataStartCol + 1] || "N/A";
      let faceit = row[dataStartCol + 2] || "N/A";
      
      let pRole = p === 0 ? " ©" : (p >= 5 ? " (Sub)" : "");
      let pName = faceit !== "N/A" ? faceit.split('/').filter(Boolean).pop() + pRole : discord + pRole;

      // Aligned exactly to Columns A through O (15 elements)
      rowsToAppend.push([
        p === 0 ? sn : "",                     // Col A: S.N
        p === 0 ? region : "",                 // Col B: Region
        p === 0 ? logoUrl : "",                // Col C: Logo URL
        steam,                                 // Col D: Steam Profile
        discord,                               // Col E: Discord ID
        pName,                                 // Col F: Player Name
        faceit,                                // Col G: Faceit Profile
        "Fetching...",                         // Col H: Live FACE IT ELO
        "",                                    // Col I: Joined Discord (Admin fills this)
        "",                                    // Col J: Role Issued (Admin fills this)
        p === 0 ? teamName : "",               // Col K: Team Name
        p === 0 ? "Pending" : "",              // Col L: AVERAGE ELO
        p === 0 ? "Under Review" : "",         // Col M: Registration status
        p === 0 ? "TBD" : "",                  // Col N: Team Seed
        ""                                     // Col O: Admin Remarks
      ]);
    }

    // Push 7 rows at once
    adminSheet.getRange(startRowIndex, 1, 7, TOTAL_COLS).setValues(rowsToAppend);
    
    // Merge the Team-level cells vertically so it looks clean
    TEAM_MERGE_COLS.forEach(col => {
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
    // If we hit a new team name (Column K), finalize the stats for the previous team
    if (adminSheet.getRange(i + 1, C.TEAM_NAME).getValue() !== "" && i !== 1) {
      finalizeTeamStats(adminSheet, teamStartIdx, eloSum, count);
      teamStartIdx = i; 
      eloSum = 0; 
      count = 0;
    }
    
    let url = data[i][C.FACEIT_URL - 1]; // Col G (Faceit Profile, index 6)
    if (url && url.includes("faceit.com")) {
      try {
        let res = UrlFetchApp.fetch(`https://open.faceit.com/data/v4/players?nickname=${url.split('/').pop()}`, options);
        if (res.getResponseCode() === 200) {
          let json = JSON.parse(res.getContentText());
          let elo = json.games.cs2 ? json.games.cs2.faceit_elo : (json.games.csgo ? json.games.csgo.faceit_elo : 0);
          adminSheet.getRange(i + 1, C.LIVE_ELO).setValue(elo); // Col H (Live FACE IT ELO, column 8)
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
  
  // Col L (12) - Average ELO
  sheet.getRange(teamStartIdx + 1, C.AVG_ELO).setValue(avg);
  
  // Col N (14) - Team Seed
  sheet.getRange(teamStartIdx + 1, C.SEED)
       .setValue(seed)
       .setBackground(seed==="LOW"?"#d9d9d9":seed==="MID"?"#b6d7a8":seed==="NORMAL"?"#ffe599":seed==="AVG"?"#f9cb9c":seed==="GOOD"?"#00ffff":"#ff00ff")
       .setFontWeight("bold");
}

// ── TRIGGERED EVENT SYNC BACK TO RAW REGISTER SHEET ───────────────────────────
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  
  if (sheetName === "Admin_Ops" || sheetName === "Sheet1") {
    const col = range.getColumn();
    
    // Column M (Column 13) is the Registration status column
    if (col === C.REG_STATUS) {
      const oldValue = e.oldValue ? String(e.oldValue).trim().toUpperCase() : "";
      const newValue = e.value ? String(e.value).trim().toUpperCase() : "";
      
      if (oldValue === newValue) return;
      
      // Get the team name from Column K (Column 11)
      const teamName = sheet.getRange(range.getRow(), C.TEAM_NAME).getValue().toString().trim();
      if (!teamName) return;
      
      syncStatusToRaw(teamName, newValue);
    }
  }
}

function syncStatusToRaw(teamName, newStatus) {
  try {
    const rawDoc = SpreadsheetApp.openById(RAW_SHEET_ID);
    const rawSheet = rawDoc.getSheetByName("Sheet1") || rawDoc.getSheets()[0];
    const data = rawSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const existingTeamName = data[i][5] ? data[i][5].toString().trim() : ""; // Col F (index 5) is Team Name
      if (existingTeamName.toLowerCase() === teamName.toLowerCase()) {
        const currentStatus = data[i][4] ? data[i][4].toString().trim() : ""; // Col E (index 4) is Status
        if (currentStatus.toUpperCase() !== newStatus.toUpperCase()) {
          rawSheet.getRange(i + 1, 5).setValue(newStatus); // Col E is Column 5
        }
        break;
      }
    }
  } catch (err) {
    console.error("Failed to sync status to Raw:", err);
  }
}
