export const tournaments = [
  {
    id: "chaos-ii",
    name: "Wingman Chaos II (2026)",
    slug: "chaos-ii",
    status: "ARCHIVED",
    format: "2v2",
    gameMode: "CS2 Wingman",
    prizePool: "$400",
    maxTeams: 50,
    openSlots: 50,
    inviteSlots: 0,
    region: "Pak Ind & Middle East",
    startTime: "21:00 PKT ONWARDS",
    displayTime: "21:00 (GMT+5) / PAK TIME",
    serverLocation: "Dubai (DXB)",
    displayDate: "APRIL 24 TILL 27",
    displayYear: "2026",
    tournamentDate: "2026-04-24T21:00:00+05:00",
    registrationDeadline: "2026-04-18T23:59:00+05:00",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_overpass.png",
    antiCheat: "Akros",
    playersPerTeam: 2,
    substitutes: { min: 0, max: 1 },
    maps: ["Poseidon", "Sanctum", "Overpass", "Vertigo", "Nuke", "Inferno"],
    sheetsEndpoint: "https://script.google.com/macros/s/AKfycby0ryeemIms7XhpnEohHms0Cm3k2gUIgl0_XBDhz7gjJfGH5Hi7Qhm12l-ERNd9C7ACgw/exec",
    customVerification: [
      "MANDATORY ANTI-CHEAT — Our duo acknowledges that Akros Anti-Cheat must be installed by all players.",
      "COMMUNICATION — All players have joined the Pixel Palace Discord server.",
      "VOICE COMMS — All players confirm to join Pixel Voice Channels during their matches.",
      "SCHEDULE — We confirm availability for the registration deadline and all tournament dates."
    ],
    
    // Feature flags for Chaos II
    discordRequired: true,
    softBanEnabled: true,
    bracketsEnabled: true,
    supportsLogoUpload: true,
    
    // Results
    tournamentComplete: true,
    champion: { name: "come mid" },
    runnerUp: { name: "GN3" },
    bracketEmbedUrl: "https://challonge.com/ppwc2026/module",
  },


  {
    id: "ramadan-league-1",
    name: "Ramadan League I (2026)",
    slug: "ramadan-league",
    status: "ARCHIVED",
    format: "5v5",
    gameMode: "CS2 Competitive",
    prizePool: "$400",
    maxTeams: 8,
    region: "PAK / IND",
    tournamentDate: "2026-03-01T22:30:00Z",
    registrationDeadline: "2026-02-28T23:59:00Z",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png",
    playersPerTeam: 5
  },
  {
    id: "fc26-tournament-ii",
    name: "FC26 Tournament II (2026)",
    slug: "fc26-ii",
    status: "ARCHIVED",
    format: "1v1",
    gameMode: "FC26",
    prizePool: "$100",
    maxTeams: 32,
    region: "PAK / IND",
    tournamentDate: "2026-02-14T18:00:00Z",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_mirage.png",
    playersPerTeam: 1
  },
  {
    id: "chaos-i",
    name: "Wingman Chaos I (2026)",
    slug: "chaos-i",
    status: "ARCHIVED",
    format: "2v2",
    gameMode: "CS2 Wingman",
    prizePool: "$600",
    maxTeams: 64,
    region: "PAK / IND",
    tournamentDate: "2026-01-30T18:00:00Z",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_nuke.png",
    playersPerTeam: 2
  },
  {
    id: "rocket-league-1",
    name: "Rocket League 2v2 I (2026)",
    slug: "rocket-league-i",
    status: "ARCHIVED",
    format: "2v2",
    gameMode: "Rocket League",
    prizePool: "$100",
    maxTeams: 16,
    region: "PAK / IND",
    tournamentDate: "2026-01-23T18:00:00Z",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_ancient.png",
    playersPerTeam: 2
  },
  {
    id: "fc26-tournament-i",
    name: "FC26 Tournament I (2026)",
    slug: "fc26-i",
    status: "ARCHIVED",
    format: "1v1",
    gameMode: "FC26",
    prizePool: "$250",
    maxTeams: 32,
    region: "PAK / IND",
    tournamentDate: "2026-01-18T18:00:00Z",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_anubis.png",
    playersPerTeam: 1
  },
  {
    id: "community-cup-i",
    name: "Community Cup I (2026)",
    slug: "community-cup-1",
    status: "ARCHIVED",
    format: "5v5",
    gameMode: "CS2 Competitive",
    prizePool: "$4,000",
    maxTeams: 20,
    region: "ME / PAK",
    tournamentDate: "2026-01-09T18:00:00Z",
    registrationDeadline: "2026-01-08T23:59:00Z",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_inferno.png",
    playersPerTeam: 5
  },
  {
    id: "8ball-pool-i",
    name: "8 Ball Pool I (2026)",
    slug: "8ball-i",
    status: "ARCHIVED",
    format: "1v1",
    gameMode: "8 Ball Pool",
    prizePool: "$25",
    maxTeams: 16,
    region: "PAK / IND",
    tournamentDate: "2026-01-02T18:00:00Z",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png",
    playersPerTeam: 1
  },
  {
    id: "flying-clowns-i",
    name: "Flying Clowns I (2025)",
    slug: "flying-clowns",
    status: "ARCHIVED",
    format: "2v2",
    gameMode: "Flying Scoutzman",
    prizePool: "$100",
    maxTeams: 16,
    region: "PAK / IND",
    tournamentDate: "2025-12-28T18:00:00Z",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_overpass.png",
    playersPerTeam: 2
  },
  {
    id: "cs2-1v1-i",
    name: "CS2 1v1 Tournament I (2025)",
    slug: "cs2-1v1-i",
    status: "ARCHIVED",
    format: "1v1",
    gameMode: "CS2 1v1",
    prizePool: "ASUS 240Hz Monitor",
    maxTeams: 32,
    region: "PAK / IND",
    tournamentDate: "2025-12-14T18:00:00Z",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_aim_map.png",
    playersPerTeam: 1
  },
  {
    id: "wingman-clash-i",
    name: "Wingman Clash I (2025)",
    slug: "wingman-ep1",
    status: "ARCHIVED",
    format: "2v2",
    gameMode: "CS2 Wingman",
    prizePool: "$800",
    maxTeams: 64,
    region: "PAK / IND",
    tournamentDate: "2025-11-28T18:00:00Z",
    registrationDeadline: "2025-11-27T23:59:00Z",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_vertigo.png",
    playersPerTeam: 2
  }
];

// Fallback configuration for old tournaments so nothing breaks
const defaultConfig = {
  discordRequired: false,
  discordInviteUrl: "https://discord.gg/y6ZW8jHn2Q",
  softBanEnabled: false,
  bracketsEnabled: false,
  tournamentComplete: false,
  supportsLogoUpload: false,
  champion: { name: "", tag: "", logo: "" },
  runnerUp: { name: "", tag: "", logo: "" },
  
  // API Keys (empty strings = fallback UI logic is triggered)
  faceitApiKey: "",       // developers.faceit.com (Required for auto ELO fetch)
  steamApiKey: "",        // steamcommunity.com/dev/apikey (Required for vanity URL resolving)
  cloudinaryCloudName: "",
  cloudinaryUploadPreset: "",
  discordWebhookUrl: "",  // Integration webhooks 
  adminPreviewKey: "pixel-palace-internal-2026",
  
  playerFields: ["ign", "discord", "steam", "faceit"],
};

export const getTournamentBySlug = (slug) => {
  const tournament = tournaments.find((t) => t.slug === slug);
  if (!tournament) return null;
  return { ...defaultConfig, ...tournament };
};

