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
