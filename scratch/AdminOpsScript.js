/**
 * =============================================================================
 *  PIXEL PALACE -- ADMIN OPS BOARD v3.0 (COMPLETE INTEL ENGINE)
 *
 *  Deployed in: Pixel Palace | Chaos II Admin Sheet
 *  Sheet ID   : 1htkH0PQWbWefE5XFIdf2AGqTxpWMwLyGDMZMfOOL-2E
 *
 *  33-COLUMN LAYOUT (Columns A through AG)
 *
 *  TEAM-LEVEL (merged across 3 player rows):
 *    A(1)=S.N   B(2)=Team Name   C(3)=Team Tag   D(4)=Logo   E(5)=Region
 *    N(14)=Avg ELO   O(15)=Reg Status   P(16)=Seed   Q(17)=Remarks   AG(33)=Risk Flag
 *
 *  PLAYER-LEVEL (per row):
 *    F(6)=Player Name   G(7)=Discord   H(8)=Steam URL
 *    I(9)=Joined Discord?   J(10)=Role Issued?   K(11)=Private VC
 *    L(12)=FACEIT URL   M(13)=Live ELO
 *    R(18)=Role   S(19)=Skill Lvl   T(20)=CS2 Rank Badge
 *    U(21)=Win Rate%   V(22)=K/D   W(23)=HS%
 *    X(24)=Matches   Y(25)=FACEIT Tier   Z(26)=Country
 *    AA(27)=Steam64 ID   AB(28)=VAC Ban   AC(29)=Game Ban
 *    AD(30)=Steam Lvl   AE(31)=CS2 Hrs   AF(32)=Steam Age (yrs)
 *
 *  Raw Sheet layout (18v5CFox5pRSRNhEtx9kmkVJHNDwH2K84hvMIH-KZyEc):
 *    A(0)=Team ID   B(1)=Timestamp   C(2)=Tournament ID
 *    D(3)=Submission ID   E(4)=Status   F(5)=Team Name
 *    G(6)=Team Tag   H(7)=Region   I(8)=Logo URL
 *    J(9)=P1 Discord   K(10)=P1 Steam   L(11)=P1 Faceit   M(12)=P1 Rank
 *    N(13)=P2 Discord   O(14)=P2 Steam   P(15)=P2 Faceit   Q(16)=P2 Rank
 *    R(17)=P3 Discord   S(18)=P3 Steam   T(19)=P3 Faceit   U(20)=P3 Rank
 * =============================================================================
 */

// -- CONFIGURATION ------------------------------------------------------------
const RAW_SHEET_ID      = "18v5CFox5pRSRNhEtx9kmkVJHNDwH2K84hvMIH-KZyEc";
const FACEIT_API_KEY    = "a77d0763-5fdd-4bde-a8a5-6e840408de2e";
const STEAM_API_KEY     = "B0B73613E7724F046A860E9CC1DCF86B";
const TARGET_TOURNAMENT = "community-cup-2";
const ADMIN_SHEET_NAME  = "Admin_Ops";  // Sheet tab name in this spreadsheet
const CS2_APP_ID        = 730;
const PLAYERS_PER_TEAM  = 7;           // Captain + 4 Players + 2 Substitutes


// -- COLUMN MAP (1-indexed for getRange) --------------------------------------
const C = {
  // Team-level (merged)
  SN:          1,   // A
  TEAM_NAME:   2,   // B
  TEAM_TAG:    3,   // C
  LOGO:        4,   // D
  REGION:      5,   // E
  // Player-level
  PLAYER_NAME: 6,   // F
  DISCORD:     7,   // G
  STEAM_URL:   8,   // H
  JOINED:      9,   // I
  ROLE_ISSUED: 10,  // J
  PRIVATE_VC:  11,  // K
  FACEIT_URL:  12,  // L
  LIVE_ELO:    13,  // M
  // Team-level (merged, continued)
  AVG_ELO:     14,  // N
  REG_STATUS:  15,  // O
  SEED:        16,  // P
  REMARKS:     17,  // Q
  // Player Intel (auto-fetched)
  ROLE:        18,  // R
  SKILL_LVL:   19,  // S
  RANK_BADGE:  20,  // T
  WIN_RATE:    21,  // U
  KD:          22,  // V
  HS_PCT:      23,  // W
  MATCHES:     24,  // X
  FACEIT_TIER: 25,  // Y
  COUNTRY:     26,  // Z
  STEAM64:     27,  // AA
  VAC_BAN:     28,  // AB
  GAME_BAN:    29,  // AC
  STEAM_LVL:   30,  // AD
  CS2_HRS:     31,  // AE
  STEAM_AGE:   32,  // AF
  RISK_FLAG:   33,  // AG
};

const TOTAL_COLS = 33;

// Columns that merge across all PLAYERS_PER_TEAM rows:
const TEAM_MERGE_COLS = [
  C.SN, C.TEAM_NAME, C.TEAM_TAG, C.LOGO, C.REGION,
  C.AVG_ELO, C.REG_STATUS, C.SEED, C.REMARKS, C.RISK_FLAG
];

// -- HEADERS ------------------------------------------------------------------
const ALL_HEADERS = [
  "S.N", "Team Name", "Team Tag", "Logo", "Region",
  "Player Name", "Discord", "Steam URL",
  "Joined Discord?", "Role Issued?", "Private VC",
  "FACEIT URL", "Live ELO", "Avg ELO",
  "Reg. Status", "Team Seed", "Admin Remarks",
  "Role", "Skill Lvl", "CS2 Rank Badge",
  "Win Rate %", "K/D Ratio", "HS %",
  "Matches", "FACEIT Tier", "Country",
  "Steam64 ID", "VAC Ban", "Game Ban",
  "Steam Lvl", "CS2 Hrs", "Steam Age (yrs)",
  "Risk Flag"
];

// ─────────────────────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Admin Tools")
    .addItem("Full Sync - All Sources",      "syncAndFetch")
    .addSeparator()
    .addItem("Setup / Fix Column Headers",   "setupNewColumns")
    .addItem("Fill Roles from Player Names", "fillRolesFromNames")
    .addItem("Sync New Teams Only",          "syncRawToAdmin")
    .addItem("Refresh FACEIT Data",          "updateFaceitData")
    .addItem("Refresh Steam Data",           "updateSteamData")
    .addSeparator()
    .addItem("Re-run Risk Flags",            "flagAtRiskPlayers")
    .addItem("Rebuild Summary Sheet",        "buildSummarySheet")
    .addItem("Fix Merged Cells",             "fixMerges")
    .addItem("Setup Status Dropdown",        "setupValidation")
    .addItem("Setup Brackets Sheet",         "setupBracketsSheet")
    .addItem("Schedule Match Time",          "showTimeScheduler")
    .addSeparator()
    .addItem("Enable Auto-Sync (30 min)",    "setupTrigger")
    .addItem("Disable Auto-Sync",            "removeTrigger")
    .addToUi();
}

function syncAndFetch() {
  setupNewColumns();
  syncRawToAdmin();
  fillRolesFromNames();
  updateFaceitData();
  updateSteamData();
  buildSummarySheet();
  SpreadsheetApp.getActiveSpreadsheet().toast("Full sync complete!", "Admin Ops", 6);
}

function setupTrigger() {
  removeTrigger();
  ScriptApp.newTrigger("syncAndFetch").timeBased().everyMinutes(30).create();
  SpreadsheetApp.getUi().alert("Auto-Sync enabled: every 30 minutes.");
}

function removeTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });
}

function getAdminSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(ADMIN_SHEET_NAME) || ss.getSheets()[0];
}

// -- STEP 0: SETUP COLUMN HEADERS --------------------------------------------
function setupNewColumns() {
  var sheet = getAdminSheet_();
  if (!sheet) return;

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(ALL_HEADERS);
    sheet.setFrozenRows(1);
  }

  var headerRow = sheet.getRange(1, 1, 1, TOTAL_COLS).getValues()[0];
  for (var idx = 0; idx < ALL_HEADERS.length; idx++) {
    var col   = idx + 1;
    var label = ALL_HEADERS[idx];
    if (headerRow[idx] === label) continue;
    sheet.getRange(1, col)
      .setValue(label)
      .setFontWeight("bold")
      .setBackground("#1D4ED8")
      .setFontColor("white")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
  }

  sheet.getRange(1, 1, 1, TOTAL_COLS)
    .setFontWeight("bold")
    .setBackground("#1D4ED8")
    .setFontColor("white")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  var widths = {};
  widths[C.TEAM_NAME]   = 160;
  widths[C.TEAM_TAG]    = 90;
  widths[C.LOGO]        = 60;
  widths[C.PLAYER_NAME] = 160;
  widths[C.RANK_BADGE]  = 140;
  widths[C.STEAM64]     = 150;
  widths[C.VAC_BAN]     = 90;
  widths[C.GAME_BAN]    = 90;
  widths[C.STEAM_AGE]   = 110;
  widths[C.WIN_RATE]    = 85;
  widths[C.KD]          = 75;
  widths[C.HS_PCT]      = 75;
  widths[C.MATCHES]     = 80;
  widths[C.RISK_FLAG]   = 200;
  Object.keys(widths).forEach(function(col) {
    sheet.setColumnWidth(parseInt(col), widths[col]);
  });
  sheet.setFrozenRows(1);
  setupValidation();
}

function setupValidation() {
  var sheet = getAdminSheet_();
  if (!sheet) return;
  
  var range = sheet.getRange(2, C.REG_STATUS, sheet.getMaxRows() - 1, 1);
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["PENDING", "APPROVED", "ROSTER_LOCKED", "CHECKED_IN", "OBJECTION", "WAITLISTED", "REJECTED", "DISQUALIFIED", "CHAMPION", "ELIMINATED"], true)
    .setAllowInvalid(false)
    .setHelpText("Please select a valid registration status.")
    .build();
    
  range.setDataValidation(rule);
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast("Status dropdown validation applied to Column O!", "Admin Ops", 5);
  } catch (e) {}
}

// -- STEP 1: FILL ROLES FROM PLAYER NAME COLUMN ------------------------------
function fillRolesFromNames() {
  var sheet = getAdminSheet_();
  if (!sheet || sheet.getLastRow() <= 1) return;
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var name = (data[i][C.PLAYER_NAME - 1] || "").toString();
    if (!name || name === "N/A") continue;
    var existing = (data[i][C.ROLE - 1] || "").toString();
    var role = parseRole(name);
    if (role !== "X" && existing !== role) {
      sheet.getRange(i + 1, C.ROLE).setValue(role);
    }
  }
}

// -- STEP 2: PULL NEW TEAMS FROM RAW SHEET -----------------------------------
// Actual raw sheet layout (Google Form submissions, 0-indexed):
//   0=Timestamp   1=Tournament ID   2=Submission ID
//   3=Team Name   4=Team Tag        5=Region    6=Logo URL
//   7=P1 Discord  8=P1 Steam        9=P1 Faceit  10=P1 Rank
//  11=P2 Discord 12=P2 Steam       13=P2 Faceit  14=P2 Rank
//  15=P3 Discord 16=P3 Steam       17=P3 Faceit  18=P3 Rank
//  ...(P4-P7 at indices 19-34)...
//  Last col = VIP Code Used
function syncRawToAdmin() {
  var rawSheet   = SpreadsheetApp.openById(RAW_SHEET_ID).getSheetByName("Sheet1");
  var adminSheet = getAdminSheet_();
  if (!rawSheet || !adminSheet) return;

  // Automatically align any shifted rows in the raw sheet first
  autoAlignRawSheet_(rawSheet);


  setupNewColumns();

  var rawData   = rawSheet.getDataRange().getValues();
  var adminData = adminSheet.getDataRange().getValues();

  var existing = {};
  for (var ai = 1; ai < adminData.length; ai++) {
    var tn = (adminData[ai][C.TEAM_NAME - 1] || "").toString().toLowerCase().trim();
    if (tn) existing[tn] = true;
  }

  var teamCount = 0;
  for (var ai2 = 1; ai2 < adminData.length; ai2++) {
    var sncell = (adminData[ai2][C.SN - 1] || "").toString();
    if (sncell.indexOf("TEAM") === 0) teamCount++;
  }

  var roleTags, roles;
  if (PLAYERS_PER_TEAM === 3) {
    roleTags = [" (C)", "", " (Sub)"];
    roles    = ["Captain", "Player 2", "Substitute"];
  } else {
    roleTags = [" (C)", "", "", "", "", " (Sub)", " (Sub)"];
    roles    = ["Captain", "Player 2", "Player 3", "Player 4", "Player 5", "Substitute", "Substitute"];
  }

  var added    = 0;


  // Detect if first row is a header row
  var startIdx = 1;
  if (rawData.length > 0) {
    var r0 = (rawData[0][1] || "").toString().trim().toLowerCase();
    if (r0 === "tournament id" || r0 === "tournament") startIdx = 1;
    else startIdx = 0; // No header row
  }

  for (var i = startIdx; i < rawData.length; i++) {
    var row = rawData[i];
    // Skip completely empty rows
    if (!row[1] && !row[3]) continue;

    var tid = (row[1] || "").toString().trim(); // index 1 = Tournament ID
    if (tid !== TARGET_TOURNAMENT) continue;

    var teamName = (row[3] || "").toString().trim(); // index 3 = Team Name
    if (!teamName || existing[teamName.toLowerCase()]) continue;

    var teamTag  = (row[4] || "").toString().trim(); // index 4 = Team Tag
    var region   = (row[5] || "").toString().trim(); // index 5 = Region
    var logoUrl  = (row[6] || "").toString().trim(); // index 6 = Logo URL
    var startRow = adminSheet.getLastRow() + 1;

    teamCount++;
    var sn    = "TEAM " + teamCount;
    var block = [];

    for (var p = 0; p < PLAYERS_PER_TEAM; p++) {
      var base    = 7 + p * 4;                               // P1 starts at index 7
      var discord = (row[base]     || "").toString().trim() || "N/A";
      var steam   = (row[base + 1] || "").toString().trim() || "N/A";
      var faceit  = (row[base + 2] || "").toString().trim() || "N/A";

      var pName = (faceit && faceit !== "N/A" && faceit.indexOf("faceit.com") !== -1)
        ? faceit.replace(/\/$/, "").split("/").pop() + roleTags[p]
        : discord + roleTags[p];

      var r = [];
      for (var x = 0; x < TOTAL_COLS; x++) r.push("");
      r[C.SN - 1]          = p === 0 ? sn       : "";
      r[C.TEAM_NAME - 1]   = p === 0 ? teamName : "";
      r[C.TEAM_TAG - 1]    = p === 0 ? teamTag  : "";
      r[C.LOGO - 1]        = (p === 0 && logoUrl) ? '=IMAGE("' + logoUrl + '")' : "";
      r[C.REGION - 1]      = p === 0 ? region   : "";
      r[C.PLAYER_NAME - 1] = pName;
      r[C.DISCORD - 1]     = discord;
      r[C.STEAM_URL - 1]   = steam;
      r[C.FACEIT_URL - 1]  = faceit;
      r[C.LIVE_ELO - 1]    = "Fetching...";
      r[C.AVG_ELO - 1]     = p === 0 ? "Pending" : "";
      r[C.REG_STATUS - 1]  = p === 0 ? "PENDING" : "";
      r[C.SEED - 1]        = p === 0 ? "TBD"     : "";
      r[C.ROLE - 1]        = roles[p];
      r[C.RISK_FLAG - 1]   = p === 0 ? "Pending" : "";
      block.push(r);
    }

    adminSheet.getRange(startRow, 1, PLAYERS_PER_TEAM, TOTAL_COLS).setValues(block);
    TEAM_MERGE_COLS.forEach(function(col) {
      adminSheet.getRange(startRow, col, PLAYERS_PER_TEAM, 1)
                .merge()
                .setVerticalAlignment("middle")
                .setHorizontalAlignment("center");
    });
    adminSheet.setRowHeightsForced(startRow, PLAYERS_PER_TEAM, 28);

    existing[teamName.toLowerCase()] = true;
    added++;
  }

  Logger.log("syncRawToAdmin: added " + added + " team(s).");
  SpreadsheetApp.getActiveSpreadsheet().toast(
    added > 0 ? "Synced " + added + " new team(s)." : "No new teams found.",
    "Sync Done", 4
  );
}

// -- FIX MERGES ---------------------------------------------------------------
function fixMerges() {
  var adminSheet = getAdminSheet_();
  var lastRow = adminSheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getActiveSpreadsheet().toast("No data rows to fix.", "Fix Merges", 3);
    return;
  }

  adminSheet.getRange(2, 1, lastRow - 1, TOTAL_COLS).breakApart();

  var data = adminSheet.getRange(2, 1, lastRow - 1, TOTAL_COLS).getValues();
  var teamBoundaries = [];

  for (var i = 0; i < data.length; i++) {
    var tName = (data[i][C.TEAM_NAME - 1] || "").toString().trim();
    if (tName) {
      var span = 1;
      for (var j = i + 1; j < data.length && j < i + PLAYERS_PER_TEAM; j++) {
        if ((data[j][C.TEAM_NAME - 1] || "").toString().trim() === "") span++;
        else break;
      }
      if (span > 1) teamBoundaries.push({ startRow: i + 2, spanCount: span });
    }
  }

  teamBoundaries.forEach(function(t) {
    TEAM_MERGE_COLS.forEach(function(col) {
      adminSheet.getRange(t.startRow, col, t.spanCount, 1)
                .merge()
                .setVerticalAlignment("middle")
                .setHorizontalAlignment("center");
    });
  });

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Fixed " + teamBoundaries.length + " team blocks.", "Fix Merges", 5
  );
}

// -- STEP 3: FACEIT FULL DATA FETCH ------------------------------------------
function updateFaceitData() {
  var sheet = getAdminSheet_();
  if (!sheet || sheet.getLastRow() <= 1) return;

  var data = sheet.getDataRange().getValues();
  var opts = {
    method: "get",
    headers: { "Authorization": "Bearer " + FACEIT_API_KEY },
    muteHttpExceptions: true
  };

  var teamStartIdx = 1;
  var teamElos = [];

  for (var i = 1; i < data.length; i++) {
    var sn = (data[i][C.SN - 1] || "").toString().trim();
    if (sn !== "" && i !== 1) {
      finalizeTeamStats(sheet, teamStartIdx, teamElos);
      teamStartIdx = i;
      teamElos = [];
    }

    var faceitUrl = (data[i][C.FACEIT_URL - 1] || "").toString().trim();
    if (!faceitUrl || faceitUrl === "N/A" || faceitUrl.indexOf("faceit.com") === -1) {
      if (i === data.length - 1) finalizeTeamStats(sheet, teamStartIdx, teamElos);
      continue;
    }

    var nickname = faceitUrl.replace(/\/$/, "").split("/").pop();

    try {
      var pRes = UrlFetchApp.fetch(
        "https://open.faceit.com/data/v4/players?nickname=" + encodeURIComponent(nickname), opts
      );

      if (pRes.getResponseCode() !== 200) {
        sheet.getRange(i + 1, C.LIVE_ELO).setValue("Not Found");
        if (i === data.length - 1) finalizeTeamStats(sheet, teamStartIdx, teamElos);
        continue;
      }

      var player   = JSON.parse(pRes.getContentText());
      var gameData = (player.games && player.games.cs2) ? player.games.cs2
                   : (player.games && player.games.csgo) ? player.games.csgo : {};
      var elo      = parseInt(gameData.faceit_elo) || 0;
      var skillLvl = parseInt(gameData.skill_level) || 0;
      var country  = (player.country || "N/A").toUpperCase();
      var tier     = capitalize(player.membership_type || "free");
      var steam64  = (player.steam_id_64 || player.steam_id || "").toString().trim();
      var pid      = player.player_id;

      if (elo > 0) teamElos.push(elo);

      var row = i + 1;
      sheet.getRange(row, C.LIVE_ELO).setValue(elo > 0 ? elo : "No ELO");
      sheet.getRange(row, C.SKILL_LVL).setValue(skillLvl || "N/A");
      sheet.getRange(row, C.RANK_BADGE).setValue(getCS2RankBadge(skillLvl));
      sheet.getRange(row, C.FACEIT_TIER).setValue(tier);
      sheet.getRange(row, C.COUNTRY).setValue(country);
      if (steam64 && steam64.length === 17) sheet.getRange(row, C.STEAM64).setValue(steam64);

      colorSkillCell(sheet.getRange(row, C.SKILL_LVL), skillLvl);

      // Fetch lifetime stats: try CS2 first, then CSGO
      if (pid) {
        var games = ["cs2", "csgo"];
        for (var g = 0; g < games.length; g++) {
          try {
            var sRes = UrlFetchApp.fetch(
              "https://open.faceit.com/data/v4/players/" + pid + "/stats/" + games[g], opts
            );
            if (sRes.getResponseCode() !== 200) continue;
            var lt  = JSON.parse(sRes.getContentText()).lifetime || {};
            var kd  = parseFloat(lt["Average K/D Ratio"]);
            var wr  = parseFloat(lt["Win Rate %"]);
            var hs  = parseFloat(lt["Average Headshots %"]);
            var m   = lt["Matches"];
            if (!isNaN(kd) && kd > 0) {
              sheet.getRange(row, C.WIN_RATE).setValue(isNaN(wr) ? "N/A" : wr.toFixed(1) + "%");
              sheet.getRange(row, C.KD).setValue(kd.toFixed(2));
              sheet.getRange(row, C.HS_PCT).setValue(isNaN(hs) ? "N/A" : hs.toFixed(1) + "%");
              sheet.getRange(row, C.MATCHES).setValue(m || "N/A");
              break;
            }
          } catch (e) {}
        }
      }

    } catch (e) {
      sheet.getRange(i + 1, C.LIVE_ELO).setValue("Error");
    }

    if (i === data.length - 1) finalizeTeamStats(sheet, teamStartIdx, teamElos);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast("FACEIT data refreshed!", "FACEIT", 4);
}

// -- STEP 4: STEAM DATA FETCH ------------------------------------------------
function updateSteamData() {
  var sheet = getAdminSheet_();
  if (!sheet || sheet.getLastRow() <= 1) return;
  var data = sheet.getDataRange().getValues();

  var players = [];
  for (var i = 1; i < data.length; i++) {
    var s64 = (data[i][C.STEAM64 - 1] || "").toString().trim();
    if (!isValidSteam64(s64)) {
      var url = (data[i][C.STEAM_URL - 1] || "").toString().trim();
      s64 = resolveFromUrl(url) || "";
    }
    if (!isValidSteam64(s64)) continue;
    if ((data[i][C.STEAM64 - 1] || "").toString() !== s64) {
      sheet.getRange(i + 1, C.STEAM64).setValue(s64);
    }
    players.push({ rowIdx: i, steam64: s64 });
  }

  if (players.length === 0) {
    SpreadsheetApp.getUi().alert("No valid Steam64 IDs found. Run FACEIT Refresh first.");
    return;
  }

  var allIds     = players.map(function(p) { return p.steam64; });
  var banMap     = fetchBansBatch(allIds);
  var profileMap = fetchSummariesBatch(allIds);

  for (var pi = 0; pi < players.length; pi++) {
    var rowIdx  = players[pi].rowIdx;
    var steam64 = players[pi].steam64;
    var row     = rowIdx + 1;
    var ban     = banMap[steam64]     || {};
    var profile = profileMap[steam64] || {};

    var vacBanned  = ban.VACBanned || false;
    var gameBans   = ban.NumberOfGameBans || 0;
    var gameBanned = gameBans > 0;

    var vacCell  = sheet.getRange(row, C.VAC_BAN);
    var gameCell = sheet.getRange(row, C.GAME_BAN);

    vacCell.setValue(vacBanned  ? "BANNED" : "Clean");
    gameCell.setValue(gameBanned ? "BANNED (" + gameBans + ")" : "Clean");

    if (vacBanned) {
      vacCell.setBackground("#EA4335").setFontColor("white").setFontWeight("bold");
    } else {
      vacCell.setBackground("#C8E6C9").setFontColor("#1B5E20").setFontWeight("normal");
    }
    if (gameBanned) {
      gameCell.setBackground("#FF6D00").setFontColor("white").setFontWeight("bold");
    } else {
      gameCell.setBackground("#C8E6C9").setFontColor("#1B5E20").setFontWeight("normal");
    }

    if (profile.timecreated) {
      var ageYrs = ((Date.now() - profile.timecreated * 1000) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
      sheet.getRange(row, C.STEAM_AGE).setValue(ageYrs);
    }

    try {
      var lvlRes = UrlFetchApp.fetch(
        "https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=" + STEAM_API_KEY + "&steamid=" + steam64,
        { muteHttpExceptions: true }
      );
      if (lvlRes.getResponseCode() === 200) {
        var lvlJson = JSON.parse(lvlRes.getContentText());
        var lvl = lvlJson.response && lvlJson.response.player_level !== undefined ? lvlJson.response.player_level : null;
        if (lvl !== null) sheet.getRange(row, C.STEAM_LVL).setValue(lvl);
      }
    } catch (e) {}

    try {
      var gamesRes = UrlFetchApp.fetch(
        "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=" + STEAM_API_KEY + "&steamid=" + steam64 + "&include_played_free_games=1&format=json",
        { muteHttpExceptions: true }
      );
      if (gamesRes.getResponseCode() === 200) {
        var gamesJson = JSON.parse(gamesRes.getContentText());
        var gamesList = (gamesJson.response && gamesJson.response.games) ? gamesJson.response.games : [];
        var cs2game   = null;
        for (var gi = 0; gi < gamesList.length; gi++) {
          if (gamesList[gi].appid === CS2_APP_ID) { cs2game = gamesList[gi]; break; }
        }
        sheet.getRange(row, C.CS2_HRS).setValue(cs2game ? Math.round(cs2game.playtime_forever / 60) : 0);
      }
    } catch (e) {}
  }

  flagAtRiskPlayers();
  SpreadsheetApp.getActiveSpreadsheet().toast("Steam data refreshed!", "Steam", 4);
}

// -- BATCH HELPERS ------------------------------------------------------------
function fetchBansBatch(ids) {
  var map = {};
  var CHUNK = 100;
  for (var i = 0; i < ids.length; i += CHUNK) {
    var chunk = ids.slice(i, i + CHUNK).join(",");
    try {
      var r = UrlFetchApp.fetch(
        "https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=" + STEAM_API_KEY + "&steamids=" + chunk,
        { muteHttpExceptions: true }
      );
      if (r.getResponseCode() === 200) {
        var pl = JSON.parse(r.getContentText()).players || [];
        for (var j = 0; j < pl.length; j++) map[pl[j].SteamId] = pl[j];
      }
    } catch (e) {}
  }
  return map;
}

function fetchSummariesBatch(ids) {
  var map = {};
  var CHUNK = 100;
  for (var i = 0; i < ids.length; i += CHUNK) {
    var chunk = ids.slice(i, i + CHUNK).join(",");
    try {
      var r = UrlFetchApp.fetch(
        "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=" + STEAM_API_KEY + "&steamids=" + chunk,
        { muteHttpExceptions: true }
      );
      if (r.getResponseCode() === 200) {
        var resp = JSON.parse(r.getContentText());
        var pl   = (resp.response && resp.response.players) ? resp.response.players : [];
        for (var j = 0; j < pl.length; j++) map[pl[j].steamid] = pl[j];
      }
    } catch (e) {}
  }
  return map;
}

// -- TEAM ELO AVERAGE + SEED -------------------------------------------------
function finalizeTeamStats(sheet, teamStartIdx, teamElos) {
  if (!teamElos || teamElos.length === 0) return;
  var sum = 0;
  for (var x = 0; x < teamElos.length; x++) sum += teamElos[x];
  var avgElo = Math.round(sum / teamElos.length);

  var SEEDS = [
    { max: 500,        label: "LEVEL 1",  bg: "#4D5356", fg: "#fff" },
    { max: 750,        label: "LEVEL 2",  bg: "#00E65A", fg: "#000" },
    { max: 900,        label: "LEVEL 3",  bg: "#00E65A", fg: "#000" },
    { max: 1050,       label: "LEVEL 4",  bg: "#FFC800", fg: "#000" },
    { max: 1200,       label: "LEVEL 5",  bg: "#FFC800", fg: "#000" },
    { max: 1350,       label: "LEVEL 6",  bg: "#FFC800", fg: "#000" },
    { max: 1530,       label: "LEVEL 7",  bg: "#FFC800", fg: "#000" },
    { max: 1750,       label: "LEVEL 8",  bg: "#FF5E00", fg: "#fff" },
    { max: 2000,       label: "LEVEL 9",  bg: "#FF5E00", fg: "#fff" },
    { max: 999999999,  label: "LEVEL 10", bg: "#FF1E27", fg: "#fff" }
  ];

  var seed = SEEDS[SEEDS.length - 1];
  for (var s = 0; s < SEEDS.length; s++) {
    if (avgElo <= SEEDS[s].max) { seed = SEEDS[s]; break; }
  }

  var teamRow = teamStartIdx + 1;
  sheet.getRange(teamRow, C.AVG_ELO).setValue(avgElo);
  sheet.getRange(teamRow, C.SEED)
       .setValue(seed.label)
       .setBackground(seed.bg)
       .setFontColor(seed.fg)
       .setFontWeight("bold")
       .setHorizontalAlignment("center");
}

// -- RISK FLAG ENGINE --------------------------------------------------------
function flagAtRiskPlayers() {
  var sheet = getAdminSheet_();
  if (!sheet || sheet.getLastRow() <= 1) return;
  var data = sheet.getDataRange().getValues();

  var teamStartRow = 1;
  var flags = [];

  function applyFlag(startRow, reasons) {
    var unique = [];
    var seen   = {};
    for (var k = 0; k < reasons.length; k++) {
      if (!seen[reasons[k]]) { unique.push(reasons[k]); seen[reasons[k]] = true; }
    }
    var cell = sheet.getRange(startRow + 1, C.RISK_FLAG);
    if (unique.length > 0) {
      cell.setValue("RISK: " + unique.slice(0, 4).join(" | "))
          .setBackground("#EA4335").setFontColor("white").setFontWeight("bold");
    } else {
      cell.setValue("OK")
          .setBackground("#34A853").setFontColor("white").setFontWeight("bold");
    }
  }

  for (var i = 1; i < data.length; i++) {
    var sn = (data[i][C.SN - 1] || "").toString().trim();
    if (sn !== "" && i !== 1) {
      applyFlag(teamStartRow, flags);
      teamStartRow = i;
      flags = [];
    }

    var vac     = (data[i][C.VAC_BAN  - 1] || "").toString();
    var gameBan = (data[i][C.GAME_BAN  - 1] || "").toString();
    var cs2hrs  = parseFloat(data[i][C.CS2_HRS  - 1]) || 0;
    var acctAge = parseFloat(data[i][C.STEAM_AGE - 1]) || 0;
    var matches = parseInt(data[i][C.MATCHES    - 1])  || 0;

    if (vac.indexOf("BANNED")     !== -1) flags.push("VAC");
    if (gameBan.indexOf("BANNED") !== -1) flags.push("GameBan");
    if (cs2hrs > 0  && cs2hrs  < 50)  flags.push("LowCS2Hrs");
    if (acctAge > 0 && acctAge < 0.5) flags.push("NewAcct");
    if (matches > 0 && matches < 10)  flags.push("FewMatches");

    if (vac.indexOf("BANNED") !== -1 || gameBan.indexOf("BANNED") !== -1) {
      sheet.getRange(i + 1, C.PLAYER_NAME).setBackground("#FFCDD2");
    }
  }
  applyFlag(teamStartRow, flags);
}

// -- SUMMARY SHEET -----------------------------------------------------------
function buildSummarySheet() {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var sum = ss.getSheetByName("Summary");
  if (!sum) sum = ss.insertSheet("Summary");
  sum.clearContents().clearFormats();
  sum.setColumnWidth(1, 220);
  sum.setColumnWidth(2, 140);

  var sheet = getAdminSheet_();
  if (!sheet) return;
  var data  = sheet.getDataRange().getValues();

  var teams = 0, vacBans = 0, gameBans = 0, riskTeams = 0, eloSum = 0, eloN = 0;
  var seeds = {}, regions = {}, countries = {};

  for (var i = 1; i < data.length; i++) {
    var sn = (data[i][C.SN - 1] || "").toString();
    if (sn.indexOf("TEAM") === 0) {
      teams++;
      var seed   = (data[i][C.SEED      - 1] || "TBD").toString();
      var region = (data[i][C.REGION    - 1] || "?").toString();
      var avg    = parseFloat(data[i][C.AVG_ELO  - 1]);
      var risk   = (data[i][C.RISK_FLAG - 1] || "").toString();
      seeds[seed]     = (seeds[seed]     || 0) + 1;
      regions[region] = (regions[region] || 0) + 1;
      if (!isNaN(avg)) { eloSum += avg; eloN++; }
      if (risk.indexOf("RISK") === 0) riskTeams++;
    }
    if ((data[i][C.VAC_BAN  - 1] || "").toString().indexOf("BANNED") !== -1) vacBans++;
    if ((data[i][C.GAME_BAN - 1] || "").toString().indexOf("BANNED") !== -1) gameBans++;
    var cc = (data[i][C.COUNTRY - 1] || "").toString();
    if (cc && cc !== "N/A" && cc.length > 0) countries[cc] = true;
  }

  var avgElo = eloN > 0 ? Math.round(eloSum / eloN) : "N/A";
  var countryList = Object.keys(countries).sort().join(", ");

  var rows = [
    ["PIXEL PALACE - Tournament Intel", ""],
    ["Tournament", TARGET_TOURNAMENT],
    ["", ""],
    ["== OVERVIEW ==", ""],
    ["Total Teams", teams],
    ["Avg Team ELO", avgElo],
    ["Unique Countries", Object.keys(countries).length],
    ["Teams Flagged for Review", riskTeams],
    ["VAC Banned Players", vacBans],
    ["Game Banned Players", gameBans],
    ["", ""],
    ["== SEED DISTRIBUTION ==", ""]
  ];

  var seedOrder = ["LEVEL 1","LEVEL 2","LEVEL 3","LEVEL 4","LEVEL 5","LEVEL 6","LEVEL 7","LEVEL 8","LEVEL 9","LEVEL 10","TBD"];
  var seedKeys  = Object.keys(seeds).sort(function(a, b) {
    return seedOrder.indexOf(a) - seedOrder.indexOf(b);
  });
  for (var s = 0; s < seedKeys.length; s++) {
    rows.push([seedKeys[s], seeds[seedKeys[s]]]);
  }

  rows.push(["", ""]);
  rows.push(["== REGION BREAKDOWN ==", ""]);
  var regionKeys = Object.keys(regions).sort(function(a, b) { return regions[b] - regions[a]; });
  for (var r = 0; r < regionKeys.length; r++) {
    rows.push([regionKeys[r], regions[regionKeys[r]]]);
  }

  rows.push(["", ""]);
  rows.push(["== COUNTRIES ==", ""]);
  rows.push([countryList, ""]);

  sum.getRange(1, 1, rows.length, 2).setValues(rows);
  sum.getRange(1, 1, 1, 2).merge()
     .setFontWeight("bold").setFontSize(13)
     .setBackground("#1D4ED8").setFontColor("white").setHorizontalAlignment("center");

  if (vacBans > 0) {
    for (var ri = 0; ri < rows.length; ri++) {
      if (rows[ri][0] === "VAC Banned Players") {
        sum.getRange(ri + 1, 2).setBackground("#FFCDD2").setFontWeight("bold").setFontColor("#B71C1C");
        break;
      }
    }
  }
}

// -- ON EDIT: sync status change back to Raw Sheet ---------------------------
function onEdit(e) {
  if (!e || !e.range) return;

  var range     = e.range;
  var sheet     = range.getSheet();
  var sheetName = sheet.getName();

  if (sheetName !== ADMIN_SHEET_NAME && sheetName !== "Sheet1") return;
  if (range.getColumn() !== C.REG_STATUS) return;

  var newStatus = e.value     ? e.value.toString().trim().toUpperCase()    : "";
  var oldStatus = e.oldValue  ? e.oldValue.toString().trim().toUpperCase() : "";
  if (newStatus === oldStatus) return;

  // Get team name from Col B; merged cells may return "" for sub-rows
  var teamName = sheet.getRange(range.getRow(), C.TEAM_NAME).getValue().toString().trim();
  if (!teamName) {
    for (var r = range.getRow() - 1; r >= 2; r--) {
      teamName = sheet.getRange(r, C.TEAM_NAME).getValue().toString().trim();
      if (teamName) break;
    }
  }
  if (!teamName) return;

  syncStatusToRaw_(teamName, newStatus);
}

function syncStatusToRaw_(teamName, newStatus) {
  // NOTE: Raw Google Form sheet has no "Status" column.
  // Status changes only live in the Admin Ops sheet.
  // This function is a no-op for Chaos II raw sheet but kept for compatibility.
  Logger.log("syncStatusToRaw_ called: " + teamName + " => " + newStatus + " (admin-only update)");
}


// -- SETUP STATUS DROPDOWN + CONDITIONAL COLORS ------------------------------
function setupValidation() {
  var sheet   = getAdminSheet_();
  var lastRow = Math.max(sheet.getLastRow(), 2);

  var statusOptions = [
    "PENDING", "APPROVED", "ROSTER_LOCKED", "CHECKED_IN",
    "OBJECTION", "WAITLISTED", "REJECTED", "DISQUALIFIED", "CHAMPION"
  ];
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusOptions, true)
    .setAllowInvalid(false)
    .setHelpText("Select a registration status.")
    .build();
  sheet.getRange(2, C.REG_STATUS, lastRow - 1, 1).setDataValidation(rule);

  sheet.clearConditionalFormatRules();
  var statusColLetter = columnToLetter(C.REG_STATUS);
  var range = sheet.getRange("A2:AG" + lastRow);
  var statusColors = {
    "PENDING":       { bg: "#FFF9C4", fg: "#5D4037" },
    "APPROVED":      { bg: "#C8E6C9", fg: "#1B5E20" },
    "ROSTER_LOCKED": { bg: "#B2EBF2", fg: "#006064" },
    "CHECKED_IN":    { bg: "#BBDEFB", fg: "#0D47A1" },
    "OBJECTION":     { bg: "#FFE0B2", fg: "#BF360C" },
    "WAITLISTED":    { bg: "#E1BEE7", fg: "#4A148C" },
    "REJECTED":      { bg: "#FFCDD2", fg: "#B71C1C" },
    "DISQUALIFIED":  { bg: "#CFD8DC", fg: "#37474F" },
    "CHAMPION":      { bg: "#FFF176", fg: "#F57F17" }
  };

  var rules = [];
  Object.keys(statusColors).forEach(function(status) {
    var c = statusColors[status];
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=$' + statusColLetter + '2="' + status + '"')
        .setBackground(c.bg)
        .setFontColor(c.fg)
        .setRanges([range])
        .build()
    );
  });
  sheet.setConditionalFormatRules(rules);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Status dropdown + colors applied to " + (lastRow - 1) + " rows.", "Setup Done", 5
  );
}

// -- UTILITY FUNCTIONS -------------------------------------------------------

function resolveFromUrl(url) {
  if (!url || url === "N/A") return null;
  var clean = url.toString().trim().replace(/\/$/, "");

  var profMatch = clean.match(/\/profiles\/([0-9]{17})/);
  if (profMatch) return profMatch[1];

  var idMatch = clean.match(/\/id\/([^\/]+)/);
  if (idMatch) {
    try {
      var r = UrlFetchApp.fetch(
        "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=" + STEAM_API_KEY + "&vanityurl=" + encodeURIComponent(idMatch[1]),
        { muteHttpExceptions: true }
      );
      if (r.getResponseCode() === 200) {
        var json = JSON.parse(r.getContentText());
        if (json.response && json.response.steamid) return json.response.steamid;
      }
    } catch (e) {}
  }
  return null;
}

function isValidSteam64(id) {
  return id && /^[0-9]{17}$/.test(id.toString().trim());
}

function getCS2RankBadge(skillLvl) {
  var lvl = parseInt(skillLvl);
  if (isNaN(lvl) || lvl === 0) return "Unranked";
  if (lvl === 1)  return "Level 1 (Silver)";
  if (lvl <= 3)   return "Level " + lvl + " (Gold Nova)";
  if (lvl <= 6)   return "Level " + lvl + " (Master Guardian)";
  if (lvl <= 8)   return "Level " + lvl + " (LE / Supreme)";
  if (lvl === 9)  return "Level 9 (Global Elite)";
  if (lvl >= 10)  return "Level 10 (Challenger)";
  return "Level " + lvl;
}

function colorSkillCell(range, level) {
  var lvl = parseInt(level);
  if (isNaN(lvl) || lvl === 0) return;
  var bg = "#ffffff", fg = "#000000";
  if      (lvl === 1) { bg = "#4D5356"; fg = "#ffffff"; }
  else if (lvl <= 3)  { bg = "#00E65A"; fg = "#000000"; }
  else if (lvl <= 7)  { bg = "#FFC800"; fg = "#000000"; }
  else if (lvl <= 9)  { bg = "#FF5E00"; fg = "#ffffff"; }
  else if (lvl >= 10) { bg = "#FF1E27"; fg = "#ffffff"; }
  range.setBackground(bg).setFontColor(fg).setFontWeight("bold").setHorizontalAlignment("center");
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function parseRole(name) {
  if (name.indexOf("(C)")       !== -1) return "Captain";
  if (name.indexOf("(Partner)") !== -1) return "Partner";
  if (name.indexOf("(Sub)")     !== -1) return "Substitute";
  return "X";
}

function columnToLetter(col) {
  var letter = "";
  while (col > 0) {
    var rem = (col - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

// -- RAW TAG MAP (reads Team Name and Tag from raw sheet) --------------------
function getRawTagMap_() {
  var map = {};
  try {
    var rawSheet = SpreadsheetApp.openById(RAW_SHEET_ID).getSheetByName("Sheet1");
    if (!rawSheet) return map;
    var data = rawSheet.getDataRange().getValues();
    // Detect header: index 1 should be "Tournament ID" or a date
    var start = 1;
    var r0col1 = (data[0][1] || "").toString().trim().toLowerCase();
    if (r0col1 !== "tournament id" && r0col1 !== "tournament") start = 0;
    for (var i = start; i < data.length; i++) {
      var name = (data[i][3] || "").toString().trim(); // index 3 = Team Name
      var tag  = (data[i][4] || "").toString().trim(); // index 4 = Team Tag
      if (name && tag) map[name.toLowerCase()] = tag;
    }
  } catch (e) {}
  return map;
}

/**
 * Automatically detects and fixes shifted rows in Sheet1 (Layout B).
 * Shifted rows contain a "PP-" Team ID in column 0 (which has header Timestamp/Time Stamp).
 */
function autoAlignRawSheet_(rawSheet) {
  try {
    if (!rawSheet) return;
    var range = rawSheet.getDataRange();
    var values = range.getValues();
    if (values.length < 2) return;

    var headers = values[0];
    var col0Header = (headers[0] || "").toString().trim().toLowerCase();
    
    // Check if the sheet header represents Layout B (no Team ID column)
    if (col0Header === "time stamp" || col0Header === "timestamp") {
      var updated = false;
      
      for (var i = 1; i < values.length; i++) {
        var row = values[i];
        var val0 = (row[0] || "").toString().trim();
        
        // If the row starts with "PP-", it was written with Team ID in Col A, which shifted it
        if (val0.indexOf("PP-") === 0) {
          var originalLength = row.length;
          // Splice index 4 (Status) first
          row.splice(4, 1);
          // Splice index 0 (Team ID)
          row.splice(0, 1);
          // Pad to original length
          while (row.length < originalLength) {
            row.push("");
          }
          
          // Write the aligned row back to the sheet
          rawSheet.getRange(i + 1, 1, 1, originalLength).setValues([row]);
          updated = true;
        }
      }
      
      if (updated) {
        SpreadsheetApp.flush();
      }
    }
  } catch (err) {
    Logger.log("autoAlignRawSheet_ error: " + err);
  }
}

// -- END OF FILE --------------------------------------------------------------

// =============================================================================
//  TOURNAMENT BRACKETS ENGINE
// =============================================================================

/**
 * Initializes the Brackets sheet tab and builds a 32-team single elimination structure
 */
function setupBracketsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Brackets");
  if (!sheet) {
    sheet = ss.insertSheet("Brackets");
  }
  
  var headers = [
    "Match ID", "Round", "Team 1", "Team 2", "Status", "Winner", "Score", "Time (e.g. 20:00 +5 GMT)", "Stream Link", "Source Match 1", "Source Match 2", "Format", "Selected Maps"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
       .setFontWeight("bold")
       .setBackground("#1D4ED8")
       .setFontColor("white")
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle");
       
  sheet.setFrozenRows(1);
  
  // Populate matches if sheet is empty (only has header row)
  if (sheet.getLastRow() <= 1) {
    var matches = [];
    
    // Round of 32 (M01 to M16)
    for (var i = 1; i <= 16; i++) {
      var id = "M" + String(i).padStart(2, "0");
      matches.push([id, "Round of 32", "", "", "SCHEDULED", "TBD", "", "20:00 +5 GMT", "", "SEEDED", "SEEDED", "BO1", ""]);
    }
    
    // Round of 16 (M17 to M24)
    for (var i = 17; i <= 24; i++) {
      var id = "M" + String(i).padStart(2, "0");
      var src1Idx = (i - 17) * 2 + 1;
      var src2Idx = src1Idx + 1;
      var src1 = "M" + String(src1Idx).padStart(2, "0");
      var src2 = "M" + String(src2Idx).padStart(2, "0");
      matches.push([id, "Round of 16", "", "", "SCHEDULED", "TBD", "", "20:00 +5 GMT", "", src1, src2, "BO1", ""]);
    }
    
    // Quarterfinals (M25 to M28)
    for (var i = 25; i <= 28; i++) {
      var id = "M" + String(i).padStart(2, "0");
      var src1Idx = 17 + (i - 25) * 2;
      var src2Idx = src1Idx + 1;
      var src1 = "M" + String(src1Idx).padStart(2, "0");
      var src2 = "M" + String(src2Idx).padStart(2, "0");
      matches.push([id, "Quarterfinals", "", "", "SCHEDULED", "TBD", "", "20:00 +5 GMT", "", src1, src2, "BO3", ""]);
    }
    
    // Semifinals (M29 to M30)
    for (var i = 29; i <= 30; i++) {
      var id = "M" + String(i).padStart(2, "0");
      var src1Idx = 25 + (i - 29) * 2;
      var src2Idx = src1Idx + 1;
      var src1 = "M" + String(src1Idx).padStart(2, "0");
      var src2 = "M" + String(src2Idx).padStart(2, "0");
      matches.push([id, "Semifinals", "", "", "SCHEDULED", "TBD", "", "20:00 +5 GMT", "", src1, src2, "BO3", ""]);
    }
    
    // Grand Finals (M31)
    matches.push(["M31", "Grand Finals", "", "", "SCHEDULED", "TBD", "", "20:00 +5 GMT", "", "M29", "M30", "BO3", ""]);
    
    sheet.getRange(2, 1, matches.length, headers.length).setValues(matches);
  }
  
  // Status column validation (Col E / index 5)
  var statusRange = sheet.getRange(2, 5, sheet.getMaxRows() - 1, 1);
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["SCHEDULED", "LIVE", "ON HOLD", "COMPLETED", "BYE"], true)
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(statusRule);

  // Format column validation (Col L / index 12)
  var formatRange = sheet.getRange(2, 12, sheet.getMaxRows() - 1, 1);
  var formatRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["BO1", "BO3", "BO5"], true)
    .setAllowInvalid(false)
    .build();
  formatRange.setDataValidation(formatRule);
  
  // Apply team dropdown validations
  updateBracketDropdowns();
  
  ss.toast("Brackets sheet setup complete!", "Admin Ops", 5);
}

/**
 * Dynamically updates dropdown validations for Team 1, Team 2, and Winner columns.
 * Prevents selecting the same team twice in Round 1, and limits subsequent rounds to predecessor match teams.
 */
function updateBracketDropdowns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bracketsSheet = ss.getSheetByName("Brackets");
  if (!bracketsSheet) return;
  
  var adminSheet = getAdminSheet_();
  var adminData = adminSheet.getDataRange().getValues();
  
  // 1. Get list of all approved / registered teams
  var registeredTeams = [];
  for (var i = 1; i < adminData.length; i += PLAYERS_PER_TEAM) {
    var tName = (adminData[i][C.TEAM_NAME - 1] || "").toString().trim();
    var tStatus = (adminData[i][C.REG_STATUS - 1] || "").toString().trim().toUpperCase();
    if (tName && tName !== "Team Name" && tStatus !== "REJECTED" && tStatus !== "DISQUALIFIED") {
      registeredTeams.push(tName);
    }
  }
  
  var totalRows = bracketsSheet.getLastRow();
  if (totalRows <= 1) return;
  
  var matchData = bracketsSheet.getRange(1, 1, totalRows, 11).getValues();
  
  // 2. Scan Round 1 matches (M01 - M16, rows 2 to 17) to find all currently selected teams
  var selectedTeams = new Set();
  for (var r = 1; r <= 16; r++) {
    if (r >= matchData.length) break;
    var t1 = (matchData[r][2] || "").toString().trim();
    var t2 = (matchData[r][3] || "").toString().trim();
    if (t1 && t1.toLowerCase() !== "bye") selectedTeams.add(t1.toLowerCase());
    if (t2 && t2.toLowerCase() !== "bye") selectedTeams.add(t2.toLowerCase());
  }
  
  // Helper to build dropdown values
  var applyValidation = function(rowNum, colNum, options, currentVal) {
    var list = [];
    options.forEach(function(o) {
      if (o && list.indexOf(o) === -1) list.push(o);
    });
    // Ensure current value is included to avoid validation error warnings
    if (currentVal && list.indexOf(currentVal) === -1) {
      list.push(currentVal);
    }
    
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(list, true)
      .setAllowInvalid(false)
      .build();
    bracketsSheet.getRange(rowNum, colNum).setDataValidation(rule);
  };
  
  // 3. Apply validations for Round 1 (rows 2 to 17)
  for (var r = 2; r <= 17; r++) {
    if (r > totalRows) break;
    
    var t1Val = (matchData[r - 1][2] || "").toString().trim();
    var t2Val = (matchData[r - 1][3] || "").toString().trim();
    
    // Team 1 dropdown: Registered teams minus teams chosen in other matches
    var t1Options = ["BYE"];
    registeredTeams.forEach(function(team) {
      if (!selectedTeams.has(team.toLowerCase()) || team.toLowerCase() === t1Val.toLowerCase()) {
        t1Options.push(team);
      }
    });
    applyValidation(r, 3, t1Options, t1Val);
    
    // Team 2 dropdown: Registered teams minus teams chosen in other matches
    var t2Options = ["BYE"];
    registeredTeams.forEach(function(team) {
      if (!selectedTeams.has(team.toLowerCase()) || team.toLowerCase() === t2Val.toLowerCase()) {
        t2Options.push(team);
      }
    });
    applyValidation(r, 4, t2Options, t2Val);
    
    // Winner dropdown: Team 1 name, Team 2 name, or TBD
    var wOptions = ["TBD"];
    if (t1Val) wOptions.push(t1Val);
    if (t2Val) wOptions.push(t2Val);
    applyValidation(r, 6, wOptions, (matchData[r - 1][5] || "").toString().trim());
  }
  
  // 4. Apply validations for subsequent rounds (rows 18 to 32)
  for (var r = 18; r <= totalRows; r++) {
    var t1Val = (matchData[r - 1][2] || "").toString().trim();
    var t2Val = (matchData[r - 1][3] || "").toString().trim();
    var src1 = (matchData[r - 1][9] || "").toString().trim(); // Source Match 1 ID (e.g. M01)
    var src2 = (matchData[r - 1][10] || "").toString().trim(); // Source Match 2 ID (e.g. M02)
    
    // Resolve Team 1 choices (from Source Match 1 winner, or predecessor team choices)
    var t1Options = ["TBD", "BYE"];
    if (src1) {
      var src1Row = parseInt(src1.replace("M", ""), 10) + 1;
      if (src1Row > 1 && src1Row < r) {
        var s1T1 = (matchData[src1Row - 1][2] || "").toString().trim();
        var s1T2 = (matchData[src1Row - 1][3] || "").toString().trim();
        var s1Win = (matchData[src1Row - 1][5] || "").toString().trim();
        if (s1T1 && s1T1 !== "BYE") t1Options.push(s1T1);
        if (s1T2 && s1T2 !== "BYE") t1Options.push(s1T2);
        if (s1Win && s1Win !== "TBD" && s1Win !== "BYE") t1Options.push(s1Win);
      }
    }
    applyValidation(r, 3, t1Options, t1Val);
    
    // Resolve Team 2 choices (from Source Match 2 winner, or predecessor team choices)
    var t2Options = ["TBD", "BYE"];
    if (src2) {
      var src2Row = parseInt(src2.replace("M", ""), 10) + 1;
      if (src2Row > 1 && src2Row < r) {
        var s2T1 = (matchData[src2Row - 1][2] || "").toString().trim();
        var s2T2 = (matchData[src2Row - 1][3] || "").toString().trim();
        var s2Win = (matchData[src2Row - 1][5] || "").toString().trim();
        if (s2T1 && s2T1 !== "BYE") t2Options.push(s2T1);
        if (s2T2 && s2T2 !== "BYE") t2Options.push(s2T2);
        if (s2Win && s2Win !== "TBD" && s2Win !== "BYE") t2Options.push(s2Win);
      }
    }
    applyValidation(r, 4, t2Options, t2Val);
    
    // Winner dropdown: Team 1, Team 2, or TBD
    var wOptions = ["TBD"];
    if (t1Val && t1Val !== "TBD") wOptions.push(t1Val);
    if (t2Val && t2Val !== "TBD") wOptions.push(t2Val);
    applyValidation(r, 6, wOptions, (matchData[r - 1][5] || "").toString().trim());
  }
}

/**
 * Spreadsheet-level edit listener to trigger real-time dropdown updates on selection changes.
 */
function onEdit(e) {
  if (!e) return;
  var range = e.range;
  var sheet = range.getSheet();
  var sheetName = sheet.getName();
  
  // Real-time dynamic validation updates for brackets selections
  if (sheetName === "Brackets") {
    var col = range.getColumn();
    // Col 3 is Team 1, Col 4 is Team 2, Col 6 is Winner
    if (col === 3 || col === 4 || col === 6) {
      updateBracketDropdowns();
    }
  }
}

// =============================================================================
//  MATCH TIME SCHEDULER SIDEBAR
// =============================================================================

/**
 * Opens the HTML Match Scheduler sidebar panel.
 */
function showTimeScheduler() {
  var html = HtmlService.createHtmlOutputFromFile('TimeScheduler')
      .setTitle('Match Scheduler')
      .setWidth(350);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Retrieves details (Match ID, Team names, current date/time) for the selected row in "Brackets"
 */
function getActiveMatchDetails() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    if (sheet.getName() !== "Brackets") {
      return { error: "Please open and select a row in the 'Brackets' sheet first." };
    }
    
    var activeCell = sheet.getActiveCell();
    var rowIdx = activeCell.getRow();
    if (rowIdx <= 1) {
      return { error: "Please select a valid Match row (Row 2 or below)." };
    }
    
    var rowData = sheet.getRange(rowIdx, 1, 1, 13).getValues()[0];
    var matchId = (rowData[0] || "").toString().trim();
    var team1 = (rowData[2] || "").toString().trim();
    var team2 = (rowData[3] || "").toString().trim();
    var timeStr = (rowData[7] || "").toString().trim(); // Column H (8)
    var formatStr = (rowData[11] || "BO1").toString().trim(); // Column L (12)
    var mapsStr = (rowData[12] || "").toString().trim(); // Column M (13)
    
    if (!matchId) {
      return { error: "Selected row does not contain a valid Match ID." };
    }
    
    // Parse existing ISO date-time (e.g. 2026-07-31T20:00:00+05:00)
    var dateVal = "";
    var timeVal = "";
    var offsetVal = "+5"; // Default
    
    if (timeStr && timeStr.includes("T")) {
      var parts = timeStr.split("T");
      dateVal = parts[0];
      
      var timeParts = parts[1].split(/[+-]/);
      if (timeParts[0]) {
        timeVal = timeParts[0].substring(0, 5); // HH:MM
      }
      
      var hasPlus = parts[1].includes("+");
      var hasMinus = parts[1].includes("-");
      if (hasPlus || hasMinus) {
        var sign = hasPlus ? "+" : "-";
        var offsetStr = parts[1].substring(parts[1].indexOf(sign));
        // Convert "+05:30" back to "+5.5"
        var offsetParts = offsetStr.split(":");
        var hrs = parseInt(offsetParts[0], 10);
        var mins = offsetParts[1] ? parseInt(offsetParts[1], 10) : 0;
        var val = hrs + (mins / 60) * (hrs >= 0 ? 1 : -1);
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

/**
 * Saves a formatted ISO 8601 date-time string to the active row's Time column (H)
 */
function saveMatchTime(dateVal, timeVal, offsetVal, formatVal, mapsVal) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  if (sheet.getName() !== "Brackets") {
    throw new Error("Please open the 'Brackets' sheet first.");
  }
  
  var activeCell = sheet.getActiveCell();
  var rowIdx = activeCell.getRow();
  if (rowIdx <= 1) {
    throw new Error("Please select a valid Match row.");
  }
  
  // Format offset float into +/-HH:MM (e.g. +5.5 -> +05:30)
  var val = parseFloat(offsetVal);
  var sign = val >= 0 ? "+" : "-";
  var absVal = Math.abs(val);
  var hrs = Math.floor(absVal);
  var mins = Math.round((absVal - hrs) * 60);
  var offsetFormatted = sign + String(hrs).padStart(2, "0") + ":" + String(mins).padStart(2, "0");
  
  // Construct standard ISO 8601: YYYY-MM-DDTHH:MM:00+HH:MM
  var timestamp = dateVal + "T" + timeVal + ":00" + offsetFormatted;
  
  // Write to Column H (8), Format (12), Selected Maps (13)
  sheet.getRange(rowIdx, 8).setValue(timestamp);
  sheet.getRange(rowIdx, 12).setValue(formatVal || "BO1");
  sheet.getRange(rowIdx, 13).setValue(mapsVal || "");
}
