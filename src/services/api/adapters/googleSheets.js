export const mapToGoogleSheets = (canonical) => {
  const flat = {
    idempotencyKey: canonical.submission_id,
    tournamentId: canonical.tournament_id,
    teamName: canonical.team.team_name,
    teamTag: canonical.team.team_tag,
    teamRegion: canonical.team.region,
    logoLink: canonical.team.logo_url,
    inviteCode: canonical.team.invite_code || "",
    subIncluded: canonical.metadata.sub_included
  };

  // Dynamically map roster to specific flattened keys
  canonical.roster.forEach((player, i) => {
    const idx = i + 1;
    flat[`p${idx}Discord`] = player.discord || "";
    flat[`p${idx}Steam`] = player.steam || "";
    flat[`p${idx}Faceit`] = player.faceit || "";
    flat[`p${idx}Rank`] = player.rank || "";
  });

  return flat;
};
