/**
 * Single Source of Truth for PP-CC2 Bracket Topology & Layout Configuration
 * Standard 31-Match Single Elimination Topology Graph.
 */

import { 
  DEFAULT_DESIGN_SYSTEM, 
  computeTournamentLayout, 
  generateConnectorPath as baseGenerateConnectorPath, 
  getRoundX 
} from './layoutEngine';

export const DESIGN_SYSTEM = DEFAULT_DESIGN_SYSTEM;

// Standard 31-Match Graph Topology (16 in R32, 8 in R16, 4 in QF, 2 in SF, 1 in GF)
export const TOPOLOGY_DEFINITIONS = [
  // Round 1 (16 matches)
  ...Array.from({ length: 16 }, (_, i) => ({
    slotKey: `R32-M${String(i + 1).padStart(2, '0')}`,
    round: 1,
    position: i,
    visualLabel: `R32 • M${String(i + 1).padStart(2, '0')}`,
    format: "BO1",
    feedsFrom: []
  })),

  // Round 2 (8 matches)
  { slotKey: "R16-M01", round: 2, position: 0, visualLabel: "R16 • M01", format: "BO1", feedsFrom: ["R32-M01", "R32-M02"] },
  { slotKey: "R16-M02", round: 2, position: 1, visualLabel: "R16 • M02", format: "BO1", feedsFrom: ["R32-M03", "R32-M04"] },
  { slotKey: "R16-M03", round: 2, position: 2, visualLabel: "R16 • M03", format: "BO1", feedsFrom: ["R32-M05", "R32-M06"] },
  { slotKey: "R16-M04", round: 2, position: 3, visualLabel: "R16 • M04", format: "BO1", feedsFrom: ["R32-M07", "R32-M08"] },
  { slotKey: "R16-M05", round: 2, position: 4, visualLabel: "R16 • M05", format: "BO1", feedsFrom: ["R32-M09", "R32-M10"] },
  { slotKey: "R16-M06", round: 2, position: 5, visualLabel: "R16 • M06", format: "BO1", feedsFrom: ["R32-M11", "R32-M12"] },
  { slotKey: "R16-M07", round: 2, position: 6, visualLabel: "R16 • M07", format: "BO1", feedsFrom: ["R32-M13", "R32-M14"] },
  { slotKey: "R16-M08", round: 2, position: 7, visualLabel: "R16 • M08", format: "BO1", feedsFrom: ["R32-M15", "R32-M16"] },

  // Round 3 (Quarterfinals - 4 matches)
  { slotKey: "QF-M01", round: 3, position: 0, visualLabel: "QF • M01", format: "BO3", feedsFrom: ["R16-M01", "R16-M02"] },
  { slotKey: "QF-M02", round: 3, position: 1, visualLabel: "QF • M02", format: "BO3", feedsFrom: ["R16-M03", "R16-M04"] },
  { slotKey: "QF-M03", round: 3, position: 2, visualLabel: "QF • M03", format: "BO3", feedsFrom: ["R16-M05", "R16-M06"] },
  { slotKey: "QF-M04", round: 3, position: 3, visualLabel: "QF • M04", format: "BO3", feedsFrom: ["R16-M07", "R16-M08"] },

  // Round 4 (Semifinals - 2 matches)
  { slotKey: "SF-M01", round: 4, position: 0, visualLabel: "SF • M01", format: "BO3", feedsFrom: ["QF-M01", "QF-M02"] },
  { slotKey: "SF-M02", round: 4, position: 1, visualLabel: "SF • M02", format: "BO3", feedsFrom: ["QF-M03", "QF-M04"] },

  // Round 5 (Grand Finals - 1 match)
  { slotKey: "GF-M01", round: 5, position: 0, visualLabel: "GRAND FINAL", format: "BO3", feedsFrom: ["SF-M01", "SF-M02"] }
];

// Compute Layout using universal engine
const layoutResult = computeTournamentLayout(TOPOLOGY_DEFINITIONS, DESIGN_SYSTEM);

// Header Labels
export const PPCC2_HEADERS = [
  { round: 1, label: 'Round of 32', matchesLabel: '16 Matches', x: getRoundX(1, DESIGN_SYSTEM), width: DESIGN_SYSTEM.roundWidths[1] },
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
