/**
 * =============================================================================
 *  PIXEL PALACE — TOURNAMENT OPERATIONS CENTER (TOC) BACKUPS (v6.0)
 * =============================================================================
 */

/**
 * Creates a timestamped duplicate of the active spreadsheet in a designated Drive folder.
 */
function backupWorkbook() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = getSettings();
  
  // Find backup directory ID from Settings constants
  const folderId = settings.Backup_Folder_Id || '';
  let folder;
  
  try {
    if (folderId && folderId.trim() !== '') {
      folder = DriveApp.getFolderById(folderId.trim());
    } else {
      // Fallback: create in same folder as active spreadsheet
      const files = DriveApp.getFilesByName(ss.getName());
      if (files.hasNext()) {
        const file = files.next();
        const parents = file.getParents();
        if (parents.hasNext()) {
          folder = parents.next();
        }
      }
    }
  } catch (err) {
    Logger.log(`Failed to resolve target backup folder: ${err.message}. Using Drive Root.`);
  }
  
  if (!folder) {
    folder = DriveApp.getRootFolder();
  }
  
  const timestamp = Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd-HHmmss");
  const backupName = `${ss.getName()}_BACKUP_${timestamp}_UTC`;
  
  try {
    const file = DriveApp.getFileById(ss.getId());
    const copy = file.makeCopy(backupName, folder);
    
    // Log backup event to SYS_Audit_Log
    logSystemEvent('BACKUP', `Successfully created spreadsheet backup copy: "${backupName}" (ID: ${copy.getId()})`);
    
    SpreadsheetApp.getUi().alert(`✅ Workbook backup created successfully:\n\nFolder: ${folder.getName()}\nName: "${backupName}"`);
  } catch (err) {
    logSystemEvent('BACKUP_FAILED', `Backup failed: ${err.message}`);
    SpreadsheetApp.getUi().alert(`🔴 Backup failed: ${err.message}`);
    throw err;
  }
}

/**
 * Audit helper to append system events to SYS_Audit_Log.
 */
function logSystemEvent(actionType, message) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName('SYS_Audit_Log');
  if (logSheet) {
    logSheet.appendRow([
      new Date(),
      'SYSTEM',       // Row ID / Scope
      'SYSTEM_OPS',   // Column Name / Field
      actionType,
      '',             // Old value
      message,        // New value
      Session.getActiveUser().getEmail(),
      ''              // Source IP
    ]);
  }
}
