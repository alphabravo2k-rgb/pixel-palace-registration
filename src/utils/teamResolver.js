/**
 * Reusable Team Resolver Utility
 * Resolves a team from the registration list against a Pixel Palace API team reference.
 * Contains official team tags and logo URLs submitted by tournament participants.
 */

export function formatDriveUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

// Official team registry: name → { tag, logo }
export const OFFICIAL_TEAM_REGISTRY = {
  "team eagle":        { tag: "EAGLE",   logo: "https://lh3.googleusercontent.com/d/1MdrjT0acW7JLJoOWBfr_Y3QDWFtRB430" },
  "eagle":             { tag: "EAGLE",   logo: "https://lh3.googleusercontent.com/d/1MdrjT0acW7JLJoOWBfr_Y3QDWFtRB430" },
  "team black":        { tag: "BLACK",   logo: "https://lh3.googleusercontent.com/d/1_TIig1SFENt4ECS-rWStt0TgCVxkw4YM" },
  "black":             { tag: "BLACK",   logo: "https://lh3.googleusercontent.com/d/1_TIig1SFENt4ECS-rWStt0TgCVxkw4YM" },
  "legion":            { tag: "LG",      logo: "https://lh3.googleusercontent.com/d/1l-ayzwYBElLx7EeAMV953cPteKYiJ8Nh" },
  "board to death":    { tag: "BTD",     logo: "https://lh3.googleusercontent.com/d/17y5iDghg53oONpQVXAtUrO3LDi7nuHWu" },
  "udst wolves":       { tag: "WLVS",    logo: "https://lh3.googleusercontent.com/d/1cdTr8x4PC__iLxGBzD9959KHqEdSkL5_" },
  "back below":        { tag: "BB",      logo: "https://lh3.googleusercontent.com/d/1nwxrGcSBRxVXDCXTuCrhNqXeMborUQQ6" },
  "mr clan":           { tag: "Mr",      logo: "https://lh3.googleusercontent.com/d/1mEGkcRM_x4_MKGlu5mhiZhJU4sMQ7MfD" },
  "mr  clan":          { tag: "Mr",      logo: "https://lh3.googleusercontent.com/d/1mEGkcRM_x4_MKGlu5mhiZhJU4sMQ7MfD" },
  "nhk":               { tag: "NHK",     logo: "https://lh3.googleusercontent.com/d/1PvJkpkYG9ipMod_4J75g-N4lvSsuX6MD" },
  "arrival":           { tag: "AVL",     logo: "https://lh3.googleusercontent.com/d/1UGpQ1pDtWUpkc0IYSVS2PVPFME8t4pDN" },
  "aimst4rs":          { tag: "AS",      logo: "https://lh3.googleusercontent.com/d/1AsxaAW0Mj0ih-4oRc249mBZW1IdXq77k" },
  "team m5":           { tag: "M5",      logo: "https://lh3.googleusercontent.com/d/1kRH0c7peX-Y6m4fvDBNDQaKlb1_dPUEV" },
  "m5":                { tag: "M5",      logo: "https://lh3.googleusercontent.com/d/1kRH0c7peX-Y6m4fvDBNDQaKlb1_dPUEV" },
  "cloud69":           { tag: "C69",     logo: "https://lh3.googleusercontent.com/d/1Y5FNFuL2mrNA5Xj3tefsoFY4tQGFnrt0" },
  "quintess esports":  { tag: "QES",     logo: "https://lh3.googleusercontent.com/d/1P6ZyU4H-Qyo3abz12CiF8JmL1KY0eH3h" },
  "star bois":         { tag: "SB",      logo: "https://lh3.googleusercontent.com/d/1Klo6q-NuQhUKidGBACRYht2XRRyDykRA" },
  "jpb":               { tag: "JPB",     logo: "https://lh3.googleusercontent.com/d/1i4Jz_NpABwpYJqjhHNiU0UUPhmNR0XA2" },
  "diamond dogs":      { tag: "DD",      logo: "https://lh3.googleusercontent.com/d/1I3Y-R2hapLO-J7USyr9mIef_4H7YzqiC" },
  "team_throwers":     { tag: "TKMF",    logo: "https://lh3.googleusercontent.com/d/158cryD2sMFrHtiGY5iVFjuyUkrbIpfsS" },
  "team throwers":     { tag: "TKMF",    logo: "https://lh3.googleusercontent.com/d/158cryD2sMFrHtiGY5iVFjuyUkrbIpfsS" },
  "throwers":          { tag: "TKMF",    logo: "https://lh3.googleusercontent.com/d/158cryD2sMFrHtiGY5iVFjuyUkrbIpfsS" },
  "valo boosters":     { tag: "VBS",     logo: "https://lh3.googleusercontent.com/d/1E-_B6kHur9j3boFUMbcR84BlmS3LNV8s" },
  "losersgaming":      { tag: "LOSERS",  logo: "https://lh3.googleusercontent.com/d/1AZJoFehRKkvwxDuMuEZOVrJdi5ZOVFfh" },
  "losers gaming":     { tag: "LOSERS",  logo: "https://lh3.googleusercontent.com/d/1AZJoFehRKkvwxDuMuEZOVrJdi5ZOVFfh" },
  "team invictus":     { tag: "INVIC",   logo: "https://lh3.googleusercontent.com/d/1DqvTa08R0YtLCPQzf-2kkGcq25ftF4pu" },
  "invictus":          { tag: "INVIC",   logo: "https://lh3.googleusercontent.com/d/1DqvTa08R0YtLCPQzf-2kkGcq25ftF4pu" },
  "ppeeks":            { tag: "PPeeks",  logo: "https://lh3.googleusercontent.com/d/12XaFdF2TATny9KwAGyXCP2T3TqmCIz9c" },
  "eternity esports":  { tag: "Eternity",logo: "https://lh3.googleusercontent.com/d/1KlO3JSy29_da7Fa0c-HWq5VD3QffZPXL" },
  "eternity":          { tag: "Eternity",logo: "https://lh3.googleusercontent.com/d/1KlO3JSy29_da7Fa0c-HWq5VD3QffZPXL" },
  "aimgodz":           { tag: "AIMGOD",  logo: "https://lh3.googleusercontent.com/d/1gobCM-hFrpfgqLtLNa41N-HnLf8YiZez" },
  "rezemble esports":  { tag: "REZ",     logo: "https://lh3.googleusercontent.com/d/1ELRjN8b5FXqR4lS3JXCx-kmnae9vaRur" },
  "rezemble":          { tag: "REZ",     logo: "https://lh3.googleusercontent.com/d/1ELRjN8b5FXqR4lS3JXCx-kmnae9vaRur" },
  "nospirit":          { tag: "NST",     logo: "https://lh3.googleusercontent.com/d/1VF8AXOiiTdgld1tHm6eQapRf2MtGM31d" },
  "bambarbola":        { tag: "BB",      logo: "https://lh3.googleusercontent.com/d/15dGtyRnWS-3vTdQ0kiF-HfUoIF9Dma9E" },
  "egopeekers":        { tag: "EGO",     logo: "https://lh3.googleusercontent.com/d/1lGNFTRdRKCgg1QdGPNlopxNVRNxTiu3R" },
  "better to carry":   { tag: "BTC",     logo: "https://lh3.googleusercontent.com/d/1U6N3s6H9nhQy-g-X4O1BCdG-8l9RxEdD" },
  "team mani69":       { tag: "M69",     logo: "https://lh3.googleusercontent.com/d/1GCmjGSvBsXPuP-53mHQKKKSM3jL1UDbu" },
  "mani69":            { tag: "M69",     logo: "https://lh3.googleusercontent.com/d/1GCmjGSvBsXPuP-53mHQKKKSM3jL1UDbu" },
  "team arise":        { tag: "ARS",     logo: "https://lh3.googleusercontent.com/d/1a5TjaGvJck40lA7s4QtVVrgp0eZ8XhRT" },
  "arise":             { tag: "ARS",     logo: "https://lh3.googleusercontent.com/d/1a5TjaGvJck40lA7s4QtVVrgp0eZ8XhRT" },
};

// Keep the flat tags map for backwards compatibility
export const OFFICIAL_TEAM_TAGS = Object.fromEntries(
  Object.entries(OFFICIAL_TEAM_REGISTRY).map(([k, v]) => [k, v.tag])
);

export function normalizeString(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function _lookupRegistry(nameInput) {
  if (!nameInput) return null;
  const norm = normalizeString(nameInput);
  for (const [key, val] of Object.entries(OFFICIAL_TEAM_REGISTRY)) {
    if (normalizeString(key) === norm) return val;
  }
  return null;
}

export function getTeamTag(teamInput) {
  if (!teamInput) return 'TBD';
  if (typeof teamInput === 'object' && teamInput.tag) return teamInput.tag;
  const nameStr = typeof teamInput === 'string' ? teamInput : teamInput?.name;
  if (!nameStr) return 'TBD';
  const entry = _lookupRegistry(nameStr);
  if (entry) return entry.tag;
  return nameStr.substring(0, 4).toUpperCase();
}

export function getTeamLogoUrl(teamInput) {
  if (!teamInput) return null;
  let rawUrl = null;
  if (typeof teamInput === 'object') {
    if (teamInput.logo_url && teamInput.logo_url.startsWith('http')) rawUrl = teamInput.logo_url;
    else if (teamInput.logo && teamInput.logo.startsWith('http')) rawUrl = teamInput.logo;
  }
  if (!rawUrl) {
    const nameStr = typeof teamInput === 'string' ? teamInput : teamInput?.name;
    if (!nameStr) return null;
    const entry = _lookupRegistry(nameStr);
    rawUrl = entry?.logo || null;
  }
  return formatDriveUrl(rawUrl);
}

export function resolveTeam(fluxTeam, gasTeams = []) {
  if (!fluxTeam || !Array.isArray(gasTeams)) return null;

  if (typeof fluxTeam === 'object') {
    const regId = normalizeString(fluxTeam.registrationId || fluxTeam.regId);
    const teamId = normalizeString(fluxTeam.id || fluxTeam.teamId);
    const tag = normalizeString(fluxTeam.tag);
    const name = normalizeString(fluxTeam.name);

    if (regId) {
      const match = gasTeams.find(t => normalizeString(t.registrationId) === regId);
      if (match) return match;
    }
    if (teamId) {
      const match = gasTeams.find(t => normalizeString(t.id || t.teamId) === teamId);
      if (match) return match;
    }
    if (tag) {
      const match = gasTeams.find(t => normalizeString(t.tag) === tag);
      if (match) return match;
    }
    if (name && name !== 'tbd' && name !== 'bye') {
      const match = gasTeams.find(t => normalizeString(t.name) === name);
      if (match) return match;
    }
    return null;
  }

  const cleanNorm = normalizeString(fluxTeam);
  if (!cleanNorm || cleanNorm === 'tbd' || cleanNorm === 'bye') return null;

  return gasTeams.find(t =>
    normalizeString(t.registrationId) === cleanNorm ||
    normalizeString(t.id || t.teamId) === cleanNorm ||
    normalizeString(t.tag) === cleanNorm ||
    normalizeString(t.name) === cleanNorm
  ) || null;
}

export function getTeamLogo(fluxTeam, gasTeams = []) {
  const resolved = resolveTeam(fluxTeam, gasTeams);
  if (resolved && resolved.logo && resolved.logo.startsWith('http')) return formatDriveUrl(resolved.logo);
  if (typeof fluxTeam === 'object' && fluxTeam.logo && fluxTeam.logo.startsWith('http')) return formatDriveUrl(fluxTeam.logo);
  return getTeamLogoUrl(fluxTeam);
}
