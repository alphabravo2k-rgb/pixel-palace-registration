# Pixel Palace Tournament OS — Domain Specification v1.0
## CANONICAL TELEMETRY MODEL & DOMAIN LIFECYCLE ARCHITECTURE

---

# 1. Executive Summary

Pixel Palace Tournament OS separates **Domain Telemetry Models** from **Presentation Projections**. The application is structured around 10 authoritative domains:

```
Tournament
│
├── Season / Tournament Domain (Standings, Brackets, Stakes, Records)
├── Match Lifecycle Domain (State Machine: Scheduled → Live → Approved → Archived)
├── Series & Map Domain (Map Veto, Scores, Overtime, Map MVP)
├── Round Intelligence Domain (Equip Value, Buy Types, Opening Duels, Win Conditions)
├── Economy Domain (Money Timeline, Saved Rifles, Lost Bonus, Rebuy Efficiency)
├── Utility & Tactical Domain (Flash Duration, HE Damage, Molotov Area Denial, Smokes)
├── Player & Weapon Intelligence Domain (Rating 2.0, ADR, KAST, Entry, Weapon Acc)
├── Team Identity & Scouting Domain (Map Pool Win %, Permabans, Historical H2H)
├── Officials & Operations Domain (Referee Pause Audit, Server Health 128 Tick, RCON)
└── Historical & Records Domain (Tournament Records, Milestone Badges, Cross-Match DB)
```

---

# 2. Match Lifecycle State Machine

```
[SCHEDULED] ──> [CHECK_IN] ──> [SERVER_READY] ──> [KNIFE_ROUND] ──> [LIVE]
                                                                        │
[ARCHIVED] <── [APPROVED] <── [DISPUTE_RESOLUTION] <── [SERIES_CONCLUDED] ◄┘
```

| Lifecycle State | Server Action | Authorized User Roles | Audit Log Event |
| :--- | :--- | :--- | :--- |
| `SCHEDULED` | Server Provisioned | Admin, TO | `MATCH_SCHEDULED` |
| `CHECK_IN` | RCON Handshake / Steam ID Check | Team Captains | `TEAM_CHECKED_IN` |
| `SERVER_READY` | GOTV Active / 128 Tick Ready | Referee, Admin | `SERVER_VERIFIED` |
| `KNIFE_ROUND` | Side Selection Lock | Referee | `KNIFE_COMPLETED` |
| `LIVE` | Telemetry Stream Active | System / FluxBot | `MAP_STARTED` |
| `HALFTIME` | Side Swap Lock | Referee | `HALFTIME_SWITCH` |
| `TECH_PAUSE` | Pause Hold Active | Referee, Captains | `TECHNICAL_PAUSE_CALLED` |
| `MAP_END` | Score Signed Off | Referee, System | `MAP_CONCLUDED` |
| `SERIES_CONCLUDED` | Gold Champion Banner | System | `SERIES_CONCLUDED` |
| `APPROVED` | Prize Pool Disbursed | Admin | `MATCH_APPROVED` |

---

# 3. Telemetry Source & Confidence Classification

Every data point rendered in Pixel Palace OS carries a strict Telemetry Source Badge:

- **🟢 CANONICAL TELEMETRY**: Sourced live from FluxBot API, Apps Script Backend DTO, or Google Sheets canonical datastore.
- **📊 DERIVED TELEMETRY**: Calculated programmatically from canonical DTO fields (e.g. Rating 2.0 derived from K/D/A/ADR/Rounds).
- **⏳ PLANNED TELEMETRY**: Requires CS2 Demo Replay Parser (e.g. spatial 2D heatmaps & GOTV tick replays).

---

# 4. Domain Mapping Matrix

| Domain | Canonical DTO Structure | Sourced via FluxBot | Derived in Frontend | Demo Parser Required |
| :--- | :--- | :---: | :---: | :---: |
| **Match Lifecycle** | `match.status`, `match.refereeLogs` | ✅ | ❌ | ❌ |
| **Series & Maps** | `series.score`, `maps[].mapName` | ✅ | ❌ | ❌ |
| **Round Intelligence** | `round.winner`, `round.equipValue` | ✅ | ❌ | ❌ |
| **Economy Center** | `economy.fullBuyWinPct`, `savedMoney` | ✅ | ❌ | ❌ |
| **Utility Center** | `utility.flashDuration`, `heDamage` | ✅ | ❌ | ❌ |
| **Player Roles** | `player.rating`, `entryKills`, `clutches` | ✅ | ✅ | ❌ |
| **Team Scouting** | `team.mapPoolWinRate`, `permabans` | ✅ | ❌ | ❌ |
| **Replay Markers** | `replays[].tick`, `replays[].clip` | ❌ | ❌ | ✅ |
| **Spatial Heatmaps** | `player.heatmapKills`, `utilityHeatmap` | ❌ | ❌ | ✅ |
