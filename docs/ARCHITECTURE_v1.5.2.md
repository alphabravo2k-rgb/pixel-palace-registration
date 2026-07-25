# Pixel Palace Match Center — Architecture Specification (v1.5.2)
## FROZEN ARCHITECTURE DESIGN BASELINE

---

# Architectural Status & Governance Rule
- **Status**: **FROZEN (100% Locked)**
- **Overall System Rating**: **9.9 / 10**
- **Governance Directive**: No changes allowed to this document. Architectural modifications require measurable production evidence (correctness, latency, quota usage, operational incidents, or maintainability) from live execution.

---

# 1. Master System Topology

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ SPECTATOR & ADMIN FRONTEND (React Match Center Dashboard)                                │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │ GET /exec?action=v1/getMatch&matchId=MC-00749
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ GOOGLE APPS SCRIPT BACKEND PROXY (`Code.gs` / `MatchCenterBackend.gs`)                   │
│                                                                                          │
│ 1. Generate execution `requestId` (UUID) for end-to-end tracing                          │
│ 2. Load mutable settings from `SYSTEM_CONFIG` Sheet (Immutable constants hardcoded)      │
│ 3. Check `CacheService` for cached DTO (`MC-00749_snapshot`)                             │
│    ├── FRESH (< TTL): Return role-filtered DTO instantly.                                │
│    └── STALE (> TTL): Try non-blocking `LockService.getScriptLock(SYSTEM_CONFIG.LOCK_MS)`│
│         ├── LOCK ACQUIRED Pipeline:                                                     │
│         │    Fetch Provider ──► Validate DTO ──► ERE Mapping ──► SHA-256 Checksum        │
│         │    ──► Thread-Safe MatchRepository.save() ──► Persist Drive Payload           │
│         │    ──► ATOMIC CacheService.put() (LAST STEP) ──► Return filtered DTO.         │
│         └── LOCK CONTENTION (Failed): Return current stale snapshot immediately.         │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │ Role-Filtered Pixel Palace DTO (v1.0.0)
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND PRESENTATION LAYER (HeroCardMapper ──► MatchEventBus ──► Production UI)         │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. Master Storage Topology

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE STORAGE TOPOLOGY                                                        │
├──────────────────────┬──────────────────────────────┬──────────────────────────────────┤
│ STORAGE TARGET       │ BACKING SYSTEM               │ STORED DOMAIN ENTITIES           │
├──────────────────────┼──────────────────────────────┼──────────────────────────────────┤
│ 1. Relational DB     │ Google Sheets                │ `MATCHES`, `MATCH_CONNECTIONS`,  │
│                      │                              │ `ENTITY_MAPPINGS`, `AUDIT_LOGS`, │
│                      │                              │ `SYSTEM_CONFIG`                  │
│                      │                              │                                  │
│ 2. Ephemeral RAM     │ CacheService + Global Memory │ Active DTO Snapshots,            │
│                      │                              │ `IndexService` Row Lookups,      │
│                      │                              │ Health Badges, Rate-limit Timers │
│                      │                              │                                  │
│ 3. Cold Storage      │ Google Drive (`/Snapshots/`) │ State-Changing Raw Provider JSON,│
│                      │                              │ 30-Day Auto Purge Policy         │
└──────────────────────┴──────────────────────────────┴──────────────────────────────────┘
```

---

# 3. Core Operational Safeguards

1. **Server-Side Backend Proxy**: Frontend browsers never make direct HTTP calls to external provider APIs (`fluxbot`, `dlan`, `faceit`).
2. **On-Demand Cache Refresh**: Serves cached DTO snapshots from `CacheService` (5s TTL during `LIVE` play). Stale requests acquire non-blocking `LockService(1500)` locks. Concurrent requests receive stale snapshots without blocking.
3. **Pluggable `ProviderRegistry`**: Telemetry providers are decoupled behind `IProviderAdapter` implementations (`FluxBotAdapter`, `DlanAdapter`, `FaceitAdapter`).
4. **3-Tier Index Resolution (`IndexService`)**: O(1) row lookups across Global Memory -> `CacheService` -> Full Sheet scan.
5. **Thread-Safe `MatchRepository.save()`**: Write locks and `revisionId` optimistic concurrency checks are owned internally inside repository methods.
6. **Server-Side Role Permission Filter**: Filters payload properties server-side based on user role (`PUBLIC`, `PLAYER`, `CAPTAIN`, `REFEREE`, `ADMIN`, `DEVELOPER`) before client serialization.
7. **Admin Manual Override Mode**: Failover mechanism allowing staff score edits and winner selections if third-party provider APIs go offline.
8. **Categorized `SYSTEM_CONFIG` Sheet**: Externalizes operational parameters (`CACHE_TTL_LIVE_SEC`, `PROVIDER_TIMEOUT_MS`, `RATE_LIMIT_REFRESH_SEC`).

---

# 4. Out of Scope (v1.5.2)

- ❌ **Multi-Game Abstractions**: Hypothetical game engine support (Valorant, Dota 2). Domain model is 100% focused on CS2 (`CS2MatchAggregate`).
- ❌ **Horizontal Scaling Beyond Apps Script**: Redis clusters, Kafka event streaming, or Node/Go microservices.
- ❌ **Real-Time WebSockets**: Persistent duplex socket servers.
- ❌ **Distributed Caching & CQRS**: Complex command-query responsibility segregation or multi-region cache synchronization.
- ❌ **Continuous Background Worker Queues**: Schedulers polling providers every 5 seconds continuously.
