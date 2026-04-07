/**
 * Transforms flat form data from TournamentForm into the CanonicalSchema format.
 */
export const transformToCanonical = (tournamentId, flatData) => {
  const submission_id = flatData.idempotencyKey || crypto.randomUUID();
  
  const team = {
    team_name: flatData.teamName || "",
    team_tag: flatData.teamTag || "",
    region: flatData.teamRegion || "",
    logo_url: flatData.logoLink || "",
    invite_code: flatData.inviteCode || ""
  };

  const roster = [];
  // Correctly iterate through players based on flatData keys
  // p1Discord, p2Discord, etc.
  const playerIndices = new Set();
  Object.keys(flatData).forEach(key => {
    const match = key.match(/^p(\d+)/);
    if (match) playerIndices.add(parseInt(match[1]));
  });

  const sortedIndices = Array.from(playerIndices).sort((a, b) => a - b);
  
  sortedIndices.forEach(idx => {
    // Only include if at least one field is present
    if (flatData[`p${idx}Discord`] || flatData[`p${idx}Steam`] || flatData[`p${idx}Faceit`]) {
      roster.push({
        discord: flatData[`p${idx}Discord`] || "",
        steam: flatData[`p${idx}Steam`] || "",
        faceit: flatData[`p${idx}Faceit`] || "",
        rank: flatData[`p${idx}Rank`] || "5"
      });
    }
  });

  return {
    submission_id,
    tournament_id: tournamentId,
    team,
    roster,
    metadata: {
      submitted_at: new Date().toISOString(),
      source: "portal_v1",
      schema_version: "1.0",
      sub_included: !!flatData.subCount
    }
  };
};
