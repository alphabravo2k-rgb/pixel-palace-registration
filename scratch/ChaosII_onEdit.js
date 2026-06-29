/**
 * PIXEL PALACE — CHAOS II REAL-TIME STATUS SYNC ADD-ON
 * 
 * APPEND THIS TO THE END OF YOUR CHAOS II ADMIN SHEET SCRIPT (v3.0)
 * Spreadsheet URL: https://docs.google.com/spreadsheets/d/1htkH0PQWbWefE5XFIdf2AGqTxpWMwLyGDMZMfOOL-2E/edit
 */

const RAW_SHEET_ID = "18v5CFox5pRSRNhEtx9kmkVJHNDwH2K84hvMIH-KZyEc";

/**
 * Triggered on edits to sync status changes back to the Raw Registrations spreadsheet
 */
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

/**
 * Real-time status sync back to Raw Registrations Spreadsheet
 */
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
