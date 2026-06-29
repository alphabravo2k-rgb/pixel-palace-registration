/* =============================================================================
   ⚡ PIXEL PALACE — ADMIN OPS BOARD v3.0 (COMPLETE INTEL ENGINE)
   
   Spreadsheet URL: https://docs.google.com/spreadsheets/d/1htkH0PQWbWefE5XFIdf2AGqTxpWMwLyGDMZMfOOL-2E/edit
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

      const steam64  = (player.steam_id_64 || player.steam_id || "").toString().trim();
      const pid      = player.player_id;

      if (elo > 0) teamElos.push(elo);

      const row = i + 1;
      sheet.getRange(row, C.LIVE_ELO).setValue(elo > 0 ? elo : "No ELO");
      sheet.getRange(row, C.SKILL_LVL).setValue(skillLvl || "—");
      sheet.getRange(row, C.RANK_BADGE).setValue(getCS2RankBadge(skillLvl, elo));
      sheet.getRange(row, C.FACEIT_TIER).setValue(tier);
      sheet.getRange(row, C.COUNTRY).setValue(country);
      if (steam64 && steam64.length === 17) sheet.getRange(row, C.STEAM64).setValue(steam64);

      colorSkillCell(sheet.getRange(row, C.SKILL_LVL), skillLvl);

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
              break;
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
function updateSteamData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  if (!sheet || sheet.getLastRow() <= 1) return;
  const data = sheet.getDataRange().getValues();

  const players = [];

  for (let i = 1; i < data.length; i++) {
    let s64 = (data[i][C.STEAM64 - 1] || "").toString().trim();

    if (!isValidSteam64(s64)) {
      const url = (data[i][C.STEAM_URL - 1] || "").toString().trim();
      s64 = resolveFromUrl(url) || "";
    }

    if (!isValidSteam64(s64)) continue;

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

  const banMap     = fetchBansBatch(allIds);
  const profileMap = fetchSummariesBatch(allIds);

  for (const { rowIdx, steam64 } of players) {
    const row     = rowIdx + 1;
    const ban     = banMap[steam64]     || {};
    const profile = profileMap[steam64] || {};

    const vacBanned  = ban.VACBanned  || false;
    const gameBanned = (ban.NumberOfGameBans || 0) > 0;
    const vacCell    = sheet.getRange(row, C.VAC_BAN);
    const gameCell   = sheet.getRange(row, C.GAME_BAN);

    vacCell.setValue(vacBanned  ? "BANNED ⚠" : "Clean");
    gameCell.setValue(gameBanned ? `BANNED (${ban.NumberOfGameBans})` : "Clean");

    if (vacBanned) vacCell.setBackground("#EA4335").setFontColor("white").setFontWeight("bold");
    else           vacCell.setBackground("#C8E6C9").setFontColor("#1B5E20");

    if (gameBanned) gameCell.setBackground("#FF6D00").setFontColor("white").setFontWeight("bold");
    else            gameCell.setBackground("#C8E6C9").setFontColor("#1B5E20");

    if (profile.timecreated) {
      const ageYrs = ((Date.now() - profile.timecreated * 1000) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
      sheet.getRange(row, C.STEAM_AGE).setValue(ageYrs);
    }

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
  const teamRow = teamStartIdx + 1;

  sheet.getRange(teamRow, C.AVG_ELO).setValue(avgElo);
  sheet.getRange(teamRow, C.SEED)
       .setValue(seed.label)
       .setBackground(seed.bg)
       .setFontColor(seed.fg)
       .setFontWeight("bold")
       .setHorizontalAlignment("center");
}

// ── RISK FLAG ENGINE ──────────────────────────────────────────────────────────
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

    if (vac.includes("BANNED") || gameBan.includes("BANNED")) {
      sheet.getRange(i + 1, C.PLAYER_NAME).setBackground("#FFCDD2");
    }
  }
  applyFlag(teamStartRow, flags);
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

// ── TRIGGERED EVENT SYNC BACK TO RAW REGISTER SHEET ───────────────────────────
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  
  if (sheetName === "Sheet1") {
    const col = range.getColumn();
    
    // Column O (Column 15) is the Registration status column
    if (col === 15) {
      const oldValue = e.oldValue ? String(e.oldValue).trim().toUpperCase() : "";
      const newValue = e.value ? String(e.value).trim().toUpperCase() : "";
      
      if (oldValue === newValue) return;
      
      // Get the team name from Column B (Column 2) of the top-left cell of the merged block
      const teamName = sheet.getRange(range.getRow(), 2).getValue().toString().trim();
      if (!teamName) return;
      
      // Real-time status sync back to Raw Registrations Spreadsheet
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

// ── UTILITY FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Resolve a Steam64 ID from a community URL.
 * Handles /profiles/STEAMID64 and /id/vanityname formats.
 * NOTE: In v3 we primarily get Steam64 from FACEIT API directly.
 * This is only a fallback for players where FACEIT fetch failed.
 */
function resolveFromUrl(url) {
  if (!url) return null;
  const clean = url.toString().trim().replace(/\/$/, "");
  
  // profiles match
  const profMatch = clean.match(/\/profiles\/([0-9]{17})/);
  if (profMatch) return profMatch[1];
  
  // id match
  const idMatch = clean.match(/\/id\/([^\/]+)/);
  if (idMatch) {
    const vanity = idMatch[1];
    try {
      const r = UrlFetchApp.fetch(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${vanity}`,
        { muteHttpExceptions: true }
      );
      if (r.getResponseCode() === 200) {
        const json = JSON.parse(r.getContentText());
        if (json.response && json.response.steamid) {
          return json.response.steamid;
        }
      }
    } catch (e) {}
  }
  return null;
}

function isValidSteam64(id) {
  return id && /^[0-9]{17}$/.test(id.toString().trim());
}

function getCS2RankBadge(skillLvl, elo) {
  if (!skillLvl || skillLvl === "—") return "Unranked";
  const lvl = parseInt(skillLvl);
  if (isNaN(lvl)) return "Unranked";
  if (lvl === 1) return "Level 1 (Silver)";
  if (lvl <= 3) return "Level " + lvl + " (Gold Nova)";
  if (lvl <= 6) return "Level " + lvl + " (Master Guardian)";
  if (lvl <= 8) return "Level " + lvl + " (LE / Supreme)";
  if (lvl <= 9) return "Level " + lvl + " (Global Elite)";
  if (lvl >= 10) return "Level 10 (Challenger)";
  return "Level " + skillLvl;
}

function colorSkillCell(range, level) {
  if (!level) return;
  const lvl = parseInt(level);
  if (isNaN(lvl)) return;
  let bg = "#ffffff", fg = "#000000";
  if (lvl <= 3) { bg = "#e8eaed"; fg = "#5f6368"; }
  else if (lvl <= 7) { bg = "#ffe599"; fg = "#7f6000"; }
  else if (lvl <= 9) { bg = "#c9daf8"; fg = "#1155cc"; }
  else if (lvl >= 10) { bg = "#f4cccc"; fg = "#cc0000"; }
  range.setBackground(bg).setFontColor(fg).setFontWeight("bold").setHorizontalAlignment("center");
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function parseRole(name) {
  if (name.includes("©")) return "Captain";
  if (name.includes("(Partner)")) return "Partner";
  if (name.includes("(Sub)")) return "Substitute";
  return "—";
}
