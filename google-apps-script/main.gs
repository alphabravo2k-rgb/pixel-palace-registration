/**
 * =============================================================================
 *  PIXEL PALACE — TOURNAMENT OPERATIONS CENTER (TOC) MAIN UTILITIES (v6.0)
 * =============================================================================
 */function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  // 1. Admin Tools Menu (Legacy Registrations)
  ui.createMenu("Admin Tools")
    .addItem("Full Sync - All Sources", "syncAndFetch")
    .addSeparator()
    .addItem("Setup / Fix Column Headers", "setupNewColumns")
    .addItem("Fill Roles from Player Names", "fillRolesFromNames")
    .addItem("Sync New Teams Only", "syncRawToAdmin")
    .addItem("Refresh FACEIT Data", "updateFaceitData")
    .addItem("Refresh Steam Data", "updateSteamData")
    .addItem("Force Refresh FACEIT (All)", "forceUpdateFaceitData")
    .addItem("Force Refresh Steam (All)", "forceUpdateSteamData")
    .addSeparator()
    .addItem("Re-run Risk Flags", "flagAtRiskPlayers")
    .addItem("Rebuild Summary Sheet", "buildSummarySheet")
    .addItem("Fix Merged Cells", "fixMerges")
    .addItem("Setup Status Dropdown", "setupValidation")
    .addItem("Setup Brackets Sheet", "setupBracketsSheet")
    .addItem("Schedule Match Time", "showTimeScheduler")
    .addSeparator()
    .addItem("Enable Auto-Sync (30 min)", "setupTrigger")
    .addItem("Disable Auto-Sync", "removeTrigger")
    .addToUi();

  // 2. Tournament Tools Menu (TOC Engine)
  ui.createMenu("🏆 Tournament Tools")
    .addItem("🔍 Validate Schema & Start Validations", "menuValidateSchema")
    .addItem("🔧 Repair Formula Templates (R1C1)", "menuRepairFormulas")
    .addItem("📈 Rebuild Dashboard Counters", "menuRebuildCounters")
    .addItem("👥 Sync Teams from Admin_Ops", "menuSyncTeams")
    .addItem("💾 Backup Workbook to Drive", "menuBackupWorkbook")
    .addItem("🔄 Migrate Schema", "menuMigrateSchema")
    .addSeparator()
    .addItem("🛠️ Setup & Configure TOC Tabs", "menuSetupTOC")
    .addItem("🧹 Archive Old Audit Logs", "menuArchiveAuditLogs")
    .addToUi();
}

/**
 * Main edit trigger for both legacy Admin_Ops sync and TOC matches.
 */
function onEdit(e) {
  if (!e || !e.range) return;
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  
  // A. LEGACY ADMIN_OPS EDIT HANDLER
  if (sheetName === 'Admin_Ops' || sheetName === 'Sheet1') {
    if (typeof C !== 'undefined' && range.getColumn() === C.REG_STATUS) {
      var newStatus = e.value ? e.value.toString().trim().toUpperCase() : "";
      var oldStatus = e.oldValue ? e.oldValue.toString().trim().toUpperCase() : "";
      if (newStatus === oldStatus) return;

      var teamName = sheet.getRange(range.getRow(), C.TEAM_NAME).getValue().toString().trim();
      if (!teamName) {
        for (var r = range.getRow() - 1; r >= 2; r--) {
          teamName = sheet.getRange(r, C.TEAM_NAME).getValue().toString().trim();
          if (teamName) break;
        }
      }
      if (!teamName) return;
      if (typeof syncStatusToRaw_ === 'function') {
        syncStatusToRaw_(teamName, newStatus);
      }
    }
    return;
  }
  
  // B. TOC_MATCHES EDIT HANDLER
  if (sheetName === 'TOC_Matches') {
    initializeDynamicColumns(sheet);
    const rowIdx = range.getRow();
    if (rowIdx < 3) return; // Skip headers
    
    const colIdx = range.getColumn();
    
    // Ignore edits to read-only/protected/formula columns in script
    if (isManuallyLockedField(colIdx)) return;
    
    const internalId = sheet.getRange(rowIdx, COL.INTERNAL_ID).getValue().toString();
    const oldValue = e.oldValue !== undefined ? e.oldValue : '';
    const newValue = e.value !== undefined ? e.value : '';
    
    // Resolve column name
    const colKeys = Object.keys(COL);
    let colName = `COL_${colIdx}`;
    for (let i = 0; i < colKeys.length; i++) {
      if (COL[colKeys[i]] === colIdx) {
        colName = colKeys[i];
        break;
      }
    }
    
    // Log manual edit
    writeAuditEntry(internalId, colName, 'UPDATE', oldValue, newValue);
    
    // Concurrency version increment & state checks
    incrementRowVersion(sheet, rowIdx);
    sheet.getRange(rowIdx, COL.NEEDS_SYNC).setValue('Pending');
    sheet.getRange(rowIdx, COL.LAST_UPDATED).setValue(new Date());
    sheet.getRange(rowIdx, COL.LAST_UPDATED_BY).setValue(Session.getActiveUser().getEmail());
    
    // Re-run health checks and counters
    processHealthBatch();
    rebuildCounters();
  }
}

function menuValidateSchema() {
  const errors = runStartupValidations();
  if (errors.length === 0) {
    SpreadsheetApp.getUi().alert("✅ Startup Validations clean. Schema and data integrity verified.");
  } else {
    SpreadsheetApp.getUi().alert(`🔴 Validation warnings detected (${errors.length}):\n\n${errors.slice(0,10).join('\n')}\n... See SYS_Error_Log for details.`);
  }
}

function menuRepairFormulas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const matchesSheet = ss.getSheetByName('TOC_Matches');
  if (!matchesSheet) {
    SpreadsheetApp.getUi().alert("Error: TOC_Matches sheet is missing.");
    return;
  }
  initializeDynamicColumns(matchesSheet);
  repairFormulas(matchesSheet);
  SpreadsheetApp.getUi().alert("✅ Formula templates successfully restored (R1C1).");
}

function menuRebuildCounters() {
  rebuildCounters();
  SpreadsheetApp.getUi().alert("✅ Counter stats successfully rebuilt.");
}

function menuSyncTeams() {
  const result = syncAdminOpsToTeams();
  SpreadsheetApp.getUi().alert(`✅ Team synchronization complete!\n\nAdded: ${result.added} new team(s)\nUpdated: ${result.updated} team(s)`);
}

function menuBackupWorkbook() {
  backupWorkbook();
}


function menuMigrateSchema() {
  migrateSchema();
}

function menuSetupTOC() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.alert("Configure TOC Workbook", "Are you sure you want to setup/align all TOC sheets and columns? This will overwrite configuration tabs.", ui.ButtonSet.YES_NO);
  if (res === ui.Button.YES) {
    setupTOCSheets();
  }
}

function menuArchiveAuditLogs() {
  archiveAuditLogs();
  SpreadsheetApp.getUi().alert("✅ Audit logs checked and archived if necessary.");
}

/**
 * Initializes and configures all required TOC sheets, columns, and data validations.
 */
function setupTOCSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup TOC_Settings Tab
  let settingsSheet = ss.getSheetByName('TOC_Settings');
  if (!settingsSheet) settingsSheet = ss.insertSheet('TOC_Settings');
  settingsSheet.clear();
  settingsSheet.appendRow(['Constant Key', 'Value', 'Description']);
  const settingsRows = [
    ['Schema_Version', 6, 'Current dynamic schema layout version'],
    ['Settings_Version', 1, 'Current settings mapping version'],
    ['Poll_Live_Sec', 30, 'Live polling interval (seconds)'],
    ['Poll_Warmup_Sec', 60, 'Warmup/Pause polling interval (seconds)'],
    ['Poll_Scheduled_Near_Sec', 300, 'Scheduled matches < 2h polling (seconds)'],
    ['Poll_Scheduled_Far_Sec', 900, 'Scheduled matches > 2h polling (seconds)'],
    ['Stale_Warn_Min', 5, 'Warning threshold for late polling (minutes)'],
    ['Stale_Error_Min', 10, 'Error threshold for stale connection (minutes)'],
    ['Stale_Fail_Count', 3, 'Consecutive failed API attempts before offline'],
    ['Warn_Before_Match_Min', 60, 'Trigger warnings for unassigned referees/casters (minutes)'],
    ['Demo_Missing_Warn_Min', 60, 'Demo URL missing trigger on finished matches (minutes)'],
    ['Est_BO1_Min', 90, 'BO1 duration (minutes)'],
    ['Est_BO3_Min', 150, 'BO3 duration (minutes)'],
    ['Est_BO5_Min', 240, 'BO5 duration (minutes)'],
    ['Dashboard_Refresh_Min', 5, 'Dashboard refresh time'],
    ['Override_Warn_Days', 1, 'Flag overrides left unresolved for longer than (days)'],
    ['Sync_Retry_Min', 5, 'Failed sync entries retried interval (minutes)'],
    ['Backup_Folder_Id', '', 'Drive Folder ID to copy backups into'],
    ['Enable_Discord', 'TRUE', 'Global Discord bot alerts flag'],
    ['Enable_Poller', 'TRUE', 'Global API Poller execution flag'],
    ['Enable_Audit', 'TRUE', 'Global User Edit Logging flag'],
    ['Enable_Dashboard', 'TRUE', 'Global Dashboard rebuilds flag'],
    ['Enable_Webhook', 'TRUE', 'Enable incoming webhook endpoint processing'],
    ['Enable_ProcessByes', 'TRUE', 'Enable automated round 1 BYE advancements']
  ];
  settingsSheet.getRange(2, 1, settingsRows.length, 3).setValues(settingsRows);
  settingsSheet.setFrozenRows(1);
  
  // 2. Setup SYS_Counters Tab
  let countersSheet = ss.getSheetByName('SYS_Counters');
  if (!countersSheet) countersSheet = ss.insertSheet('SYS_Counters');
  countersSheet.clear();
  countersSheet.appendRow(['Counter Key', 'Value']);
  
  // 3. Setup SYS_Error_Log, SYS_Poll_Log, SYS_Audit_Log, SYS_Propagation_Log
  const logs = [
    { name: 'SYS_Error_Log', cols: ['Timestamp', 'Type', 'Error Message'] },
    { name: 'SYS_Poll_Log', cols: ['Timestamp', 'Match Internal ID', 'Provider', 'Result Status', 'HTTP Code', 'Latency (ms)', 'Bytes Received', 'Rows Updated', 'Duration', 'Error'] },
    { name: 'SYS_Audit_Log', cols: ['Timestamp', 'Row ID', 'Col Name', 'Action Type', 'Old Value', 'New Value', 'User', 'IP Address'] },
    { name: 'SYS_Propagation_Log', cols: ['Timestamp', 'Source Match ID', 'Target Match ID', 'Propagated Team UUID', 'Slot'] }
  ];
  logs.forEach(log => {
    let sheet = ss.getSheetByName(log.name);
    if (!sheet) sheet = ss.insertSheet(log.name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(log.cols);
      sheet.setFrozenRows(1);
      sheet.hideSheet();
    }
  });
  
  // 4. Setup TOC_Config Tab
  let configSheet = ss.getSheetByName('TOC_Config');
  if (!configSheet) configSheet = ss.insertSheet('TOC_Config');
  if (configSheet.getLastRow() === 0) {
    const configHeaders = [
      'Tournament ID', 'Tournament Name', 'Tournament Slug', 'Template', 'Game',
      'Format', 'Max Teams', 'Teams Registered', 'Players Per Team', 'Subs Max',
      'Default Best Of', 'Default Map Pool', 'Tournament Timezone', 'UTC Offset (min)',
      'Tournament Start', 'Tournament End', 'Phase', 'Prize Pool', 'Discord Webhook',
      'Default Stream', 'Ruleset URL', 'Tournament Logo', 'Brand Color', 'Accent Color',
      'Default Discord Role', 'Default Language', 'Public URL', 'Schema Version',
      'Created At', 'Last Updated'
    ];
    configSheet.appendRow(configHeaders);
    configSheet.setFrozenRows(1);
    
    // Add CC2 row as defaults
    configSheet.appendRow([
      'CC2', 'Community Cup II', 'community-cup-ii', 'Community Cup', 'CS2',
      'SE', 32, '=COUNTIF(TOC_Teams!F:F, A2)', 5, 2,
      'BO3', 'active_duty', 'PKT', 300,
      '2026-07-31', '2026-08-03', 'Planning', '$500', '',
      '', '', '', '#7C3AED', '#A78BFA',
      '', 'English', '=CONCAT("https://pixelpalace.gg/tournament/", C2)', 6,
      new Date(), new Date()
    ]);
  }
  
  // 5. Setup TOC_Teams Tab
  let teamsSheet = ss.getSheetByName('TOC_Teams');
  if (!teamsSheet) teamsSheet = ss.insertSheet('TOC_Teams');
  if (teamsSheet.getLastRow() === 0) {
    const teamHeaders = ['Team UUID', 'Team Name', 'Team Tag', 'Seed', 'Logo URL', 'Tournament', 'Registration Status', 'Captain UUID', 'Discord Server', 'Contact', 'Created At'];
    teamsSheet.appendRow(teamHeaders);
    teamsSheet.setFrozenRows(1);
    
    // Insert special BYE team
    teamsSheet.appendRow(['TEAM-0000', 'BYE', 'BYE', 0, '', 'CC2', 'Approved', '', '', '', new Date()]);
  }
  
  // 6. Setup TOC_Staff Tab
  let staffSheet = ss.getSheetByName('TOC_Staff');
  if (!staffSheet) staffSheet = ss.insertSheet('TOC_Staff');
  if (staffSheet.getLastRow() === 0) {
    const staffHeaders = ['Staff UUID', 'Name', 'Role', 'Discord', 'Contact', 'Certified', 'Active', 'Notes'];
    staffSheet.appendRow(staffHeaders);
    staffSheet.setFrozenRows(1);
    staffSheet.appendRow(['REF-0001', 'Tournament Director', 'Head Referee', 'Director#0000', 'director@pixelpalace.gg', 'Yes', 'Yes', '']);
  }
  
  // 7. Setup TOC_Matches Tab (The core schema)
  let matchesSheet = ss.getSheetByName('TOC_Matches');
  if (!matchesSheet) matchesSheet = ss.insertSheet('TOC_Matches');
  
  const matchesHeaders = Object.keys(CANONICAL_HEADERS);
  matchesSheet.clearContents();
  
  // Set headers
  matchesSheet.getRange(1, 1, 1, matchesHeaders.length).setValues([matchesHeaders]);
  matchesSheet.getRange(2, 1, 1, matchesHeaders.length).setValue(''); // Blank filter row placeholder
  matchesSheet.setFrozenRows(2);
  
  // Build dynamic column map now to get column locations for styling and validation
  initializeDynamicColumns(matchesSheet);
  
  // Style Headers
  styleHeaders(matchesSheet);
  
  // Apply Groupings (collapses advanced sections)
  setupMatchesGroupings(matchesSheet);
  
  // Apply Dropdown validation rules
  applyMatchesDataValidation(matchesSheet);
  
  // Populate R1C1 Formulas
  repairFormulas(matchesSheet);
  
  // Rebuild dashboard and counters
  rebuildCounters();
  
  ss.toast("TOC sheets and dynamic parameters setup completed!", "TOC Core", 6);
}

/**
 * Styles headers in TOC_Matches with grouping color coding.
 */
function styleHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  
  // Identity section
  sheet.getRange(1, COL.INTERNAL_ID, 1, 3).setBackground('#1C1C1C').setFontColor('white');
  // Bracket section
  sheet.getRange(1, COL.TOURNAMENT, 1, 7).setBackground('#1E3A5F').setFontColor('white');
  // Teams section
  sheet.getRange(1, COL.TEAM_A_ID, 1, 8).setBackground('#1A3C2F').setFontColor('white');
  // Scheduling section
  sheet.getRange(1, COL.SCHEDULED_LOCAL, 1, 5).setBackground('#3D2000').setFontColor('white');
  // Status section
  sheet.getRange(1, COL.STATUS, 1, 13).setBackground('#3D0000').setFontColor('white');
  
  // Other advanced headers default styles
  sheet.getRange(1, 1, 1, lastCol).setFontWeight('bold').setHorizontalAlignment('center');
}

/**
 * Collapses non-essential column blocks to maintain a clean operational viewport (A–AD default visible).
 */
function setupMatchesGroupings(sheet) {
  // Clear any existing column groups
  try {
    const colCount = sheet.getMaxColumns();
    for (let c = 1; c <= colCount; c++) {
      sheet.getRange(1, c).shiftColumnGroupDepth(-1);
    }
  } catch (e) {}

  // Collapsed Sections:
  // LIVE MATCH DATA (Maps Won A through Duration)
  sheet.getRange(1, COL.MAPS_WON_A, 1, 9).shiftColumnGroupDepth(1);
  
  // MAP RESULTS (Map 1 Name to Map 5 Duration)
  sheet.getRange(1, COL.MAP_1_NAME, 1, 30).shiftColumnGroupDepth(1);
  
  // OFFICIALS (Referee ID to Stream ID)
  sheet.getRange(1, COL.REFEREE_ID, 1, 7).shiftColumnGroupDepth(1);
  
  // READY CHECK (Captain A Ready to Observer Ready)
  sheet.getRange(1, COL.CAPTAIN_A_READY, 1, 6).shiftColumnGroupDepth(1);
  
  // OVERRIDE (Override Type to Override Review Required)
  sheet.getRange(1, COL.OVERRIDE_TYPE, 1, 6).shiftColumnGroupDepth(1);
  
  // API INTEGRATION (Match Source to Last Successful Poll)
  sheet.getRange(1, COL.MATCH_SOURCE, 1, 6).shiftColumnGroupDepth(1);
  
  // MEDIA (Demo URL to Server Region)
  sheet.getRange(1, COL.DEMO_URL, 1, 4).shiftColumnGroupDepth(1);
  
  // URLS (Public URL to Admin Notes)
  sheet.getRange(1, COL.PUBLIC_URL, 1, 3).shiftColumnGroupDepth(1);
  
  // AUDIT (Created By to Deleted)
  sheet.getRange(1, COL.CREATED_BY, 1, 7).shiftColumnGroupDepth(1);
  
  // Collapse them all
  sheet.collapseAllColumns();
}

/**
 * Applies Google Sheets Data Validation dropdowns to TOC_Matches.
 */
function applyMatchesDataValidation(sheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Simple Dropdowns
  const validations = [
    { col: COL.STATUS, items: ['Pending', 'Scheduled', 'Live', 'Paused', 'Completed', 'Cancelled', 'Walkover', 'Bye', 'DQ', 'Forfeit', 'Tech Win', 'Disputed', 'Postponed'] },
    { col: COL.LIVE_PHASE, items: ['Check-In', 'Warmup', 'Knife', 'Map', 'Halftime', 'Overtime', 'Map Break'] },
    { col: COL.PRIORITY, items: ['Critical', 'High', 'Normal', 'Internal'] },
    { col: COL.BROADCAST, items: ['Off Air', 'Countdown', 'Live', 'Technical Issues', 'Ended'] },
    { col: COL.BEST_OF, items: ['BO1', 'BO3', 'BO5'] },
    { col: COL.OVERRIDE_TYPE, items: ['None', 'Score', 'Winner', 'Status', 'Forfeit', 'Walkover', 'DQ', 'Tech Win', 'Bye'] },
    { col: COL.OVERRIDE_REVIEW_REQUIRED, items: ['YES', 'NO'] },
    { col: COL.NEEDS_SYNC, items: ['Pending', 'Processing', 'Complete', 'Failed'] },
    { col: COL.DELETED, items: ['YES', 'NO'] },
    { col: COL.CAPTAIN_A_READY, items: ['✅', '❌', '⏳', 'N/A'] },
    { col: COL.CAPTAIN_B_READY, items: ['✅', '❌', '⏳', 'N/A'] },
    { col: COL.SERVER_READY, items: ['✅', '❌', '⏳', 'N/A'] },
    { col: COL.REFEREE_READY, items: ['✅', '❌', '⏳', 'N/A'] },
    { col: COL.CASTER_READY, items: ['✅', '❌', '⏳', 'N/A'] },
    { col: COL.OBSERVER_READY, items: ['✅', '❌', '⏳', 'N/A'] }
  ];
  
  validations.forEach(val => {
    if (val.col) {
      const range = sheet.getRange(3, val.col, sheet.getMaxRows() - 2, 1);
      const rule = SpreadsheetApp.newDataValidation().requireValueInList(val.items, true).setAllowInvalid(false).build();
      range.setDataValidation(rule);
    }
  });
  
  // 2. Tournament Config ID Dropdown
  const configRange = ss.getSheetByName('TOC_Config').getRange('A2:A100');
  const tRule = SpreadsheetApp.newDataValidation().requireValueInRange(configRange, true).setAllowInvalid(false).build();
  sheet.getRange(3, COL.TOURNAMENT, sheet.getMaxRows() - 2, 1).setDataValidation(tRule);
  
  // 3. Dynamic Dropdown for Teams: Combined Name + UUID
  // Creates validation from TOC_Teams
  updateTeamsDropdownValidation(sheet);
  
  // 4. Dynamic Dropdown for Staff members
  updateStaffDropdownValidation(sheet);
}

function updateTeamsDropdownValidation(sheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const teamsSheet = ss.getSheetByName('TOC_Teams');
  const lastRow = teamsSheet.getLastRow();
  if (lastRow < 2) return;
  
  // Teams format helper: "Team Name [TEAM-XXXX]"
  // Write to a hidden column in TOC_Teams to create validation range
  const displayNames = teamsSheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
  const uuids = teamsSheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const combined = [];
  for (let i = 0; i < displayNames.length; i++) {
    if (displayNames[i] && uuids[i]) {
      combined.push([`${displayNames[i]} [${uuids[i]}]`]);
    }
  }
  
  // Set dropdown list values in TOC_Teams Col L (hidden helper range)
  teamsSheet.getRange(2, 12, combined.length, 1).setValues(combined);
  
  const validationRange = teamsSheet.getRange(2, 12, combined.length, 1);
  const rule = SpreadsheetApp.newDataValidation().requireValueInRange(validationRange, true).setAllowInvalid(false).build();
  
  sheet.getRange(3, COL.TEAM_A_ID, sheet.getMaxRows() - 2, 1).setDataValidation(rule);
  sheet.getRange(3, COL.TEAM_B_ID, sheet.getMaxRows() - 2, 1).setDataValidation(rule);
}

function updateStaffDropdownValidation(sheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const staffSheet = ss.getSheetByName('TOC_Staff');
  const lastRow = staffSheet.getLastRow();
  if (lastRow < 2) return;
  
  const displayNames = staffSheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
  const uuids = staffSheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const combined = [];
  for (let i = 0; i < displayNames.length; i++) {
    if (displayNames[i] && uuids[i]) {
      combined.push([`${displayNames[i]} [${uuids[i]}]`]);
    }
  }
  
  // Set dropdown list in Col I of TOC_Staff (hidden helper range)
  staffSheet.getRange(2, 9, combined.length, 1).setValues(combined);
  
  const validationRange = staffSheet.getRange(2, 9, combined.length, 1);
  const rule = SpreadsheetApp.newDataValidation().requireValueInRange(validationRange, true).setAllowInvalid(false).build();
  
  sheet.getRange(3, COL.REFEREE_ID, sheet.getMaxRows() - 2, 1).setDataValidation(rule);
  sheet.getRange(3, COL.OBSERVER_ID, sheet.getMaxRows() - 2, 1).setDataValidation(rule);
  sheet.getRange(3, COL.OPS_LEAD_ID, sheet.getMaxRows() - 2, 1).setDataValidation(rule);
}

/**
 * Injects R1C1 formula templates into Matches sheet.
 */
function repairFormulas(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 3) return;
  
  // Template maps using R1C1 syntax (R=Row offset, C=Col offset)
  const DISPLAY_ID_FORMULA = '=CONCAT("PP-", RC[' + (COL.TOURNAMENT - COL.DISPLAY_ID) + '], "-", RC[' + (COL.STAGE - COL.DISPLAY_ID) + '], "-M", TEXT(RC[' + (COL.ROUND - COL.DISPLAY_ID) + '], "00"))';
  
  // Lookup Name, Tag, Seed from TOC_Teams
  // In RC[-1] (J / Team A ID), extract ID via REGEXEXTRACT
  const TEAM_A_NAME_FORMULA = '=IF(RC[-1]="", "TBD", XLOOKUP(REGEXEXTRACT(RC[-1], "\\[([A-Z0-9\\-]+)\\]"), TOC_Teams!A:A, TOC_Teams!B:B, "Unknown"))';
  const TEAM_A_TAG_FORMULA  = '=IF(RC[-2]="", "", XLOOKUP(REGEXEXTRACT(RC[-2], "\\[([A-Z0-9\\-]+)\\]"), TOC_Teams!A:A, TOC_Teams!C:C, ""))';
  const TEAM_A_SEED_FORMULA = '=IF(RC[-3]="", "", XLOOKUP(REGEXEXTRACT(RC[-3], "\\[([A-Z0-9\\-]+)\\]"), TOC_Teams!A:A, TOC_Teams!D:D, ""))';
  
  // Team B counterparts
  const TEAM_B_NAME_FORMULA = '=IF(RC[-1]="", "TBD", XLOOKUP(REGEXEXTRACT(RC[-1], "\\[([A-Z0-9\\-]+)\\]"), TOC_Teams!A:A, TOC_Teams!B:B, "Unknown"))';
  const TEAM_B_TAG_FORMULA  = '=IF(RC[-2]="", "", XLOOKUP(REGEXEXTRACT(RC[-2], "\\[([A-Z0-9\\-]+)\\]"), TOC_Teams!A:A, TOC_Teams!C:C, ""))';
  const TEAM_B_SEED_FORMULA = '=IF(RC[-3]="", "", XLOOKUP(REGEXEXTRACT(RC[-3], "\\[([A-Z0-9\\-]+)\\]"), TOC_Teams!A:A, TOC_Teams!D:D, ""))';
  
  // Staff lookups
  const REF_NAME_FORMULA = '=IF(RC[-1]="", "", XLOOKUP(REGEXEXTRACT(RC[-1], "\\[([A-Z0-9\\-]+)\\]"), TOC_Staff!A:A, TOC_Staff!B:B, ""))';
  const OBS_NAME_FORMULA = '=IF(RC[-1]="", "", XLOOKUP(REGEXEXTRACT(RC[-1], "\\[([A-Z0-9\\-]+)\\]"), TOC_Staff!A:A, TOC_Staff!B:B, ""))';
  const OPS_NAME_FORMULA = '=IF(RC[-1]="", "", XLOOKUP(REGEXEXTRACT(RC[-1], "\\[([A-Z0-9\\-]+)\\]"), TOC_Staff!A:A, TOC_Staff!B:B, ""))';
  
  // Scheduled UTC
  const SCHEDULED_UTC_FORMULA = '=IF(RC[-1]="", "", RC[-1]-TIME(FLOOR(XLOOKUP(RC[-16],TOC_Config!A:A,TOC_Config!N:N,0)/60,1),MOD(XLOOKUP(RC[-16],TOC_Config!A:A,TOC_Config!N:N,0),60),0))';
  
  // Est Finish time
  const EST_FINISH_FORMULA = '=IF(RC[-2]="", "", RC[-2] + TIME(FLOOR(XLOOKUP(IF(RC[1]="BO1", "Est_BO1_Min", IF(RC[1]="BO3", "Est_BO3_Min", "Est_BO5_Min")), TOC_Settings!A:A, TOC_Settings!B:B, 90)/60, 1), MOD(XLOOKUP(IF(RC[1]="BO1", "Est_BO1_Min", IF(RC[1]="BO3", "Est_BO3_Min", "Est_BO5_Min")), TOC_Settings!A:A, TOC_Settings!B:B, 90), 60), 0))';
  
  // Series Score
  const SERIES_SCORE_FORMULA = '=IF(OR(RC[-2]="",RC[-1]=""), "", RC[-2]&"-"&RC[-1])';
  
  // Winners
  const WINNER_NAME_FORMULA = '=IF(RC[-1]="", "", XLOOKUP(RC[-1], TOC_Teams!A:A, TOC_Teams!B:B, ""))';
  const LOSER_ID_FORMULA = '=IF(RC[-2]="", "", IF(RC[-2]=RC[-23], RC[-19], IF(RC[-2]=RC[-19], RC[-23], "")))';
  const LOSER_NAME_FORMULA = '=IF(RC[-1]="", "", XLOOKUP(RC[-1], TOC_Teams!A:A, TOC_Teams!B:B, ""))';
  
  // Controls
  const READY_STATUS_FORMULA = '=IF(AND(RC[18]="✅",RC[19]="✅",RC[20]="✅",RC[21]="✅"), "✅ Ready", "❌ Not Ready")';
  const OVERRIDE_ACTIVE_FORMULA = '=IF(RC[14]<>"None", "YES", "NO")';
  
  // Apply formulas across all row lines
  for (let r = 3; r <= lastRow; r++) {
    sheet.getRange(r, COL.DISPLAY_ID).setFormulaR1C1(DISPLAY_ID_FORMULA);
    
    sheet.getRange(r, COL.TEAM_A_NAME).setFormulaR1C1(TEAM_A_NAME_FORMULA);
    sheet.getRange(r, COL.TEAM_A_TAG).setFormulaR1C1(TEAM_A_TAG_FORMULA);
    sheet.getRange(r, COL.TEAM_A_SEED).setFormulaR1C1(TEAM_A_SEED_FORMULA);
    
    sheet.getRange(r, COL.TEAM_B_NAME).setFormulaR1C1(TEAM_B_NAME_FORMULA);
    sheet.getRange(r, COL.TEAM_B_TAG).setFormulaR1C1(TEAM_B_TAG_FORMULA);
    sheet.getRange(r, COL.TEAM_B_SEED).setFormulaR1C1(TEAM_B_SEED_FORMULA);
    
    sheet.getRange(r, COL.REFEREE_NAME).setFormulaR1C1(REF_NAME_FORMULA);
    sheet.getRange(r, COL.OBSERVER_NAME).setFormulaR1C1(OBS_NAME_FORMULA);
    sheet.getRange(r, COL.OPS_LEAD_NAME).setFormulaR1C1(OPS_NAME_FORMULA);
    
    sheet.getRange(r, COL.SCHEDULED_UTC).setFormulaR1C1(SCHEDULED_UTC_FORMULA);
    sheet.getRange(r, COL.EST_FINISH).setFormulaR1C1(EST_FINISH_FORMULA);
    
    sheet.getRange(r, COL.SERIES_SCORE).setFormulaR1C1(SERIES_SCORE_FORMULA);
    sheet.getRange(r, COL.WINNER_NAME).setFormulaR1C1(WINNER_NAME_FORMULA);
    sheet.getRange(r, COL.LOSER_ID).setFormulaR1C1(LOSER_ID_FORMULA);
    sheet.getRange(r, COL.LOSER_NAME).setFormulaR1C1(LOSER_NAME_FORMULA);
    
    sheet.getRange(r, COL.READY_STATUS).setFormulaR1C1(READY_STATUS_FORMULA);
    sheet.getRange(r, COL.OVERRIDE_ACTIVE).setFormulaR1C1(OVERRIDE_ACTIVE_FORMULA);
  }
  
  // Format column protections
  const protectedCols = [
    COL.INTERNAL_ID, COL.DISPLAY_ID, COL.UUID, COL.TEAM_A_NAME, COL.TEAM_A_TAG, COL.TEAM_A_SEED,
    COL.TEAM_B_NAME, COL.TEAM_B_TAG, COL.TEAM_B_SEED, COL.REFEREE_NAME, COL.OBSERVER_NAME, COL.OPS_LEAD_NAME,
    COL.SCHEDULED_UTC, COL.EST_FINISH, COL.SERIES_SCORE, COL.WINNER_NAME, COL.LOSER_ID, COL.LOSER_NAME,
    COL.READY_STATUS, COL.OVERRIDE_ACTIVE, COL.CONNECTION, COL.HEALTH, COL.ROW_VERSION, COL.NEEDS_SYNC
  ];
  
  const currentProtections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  currentProtections.forEach(p => p.remove()); // Reset protections
  
  protectedCols.forEach(col => {
    const range = sheet.getRange(1, col, lastRow, 1);
    const protection = range.protect();
    protection.setDescription(`Lock Col ${col}`);
    protection.removeEditors(protection.getEditors());
    if (protection.canDomainEdit()) {
      protection.setDomainEdit(false);
    }
  });
}

/**
 * Performs a batch scan to compute row health states and writes them in one API operation.
 */
function processHealthBatch() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('TOC_Matches');
  if (!sheet) return;
  
  initializeDynamicColumns(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 3) return;
  
  const data = sheet.getRange(3, 1, lastRow - 2, sheet.getLastColumn()).getValues();
  const settings = getSettings();
  
  const healthValues = [];
  
  data.forEach((row) => {
    const status = row[COL.STATUS - 1];
    const deleted = row[COL.DELETED - 1];
    if (deleted === 'YES') {
      healthValues.push(['']);
      return;
    }
    
    let health = '🟢 Healthy';
    
    const referee = row[COL.REFEREE_ID - 1];
    const stream = row[COL.STREAM_ID - 1];
    const priority = row[COL.PRIORITY - 1];
    const lastPolled = row[COL.LAST_POLLED - 1];
    const connection = row[COL.CONNECTION - 1];
    const teamA = row[COL.TEAM_A_ID - 1];
    const teamB = row[COL.TEAM_B_ID - 1];
    const overrideType = row[COL.OVERRIDE_TYPE - 1];
    const overrideExpiry = row[COL.OVERRIDE_EXPIRY - 1];
    const syncStatus = row[COL.NEEDS_SYNC - 1];
    const readyStatus = row[COL.READY_STATUS - 1];
    const demoUrl = row[COL.DEMO_URL - 1];
    const winnerId = row[COL.WINNER_ID - 1];
    const scheduledLocal = row[COL.SCHEDULED_LOCAL - 1];
    
    const nowTime = new Date().getTime();
    const scheduledTime = scheduledLocal ? new Date(scheduledLocal).getTime() : 0;
    const timeToStartMin = scheduledTime ? (scheduledTime - nowTime) / (1000 * 60) : 999999;
    
    // Stale Polling calculations
    const staleMin = lastPolled ? (nowTime - new Date(lastPolled).getTime()) / (1000 * 60) : 999999;
    
    // RED ERROR TRIGGERS
    if (status === 'Live' && staleMin > (parseFloat(settings.Stale_Error_Min) || 10)) {
      health = '🔴 Error';
    } else if (status === 'Live' && connection === 'Offline') {
      health = '🔴 Error';
    } else if (status === 'Live' && !row[COL.MATCH_SOURCE - 1]) {
      health = '🔴 Error';
    } else if ((status === 'Scheduled' || status === 'Live') && (!teamA || !teamB)) {
      health = '🔴 Error';
    } else if (status === 'Completed' && !winnerId) {
      health = '🔴 Error';
    } else if (syncStatus === 'Failed') {
      health = '🔴 Error';
    }
    
    // YELLOW WARNING TRIGGERS (if not already RED)
    if (health !== '🔴 Error') {
      if (status === 'Scheduled' && timeToStartMin < (parseFloat(settings.Warn_Before_Match_Min) || 60) && !referee) {
        health = '🟡 Warning';
      } else if (status === 'Scheduled' && timeToStartMin < (parseFloat(settings.Warn_Before_Match_Min) || 60) && !stream && (priority === 'Critical' || priority === 'High')) {
        health = '🟡 Warning';
      } else if (status === 'Live' && staleMin > (parseFloat(settings.Stale_Warn_Min) || 5)) {
        health = '🟡 Warning';
      } else if (status === 'Live' && connection === 'Slow') {
        health = '🟡 Warning';
      } else if (overrideType && overrideType !== 'None') {
        health = '🟡 Warning';
      } else if (readyStatus !== '✅ Ready' && row[COL.LIVE_PHASE - 1] === 'Warmup') {
        health = '🟡 Warning';
      } else if (status === 'Completed' && !demoUrl) {
        health = '🟡 Warning';
      } else if (syncStatus === 'Pending') {
        health = '🟡 Warning';
      }
    }
    
    healthValues.push([health]);
  });
  
  sheet.getRange(3, COL.HEALTH, healthValues.length, 1).setValues(healthValues);
  updateCounterHealthMetrics(healthValues);
}

function updateCounterHealthMetrics(healthValues) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const countersSheet = ss.getSheetByName('SYS_Counters');
  if (!countersSheet) return;
  
  let errors = 0;
  let warnings = 0;
  healthValues.forEach(h => {
    if (h[0] === '🔴 Error') errors++;
    if (h[0] === '🟡 Warning') warnings++;
  });
  
  updateCounterKey(countersSheet, 'count_Health_Error', errors);
  updateCounterKey(countersSheet, 'count_Health_Warning', warnings);
}

/**
 * Scans matches Sheet, pre-computes operational counters, and writes them to SYS_Counters.
 */
function rebuildCounters() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const matchesSheet = ss.getSheetByName('TOC_Matches');
  if (!matchesSheet) return;
  
  initializeDynamicColumns(matchesSheet);
  const lastRow = matchesSheet.getLastRow();
  if (lastRow < 3) {
    resetCountersToZero();
    return;
  }
  
  const data = matchesSheet.getRange(3, 1, lastRow - 2, matchesSheet.getLastColumn()).getValues();
  const counters = {
    count_Pending: 0,
    count_Scheduled: 0,
    count_Live: 0,
    count_Completed: 0,
    count_Cancelled: 0,
    count_Health_Error: 0,
    count_Health_Warning: 0,
    count_Overrides_Active: 0,
    count_Streams_Active: 0
  };
  
  data.forEach(row => {
    if (row[COL.DELETED - 1] === 'YES') return;
    
    const status = row[COL.STATUS - 1];
    const health = row[COL.HEALTH - 1];
    const override = row[COL.OVERRIDE_ACTIVE - 1];
    const stream = row[COL.STREAM_ID - 1];
    
    if (counters[`count_${status}`] !== undefined) counters[`count_${status}`]++;
    if (health === '🔴 Error') counters.count_Health_Error++;
    if (health === '🟡 Warning') counters.count_Health_Warning++;
    if (override === 'YES') counters.count_Overrides_Active++;
    if (stream && status === 'Live') counters.count_Streams_Active++;
  });
  
  const counterSheet = ss.getSheetByName('SYS_Counters');
  counterSheet.clearContents();
  counterSheet.getRange(1, 1, 1, 2).setValues([['Counter Key', 'Value']]);
  
  const rows = Object.entries(counters).map(([k, v]) => [k, v]);
  rows.push(['last_rebuilt', new Date().toISOString()]);
  
  counterSheet.getRange(2, 1, rows.length, 2).setValues(rows);
}

function resetCountersToZero() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const counterSheet = ss.getSheetByName('SYS_Counters');
  if (!counterSheet) return;
  counterSheet.clearContents();
  counterSheet.getRange(1, 1, 1, 2).setValues([['Counter Key', 'Value']]);
  const rows = [
    ['count_Pending', 0],
    ['count_Scheduled', 0],
    ['count_Live', 0],
    ['count_Completed', 0],
    ['count_Cancelled', 0],
    ['count_Health_Error', 0],
    ['count_Health_Warning', 0],
    ['count_Overrides_Active', 0],
    ['count_Streams_Active', 0],
    ['last_rebuilt', new Date().toISOString()]
  ];
  counterSheet.getRange(2, 1, rows.length, 2).setValues(rows);
}

function updateCounterKey(sheet, key, value) {
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
}

/**
 * Truncates and moves audit logs to archive tab once size threshold is exceeded.
 */
function archiveAuditLogs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName('SYS_Audit_Log');
  if (!logSheet) return;
  
  const lastRow = logSheet.getLastRow();
  const MAX_ROWS = 100000;
  if (lastRow <= MAX_ROWS) return;
  
  let archiveSheet = ss.getSheetByName('SYS_Audit_Archive');
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet('SYS_Audit_Archive');
    archiveSheet.appendRow(logSheet.getRange(1, 1, 1, logSheet.getLastColumn()).getValues()[0]);
  }
  
  const rowsToMove = lastRow - 50000; // Keep last 50,000 records
  const rangeToMove = logSheet.getRange(2, 1, rowsToMove, logSheet.getLastColumn());
  const values = rangeToMove.getValues();
  
  archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, values.length, values[0].length).setValues(values);
  logSheet.deleteRows(2, rowsToMove);
}

/**
 * Generates monotonic padded IDs for teams, staff, or streams to prevent duplicates.
 */
function generateNextId(prefix) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetName = '';
  
  switch(prefix) {
    case 'TEAM': sheetName = 'TOC_Teams'; break;
    case 'REF':  sheetName = 'TOC_Staff'; break;
    case 'STR':  sheetName = 'TOC_Streams'; break;
    default:
      throw new Error(`Unknown ID allocator prefix: ${prefix}`);
  }
  
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Missing ID sheet: ${sheetName}`);
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return `${prefix}-0001`;
  
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(Boolean);
  let maxNum = 0;
  
  ids.forEach(id => {
    const match = id.toString().match(/-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10) || 0;
      if (num > maxNum) maxNum = num;
    }
  });
  
  return `${prefix}-${(maxNum + 1).toString().padStart(4, '0')}`;
}

/**
 * Synchronizes approved teams from the merged Admin_Ops sheet into the flat TOC_Teams sheet.
 */
function syncAdminOpsToTeams() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const adminSheet = ss.getSheetByName('Admin_Ops');
  const teamsSheet = ss.getSheetByName('TOC_Teams');
  
  if (!adminSheet || !teamsSheet) {
    throw new Error('Admin_Ops or TOC_Teams sheet is missing.');
  }
  
  const adminData = adminSheet.getDataRange().getValues();
  const lastTeamRow = teamsSheet.getLastRow();
  
  // Build a map of existing teams in TOC_Teams by Team Name -> Team row data
  const existingTeams = {};
  if (lastTeamRow >= 2) {
    const teamValues = teamsSheet.getRange(2, 1, lastTeamRow - 1, teamsSheet.getLastColumn()).getValues();
    teamValues.forEach((row, idx) => {
      const name = row[1].toString().trim().toLowerCase();
      if (name) {
        existingTeams[name] = {
          rowIndex: idx + 2,
          uuid: row[0],
          tag: row[2],
          seed: row[3],
          logo: row[4],
          status: row[6]
        };
      }
    });
  }
  
  let added = 0;
  let updated = 0;
  
  // Loop through Admin_Ops rows starting from row 2 (index 1)
  // Admin_Ops has blocks of 7 rows per team. The first row of the block has the team info.
  for (let i = 1; i < adminData.length; i++) {
    const row = adminData[i];
    const sn = (row[0] || '').toString().trim(); // Col A (1-based index 0)
    
    // Check if this is the start of a team block (e.g. SN starts with "TEAM" or is not empty on captain row)
    if (sn.toUpperCase().indexOf('TEAM') === 0) {
      const teamName = (row[1] || '').toString().trim(); // Col B (1-based index 1)
      if (!teamName) continue;
      
      const teamTag = (row[2] || '').toString().trim(); // Col C (1-based index 2)
      const logoFormula = (row[3] || '').toString().trim(); // Col D (1-based index 3)
      const status = (row[14] || '').toString().trim(); // Col O (1-based index 14)
      const seed = (row[15] || '').toString().trim(); // Col P (1-based index 15)
      
      // Parse logo URL from formula if it's an IMAGE formula, e.g. =IMAGE("url")
      let logoUrl = logoFormula;
      if (logoFormula.toUpperCase().indexOf('=IMAGE(') === 0) {
        const match = logoFormula.match(/["']([^"']+)["']/);
        if (match) logoUrl = match[1];
      }
      
      const nameKey = teamName.toLowerCase();
      
      if (existingTeams[nameKey]) {
        // Update existing team if details changed
        const existing = existingTeams[nameKey];
        if (existing.tag !== teamTag || existing.seed !== seed || existing.logo !== logoUrl || existing.status !== status) {
          teamsSheet.getRange(existing.rowIndex, 3).setValue(teamTag); // Tag
          teamsSheet.getRange(existing.rowIndex, 4).setValue(seed); // Seed
          teamsSheet.getRange(existing.rowIndex, 5).setValue(logoUrl); // Logo
          teamsSheet.getRange(existing.rowIndex, 7).setValue(status); // Status
          updated++;
        }
      } else {
        // Add new team
        const nextUuid = generateNextId('TEAM');
        teamsSheet.appendRow([
          nextUuid,
          teamName,
          teamTag,
          seed,
          logoUrl,
          'CC2', // Default tournament slug for CC2
          status,
          '',    // Captain UUID (optional reference)
          '',    // Discord Server
          '',    // Contact
          new Date()
        ]);
        
        // Add to local map to prevent duplicates within same loop
        existingTeams[nameKey] = { uuid: nextUuid };
        added++;
      }
    }
  }
  
  // Re-apply dropdown validation rules in TOC_Matches since team list has changed
  const matchesSheet = ss.getSheetByName('TOC_Matches');
  if (matchesSheet) {
    initializeDynamicColumns(matchesSheet);
    updateTeamsDropdownValidation(matchesSheet);
  }
  
  Logger.log(`TOC Team Sync: Added ${added} new teams, updated ${updated} existing teams.`);
  return { added, updated };
}
