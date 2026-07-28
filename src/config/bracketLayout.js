/**
 * Canonical Topology & Visual Bracket Layout for PP-CC2
 * Encodes explicit 30-team / 29-match tournament topology from official published poster.
 */

export const PPCC2_PERMANENT_SLOTS = [
  // Round of 32 (14 matches: R32-M01 to R32-M14)
  ...Array.from({ length: 14 }, (_, i) => ({
    slotKey: `R32-M${String(i + 1).padStart(2, '0')}`,
    round_number: 1,
    position: i,
    roundName: 'Round 1 (R32)',
    visualLabel: `R32 • M${String(i + 1).padStart(2, '0')}`,
    format: 'BO1',
    feedsFrom: []
  })),

  // Round of 16 (8 matches: R16-M01 to R16-M08)
  {
    slotKey: 'R16-M01',
    round_number: 2,
    position: 0,
    roundName: 'Round 2 (R16)',
    visualLabel: 'R16 • M01',
    format: 'BO1',
    seededTeam: 'Last Dance',
    feedsFrom: ['R32-M01']
  },
  {
    slotKey: 'R16-M02',
    round_number: 2,
    position: 1,
    roundName: 'Round 2 (R16)',
    visualLabel: 'R16 • M02',
    format: 'BO1',
    feedsFrom: ['R32-M02', 'R32-M03']
  },
  {
    slotKey: 'R16-M03',
    round_number: 2,
    position: 2,
    roundName: 'Round 2 (R16)',
    visualLabel: 'R16 • M03',
    format: 'BO1',
    feedsFrom: ['R32-M04', 'R32-M05']
  },
  {
    slotKey: 'R16-M04',
    round_number: 2,
    position: 3,
    roundName: 'Round 2 (R16)',
    visualLabel: 'R16 • M04',
    format: 'BO1',
    feedsFrom: ['R32-M06', 'R32-M07']
  },
  {
    slotKey: 'R16-M05',
    round_number: 2,
    position: 4,
    roundName: 'Round 2 (R16)',
    visualLabel: 'R16 • M05',
    format: 'BO1',
    seededTeam: 'NoSpirit',
    feedsFrom: ['R32-M08']
  },
  {
    slotKey: 'R16-M06',
    round_number: 2,
    position: 5,
    roundName: 'Round 2 (R16)',
    visualLabel: 'R16 • M06',
    format: 'BO1',
    feedsFrom: ['R32-M09', 'R32-M10']
  },
  {
    slotKey: 'R16-M07',
    round_number: 2,
    position: 6,
    roundName: 'Round 2 (R16)',
    visualLabel: 'R16 • M07',
    format: 'BO1',
    feedsFrom: ['R32-M11', 'R32-M12']
  },
  {
    slotKey: 'R16-M08',
    round_number: 2,
    position: 7,
    roundName: 'Round 2 (R16)',
    visualLabel: 'R16 • M08',
    format: 'BO1',
    feedsFrom: ['R32-M13', 'R32-M14']
  },

  // Quarterfinals (4 matches: QF-M01 to QF-M04)
  {
    slotKey: 'QF-M01',
    round_number: 3,
    position: 0,
    roundName: 'Quarterfinals',
    visualLabel: 'QF • M01',
    format: 'BO3',
    feedsFrom: ['R16-M01', 'R16-M02']
  },
  {
    slotKey: 'QF-M02',
    round_number: 3,
    position: 1,
    roundName: 'Quarterfinals',
    visualLabel: 'QF • M02',
    format: 'BO3',
    feedsFrom: ['R16-M03', 'R16-M04']
  },
  {
    slotKey: 'QF-M03',
    round_number: 3,
    position: 2,
    roundName: 'Quarterfinals',
    visualLabel: 'QF • M03',
    format: 'BO3',
    feedsFrom: ['R16-M05', 'R16-M06']
  },
  {
    slotKey: 'QF-M04',
    round_number: 3,
    position: 3,
    roundName: 'Quarterfinals',
    visualLabel: 'QF • M04',
    format: 'BO3',
    feedsFrom: ['R16-M07', 'R16-M08']
  },

  // Semifinals (2 matches: SF-M01 to SF-M02)
  {
    slotKey: 'SF-M01',
    round_number: 4,
    position: 0,
    roundName: 'Semifinals',
    visualLabel: 'SF • M01',
    format: 'BO3',
    feedsFrom: ['QF-M01', 'QF-M02']
  },
  {
    slotKey: 'SF-M02',
    round_number: 4,
    position: 1,
    roundName: 'Semifinals',
    visualLabel: 'SF • M02',
    format: 'BO3',
    feedsFrom: ['QF-M03', 'QF-M04']
  },

  // Grand Finals (1 match: GF-M01)
  {
    slotKey: 'GF-M01',
    round_number: 5,
    position: 0,
    roundName: 'Grand Finals',
    visualLabel: 'GRAND FINAL',
    format: 'BO3',
    feedsFrom: ['SF-M01', 'SF-M02']
  }
];

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

export function formatRoundName(round) {
  if (!round) return "Round 1";
  if (typeof round === 'number') {
    const names = { 1: "Round of 32", 2: "Round of 16", 3: "Quarterfinals", 4: "Semifinals", 5: "Grand Finals" };
    return names[round] || `Round ${round}`;
  }
  return String(round).trim();
}
