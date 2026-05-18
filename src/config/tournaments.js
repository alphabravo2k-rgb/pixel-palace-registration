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
    sheetsEndpoint: "https://script.google.com/macros/s/AKfycbyaIDyEwLl7DD_1VS4Rd0QtLE8o9TPUJnrn-uHGZKemnX7x8ncSGEnjJf086F-JTCaF/exec",
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
    champion: { 
      name: "come mid", 
      score: "2-1",
      players: ["SultaaN--", "-soulM8"],
      matchHistory: [
        { map: "Inferno", score: "5-9", win: false },
        { map: "Poseidon", score: "9-6", win: true },
        { map: "Overpass", score: "9-4", win: true }
      ]
    },
    runnerUp: { name: "GN3", players: ["LaGGer7-", "-vapezflyy"] },
    thirdPlace: { name: "patties" },
    fourthPlace: { name: "Team BackBehind" },
    bracketEmbedUrl: "https://challonge.com/ppwc2026/module",
    scheduleUtc: [
      "2026-04-24T21:00:00+05:00", // Quarterfinals
      "2026-04-25T21:00:00+05:00", // Semifinals
      "2026-04-26T22:00:00+05:00", // Grand Finals
    ]
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
    playersPerTeam: 5,
    scheduleUtc: [
      "2026-03-01T22:30:00Z", // Week 1
      "2026-03-08T22:30:00Z", // Week 2
      "2026-03-15T22:30:00Z", // Week 3
      "2026-03-22T22:30:00Z", // Finals
    ]
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
    playersPerTeam: 5,
    scheduleUtc: [
      "2026-01-09T18:00:00Z", // Day 1
      "2026-01-10T18:00:00Z", // Day 2
      "2026-01-11T18:00:00Z", // Finals
    ]
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
    playersPerTeam: 1,
    scheduleUtc: [
      "2026-01-02T18:00:00Z"
    ]
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
  sheetsEndpoint: "https://script.google.com/macros/s/AKfycbyaIDyEwLl7DD_1VS4Rd0QtLE8o9TPUJnrn-uHGZKemnX7x8ncSGEnjJf086F-JTCaF/exec",
  softBanEnabled: false,
  bracketsEnabled: false,
  tournamentComplete: false,
  supportsLogoUpload: false,
  champion: { name: "", tag: "", logo: "" },
  runnerUp: { name: "", tag: "", logo: "" },
  
  // API Keys (empty strings = fallback UI logic is triggered)
  // API Keys (Environment Variables)
  faceitApiKey: import.meta.env.VITE_FACEIT_API_KEY || "",
  steamApiKey: import.meta.env.VITE_STEAM_API_KEY || "",
  cloudinaryCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
  cloudinaryUploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
  discordStaffWebhook: import.meta.env.VITE_DISCORD_STAFF_WEBHOOK || "",
  adminPreviewKey: import.meta.env.VITE_ADMIN_PREVIEW_KEY || "pixel-palace-internal-2026",
  
  playerFields: ["ign", "discord", "steam", "faceit"],
  scheduleUtc: [],
  entryFee: 0,
  entryFeeAsset: 'USDT',
  sponsors: [],
};

export const getTournamentBySlug = (slug) => {
  const tournament = tournaments.find((t) => t.slug === slug);
  if (!tournament) return null;
  return { ...defaultConfig, ...tournament };
};

