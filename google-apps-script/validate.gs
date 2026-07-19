/**
 * =============================================================================
 *  PIXEL PALACE — TOURNAMENT OPERATIONS CENTER (TOC) VALIDATIONS (v6.0)
 * =============================================================================
 */

/**
 * Validates the spreadsheet schema structures, headers, and formula integrity.
 * Throws or alerts on error.
 */
function validateSchema() {
  const errors = [];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Check required sheets
  const REQUIRED_TABS = [
    'TOC_Matches', 'TOC_Config', 'TOC_Teams', 'TOC_Streams', 'TOC_Staff',
    'TOC_Dashboard', 'TOC_Settings',
    'SYS_Poll_Log', 'SYS_Audit_Log', 'SYS_Propagation_Log', 'SYS_Error_Log',
    'SYS_Counters'
  ];
  
  REQUIRED_TABS.forEach(name => {
    if (!ss.getSheetByName(name)) {
      errors.push(`MISSING SHEET TAB: "${name}"`);
    }
  });
  
  if (errors.length > 0) return errors; // Return early if sheets are missing
  
  // 2. Validate Settings version
  const settings = getSettings();
  if (parseInt(settings.Schema_Version) !== REQUIRED_SCHEMA_VERSION) {
    errors.push(`SCHEMA VERSION MISMATCH: Expected v${REQUIRED_SCHEMA_VERSION}, got v${settings.Schema_Version}`);
  }
  if (parseInt(settings.Settings_Version) !== REQUIRED_SETTINGS_VERSION) {
    errors.push(`SETTINGS VERSION MISMATCH: Expected v${REQUIRED_SETTINGS_VERSION}, got v${settings.Settings_Version}`);
  }
  
  // 3. Validate Match headers
  const matchesSheet = ss.getSheetByName('TOC_Matches');
  try {
    initializeDynamicColumns(matchesSheet);
  } catch (err) {
    errors.push(err.message);
  }
  
  if (errors.length > 0) return errors;

  // 4. Validate critical formulas (validate R1C1 content on row 3 as sample)
  const lastRow = matchesSheet.getLastRow();
  if (lastRow >= 3) {
    const FORMULA_CHECKS = [
      { col: COL.DISPLAY_ID, pattern: /CONCAT/i, label: 'Display ID' },
      { col: COL.SCHEDULED_UTC, pattern: /TIME/i, label: 'Scheduled UTC' },
      { col: COL.TEAM_A_NAME, pattern: /XLOOKUP/i, label: 'Team A Name' },
      { col: COL.READY_STATUS, pattern: /AND/i, label: 'Ready Status' },
      { col: COL.OVERRIDE_ACTIVE, pattern: /None/i, label: 'Override Active' }
    ];
    
    const sampleRowFormulas = matchesSheet.getRange(3, 1, 1, matchesSheet.getLastColumn()).getFormulas()[0];
    FORMULA_CHECKS.forEach(({ col, pattern, label }) => {
      const formula = sampleRowFormulas[col - 1] || '';
      if (!pattern.test(formula)) {
        errors.push(`FORMULA INTEGRITY FAILED in row 3, column ${col} (${label}): expected pattern "${pattern}", found "${formula || '(empty)'}"`);
      }
    });
  }
  
  // 5. Check duplicate keys on key tables
  // TOC_Teams duplicates
  const teamsSheet = ss.getSheetByName('TOC_Teams');
  const lastTeamRow = teamsSheet.getLastRow();
  if (lastTeamRow >= 2) {
    const teamIds = teamsSheet.getRange(2, 1, lastTeamRow - 1, 1).getValues().flat().filter(Boolean);
    const dups = teamIds.filter((id, idx) => teamIds.indexOf(id) !== idx);
    if (dups.length > 0) {
      errors.push(`DUPLICATE TEAM UUIDs in TOC_Teams: ${dups.join(', ')}`);
    }
  }
  
  // TOC_Staff duplicates
  const staffSheet = ss.getSheetByName('TOC_Staff');
  const lastStaffRow = staffSheet.getLastRow();
  if (lastStaffRow >= 2) {
    const staffIds = staffSheet.getRange(2, 1, lastStaffRow - 1, 1).getValues().flat().filter(Boolean);
    const dups = staffIds.filter((id, idx) => staffIds.indexOf(id) !== idx);
    if (dups.length > 0) {
      errors.push(`DUPLICATE STAFF UUIDs in TOC_Staff: ${dups.join(', ')}`);
    }
  }
  
  // 6. Check duplicate Internal Match IDs
  const lastMatchRow = matchesSheet.getLastRow();
  if (lastMatchRow >= 3) {
    const matchIds = matchesSheet.getRange(3, COL.INTERNAL_ID, lastMatchRow - 2, 1).getValues().flat().filter(Boolean);
    const dups = matchIds.filter((id, idx) => matchIds.indexOf(id) !== idx);
    if (dups.length > 0) {
      errors.push(`DUPLICATE MATCH INTERNAL IDs in TOC_Matches: ${dups.join(', ')}`);
    }
  }
  
  return errors;
}

/**
 * Executes full startup and operational validations.
 * Checks for orphaned records and duplicate references.
 * Writes errors to SYS_Error_Log.
 */
function runStartupValidations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const errors = validateSchema();
  
  if (errors.length > 0) {
    logValidationError('SCHEMA_VALIDATION', errors.join('; '));
    return errors;
  }
  
  const matchesSheet = ss.getSheetByName('TOC_Matches');
  const teamsSheet = ss.getSheetByName('TOC_Teams');
  const staffSheet = ss.getSheetByName('TOC_Staff');
  
  // Gather reference lists
  const lastTeamRow = teamsSheet.getLastRow();
  const validTeamIds = new Set(
    lastTeamRow >= 2 ? teamsSheet.getRange(2, 1, lastTeamRow - 1, 1).getValues().flat().filter(Boolean) : []
  );
  
  const lastStaffRow = staffSheet.getLastRow();
  const validStaffIds = new Set(
    lastStaffRow >= 2 ? staffSheet.getRange(2, 1, lastStaffRow - 1, 1).getValues().flat().filter(Boolean) : []
  );
  
  const lastMatchRow = matchesSheet.getLastRow();
  if (lastMatchRow >= 3) {
    const matchData = matchesSheet.getRange(3, 1, lastMatchRow - 2, matchesSheet.getLastColumn()).getValues();
    
    matchData.forEach((row, index) => {
      const rowIdx = index + 3;
      const teamA = row[COL.TEAM_A_ID - 1];
      const teamB = row[COL.TEAM_B_ID - 1];
      
      // check orphaned Team IDs
      if (teamA && teamA !== 'TEAM-0000' && !validTeamIds.has(teamA)) {
        errors.push(`ORPHANED TEAM REFERENCE: Row ${rowIdx} contains Team A ID "${teamA}" which does not exist in TOC_Teams`);
      }
      if (teamB && teamB !== 'TEAM-0000' && !validTeamIds.has(teamB)) {
        errors.push(`ORPHANED TEAM REFERENCE: Row ${rowIdx} contains Team B ID "${teamB}" which does not exist in TOC_Teams`);
      }
      
      // check orphaned Staff IDs in Match Referee, Observer, Ops Lead
      if (COL.REFEREE_ID) {
        const refId = row[COL.REFEREE_ID - 1];
        if (refId && !validStaffIds.has(refId)) {
          errors.push(`ORPHANED STAFF REFERENCE: Row ${rowIdx} contains Referee ID "${refId}" which does not exist in TOC_Staff`);
        }
      }
      if (COL.OBSERVER_ID) {
        const obsId = row[COL.OBSERVER_ID - 1];
        if (obsId && !validStaffIds.has(obsId)) {
          errors.push(`ORPHANED STAFF REFERENCE: Row ${rowIdx} contains Observer ID "${obsId}" which does not exist in TOC_Staff`);
        }
      }
      if (COL.OPS_LEAD_ID) {
        const leadId = row[COL.OPS_LEAD_ID - 1];
        if (leadId && !validStaffIds.has(leadId)) {
          errors.push(`ORPHANED STAFF REFERENCE: Row ${rowIdx} contains Ops Lead ID "${leadId}" which does not exist in TOC_Staff`);
        }
      }
    });
  }
  
  if (errors.length > 0) {
    logValidationError('ORPHAN_VALIDATION', errors.join('; '));
  }
  
  return errors;
}

/**
 * Logs a validation error to the SYS_Error_Log.
 */
function logValidationError(type, message) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const errorSheet = ss.getSheetByName('SYS_Error_Log');
  if (errorSheet) {
    errorSheet.appendRow([
      new Date(),
      type,
      message
    ]);
  }
}
