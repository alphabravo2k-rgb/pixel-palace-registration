/**
 * =============================================================================
 *  PIXEL PALACE — TOURNAMENT OPERATIONS CENTER (TOC) CONCURRENCY (v6.0)
 * =============================================================================
 */

/**
 * Atomic version incrementing helper using Google's script LockService.
 * Returns the incremented version index.
 */
function incrementRowVersion(sheet, rowIdx) {
  const lock = LockService.getScriptLock();
  lock.waitLock(3000); // Wait up to 3 seconds for lock release
  
  try {
    const cell = sheet.getRange(rowIdx, COL.ROW_VERSION);
    const currentVal = parseInt(cell.getValue(), 10) || 0;
    const nextVal = currentVal + 1;
    cell.setValue(nextVal);
    SpreadsheetApp.flush();
    return nextVal;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Resolves the timestamp of the last manual human edit or API write from the SYS_Audit_Log.
 */
function getLastAuditTimestamp(rowIdx, matchId, actionType) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName('SYS_Audit_Log');
  if (!logSheet) return 0;
  
  const lastRow = logSheet.getLastRow();
  if (lastRow < 2) return 0;
  
  const data = logSheet.getRange(2, 1, lastRow - 1, 4).getValues(); // Timestamp, Row ID, Col Name, Action Type
  
  let lastTime = 0;
  // Read backwards to find the latest log entries quickly
  for (let i = data.length - 1; i >= 0; i--) {
    const timestamp = new Date(data[i][0]).getTime();
    const rowId = data[i][1].toString();
    const actType = data[i][3].toString();
    
    // RowId in audit log will match either the sheet row index or the Match Internal ID
    if ((rowId === rowIdx.toString() || rowId === matchId) && actType === actionType) {
      if (timestamp > lastTime) {
        lastTime = timestamp;
      }
    }
  }
  return lastTime;
}

/**
 * Returns true if a column field is classified as a "Manually Owned" or "Override" locked cell.
 */
function isManuallyLockedField(colIdx) {
  // If the column resolves to scheduling local, best of, override fields, or ready checks,
  // we treat them as manually locked and prioritize human edits over automated API values.
  const colKeys = Object.keys(COL);
  let resolvedKey = '';
  for (let i = 0; i < colKeys.length; i++) {
    if (COL[colKeys[i]] === colIdx) {
      resolvedKey = colKeys[i];
      break;
    }
  }
  
  const MANUAL_FIELDS = [
    'SCHEDULED_LOCAL', 'BEST_OF', 'STAGE', 'ROUND', 'DISPLAY_MATCH',
    'VENUE', 'REFEREE_ID', 'OBSERVER_ID', 'OPS_LEAD_ID', 'STREAM_ID',
    'OVERRIDE_TYPE', 'OVERRIDE_NOTES', 'OVERRIDE_EXPIRY', 'OVERRIDE_REVIEW_REQUIRED',
    'CAPTAIN_A_READY', 'CAPTAIN_B_READY', 'SERVER_READY', 'REFEREE_READY', 'CASTER_READY', 'OBSERVER_READY',
    'MATCH_SOURCE', 'VOD_URL', 'ADMIN_NOTES', 'DELETED'
  ];
  
  return MANUAL_FIELDS.includes(resolvedKey);
}

/**
 * Standard audit logger for all spreadsheet edits.
 */
function writeAuditEntry(rowId, colName, actionType, oldValue, newValue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName('SYS_Audit_Log');
  if (logSheet) {
    logSheet.appendRow([
      new Date(),
      rowId,
      colName,
      actionType,
      oldValue !== undefined && oldValue !== null ? oldValue.toString() : '',
      newValue !== undefined && newValue !== null ? newValue.toString() : '',
      Session.getActiveUser().getEmail(),
      '' // IP Placeholder (requires web app context to retrieve)
    ]);
  }
}

/**
 * Concurrency-safe row updating routine.
 * checks:
 * 1. Monotonic row version matching.
 * 2. Precedence hierarchy (Manual > Override > API).
 */
function safeWriteRow(sheet, rowIdx, updates, expectedVersion) {
  if (!sheet) {
    throw new Error('Sheet parameter is null or undefined.');
  }
  initializeDynamicColumns(sheet);
  
  const lock = LockService.getScriptLock();
  lock.waitLock(3000); // Timeout block
  
  try {
    const versionCell = sheet.getRange(rowIdx, COL.ROW_VERSION);
    const currentVersion = parseInt(versionCell.getValue(), 10) || 0;
    
    // 1. Version conflict checking
    if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
      throw new Error(`CONCURRENCY CONFLICT: Row ${rowIdx} modified. Expected Row Version v${expectedVersion}, got v${currentVersion}`);
    }
    
    const internalId = sheet.getRange(rowIdx, COL.INTERNAL_ID).getValue().toString();
    
    // Resolve audit times
    const lastHumanEdit = getLastAuditTimestamp(rowIdx, internalId, 'UPDATE');
    const lastApiWrite = getLastAuditTimestamp(rowIdx, internalId, 'API');
    
    const isHumanEdited = lastHumanEdit > lastApiWrite;
    
    const successCols = [];
    
    // 2. Perform updates
    for (const [colName, val] of Object.entries(updates)) {
      const colIdx = COL[colName];
      if (!colIdx) continue;
      
      // If human edit is newer, do not stomp manually owned fields unless it is an override reset
      if (isHumanEdited && isManuallyLockedField(colIdx) && colName !== 'NEEDS_SYNC') {
        Logger.log(`SKIP CONCURRENCY WRITE: Row ${rowIdx} Col ${colName} ignored due to newer manual edit.`);
        continue;
      }
      
      const cell = sheet.getRange(rowIdx, colIdx);
      const oldVal = cell.getValue();
      
      if (oldVal !== val) {
        cell.setValue(val);
        writeAuditEntry(internalId, colName, expectedVersion === undefined ? 'SYSTEM' : 'API', oldVal, val);
        successCols.push(colName);
      }
    }
    
    if (successCols.length > 0) {
      // Monotonically increment row version, change sync status to pending
      const nextVersion = currentVersion + 1;
      versionCell.setValue(nextVersion);
      sheet.getRange(rowIdx, COL.NEEDS_SYNC).setValue('Pending');
      sheet.getRange(rowIdx, COL.LAST_UPDATED).setValue(new Date());
      sheet.getRange(rowIdx, COL.LAST_UPDATED_BY).setValue(Session.getActiveUser().getEmail());
    }
    
  } finally {
    lock.releaseLock();
  }
}
