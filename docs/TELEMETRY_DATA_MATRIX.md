# Pixel Palace Match Center — Telemetry Source Matrix v1.0
## ZERO MISSING INFORMATION & CANONICAL DATA SOURCES

---

# 1. Telemetry Source & Confidence Classification

| Entity | Field / Metric | Telemetry Source | Status | Backend DTO Field | Confidence Badge |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Series** | Series Score (e.g. 2–1) | FluxBot Adapter / Sheet | ✅ | `summary.seriesScore` | 🟢 CANONICAL TELEMETRY |
| **Series** | Series Winner & Champion Banner | FluxBot Adapter / Sheet | ✅ | `summary.winnerId` | 🟢 CANONICAL TELEMETRY |
| **Series** | Series MVP Resolution | Calculated from Player Stats | ✅ | `currentContext.mvp` | 📊 DERIVED TELEMETRY |
| **Tournament** | Bracket Stage & Prize Stakes | System Config / Sheet | ✅ | `summary.tournament` | 🟢 CANONICAL TELEMETRY |
| **Tournament** | Map Veto Sequence | Provider Log / Admin Form | ✅ | `summary.vetoSequence` | 🟢 CANONICAL TELEMETRY |
| **Map** | Scores & Total Rounds | Sheet / CacheService | ✅ | `summary.mapsStats` | 🟢 CANONICAL TELEMETRY |
| **Map** | Round-by-Round History Strip | Provider Event Log / API | ✅ | `roundHistory[]` | 🟢 CANONICAL TELEMETRY |
| **Round** | Round Winner & Side (CT/T) | Provider Event Log / API | ✅ | `round.winner`, `round.side` | 🟢 CANONICAL TELEMETRY |
| **Round** | Victory Condition (Bomb/Defuse/Kill) | Provider Event Log / API | ✅ | `round.event` | 🟢 CANONICAL TELEMETRY |
| **Round** | Equipment Value & Buy Type | Provider Event Log / API | ✅ | `round.buyType`, `round.equip` | 🟢 CANONICAL TELEMETRY |
| **Round** | Opening Duel & Weapon | Provider Event Log / API | ✅ | `round.firstKill` | 🟢 CANONICAL TELEMETRY |
| **Team** | Head-to-Head ADR & Win % | Derived Player/Map Stats | ✅ | `teamComparison` | 📊 DERIVED TELEMETRY |
| **Player** | Rating 2.0, K/D, ADR, KAST | Calculated Player Stats | ✅ | `allPlayers[]` | 📊 DERIVED TELEMETRY |
| **Player** | Entry Duels & Clutches | Derived Player Stats | ✅ | `player.entryKills`, `clutches` | 📊 DERIVED TELEMETRY |
| **Player** | Spatial Heatmaps (Kills/Deaths) | CS2 Demo Replay Parser | ⏳ | `player.heatmapUrl` | ⏳ PLANNED (DEMO PARSER) |
| **Officials** | Referee Logs & Penalties | Audit Repository | ✅ | `auditLog[]` | 🟢 CANONICAL TELEMETRY |

---

# 2. Domain Lifecycle Integration

See [docs/DOMAIN_SPECIFICATION_v1.0.md](file:///d:/Pixel%20Palace/pixel-palace-registration/docs/DOMAIN_SPECIFICATION_v1.0.md) for the complete 10-Domain Lifecycle Architecture and Match State Machine (`Scheduled` → `Check-in` → `Server Ready` → `Knife` → `Live` → `Halftime` → `Technical Pause` → `Timeout` → `Map End` → `Series End` → `Dispute` → `Approved` → `Archived`).
