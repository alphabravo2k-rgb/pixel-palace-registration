export const tournaments = [
  {
    id: "community-cup-2",
    name: "Pixel Palace Community Cup 2 (2026)",
    slug: "community-cup-2",
    status: "LIVE",
    format: "5v5",
    gameMode: "CS2 Competitive",
    prizePool: "1st: $2000 | 2nd: $750",
    maxTeams: 32,
    openSlots: 26,
    inviteSlots: 6,
    region: "SEA & West Asia",
    startTime: "20:00 PKT ONWARDS",
    displayTime: "8PM Pakistan | 8:30PM India | 7PM UAE",
    serverLocation: "Dubai (DXB)",
    displayDate: "July 31 - August 03",
    displayYear: "2026",
    tournamentDate: "2026-07-31T20:00:00+05:00",
    registrationDeadline: "2026-07-26T23:59:00+05:00",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_mirage.png",
    antiCheat: "Akros",
    playersPerTeam: 5,
    substitutes: { min: 0, max: 2 },
    maps: ["Ancient", "Anubis", "Cache", "Dust2", "Inferno", "Mirage", "Nuke"],
    sheetsEndpoint: "https://script.google.com/macros/s/AKfycby0ryeemIms7XhpnEohHms0Cm3k2gUIgl0_XBDhz7gjJfGH5Hi7Qhm12l-ERNd9C7ACgw/exec",
    customVerification: [
      "MANDATORY ANTI-CHEAT — Our team acknowledges that Akros Anti-Cheat must be installed by all players.",
      "COMMUNICATION — All players have joined the Pixel Palace Discord server.",
      "VOICE COMMS — All players confirm to join Pixel Voice Channels during their matches.",
      "SCHEDULE — We confirm availability for the registration deadline and all tournament dates."
    ],

    // Feature flags
    discordRequired: true,
    softBanEnabled: false,
    bracketsEnabled: false,
    supportsLogoUpload: true,
    hideRegisteredTeamsDuringRegistration: true,

    // Results
    tournamentComplete: false,
    champion: { name: "", tag: "", logo: "" },
    runnerUp: { name: "", tag: "", logo: "" },

    scheduleUtc: [
      "2026-07-31T20:00:00+05:00",
      "2026-08-01T20:00:00+05:00",
      "2026-08-02T20:00:00+05:00",
      "2026-08-03T20:00:00+05:00",
    ]
  },
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
    tournamentComplete: true,
    champion: {
      name: "Team Sanctuary",
      tag: "SNC",
      logo: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png",
      score: "2-1",
      players: ["Sanctuary-1", "Sanctuary-2", "Sanctuary-3", "Sanctuary-4", "Sanctuary-5"],
      matchHistory: [
        { map: "Dust2", score: "11-13", win: false },
        { map: "Mirage", score: "13-10", win: true },
        { map: "Inferno", score: "13-8", win: true }
      ]
    },
    runnerUp: { name: "TBD", players: ["Runner-1", "Runner-2", "Runner-3", "Runner-4", "Runner-5"] },
    maps: ["Dust2", "Mirage", "Inferno", "Nuke", "Anubis", "Ancient"],
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
    playersPerTeam: 2,
    tournamentComplete: true,
    champion: {
      name: "Team Come Mid",
      tag: "MID",
      logo: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_nuke.png",
      score: "2-0",
      players: ["ComeMid-1", "ComeMid-2"],
      matchHistory: [
        { map: "Nuke", score: "9-4", win: true },
        { map: "Inferno", score: "9-6", win: true }
      ]
    },
    runnerUp: { name: "TBD", players: ["Runner-1", "Runner-2"] },
    maps: ["Nuke", "Inferno", "Vertigo", "Overpass", "Poseidon", "Sanctum"]
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
    tournamentComplete: true,
    champion: {
      name: "Team Legion",
      tag: "LGN",
      logo: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_inferno.png",
      score: "2-0",
      players: ["Legion-1", "Legion-2", "Legion-3", "Legion-4", "Legion-5"],
      matchHistory: [
        { map: "Inferno", score: "13-9", win: true },
        { map: "Mirage", score: "13-7", win: true }
      ]
    },
    runnerUp: { name: "TBD", players: ["Runner-1", "Runner-2", "Runner-3", "Runner-4", "Runner-5"] },
    maps: ["Inferno", "Mirage", "Nuke", "Ancient", "Anubis", "Dust2"],
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
    playersPerTeam: 2,
    tournamentComplete: true,
    champion: {
      name: "Team Que Ota",
      tag: "QO",
      logo: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_overpass.png",
      score: "2-0",
      players: ["QueOta-1", "QueOta-2"],
      matchHistory: [
        { map: "Overpass", score: "9-5", win: true },
        { map: "Vertigo", score: "9-6", win: true }
      ]
    },
    runnerUp: { name: "TBD", players: ["Runner-1", "Runner-2"] },
    maps: ["Overpass", "Vertigo", "Nuke", "Inferno"]
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
    playersPerTeam: 2,
    tournamentComplete: true,
    champion: {
      name: "Team Aimers",
      tag: "AMR",
      logo: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_vertigo.png",
      score: "2-1",
      players: ["Aimers-1", "Aimers-2"],
      matchHistory: [
        { map: "Vertigo", score: "5-9", win: false },
        { map: "Nuke", score: "9-7", win: true },
        { map: "Inferno", score: "9-4", win: true }
      ]
    },
    runnerUp: { name: "TBD", players: ["Runner-1", "Runner-2"] },
    maps: ["Vertigo", "Nuke", "Inferno", "Overpass", "Poseidon", "Sanctum"]
  }
];

// Fallback configuration for old tournaments so nothing breaks
const defaultConfig = {
  discordRequired: false,
  discordInviteUrl: "https://discord.com/invite/pixelpalacee",
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

