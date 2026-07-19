/**
 * =============================================================================
 *  PIXEL PALACE — TOURNAMENT OPERATIONS CENTER (TOC) MIGRATIONS (v6.0)
 * =============================================================================
 */

const TARGET_SCHEMA_VERSION = 6;

/**
 * Checks the current schema version and executes all pending migrations to catch up.
 */
function migrateSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('TOC_Settings');
  
  if (!settingsSheet) {
    throw new Error('TOC_Settings sheet is missing. Cannot perform schema migration.');
  }
  
  const settings = getSettings();
  let currentVersion = parseInt(settings.Schema_Version) || 1;
  
  Logger.log(`TOC Schema: Current version: v${currentVersion}, Target version: v${TARGET_SCHEMA_VERSION}`);
  
  if (currentVersion === TARGET_SCHEMA_VERSION) {
    SpreadsheetApp.getUi().alert(`Schema is already up to date (v${TARGET_SCHEMA_VERSION}).`);
    return;
  }
  
  if (currentVersion > TARGET_SCHEMA_VERSION) {
    throw new Error(`CRITICAL: Spreadsheet schema (v${currentVersion}) is newer than Apps Script version (v${TARGET_SCHEMA_VERSION}). Update your codebase.`);
  }
  
  // Sequential migration run
  while (currentVersion < TARGET_SCHEMA_VERSION) {
    Logger.log(`Executing migration step from v${currentVersion} to v${currentVersion + 1}...`);
    try {
      runMigrationStep(ss, currentVersion);
      currentVersion++;
      
      // Update Schema_Version value in settings sheet
      updateSettingValue(settingsSheet, 'Schema_Version', currentVersion);
    } catch (err) {
      Logger.log(`CRITICAL: Migration failed at v${currentVersion}: ${err.message}`);
      SpreadsheetApp.getUi().alert(`CRITICAL: Migration failed at v${currentVersion}: ${err.message}`);
      throw err;
    }
  }
  
  SpreadsheetApp.getUi().alert(`✅ Schema migration successfully completed to v${TARGET_SCHEMA_VERSION}`);
}

/**
 * Individual migration logic blocks.
 */
function runMigrationStep(ss, fromVersion) {
  switch (fromVersion) {
    case 5:
      // Migrate from v5 to v6:
      // 1. Insert Row UUID column in TOC_Matches at index 3 (Column C)
      const matchesSheet = ss.getSheetByName('TOC_Matches');
      if (matchesSheet) {
        matchesSheet.insertColumnAfter(2); // After col B (Display ID) -> Column C
        matchesSheet.getRange(1, 3).setValue('UUID');
        
        // Populate existing rows with fresh UUIDs
        const lastRow = matchesSheet.getLastRow();
        if (lastRow >= 3) {
          const uuids = [];
          for (let r = 3; r <= lastRow; r++) {
            uuids.push([Utilities.getUuid()]);
          }
          matchesSheet.getRange(3, 3, uuids.length, 1).setValues(uuids);
        }
        
        // Formulate a protection range for the UUID column
        const protection = matchesSheet.getRange(1, 3, lastRow, 1).protect();
        protection.setDescription('Locked System UUIDs');
        protection.removeEditors(protection.getEditors());
        if (protection.canDomainEdit()) {
          protection.setDomainEdit(false);
        }
      }
      
      // 2. Insert new audit columns if missing: Needs Sync enum, Deleted flag, and UUID in TOC_Teams
      const teamsSheet = ss.getSheetByName('TOC_Teams');
      if (teamsSheet && teamsSheet.getRange(1, 1).getValue() !== 'Team UUID') {
        teamsSheet.insertColumnBefore(1);
        teamsSheet.getRange(1, 1).setValue('Team UUID');
        const lastTeamRow = teamsSheet.getLastRow();
        if (lastTeamRow >= 2) {
          const teamIds = [];
          for (let r = 2; r <= lastTeamRow; r++) {
            teamIds.push([`TEAM-${(r - 1).toString().padStart(4, '0')}`]);
          }
          teamsSheet.getRange(2, 1, teamIds.length, 1).setValues(teamIds);
        }
      }
      
      const staffSheet = ss.getSheetByName('TOC_Staff');
      if (staffSheet && staffSheet.getRange(1, 1).getValue() !== 'Staff UUID') {
        staffSheet.insertColumnBefore(1);
        staffSheet.getRange(1, 1).setValue('Staff UUID');
        const lastStaffRow = staffSheet.getLastRow();
        if (lastStaffRow >= 2) {
          const staffIds = [];
          for (let r = 2; r <= lastStaffRow; r++) {
            staffIds.push([`REF-${(r - 1).toString().padStart(4, '0')}`]);
          }
          staffSheet.getRange(2, 1, staffIds.length, 1).setValues(staffIds);
        }
      }
      break;
      
    default:
      Logger.log(`No migration rules defined for v${fromVersion}`);
      break;
  }
}

/**
 * Finds and updates a specific setting row key in TOC_Settings.
 */
function updateSettingValue(sheet, key, value) {
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  // Append if missing
  sheet.appendRow([key, value]);
}
