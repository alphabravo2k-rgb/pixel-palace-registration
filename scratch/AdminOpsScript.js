/**
 * PIXEL PALACE — COMMUNITY CUP 2 ADMIN OPERATIONS SCRIPT v3.0
 *
 * Deployed in: Pixel Palace Community Cup 2 Admin Sheet
 * Sheet ID: 1_B_ovDmGuA1rAityrgAz_G3csBtLl4OFfwJUMWXXe_E
 *
 * ══════════════════════════════════════════════════════════════
 *  15-COLUMN LAYOUT (Columns A through O)
 * ══════════════════════════════════════════════════════════════
 *  A   : S.N               ─── Merged 7 rows (team-level)
 *  B   : Region             ─── Merged 7 rows (team-level)
 *  C   : Logo URL           ─── Merged 7 rows (team-level)
 *  D   : Steam Profile      ─── Per player
 *  E   : Discord ID         ─── Per player
 *  F   : Player Name        ─── Per player (Captain ©, Sub tagged)
 *  G   : Faceit Profile     ─── Per player
 *  H   : Live ELO           ─── Per player (auto-fetched)
 *  I   : Joined Discord?    ─── Per player (admin fills)
 *  J   : Role Issued?       ─── Per player (admin fills)
 *  K   : Team Name          ─── Merged 7 rows (team-level)
 *  L   : Average ELO        ─── Merged 7 rows (team-level, auto-calculated)
 *  M   : Registration Status─── Merged 7 rows (team-level, admin edits)
 *  N   : Team Seed          ─── Merged 7 rows (team-level, auto-calculated)
 *  O   : Admin Remarks      ─── Merged 7 rows (team-level)
 * ══════════════════════════════════════════════════════════════
 *
 *  Raw Sheet Column Map (18v5CFox5pRSRNhEtx9kmkVJHNDwH2K84hvMIH-KZyEc):
 *  A(0) : Team ID        B(1) : Timestamp     C(2) : Tournament ID
 *  D(3) : Submission ID  E(4) : Status        F(5) : Team Name
 *  G(6) : Team Tag       H(7) : Region        I(8) : Logo URL
 *  J(9) : P1 Discord    K(10): P1 Steam      L(11): P1 Faceit   M(12): P1 Rank
 *  N(13): P2 Discord    O(14): P2 Steam      P(15): P2 Faceit   Q(16): P2 Rank
 *  ...and so on (4 cols per player, P1-P7)
 */

const RAW_SHEET_ID   = "18v5CFox5pRSRNhEtx9kmkVJHNDwH2K84hvMIH-KZyEc";
const FACEIT_API_KEY = "a77d0763-5fdd-4bde-a8a5-6e840408de2e";

// Column numbers (1-indexed for getRange)
const COL = {
  SN          : 1,   // A
  REGION      : 2,   // B
  LOGO        : 3,   // C
  STEAM       : 4,   // D
  DISCORD     : 5,   // E
  PLAYER_NAME : 6,   // F
  FACEIT      : 7,   // G
  LIVE_ELO    : 8,   // H
  JOINED      : 9,   // I
  ROLE_ISSUED : 10,  // J
  TEAM_NAME   : 11,  // K
  AVG_ELO     : 12,  // L
  STATUS      : 13,  // M
  SEED        : 14,  // N
  REMARKS     : 15   // O
};

const TOTAL_COLS = 15;
const PLAYERS_PER_TEAM = 7;
const MERGE_COLS = [COL.SN, COL.REGION, COL.LOGO, COL.TEAM_NAME, COL.AVG_ELO, COL.STATUS, COL.SEED, COL.REMARKS];

function getSeedColor(seed) {
  const m = { LOW: "#d9d9d9", MID: "#b6d7a8", NORMAL: "#ffe599", AVG: "#f9cb9c", GOOD: "#00ffff", BEST: "#ff00ff" };
  return m[seed] || "#ffffff";
}

function eloToSeed(elo) {
  if (elo <= 1200) return "LOW";
  if (elo <= 1800) return "MID";
  if (elo <= 2200) return "NORMAL";
  if (elo <= 2500) return "AVG";
  if (elo <= 3000) return "GOOD";
  return "BEST";
}

// ─────────────────────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Admin Tools")
    .addItem("Manual Sync from Raw Sheet", "syncRawToAdmin")
    .addItem("Fetch Live ELOs from FACEIT", "updateFaceitElo")
    .addItem("Full Sync + ELO Fetch", "syncAndFetch")
    .addSeparator()
    .addItem("Setup / Fix Headers (Row 1)", "setupHeaders")
    .addItem("Enable Auto-Sync (Every 30 Mins)", "createTimeTriggers")
    .addItem("Remove All Triggers", "removeAllTriggers")
    .addToUi();
}

function syncAndFetch() {
  syncRawToAdmin();
  updateFaceitElo();
  SpreadsheetApp.getActiveSpreadsheet().toast("Sync and ELO fetch complete!", "Done", 5);
}

// ─────────────────────────────────────────────────────────────────────────────
function createTimeTriggers() {
  removeAllTriggers();
  ScriptApp.newTrigger("syncAndFetch").timeBased().everyMinutes(30).create();
  SpreadsheetApp.getUi().alert("Auto-sync enabled every 30 minutes.");
}

function removeAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });
}

// ─────────────────────────────────────────────────────────────────────────────
function setupHeaders() {
  var sheet = getAdminSheet_();
  var headers = [
    "S.N", "Region", "Logo URL", "Steam Profile", "Discord ID",
    "Player Name", "Faceit Profile", "Live ELO",
    "Joined Discord?", "Role Issued?",
    "Team Name", "Average ELO", "Registration Status", "Team Seed", "Admin Remarks"
  ];
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight("bold")
    .setBackground("#263238")
    .setFontColor("#ffffff");
  sheet.setFrozenRows(1);
  SpreadsheetApp.getActiveSpreadsheet().toast("Headers set in Row 1.", "Setup", 4);
}

// ─────────────────────────────────────────────────────────────────────────────
function getAdminSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName("Admin_Ops") || ss.getSheets()[0];
}

// ─────────────────────────────────────────────────────────────────────────────
//  DETECT RAW SHEET COLUMN POSITIONS FROM HEADER ROW
//  Supports two layouts:
//    Layout A (form-submitted): Team ID | Timestamp | Tournament ID | Submission ID | Status | Team Name | Team Tag | Region | Logo | P1 Discord...
//    Layout B (manually entered): Timestamp | Tournament ID | Submission ID | Team Name | Team Tag | Region | Logo | P1 Discord...
// ─────────────────────────────────────────────────────────────────────────────
function getRawColMap_(headerRow) {
  var map = {};
  for (var h = 0; h < headerRow.length; h++) {
    var k = headerRow[h].toString().trim().toLowerCase()
              .replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
    map[k] = h;
  }
  // Resolve common aliases
  var get = function(keys, fallback) {
    for (var x = 0; x < keys.length; x++) {
      if (map[keys[x]] !== undefined) return map[keys[x]];
    }
    return fallback;
  };
  return {
    tournament: get(['tournament_id', 'tournament'], 2),
    teamName:   get(['team_name', 'team name'],      5),
    teamTag:    get(['team_tag', 'team tag'],        6),
    region:     get(['region'],                      7),
    logo:       get(['logo_url', 'logo url'],        8),
    status:     get(['status'],                      4),
    // P1 Discord starts right after logo — detect dynamically
    playerBase: get(['p1_discord', 'p1 discord'],   9)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  SYNC RAW to ADMIN
// ─────────────────────────────────────────────────────────────────────────────
function syncRawToAdmin() {
  var rawSheet   = SpreadsheetApp.openById(RAW_SHEET_ID).getSheets()[0];
  var adminSheet = getAdminSheet_();

  var rawData   = rawSheet.getDataRange().getValues();
  var adminData = adminSheet.getDataRange().getValues();

  if (rawData.length < 1) {
    Logger.log("syncRawToAdmin: raw sheet is empty.");
    return;
  }

  // Auto-detect column positions from header row
  var cols = getRawColMap_(rawData[0]);
  Logger.log("Raw column map: " + JSON.stringify(cols));

  // Determine starting data row — skip header if row 0 looks like headers
  var firstDataRow = 1;
  var firstCell = rawData[0][0] ? rawData[0][0].toString().trim() : "";
  // If row 0 col 0 is NOT a header keyword (e.g. it's a date or team ID), start from row 0
  if (firstCell !== "" && firstCell.toLowerCase() !== "team id" &&
      firstCell.toLowerCase() !== "timestamp" && !firstCell.startsWith("P")) {
    firstDataRow = 0; // no header row
  }

  // Build existing team names from Admin Sheet Col K (0-based index 10)
  var existingTeams = {};
  var teamCount = 0;
  for (var i = 1; i < adminData.length; i++) {
    var v = adminData[i][COL.TEAM_NAME - 1];
    if (v && v.toString().trim()) {
      existingTeams[v.toString().trim().toLowerCase()] = true;
      teamCount++;
    }
  }

  var added = 0;
  for (var i = firstDataRow; i < rawData.length; i++) {
    var row = rawData[i];

    var tid = (row[cols.tournament] || "").toString().trim();
    if (tid !== "community-cup-2") continue;

    var teamName = (row[cols.teamName] || "").toString().trim();
    if (!teamName || existingTeams[teamName.toLowerCase()]) continue;

    var region  = (row[cols.region] || "").toString().trim();
    var logoUrl = (row[cols.logo]   || "").toString().trim();
    var startRow = adminSheet.getLastRow() + 1;
    var sn = "TEAM " + (teamCount + added + 1);
    var rows = [];

    for (var p = 0; p < PLAYERS_PER_TEAM; p++) {
      var base    = cols.playerBase + p * 4;
      var discord = (row[base]     || "").toString().trim() || "N/A";
      var steam   = (row[base + 1] || "").toString().trim() || "N/A";
      var faceit  = (row[base + 2] || "").toString().trim() || "N/A";

      var roleTag = p === 0 ? " (C)" : (p >= 5 ? " (Sub)" : "");
      var pName   = (faceit !== "N/A")
        ? faceit.replace(/\/$/, "").split("/").pop() + roleTag
        : discord + roleTag;

      var r = [];
      for (var x = 0; x < TOTAL_COLS; x++) r.push("");
      r[COL.SN          - 1] = p === 0 ? sn       : "";
      r[COL.REGION      - 1] = p === 0 ? region   : "";
      r[COL.LOGO        - 1] = p === 0 ? logoUrl  : "";
      r[COL.STEAM       - 1] = steam;
      r[COL.DISCORD     - 1] = discord;
      r[COL.PLAYER_NAME - 1] = pName;
      r[COL.FACEIT      - 1] = faceit;
      r[COL.LIVE_ELO    - 1] = "Fetching...";
      r[COL.TEAM_NAME   - 1] = p === 0 ? teamName : "";
      r[COL.AVG_ELO     - 1] = p === 0 ? "Pending" : "";
      r[COL.STATUS      - 1] = p === 0 ? "PENDING" : "";
      r[COL.SEED        - 1] = p === 0 ? "TBD" : "";
      rows.push(r);
    }

    adminSheet.getRange(startRow, 1, PLAYERS_PER_TEAM, TOTAL_COLS).setValues(rows);

    MERGE_COLS.forEach(function(col) {
      adminSheet.getRange(startRow, col, PLAYERS_PER_TEAM, 1)
        .merge()
        .setVerticalAlignment("middle")
        .setHorizontalAlignment("center");
    });

    existingTeams[teamName.toLowerCase()] = true;
    added++;
  }

  Logger.log("syncRawToAdmin: added " + added + " team(s).");
  if (added > 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Synced " + added + " new team(s).", "Sync Done", 5);
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast("No new teams found.", "Sync Done", 3);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  FETCH LIVE ELO
// ─────────────────────────────────────────────────────────────────────────────
function updateFaceitElo() {
  var adminSheet = getAdminSheet_();
  var data       = adminSheet.getDataRange().getValues();

  var options = {
    method: "get",
    headers: { Authorization: "Bearer " + FACEIT_API_KEY },
    muteHttpExceptions: true
  };

  // Map: teamName -> { startDataRow (1-indexed), elos[] }
  var teamMap = {};

  for (var i = 1; i < data.length; i++) {
    var tName = (data[i][COL.TEAM_NAME - 1] || "").toString().trim();
    if (tName && !teamMap[tName]) {
      teamMap[tName] = { dataRow: i + 1, elos: [] };
    }

    var faceitUrl = (data[i][COL.FACEIT - 1] || "").toString().trim();
    if (!faceitUrl || !faceitUrl.includes("faceit.com")) continue;

    var nickname = faceitUrl.replace(/\/$/, "").split("/").pop();
    if (!nickname || nickname === "N/A" || nickname === "faceit.com") continue;

    try {
      var resp = UrlFetchApp.fetch(
        "https://open.faceit.com/data/v4/players?nickname=" + encodeURIComponent(nickname),
        options
      );
      if (resp.getResponseCode() === 200) {
        var json = JSON.parse(resp.getContentText());
        var elo  = 0;
        if (json.games) {
          elo = json.games.cs2
            ? json.games.cs2.faceit_elo
            : (json.games.csgo ? json.games.csgo.faceit_elo : 0);
        }
        adminSheet.getRange(i + 1, COL.LIVE_ELO).setValue(elo > 0 ? elo : "N/A");

        // Attribute ELO to current team (search upward for team name)
        var key = "";
        for (var k = i; k >= 1; k--) {
          var candidate = (data[k][COL.TEAM_NAME - 1] || "").toString().trim();
          if (candidate) { key = candidate; break; }
        }
        if (key && teamMap[key] && elo > 0) teamMap[key].elos.push(elo);
      }
    } catch (e) {
      Logger.log("ELO fetch error for " + nickname + ": " + e);
    }
  }

  // Update Average ELO and Seed for each team
  for (var tName in teamMap) {
    var info = teamMap[tName];
    if (!info.elos.length) continue;
    var sum = 0;
    for (var x = 0; x < info.elos.length; x++) sum += info.elos[x];
    var avg  = Math.round(sum / info.elos.length);
    var seed = eloToSeed(avg);
    adminSheet.getRange(info.dataRow, COL.AVG_ELO).setValue(avg);
    adminSheet.getRange(info.dataRow, COL.SEED)
      .setValue(seed)
      .setBackground(getSeedColor(seed))
      .setFontWeight("bold");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  ON EDIT — sync status change back to Raw Sheet
// ─────────────────────────────────────────────────────────────────────────────
function onEdit(e) {
  // Guard: e is undefined when run manually from the Apps Script editor
  if (!e || !e.range) return;

  var range = e.range;
  var sheet = range.getSheet();

  if (range.getColumn() !== COL.STATUS) return;

  var newStatus = e.value ? e.value.toString().trim().toUpperCase() : "";
  var oldStatus = e.oldValue ? e.oldValue.toString().trim().toUpperCase() : "";
  if (newStatus === oldStatus) return;

  // Get team name from Col K; merged cells may return "" for sub-rows
  var teamName = sheet.getRange(range.getRow(), COL.TEAM_NAME).getValue().toString().trim();
  if (!teamName) {
    // Search upward
    for (var r = range.getRow() - 1; r >= 2; r--) {
      teamName = sheet.getRange(r, COL.TEAM_NAME).getValue().toString().trim();
      if (teamName) break;
    }
  }
  if (!teamName) return;

  syncStatusToRaw_(teamName, newStatus);
}

function syncStatusToRaw_(teamName, newStatus) {
  try {
    var rawSheet = SpreadsheetApp.openById(RAW_SHEET_ID).getSheets()[0];
    var data     = rawSheet.getDataRange().getValues();
    if (data.length < 1) return;

    // Auto-detect column positions
    var cols = getRawColMap_(data[0]);
    var firstDataRow = 1;
    var firstCell = data[0][0] ? data[0][0].toString().trim() : "";
    if (firstCell !== "" && firstCell.toLowerCase() !== "team id" &&
        firstCell.toLowerCase() !== "timestamp") {
      firstDataRow = 0;
    }

    for (var i = firstDataRow; i < data.length; i++) {
      var tn = (data[i][cols.teamName] || "").toString().trim();
      if (tn.toLowerCase() !== teamName.toLowerCase()) continue;
      var existingStatus = (data[i][cols.status] || "").toString().trim().toUpperCase();
      if (existingStatus !== newStatus) {
        rawSheet.getRange(i + 1, cols.status + 1).setValue(newStatus);
      }
      break;
    }
  } catch (err) {
    Logger.log("syncStatusToRaw_ error: " + err);
  }
}
