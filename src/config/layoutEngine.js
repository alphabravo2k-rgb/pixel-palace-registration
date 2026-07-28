/**
 * Universal Tournament Visualization Engine - Parametric Layout & Geometry Engine
 *
 * Dynamically computes 2D bracket node coordinates, round column X positions,
 * and 4px rounded SVG elbow fillet paths purely from input tournament graph topology.
 *
 * Supports any number of teams, custom BYE seeds, and multi-round single/double elimination graphs.
 */

export const DEFAULT_DESIGN_SYSTEM = {
  cardHeight: 56,          // Compact enterprise card height (56px)
  roundPitchY: 66,         // Vertical pitch between Round 1 slots (66px)
  roundWidths: {
    1: 210,                // Round 1 width
    2: 215,                // Round 2 width
    3: 220,                // Quarterfinals width
    4: 230,                // Semifinals width
    5: 240                 // Grand Finals width
  },
  connectorGap: 40,        // Horizontal gap between round columns (40px)
  cornerRadius: 4          // Rounded SVG elbow fillet radius (4px)
};

/**
 * Computes X position for a given round number
 */
export function getRoundX(roundNum, designSystem = DEFAULT_DESIGN_SYSTEM) {
  let x = 0;
  for (let r = 1; r < roundNum; r++) {
    const width = designSystem.roundWidths[r] || designSystem.roundWidths[1] || 210;
    x += width + designSystem.connectorGap;
  }
  return x;
}

/**
 * Universal Parametric Layout Engine
 * Calculates exact (X, Y) pixel coordinates and connector relations from topology definition graph
 */
export function computeTournamentLayout(topologyDefs = [], designSystem = DEFAULT_DESIGN_SYSTEM) {
  const slotsMap = new Map();
  const slots = [];

  // Pass 1: Compute Round 1 base coordinates
  topologyDefs.filter(s => s.round === 1).forEach((slotDef, i) => {
    const cardW = designSystem.roundWidths[1] || 210;
    const y = i * designSystem.roundPitchY;
    const centerY = y + designSystem.cardHeight / 2;
    const slotNode = { ...slotDef, x: 0, y, centerY, width: cardW };
    slotsMap.set(slotDef.slotKey, slotNode);
    slots.push(slotNode);
  });

  // Pass 2: Compute Rounds 2+ dynamically from feedsFrom arithmetic midpoints
  const maxRound = topologyDefs.reduce((max, s) => Math.max(max, s.round), 1);

  for (let r = 2; r <= maxRound; r++) {
    const roundSlots = topologyDefs.filter(s => s.round === r);
    const cardW = designSystem.roundWidths[r] || designSystem.roundWidths[1] || 210;
    const roundX = getRoundX(r, designSystem);

    roundSlots.forEach((slotDef) => {
      let centerY = 0;
      if (slotDef.feedsFrom.length === 1) {
        const src = slotsMap.get(slotDef.feedsFrom[0]);
        centerY = src ? src.centerY : 0;
      } else if (slotDef.feedsFrom.length === 2) {
        const src1 = slotsMap.get(slotDef.feedsFrom[0]);
        const src2 = slotsMap.get(slotDef.feedsFrom[1]);
        centerY = (src1 && src2) ? (src1.centerY + src2.centerY) / 2 : 0;
      }

      const y = centerY - designSystem.cardHeight / 2;
      const slotNode = { ...slotDef, x: roundX, y, centerY, width: cardW };
      slotsMap.set(slotDef.slotKey, slotNode);
      slots.push(slotNode);
    });
  }

  // Connectors Graph
  const connectors = topologyDefs.filter(s => s.feedsFrom && s.feedsFrom.length > 0).map(s => ({
    id: `c-${s.slotKey}`,
    from: s.feedsFrom,
    to: s.slotKey,
    type: s.feedsFrom.length === 1 ? 'bye-single' : 'pair'
  }));

  const lastRoundWidth = designSystem.roundWidths[maxRound] || 240;
  const containerWidth = getRoundX(maxRound, designSystem) + lastRoundWidth;
  const maxSlotY = slots.reduce((max, s) => Math.max(max, s.y + designSystem.cardHeight), 0);

  return {
    config: { ...designSystem, containerWidth, containerHeight: maxSlotY + 20 },
    slots,
    connectors,
    slotsMap
  };
}

/**
 * Parametric SVG Connector Generator with 4px Rounded Elbow Fillets
 */
export function generateConnectorPath(conn, slotsMap, designSystem = DEFAULT_DESIGN_SYSTEM) {
  const targetSlot = slotsMap.get(conn.to);
  if (!targetSlot) return "";

  const r = designSystem.cornerRadius || 4;

  if (conn.type === 'bye-single' || conn.from.length === 1) {
    const srcSlot = slotsMap.get(conn.from[0]);
    if (!srcSlot) return "";

    const srcX = srcSlot.x + srcSlot.width;
    const srcY = srcSlot.centerY;
    const tgtX = targetSlot.x;
    const tgtY = targetSlot.centerY;

    if (Math.abs(srcY - tgtY) < 2) {
      return `M ${srcX} ${srcY} H ${tgtX}`;
    }

    const midX = srcX + (tgtX - srcX) / 2;
    return `M ${srcX} ${srcY} H ${midX} V ${tgtY} H ${tgtX}`;
  }

  // Pair connection (2 source matches -> 1 target match)
  const src1 = slotsMap.get(conn.from[0]);
  const src2 = slotsMap.get(conn.from[1]);
  if (!src1 || !src2) return "";

  const srcX = src1.x + src1.width;
  const y1 = Math.min(src1.centerY, src2.centerY);
  const y2 = Math.max(src1.centerY, src2.centerY);
  const tgtX = targetSlot.x;
  const tgtY = targetSlot.centerY;
  const midX = srcX + (tgtX - srcX) / 2;

  // Smooth rounded fillet arcs
  return [
    `M ${srcX} ${y1} H ${midX - r} Q ${midX} ${y1} ${midX} ${y1 + r}`,
    `V ${tgtY - r} Q ${midX} ${tgtY} ${midX + r} ${tgtY} H ${tgtX}`,
    `M ${srcX} ${y2} H ${midX - r} Q ${midX} ${y2} ${midX} ${y2 - r}`,
    `V ${tgtY + r} Q ${midX} ${tgtY} ${midX + r} ${tgtY} H ${tgtX}`
  ].join(" ");
}
