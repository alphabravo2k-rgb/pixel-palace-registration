export const tournaments = [
  {
    id: "esports-open-s1",
    name: "Pixel Palace Esports Open — Season 1",
    slug: "esports-open-s1",
    status: "active", // "active" | "closed" | "upcoming"
    sheetsEndpoint: "", // To be filled with Google Apps Script Web App URL
    fields: [
      "teamName",
      "captainName",
      "captainSteamID",
      "captainDiscord",
      "captainEmail",
      "captainPhone",
      "player2Name",
      "player2SteamID",
      "player3Name",
      "player3SteamID",
      "player4Name",
      "player4SteamID",
      "player5Name",
      "player5SteamID"
    ]
  }
];

export const getTournamentBySlug = (slug) => {
  return tournaments.find((t) => t.slug === slug);
};
