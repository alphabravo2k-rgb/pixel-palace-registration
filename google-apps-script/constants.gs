/**
 * =============================================================================
 *  PIXEL PALACE — TOURNAMENT OPERATIONS CENTER (TOC) CONSTANTS (v6.0)
 * =============================================================================
 */

const REQUIRED_SCHEMA_VERSION = 6;
const REQUIRED_SETTINGS_VERSION = 1;

// Global column map resolved dynamically at runtime
var COL = {};

/**
 * Expected canonical header values in TOC_Matches sheet.
 * These are normalized to UPPER_SNAKE_CASE keys in the COL map.
 */
const CANONICAL_HEADERS = {
  // Identity
  'INTERNAL ID': 'INTERNAL_ID',
  'DISPLAY ID': 'DISPLAY_ID',
  'UUID': 'UUID',
  
  // Relationships
  'TOURNAMENT': 'TOURNAMENT',
  'STAGE': 'STAGE',
  'ROUND': 'ROUND',
  'DISPLAY MATCH #': 'DISPLAY_MATCH',
  'WINNER TO': 'WINNER_TO',
  'LOSER TO': 'LOSER_TO',
  'CANNOT START UNTIL': 'CANNOT_START',
  
  // Teams
  'TEAM A ID': 'TEAM_A_ID',
  'TEAM A NAME': 'TEAM_A_NAME',
  'TEAM A TAG': 'TEAM_A_TAG',
  'TEAM A SEED': 'TEAM_A_SEED',
  'TEAM B ID': 'TEAM_B_ID',
  'TEAM B NAME': 'TEAM_B_NAME',
  'TEAM B TAG': 'TEAM_B_TAG',
  'TEAM B SEED': 'TEAM_B_SEED',
  
  // Scheduling
  'SCHEDULED (LOCAL)': 'SCHEDULED_LOCAL',
  'SCHEDULED (UTC)': 'SCHEDULED_UTC',
  'ESTIMATED FINISH': 'EST_FINISH',
  'BEST OF': 'BEST_OF',
  'VENUE': 'VENUE',
  
  // Status & Control
  'MATCH STATUS': 'STATUS',
  'LIVE PHASE': 'LIVE_PHASE',
  'MATCH PRIORITY': 'PRIORITY',
  'BROADCAST STATUS': 'BROADCAST',
  'READY STATUS': 'READY_STATUS',
  'OVERRIDE ACTIVE': 'OVERRIDE_ACTIVE',
  'CONNECTION STATUS': 'CONNECTION',
  'HEALTH': 'HEALTH',
  'RESULT SUMMARY': 'RESULT_SUMMARY',
  'WINNER ID': 'WINNER_ID',
  'WINNER NAME': 'WINNER_NAME',
  'LOSER ID': 'LOSER_ID',
  'LOSER NAME': 'LOSER_NAME',
  
  // Live Match Data
  'MAPS WON A': 'MAPS_WON_A',
  'MAPS WON B': 'MAPS_WON_B',
  'SERIES SCORE': 'SERIES_SCORE',
  'CURRENT MAP': 'CURRENT_MAP',
  'SCORE A': 'SCORE_A',
  'SCORE B': 'SCORE_B',
  'CURRENT HALF': 'CURRENT_HALF',
  'CURRENT ROUND': 'CURRENT_ROUND',
  'DURATION': 'DURATION',
  
  // Maps 1 to 5
  'MAP 1 NAME': 'MAP_1_NAME', 'MAP 1 SCORE A': 'MAP_1_SCORE_A', 'MAP 1 SCORE B': 'MAP_1_SCORE_B', 'MAP 1 WINNER ID': 'MAP_1_WINNER_ID', 'MAP 1 WINNER NAME': 'MAP_1_WINNER_NAME', 'MAP 1 DURATION': 'MAP_1_DURATION',
  'MAP 2 NAME': 'MAP_2_NAME', 'MAP 2 SCORE A': 'MAP_2_SCORE_A', 'MAP 2 SCORE B': 'MAP_2_SCORE_B', 'MAP 2 WINNER ID': 'MAP_2_WINNER_ID', 'MAP 2 WINNER NAME': 'MAP_2_WINNER_NAME', 'MAP 2 DURATION': 'MAP_2_DURATION',
  'MAP 3 NAME': 'MAP_3_NAME', 'MAP 3 SCORE A': 'MAP_3_SCORE_A', 'MAP 3 SCORE B': 'MAP_3_SCORE_B', 'MAP 3 WINNER ID': 'MAP_3_WINNER_ID', 'MAP 3 WINNER NAME': 'MAP_3_WINNER_NAME', 'MAP 3 DURATION': 'MAP_3_DURATION',
  'MAP 4 NAME': 'MAP_4_NAME', 'MAP 4 SCORE A': 'MAP_4_SCORE_A', 'MAP 4 SCORE B': 'MAP_4_SCORE_B', 'MAP 4 WINNER ID': 'MAP_4_WINNER_ID', 'MAP 4 WINNER NAME': 'MAP_4_WINNER_NAME', 'MAP 4 DURATION': 'MAP_4_DURATION',
  'MAP 5 NAME': 'MAP_5_NAME', 'MAP 5 SCORE A': 'MAP_5_SCORE_A', 'MAP 5 SCORE B': 'MAP_5_SCORE_B', 'MAP 5 WINNER ID': 'MAP_5_WINNER_ID', 'MAP 5 WINNER NAME': 'MAP_5_WINNER_NAME', 'MAP 5 DURATION': 'MAP_5_DURATION',
  
  // Officials
  'REFEREE ID': 'REFEREE_ID',
  'REFEREE NAME': 'REFEREE_NAME',
  'OBSERVER ID': 'OBSERVER_ID',
  'OBSERVER NAME': 'OBSERVER_NAME',
  'OPERATIONS LEAD ID': 'OPS_LEAD_ID',
  'OPERATIONS LEAD NAME': 'OPS_LEAD_NAME',
  'STREAM ID': 'STREAM_ID',
  
  // Ready Check
  'CAPTAIN A READY': 'CAPTAIN_A_READY',
  'CAPTAIN B READY': 'CAPTAIN_B_READY',
  'SERVER READY': 'SERVER_READY',
  'REFEREE READY': 'REFEREE_READY',
  'CASTER READY': 'CASTER_READY',
  'OBSERVER READY': 'OBSERVER_READY',
  
  // Override
  'OVERRIDE TYPE': 'OVERRIDE_TYPE',
  'OVERRIDE NOTES': 'OVERRIDE_NOTES',
  'OVERRIDE BY': 'OVERRIDE_BY',
  'OVERRIDE TIME': 'OVERRIDE_TIME',
  'OVERRIDE EXPIRY': 'OVERRIDE_EXPIRY',
  'OVERRIDE REVIEW REQUIRED': 'OVERRIDE_REVIEW_REQUIRED',
  
  // API Integration
  'MATCH SOURCE': 'MATCH_SOURCE',
  'PROVIDER': 'PROVIDER',
  'POLLING STATE': 'POLLING_STATE',
  'LAST POLLED': 'LAST_POLLED',
  'STALE COUNT': 'STALE_COUNT',
  'LAST SUCCESSFUL POLL': 'LAST_SUCCESSFUL_POLL',
  
  // Media
  'DEMO URL': 'DEMO_URL',
  'VOD URL': 'VOD_URL',
  'GOTV': 'GOTV',
  'SERVER REGION': 'SERVER_REGION',
  
  // URLs & Notes
  'PUBLIC URL': 'PUBLIC_URL',
  'ADMIN URL': 'ADMIN_URL',
  'ADMIN NOTES': 'ADMIN_NOTES',
  
  // Audit
  'CREATED BY': 'CREATED_BY',
  'CREATED AT': 'CREATED_AT',
  'LAST UPDATED BY': 'LAST_UPDATED_BY',
  'LAST UPDATED': 'LAST_UPDATED',
  'ROW VERSION': 'ROW_VERSION',
  'NEEDS SYNC': 'NEEDS_SYNC',
  'DELETED': 'DELETED'
};

// State Machine transitions mapping
const VALID_TRANSITIONS = {
  'Pending':    ['Scheduled', 'Cancelled'],
  'Scheduled':  ['Live', 'Walkover', 'Bye', 'Postponed', 'Cancelled'],
  'Live':       ['Paused', 'Completed', 'Cancelled'],
  'Paused':     ['Live', 'Completed', 'Cancelled'],
  'Completed':  ['Disputed'],
  'Disputed':   ['Completed'],
  // Terminal states (empty transitions)
  'Walkover':   [],
  'Bye':        [],
  'DQ':         [],
  'Forfeit':    [],
  'Tech Win':   [],
  'Cancelled':  [],
  'Postponed':  []
};

// Entry requirements check mapping returning strings or true
const ENTRY_REQUIREMENTS = {
  'Scheduled': function(row) {
    const errors = [];
    if (!row[COL.TEAM_A_ID - 1] || row[COL.TEAM_A_ID - 1] === 'TEAM-0000') errors.push('Team A required');
    if (!row[COL.TEAM_B_ID - 1] || row[COL.TEAM_B_ID - 1] === 'TEAM-0000') errors.push('Team B required');
    if (!row[COL.BEST_OF - 1]) errors.push('Best Of format required');
    if (!row[COL.SCHEDULED_LOCAL - 1]) errors.push('Scheduled Local time required');
    if (!row[COL.STAGE - 1]) errors.push('Stage required');
    if (!row[COL.TOURNAMENT - 1]) errors.push('Tournament ID required');
    return errors.length > 0 ? errors : true;
  },
  
  'Live': function(row) {
    const errors = [];
    if (!row[COL.TEAM_A_ID - 1]) errors.push('Team A ID required');
    if (!row[COL.TEAM_B_ID - 1]) errors.push('Team B ID required');
    if (!row[COL.MATCH_SOURCE - 1]) errors.push('Match Source URL required');
    return errors.length > 0 ? errors : true;
  }
};

const AUDIT_ACTIONS = {
  CREATE:      'CREATE',
  UPDATE:      'UPDATE',
  API:         'API',
  SYSTEM:      'SYSTEM',
  OVERRIDE:    'OVERRIDE',
  PROPAGATION: 'PROPAGATION',
  DELETE:      'DELETE',
  RESTORE:     'RESTORE',
  STATUS:      'STATUS'
};

/**
 * Parses dropdown string in format "Display Name [ID]" to extract ID.
 */
function parseDropdownId(value) {
  if (!value) return '';
  const match = value.toString().match(/\[([A-Z0-9\-]+)\]/);
  return match ? match[1] : value.toString().trim();
}

/**
 * Parses dropdown string in format "Display Name [ID]" to extract Display Name.
 */
function parseDropdownName(value) {
  if (!value) return '';
  const match = value.toString().match(/^(.*)\s+\[/);
  return match ? match[1].trim() : value.toString().trim();
}

/**
 * Resolves sheet columns dynamically based on Row 1 values in matches sheet.
 */
function initializeDynamicColumns(sheet) {
  if (!sheet) {
    throw new Error('Sheet parameter is null or undefined.');
  }
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;
  
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  COL = {};
  
  headers.forEach((header, index) => {
    if (header) {
      const normHeader = header.toString().trim().toUpperCase();
      // Match against CANONICAL_HEADERS map
      if (CANONICAL_HEADERS[normHeader]) {
        COL[CANONICAL_HEADERS[normHeader]] = index + 1;
      } else {
        // Fallback replacement mapping: replace special chars and spaces with underscores
        const key = normHeader.replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, '_');
        COL[key] = index + 1;
      }
    }
  });
  
  // Verify mandatory operational columns exist
  const MANDATORY = [
    'INTERNAL_ID', 'DISPLAY_ID', 'UUID', 'TEAM_A_ID', 'TEAM_B_ID',
    'STATUS', 'HEALTH', 'ROW_VERSION', 'NEEDS_SYNC', 'DELETED'
  ];
  
  const missing = MANDATORY.filter(req => !COL[req]);
  if (missing.length > 0) {
    throw new Error('TOC Column Resolution Error: Missing required columns in header: ' + missing.join(', '));
  }
}

/**
 * Helper to fetch settings constants dynamically from the TOC_Settings sheet.
 */
function getSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('TOC_Settings');
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    const value = data[i][1];
    if (key !== undefined && key !== null) {
      settings[key.toString()] = value;
    }
  }
  return settings;
}
