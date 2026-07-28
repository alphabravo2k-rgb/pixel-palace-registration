/**
 * Single Source of Truth for PP-CC2 Bracket Topology & Layout Configuration
 * Built on top of the Universal Layout Engine (layoutEngine.js).
 */

import { 
  DEFAULT_DESIGN_SYSTEM, 
  computeTournamentLayout, 
  generateConnectorPath as baseGenerateConnectorPath, 
  getRoundX 
} from './layoutEngine';

export const DESIGN_SYSTEM = DEFAULT_DESIGN_SYSTEM;

// Explicit 30-Team / 29-Match Topology Graph Definition
export const TOPOLOGY_DEFINITIONS = [
  // Round 1 (14 matches)
  ...Array.from({ length: 14 }, (_, i) => ({
    slotKey: `R32-M${String(i + 1).padStart(2, '0')}`,
    round: 1,
    position: i,
    visualLabel: `R32 • M${String(i + 1).padStart(2, '0')}`,
    format: "BO1",
    feedsFrom: []
  })),

  // Round 2 (8 matches)
  { slotKey: "R16-M01", round: 2, position: 0, visualLabel: "R16 • M01", format: "BO1", defaultTeam1: "Last Dance", isByeSlot: true, feedsFrom: ["R32-M01"] },
  { slotKey: "R16-M02", round: 2, position: 1, visualLabel: "R16 • M02", format: "BO1", feedsFrom: ["R32-M02", "R32-M03"] },
  { slotKey: "R16-M03", round: 2, position: 2, visualLabel: "R16 • M03", format: "BO1", feedsFrom: ["R32-M04", "R32-M05"] },
  { slotKey: "R16-M04", round: 2, position: 3, visualLabel: "R16 • M04", format: "BO1", feedsFrom: ["R32-M06", "R32-M07"] },
  { slotKey: "R16-M05", round: 2, position: 4, visualLabel: "R16 • M05", format: "BO1", defaultTeam1: "NoSpirit", isByeSlot: true, feedsFrom: ["R32-M08"] },
  { slotKey: "R16-M06", round: 2, position: 5, visualLabel: "R16 • M06", format: "BO1", feedsFrom: ["R32-M09", "R32-M10"] },
  { slotKey: "R16-M07", round: 2, position: 6, visualLabel: "R16 • M07", format: "BO1", feedsFrom: ["R32-M11", "R32-M12"] },
  { slotKey: "R16-M08", round: 2, position: 7, visualLabel: "R16 • M08", format: "BO1", feedsFrom: ["R32-M13", "R32-M14"] },

  // Round 3 (Quarterfinals)
  { slotKey: "QF-M01", round: 3, position: 0, visualLabel: "QF • M01", format: "BO3", feedsFrom: ["R16-M01", "R16-M02"] },
  { slotKey: "QF-M02", round: 3, position: 1, visualLabel: "QF • M02", format: "BO3", feedsFrom: ["R16-M03", "R16-M04"] },
  { slotKey: "QF-M03", round: 3, position: 2, visualLabel: "QF • M03", format: "BO3", feedsFrom: ["R16-M05", "R16-M06"] },
  { slotKey: "QF-M04", round: 3, position: 3, visualLabel: "QF • M04", format: "BO3", feedsFrom: ["R16-M07", "R16-M08"] },

  // Round 4 (Semifinals)
  { slotKey: "SF-M01", round: 4, position: 0, visualLabel: "SF • M01", format: "BO3", feedsFrom: ["QF-M01", "QF-M02"] },
  { slotKey: "SF-M02", round: 4, position: 1, visualLabel: "SF • M02", format: "BO3", feedsFrom: ["QF-M03", "QF-M04"] },

  // Round 5 (Grand Finals)
  { slotKey: "GF-M01", round: 5, position: 0, visualLabel: "GRAND FINAL", format: "BO3", feedsFrom: ["SF-M01", "SF-M02"] }
];

// Compute Layout using universal engine
const layoutResult = computeTournamentLayout(TOPOLOGY_DEFINITIONS, DESIGN_SYSTEM);

// Header Labels
export const PPCC2_HEADERS = [
  { round: 1, label: 'Round of 32', matchesLabel: '14 Matches', x: getRoundX(1, DESIGN_SYSTEM), width: DESIGN_SYSTEM.roundWidths[1] },
  { round: 2, label: 'Round of 16', matchesLabel: '8 Matches', x: getRoundX(2, DESIGN_SYSTEM), width: DESIGN_SYSTEM.roundWidths[2] },
  { round: 3, label: 'Quarterfinals', matchesLabel: '4 Matches', x: getRoundX(3, DESIGN_SYSTEM), width: DESIGN_SYSTEM.roundWidths[3] },
  { round: 4, label: 'Semifinals', matchesLabel: '2 Matches', x: getRoundX(4, DESIGN_SYSTEM), width: DESIGN_SYSTEM.roundWidths[4] },
  { round: 5, label: 'Grand Finals', matchesLabel: '1 Match', x: getRoundX(5, DESIGN_SYSTEM), width: DESIGN_SYSTEM.roundWidths[5] }
];

export const PPCC2_LAYOUT = {
  ...layoutResult,
  columns: PPCC2_HEADERS
};

export function generateConnectorPath(conn, slotsMap) {
  return baseGenerateConnectorPath(conn, slotsMap, DESIGN_SYSTEM);
}

export function getMatchVisualLabel(match) {
  if (!match) return "MATCH";
  const roundNum = match.round_number || match.roundNumber || 1;
  const pos = (typeof match.position === 'number') ? match.position + 1 : 1;

  switch (roundNum) {
    case 1: return `R32 • M${String(pos).padStart(2, '0')}`;
    case 2: return `R16 • M${String(pos).padStart(2, '0')}`;
    case 3: return `QF • M${String(pos).padStart(2, '0')}`;
    case 4: return `SF • M${String(pos).padStart(2, '0')}`;
    case 5: return `GRAND FINAL`;
    default: return `R${roundNum} • M${String(pos).padStart(2, '0')}`;
  }
}
