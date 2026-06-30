/**
 * PIXEL PALACE — MASTER RAW REGISTRATIONS SCRIPT v4.0 (RECEIVER)
 *
 * Deployed in: Pixel Palace | Raw Registrations Spreadsheet
 * Web App URL: https://script.google.com/macros/s/AKfycby0ryeemIms7XhpnEohHms0Cm3k2gUIgl0_XBDhz7gjJfGH5Hi7Qhm12l-ERNd9C7ACgw/exec
 */

const SPREADSHEET_ID = "18v5CFox5pRSRNhEtx9kmkVJHNDwH2K84hvMIH-KZyEc";
const ADMIN_SECRET = ""; // Optional gateway secret matching VITE_GATEWAY_AUTH_SECRET
const LOGO_FOLDER_ID = "1HYrpFCvd4f4K26NtukB2Dq05lTaHyk6e";

/**
 * RECEIVE REGISTRATIONS (POST)
 */
function doPost(e) {
  try {
    const doc = SpreadsheetApp.openById(SPREADSHEET_ID);
    ensureInviteCodesSheet(doc);
    autoAlignRawSheet(doc);
    const payload = JSON.parse(e.postData.contents);
    const endpoint = payload.endpoint || "";

    // API Versioning Validation
    if (!endpoint.startsWith("/api/v1/")) {
      return generateResponse({ error: "UNSUPPORTED_API_VERSION: Requests must target /api/v1/ endpoints." }, 400);
    }
    
    // ── Logo Upload Endpoint ──────────────────────────────────────────────────
    if (endpoint === "/api/v1/uploadLogo") {
      try {
        const base64Data = payload.fileData;    // raw base64 string (no data: prefix)
        const fileName   = payload.fileName || ("logo_" + Date.now() + ".png");
        const mimeType   = payload.mimeType  || "image/png";

        if (!base64Data) {
          return generateResponse({ error: "Missing fileData in payload" }, 400);
        }
        if (!LOGO_FOLDER_ID || LOGO_FOLDER_ID === "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE") {
          return generateResponse({ error: "LOGO_FOLDER_ID is not configured on the server." }, 500);
        }

        const folder = DriveApp.getFolderById(LOGO_FOLDER_ID);
        const bytes  = Utilities.base64Decode(base64Data);
        const blob   = Utilities.newBlob(bytes, mimeType, fileName);
        const file   = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        const fileId  = file.getId();
        const logoUrl = "https://drive.google.com/uc?export=view&id=" + fileId;
        return generateResponse({ success: true, fileId: fileId, logoUrl: logoUrl });
      } catch (uploadErr) {
        return generateResponse({ error: "Logo upload failed: " + uploadErr.toString() }, 500);
      }
    }

    if (endpoint !== "/api/v1/register") {
      return generateResponse({ error: "NOT_FOUND: Endpoint " + endpoint + " not found." }, 404);
    }

    if (ADMIN_SECRET && payload._gateway_secret !== ADMIN_SECRET) {
      return generateResponse({ error: "Unauthorized: Invalid gateway secret." }, 401);
    }

    // 1. IDEMPOTENCY CHECK
    const cache = CacheService.getScriptCache();
    if (payload.submission_id && cache.get(payload.submission_id)) {
      return generateResponse({ "success": true, "note": "Duplicate intercepted", "teamId": "PP-INTERCEPTED" });
    }
    
    // 2. VIP CODE LOGIC
    const codeSheet = doc.getSheetByName("Codes");
    let codeValid = true;
    let codeRowIndex = -1;
    
    if (codeSheet && payload.invite_code) {
      codeValid = false;
      const codeData = codeSheet.getDataRange().getValues();
      for (let i = 1; i < codeData.length; i++) {
        if (codeData[i][0] == payload.invite_code) {
          if (codeData[i][1] && codeData[i][1].toString().trim() !== "") {
            return generateResponse({ "error": "This Access Code has already been claimed." });
          }
          codeValid = true;
          codeRowIndex = i + 1;
          break;
        }
      }
      if (!codeValid) return generateResponse({ "error": "Invalid Access Code." });
    }

    // 3. DUPLICATE VERIFICATION (STEAM & FACEIT AT GATE)
    let rawSheet = doc.getSheetByName("Sheet1");
    if (!rawSheet) throw new Error("Could not find Sheet1.");
    
    const rows = rawSheet.getDataRange().getValues();
    const headers = rows[0] || [];
    const cols = getRawColMap_(headers);
    
    const newTeamName = payload.team_name.trim().toUpperCase();
    const newSteam64s = [];
    const newFaceitUrls = [];
    
    for (let p = 1; p <= 7; p++) {
      const steam64 = payload[`p${p}Steam64`];
      const faceit = payload[`p${p}Faceit`];
      if (steam64) newSteam64s.push(String(steam64).trim());
      if (faceit) newFaceitUrls.push(String(faceit).trim().toLowerCase());
    }

    for (let i = 1; i < rows.length; i++) {
      // Check status if column exists
      if (cols.status !== undefined) {
        const existingStatus = (rows[i][cols.status] || "").toString().trim().toUpperCase();
        if (existingStatus === "REJECTED") continue;
      }

      // Check team name if column exists
      if (cols.teamName !== undefined) {
        const existingTeamName = String(rows[i][cols.teamName]).trim().toUpperCase();
        if (existingTeamName === newTeamName) {
          return generateResponse({ error: "DUPLICATE_TEAM_NAME: A team named '" + payload.team_name + "' is already registered." });
        }
      }

      // Scan starting from playerBase for matching steam/faceit
      const startCol = cols.playerBase !== undefined ? cols.playerBase : 9;
      for (let c = startCol; c < rows[i].length; c++) {
        const cellVal = String(rows[i][c]).trim();
        if (!cellVal) continue;

        if (newSteam64s.indexOf(cellVal) !== -1) {
          return generateResponse({ error: "DUPLICATE_PLAYER_STEAM: One of your players (Steam64: " + cellVal + ") is already registered." });
        }

        const cleanCellVal = cellVal.toLowerCase();
        if (newFaceitUrls.indexOf(cleanCellVal) !== -1) {
          return generateResponse({ error: "DUPLICATE_PLAYER_FACEIT: One of your players (FACEIT: " + cellVal + ") is already registered." });
        }
      }
    }

    // 4. GENERATE SEQUENTIAL TEAM ID
    const nextSerial = rows.length;
    const teamId = "PP-CC2-" + String(nextSerial).padStart(3, '0');

    // 5. SECURE HEADER SETUP IF EMPTY
    if (rawSheet.getLastRow() === 0) {
      const defaultHeaders = [
        "Time Stamp", "Tournament ID", "Submission ID", "Team Name", "Team Tag", "Region", "Logo URL",
        "P1 Discord", "P1 Steam", "P1 Faceit", "P1 Rank",
        "P2 Discord", "P2 Steam", "P2 Faceit", "P2 Rank",
        "P3 Discord", "P3 Steam", "P3 Faceit", "P3 Rank",
        "P4 Discord", "P4 Steam", "P4 Faceit", "P4 Rank",
        "P5 Discord", "P5 Steam", "P5 Faceit", "P5 Rank",
        "P6 Discord", "P6 Steam", "P6 Faceit", "P6 Rank",
        "P7 Discord", "P7 Steam", "P7 Faceit", "P7 Rank",
        "VIP Code Used"
      ];
      rawSheet.appendRow(defaultHeaders);
      rawSheet.setFrozenRows(1);
      // Re-read headers and cols
      const newRows = rawSheet.getDataRange().getValues();
      headers.push(...newRows[0]);
      Object.assign(cols, getRawColMap_(headers));
    }

    let formattedDate = Utilities.formatDate(new Date(), "GMT+5", "MM/dd/yyyy HH:mm:ss");
    
    // Build row array dynamically to match the headers 100%
    const newRowArray = new Array(headers.length).fill("");
    
    if (cols.teamId !== undefined) newRowArray[cols.teamId] = teamId;
    if (cols.timestamp !== undefined) newRowArray[cols.timestamp] = formattedDate;
    if (cols.tournament !== undefined) newRowArray[cols.tournament] = payload.tournament_id || "unknown";
    if (cols.subId !== undefined) newRowArray[cols.subId] = payload.submission_id || "";
    if (cols.status !== undefined) newRowArray[cols.status] = "PENDING";
    if (cols.teamName !== undefined) newRowArray[cols.teamName] = payload.team_name || "";
    if (cols.teamTag !== undefined) newRowArray[cols.teamTag] = payload.team_tag || "";
    if (cols.region !== undefined) newRowArray[cols.region] = payload.region || "";
    if (cols.logo !== undefined) newRowArray[cols.logo] = payload.logo_url || "";
    if (cols.inviteCode !== undefined) newRowArray[cols.inviteCode] = payload.invite_code || "";

    // Map player-level columns (up to 7 players)
    for (let p = 0; p < 7; p++) {
      const n = p + 1;
      const baseIdx = cols.playerBase + p * 4;
      if (baseIdx < headers.length)     newRowArray[baseIdx]     = payload[`p${n}Discord`] || "";
      if (baseIdx + 1 < headers.length) newRowArray[baseIdx + 1] = payload[`p${n}Steam`] || "";
      if (baseIdx + 2 < headers.length) newRowArray[baseIdx + 2] = payload[`p${n}Faceit`] || "";
      if (baseIdx + 3 < headers.length) newRowArray[baseIdx + 3] = payload[`p${n}Rank`] || "";
    }

    rawSheet.appendRow(newRowArray);

    if (codeRowIndex > -1) codeSheet.getRange(codeRowIndex, 2).setValue(payload.team_name);
    if (payload.submission_id) cache.put(payload.submission_id, "processed", 60 * 60 * 24); 

    // Log registration in audit sheet
    logAuditEntry("Sheet1", rows.length + 1, "REGISTRATION_SUBMITTED", "", "PENDING");

    // Real-time write-through sync to Admin Operations Sheet
    appendToAdminSheet(payload, teamId);

    return generateResponse({ "success": true, "teamId": teamId });
  } catch (error) {
    return generateResponse({ "error": error.toString() });
  }
}

/**
 * READ QUERIES (GET)
 */
function doGet(e) {
  try {
    const doc = SpreadsheetApp.openById(SPREADSHEET_ID);
    autoAlignRawSheet(doc);
    ensureInviteCodesSheet(doc);
    const params = e.parameter;
    const endpoint = params.endpoint || "";

    // API Versioning Enforcement
    if (!endpoint.startsWith("/api/v1/")) {
      return generateResponse({ error: "UNSUPPORTED_API_VERSION: Requests must target /api/v1/ endpoints." }, 400);
    }
    
    const tournamentId = params.tournamentId || "";
    
    // ── Validate Invite Code ────────────────────────────────────────────────
    if (endpoint === "/api/v1/validateCode") {
      const codeToCheck = (params.validateCode || "").toString().trim();
      let isValid = false;
      let slotType = "OPEN"; // default if not found in either sheet

      // 1. Check new InviteCodes sheet (preferred)
      const inviteSheet = doc.getSheetByName("InviteCodes");
      if (inviteSheet && codeToCheck) {
        const inviteData = inviteSheet.getDataRange().getValues();
        for (let i = 1; i < inviteData.length; i++) {
          const code = (inviteData[i][0] || "").toString().trim();
          if (code.toLowerCase() === codeToCheck.toLowerCase()) {
            isValid = true;
            slotType = "INVITE";
            break;
          }
        }
      }
      
      // 2. Check legacy Codes sheet if not found
      if (!isValid) {
        const codeSheet = doc.getSheetByName("Codes");
        if (codeSheet && codeToCheck) {
          const codeData = codeSheet.getDataRange().getValues();
          for (let i = 1; i < codeData.length; i++) {
            if (codeData[i][0] == codeToCheck) {
              if (!codeData[i][1] || codeData[i][1].toString().trim() === "") {
                isValid = true;
                slotType = "INVITE";
              }
              break;
            }
          }
        }
      }

      return generateResponse({ valid: isValid, slotType: slotType });
    }
    
    // ── Get Registered Teams ────────────────────────────────────────────────
    if (endpoint === "/api/v1/getTeams") {
      try {
        let adminDocId = "";
        if (tournamentId === "community-cup-2") {
          adminDocId = "1_B_ovDmGuA1rAityrgAz_G3csBtLl4OFfwJUMWXXe_E";
        } else if (tournamentId === "chaos-ii") {
          adminDocId = "1htkH0PQWbWefE5XFIdf2AGqTxpWMwLyGDMZMfOOL-2E";
        }
        
        if (!adminDocId) {
          // Fallback to legacy raw Sheet1 reading if no Admin sheet config is present
          let rawSheet = doc.getSheetByName("Sheet1");
          if (!rawSheet) return generateResponse({ teams: [] });
          const data = rawSheet.getDataRange().getValues();
          if (data.length < 1) return generateResponse({ teams: [] });

          const cols = getRawColMap_(data[0]);
          const firstDataRow = isHeaderRow_(data[0]) ? 1 : 0;

          const teams = [];
          for (let i = firstDataRow; i < data.length; i++) {
            const row = data[i];
            const tid = (row[cols.tournament] || "").toString().trim();
            if (tid !== tournamentId) continue;

            const status = (row[cols.status] || "").toString().trim().toUpperCase();
            if (status === "REJECTED" || status === "ELIMINATED" || status === "") continue;

            const teamName = (row[cols.teamName] || "").toString().trim();
            const teamTag  = (row[cols.teamTag]  || "").toString().trim();
            const region   = (row[cols.region]   || "").toString().trim();
            const logoUrl  = (row[cols.logo]     || "").toString().trim();

            const roster = [];
            for (let p = 0; p < 7; p++) {
              const base    = cols.playerBase + p * 4;
              const discord = row[base]     ? row[base].toString().trim()     : "";
              const steam   = row[base + 1] ? row[base + 1].toString().trim() : "";
              const faceit  = row[base + 2] ? row[base + 2].toString().trim() : "";
              const rank    = row[base + 3] ? row[base + 3].toString().trim() : "";

              if (discord || steam || faceit) {
                roster.push({
                  role: p === 0 ? "Captain" : p >= 5 ? "Substitute" : "Member",
                  discord: discord,
                  ign: (faceit ? faceit.replace(/\/$/, "").split("/").pop() : "") ||
                       discord.split("#")[0] || ("Player " + (p + 1)),
                  faceitLevel: rank || "N/A",
                  faceitElo: "N/A"
                });
              }
            }

            const displayStatus = status === "APPROVED" || status === "ROSTER_LOCKED" || status === "CHECKED_IN" || status === "QUALIFIED" || status === "CHAMPION"
              ? "VERIFIED" : "PENDING REVIEW";

            teams.push({
              name:   teamName,
              tag:    teamTag,
              logo:   logoUrl,
              status: displayStatus,
              region: region,
              roster: roster
            });
          }
          return generateResponse({ teams: teams, confirmed: teams.length });
        }

        // Open Admin Sheet and read Admin_Ops
        const adminDoc = SpreadsheetApp.openById(adminDocId);
        const adminSheet = adminDoc.getSheetByName("Admin_Ops") || adminDoc.getSheets()[0];
        const data = adminSheet.getDataRange().getValues();
        
        const rawMetadataMap = getRawMetadataMap_(doc);
        const teams = [];
        
        // Both admin sheets now use the 33-column v3 layout
        const isChaosII = (adminDocId === "1htkH0PQWbWefE5XFIdf2AGqTxpWMwLyGDMZMfOOL-2E");
        const rowsPerTeam   = isChaosII ? 3 : 7;
        const teamNameIdx   = 1;   // Col B (index 1)
        const statusIdx     = 14;  // Col O (index 14)
        const regionIdx     = 4;   // Col E (index 4)
        const logoColNum    = 4;   // Col D (index 3, 1-indexed is 4 for getFormula)
        const avgEloIdx     = 13;  // Col N (index 13)
        const seedIdx       = 15;  // Col P (index 15)
        const remarksIdx    = 16;  // Col Q (index 16)
        
        // Player columns
        const pNameIdx      = 5;   // Col F (index 5)
        const discordIdx    = 6;   // Col G (index 6)
        const steamIdx      = 7;   // Col H (index 7)
        const faceitIdx     = 11;  // Col L (index 11)
        const liveEloIdx    = 12;  // Col M (index 12)
        
        for (let i = 1; i < data.length; i += rowsPerTeam) {
          const teamName = (data[i][teamNameIdx] || "").toString().trim();
          if (!teamName || teamName === "Team Name") continue;
          
          const status = (data[i][statusIdx] || "").toString().trim().toUpperCase();
          if (status === "REJECTED" || status === "DISQUALIFIED" || status === "") continue;
          
          const region = (data[i][regionIdx] || "").toString().trim();
          
          const meta = rawMetadataMap[teamName.toLowerCase()] || {};
          
          let logoUrl = meta.logo || "";
          if (!logoUrl) {
            try {
              const logoFormula = adminSheet.getRange(i + 1, logoColNum).getFormula();
              if (logoFormula) {
                const match = logoFormula.match(/=IMAGE\(['"]([^'"]+)['"]/i);
                if (match) logoUrl = match[1];
              }
            } catch(e) {}
            if (!logoUrl) {
              logoUrl = (data[i][logoColNum - 1] || "").toString().trim();
            }
          }
          
          // Bypass Google Drive 403 embed blocks
          if (logoUrl && logoUrl.includes("drive.google.com")) {
            const driveIdMatch = logoUrl.match(/id=([a-zA-Z0-9_-]{25,})/) || logoUrl.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
            if (driveIdMatch) {
              logoUrl = "https://lh3.googleusercontent.com/d/" + driveIdMatch[1];
            }
          }
          
          const averageElo = parseInt(data[i][avgEloIdx]) || 0;
          const seed = (data[i][seedIdx] || "").toString().trim();
          const adminRemarks = (data[i][remarksIdx] || "").toString().trim();
          
          const roster = [];
          for (let p = 0; p < rowsPerTeam; p++) {
            const rowIdx = i + p;
            if (rowIdx >= data.length) break;
            
            const pName = (data[rowIdx][pNameIdx] || "").toString().trim();
            const discord = (data[rowIdx][discordIdx] || "").toString().trim();
            const steam = (data[rowIdx][steamIdx] || "").toString().trim();
            const faceit = (data[rowIdx][faceitIdx] || "").toString().trim();
            const liveEloVal = data[rowIdx][liveEloIdx];
            
            let liveElo = "N/A";
            if (liveEloVal !== "" && liveEloVal !== undefined && liveEloVal !== null) {
              const parsedElo = parseInt(liveEloVal);
              if (!isNaN(parsedElo) && parsedElo > 0) {
                liveElo = parsedElo.toString();
              } else if (liveEloVal.toString().trim() === "Fetching...") {
                liveElo = "Fetching...";
              }
            }
            
            if (pName && pName !== "" && pName !== "N/A") {
              let role = "Player";
              let cleanName = pName;
              
              if (pName.endsWith(" ©")) {
                role = "Captain";
                cleanName = pName.replace(" ©", "");
              } else if (pName.endsWith(" (C)")) {
                role = "Captain";
                cleanName = pName.replace(" (C)", "");
              } else if (pName.endsWith(" (Sub)")) {
                role = "Substitute";
                cleanName = pName.replace(" (Sub)", "");
              } else if (pName.endsWith(" (Partner)")) {
                cleanName = pName.replace(" (Partner)", "");
              }
              
              if (p === 0) {
                role = "Captain";
              } else if (rowsPerTeam === 3) {
                role = (p === 2) ? "Substitute" : "Player 2";
              } else {
                role = (p >= 5) ? "Substitute" : "Player " + (p + 1);
              }
              
              roster.push({
                role: role,
                discord: discord === "N/A" ? "" : discord,
                ign: cleanName,
                steam: steam === "N/A" ? "" : steam,
                faceit: faceit === "N/A" ? "" : faceit,
                faceitElo: liveElo,
                faceitLevel: getLevelFromElo_(liveElo)
              });
            }
          }
          
          // Map raw admin status to a portal-facing label
          const VERIFIED_STATUSES = ["APPROVED", "ROSTER_LOCKED", "CHECKED_IN", "QUALIFIED", "CHAMPION"];
          const displayStatus = VERIFIED_STATUSES.includes(status)
            ? "VERIFIED"
            : status === "OBJECTION"
            ? "OBJECTION"
            : status === "WAITLISTED"
            ? "WAITLISTED"
            : "PENDING REVIEW";
            
          const tag = meta.tag || (data[i][2] || "").toString().trim() || teamName.substring(0, 4).toUpperCase();
          
          teams.push({
            name: teamName,
            tag: tag,
            logo: logoUrl,
            status: displayStatus,
            rawStatus: status,
            adminRemarks: adminRemarks || "",
            region: region,
            averageElo: averageElo ? averageElo.toString() : "N/A",
            seed: seed || "TBD",
            roster: roster
          });
        }
        
        return generateResponse({ teams: teams, confirmed: teams.length });
      } catch (err) {
        console.error("[getTeams] ADMIN_OPS_SYNC_ERROR:", err.toString(), err.stack || "");
        return generateResponse({ error: "ADMIN_OPS_SYNC_ERROR: " + err.toString() }, 500);
      }
    }

    // ── Get Slot Counts ─────────────────────────────────────────────────────
    if (endpoint === "/api/v1/getSlots") {
      let rawSheet = doc.getSheetByName("Sheet1");
      if (!rawSheet) return generateResponse({ inviteConfirmed: 0, openConfirmed: 0 });
      const data = rawSheet.getDataRange().getValues();
      if (data.length < 1) return generateResponse({ inviteConfirmed: 0, openConfirmed: 0 });

      const cols = getRawColMap_(data[0]);
      const firstDataRow = isHeaderRow_(data[0]) ? 1 : 0;

      let invite = 0, open = 0;
      const inviteSheet = doc.getSheetByName("InviteCodes");
      const validCodes = new Set();
      if (inviteSheet) {
        const inviteData = inviteSheet.getDataRange().getValues();
        for (let i = 1; i < inviteData.length; i++) {
          const code = (inviteData[i][0] || "").toString().trim();
          const tid  = (inviteData[i][1] || "").toString().trim();
          if (code && (!tid || tid === tournamentId)) validCodes.add(code.toLowerCase());
        }
      }

      for (let i = firstDataRow; i < data.length; i++) {
        const row = data[i];
        const tid    = (row[cols.tournament] || "").toString().trim();
        const status = (row[cols.status]     || "").toString().trim().toUpperCase();
        if (tid !== tournamentId) continue;
        if (status === "REJECTED") continue;

        const inviteCode = (row[cols.inviteCode] || "").toString().trim();
        if (inviteCode && validCodes.has(inviteCode.toLowerCase())) {
          invite++;
        } else {
          open++;
        }
      }

      return generateResponse({ inviteConfirmed: invite, openConfirmed: open });
    }

    // ── Check Bans ──────────────────────────────────────────────────────────
    if (endpoint === "/api/v1/checkBans") {
      const steamIdsStr = params.steamIds || "";
      const steamIds = steamIdsStr.split(',').map(s => s.trim()).filter(Boolean);
      if (steamIds.length === 0) return generateResponse({ hasBans: false, details: [] });

      const banSheet = doc.getSheetByName("SoftBans");
      if (!banSheet) return generateResponse({ hasBans: false, details: [] });

      const banData = banSheet.getDataRange().getValues();
      const bannedSteamIds = new Set();
      for (let i = 1; i < banData.length; i++) {
        const id = (banData[i][0] || "").toString().trim();
        if (id) bannedSteamIds.add(id);
      }

      const found = [];
      steamIds.forEach(id => {
        if (bannedSteamIds.has(id)) {
          found.push(id);
        }
      });

      return generateResponse({ hasBans: found.length > 0, details: found });
    }

    // ── Get Bracket ─────────────────────────────────────────────────────────
    if (endpoint === "/api/v1/getBracket") {
      const settingsSheet = doc.getSheetByName("Settings");
      let bracketUrl = "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_nuke.png";
      let schedule = ["Quarterfinals: 18:00 GST", "Semifinals: 20:00 GST", "Grand Finals: 22:00 GST"];
      let bracketMode = "IMAGE"; // IMAGE, BETA, or LIVE

      if (settingsSheet) {
        const sData = settingsSheet.getDataRange().getValues();
        for (let i = 1; i < sData.length; i++) {
          const key = (sData[i][0] || "").toString().trim().toLowerCase();
          const val = (sData[i][1] || "").toString().trim();
          if (key === "bracket_url" && val) bracketUrl = val;
          if (key === "bracket_mode" && val) bracketMode = val.toString().trim().toUpperCase();
          if (key === "schedule" && val) {
            schedule = val.split(',').map(s => s.trim());
          }
        }
      }

      // 1. BETA MODE: Renders a pre-configured sample 16-team bracket for demonstration
      if (bracketMode === "BETA") {
        const mockMatches = [
          { id: "M01", round: "Round of 16", team1: "BSV", team2: "Matrix Gaming", status: "COMPLETED", winner: "BSV", score: "2-0", time: "2026-07-31T20:00:00+05:00", stream: "", source1: "SEEDED", source2: "SEEDED", format: "BO1", maps: "Mirage" },
          { id: "M02", round: "Round of 16", team1: "Dubai Duos", team2: "Pakistan Active", status: "COMPLETED", winner: "Dubai Duos", score: "2-1", time: "2026-07-31T20:30:00+04:00", stream: "", source1: "SEEDED", source2: "SEEDED", format: "BO1", maps: "Anubis, Nuke, Ancient" },
          { id: "M03", round: "Round of 16", team1: "Natus Navis", team2: "FaZe Clan", status: "COMPLETED", winner: "Natus Navis", score: "2-0", time: "2026-07-31T21:00:00+05:00", stream: "", source1: "SEEDED", source2: "SEEDED", format: "BO1", maps: "Dust2" },
          { id: "M04", round: "Round of 16", team1: "G2 Esports", team2: "Team Vitality", status: "COMPLETED", winner: "G2 Esports", score: "2-1", time: "2026-07-31T21:30:00+05:00", stream: "", source1: "SEEDED", source2: "SEEDED", format: "BO1", maps: "Vertigo, Inferno, Mirage" },
          { id: "M05", round: "Round of 16", team1: "Team Spirit", team2: "MOUZ", status: "LIVE", winner: "TBD", score: "1-1", time: "2026-07-31T22:00:00+05:00", stream: "https://twitch.tv/pixelpalace", source1: "SEEDED", source2: "SEEDED", format: "BO3", maps: "Nuke, Mirage, Ancient" },
          { id: "M06", round: "Round of 16", team1: "Astralis", team2: "Virtus.pro", status: "ON HOLD", winner: "TBD", score: "0-0", time: "2026-07-31T22:30:00+05:00", stream: "", source1: "SEEDED", source2: "SEEDED", format: "BO1", maps: "Mirage" },
          { id: "M07", round: "Round of 16", team1: "Team Liquid", team2: "Complexity", status: "SCHEDULED", winner: "TBD", score: "", time: "2026-07-31T23:00:00+05:00", stream: "", source1: "SEEDED", source2: "SEEDED", format: "BO1", maps: "" },
          { id: "M08", round: "Round of 16", team1: "HEROIC", team2: "BYE", status: "BYE", winner: "HEROIC", score: "", time: "2026-07-31T23:30:00+05:00", stream: "", source1: "SEEDED", source2: "SEEDED", format: "BO1", maps: "" },
          
          { id: "M09", round: "Quarterfinals", team1: "BSV", team2: "Dubai Duos", status: "SCHEDULED", winner: "TBD", score: "", time: "2026-08-01T18:00:00+05:00", stream: "", source1: "M01", source2: "M02", format: "BO3", maps: "" },
          { id: "M10", round: "Quarterfinals", team1: "Natus Navis", team2: "G2 Esports", status: "SCHEDULED", winner: "TBD", score: "", time: "2026-08-01T19:00:00+05:00", stream: "", source1: "M03", source2: "M04", format: "BO3", maps: "" },
          { id: "M11", round: "Quarterfinals", team1: "TBD", team2: "TBD", status: "SCHEDULED", winner: "TBD", score: "", time: "2026-08-01T20:00:00+05:00", stream: "", source1: "M05", source2: "M06", format: "BO3", maps: "" },
          { id: "M12", round: "Quarterfinals", team1: "TBD", team2: "HEROIC", status: "SCHEDULED", winner: "TBD", score: "", time: "2026-08-01T21:00:00+05:00", stream: "", source1: "M07", source2: "M08", format: "BO3", maps: "" },
          
          { id: "M13", round: "Semifinals", team1: "TBD", team2: "TBD", status: "SCHEDULED", winner: "TBD", score: "", time: "2026-08-02T20:00:00+05:00", stream: "", source1: "M09", source2: "M10", format: "BO3", maps: "" },
          { id: "M14", round: "Semifinals", team1: "TBD", team2: "TBD", status: "SCHEDULED", winner: "TBD", score: "", time: "2026-08-02T21:00:00+05:00", stream: "", source1: "M11", source2: "M12", format: "BO3", maps: "" },
          
          { id: "M15", round: "Grand Finals", team1: "TBD", team2: "TBD", status: "SCHEDULED", winner: "TBD", score: "", time: "2026-08-03T22:00:00+05:00", stream: "", source1: "M13", source2: "M14", format: "BO5", maps: "" }
        ];
        return generateResponse({
          type: "live",
          matches: mockMatches,
          schedule: schedule,
          bracketUrl: bracketUrl
        });
      }

      // 2. LIVE SPREADSHEET MODE: Reads real-time data from the "Brackets" sheet
      if (bracketMode === "LIVE") {
        try {
          let adminDocId = "";
          if (tournamentId === "community-cup-2") {
            adminDocId = "1_B_ovDmGuA1rAityrgAz_G3csBtLl4OFfwJUMWXXe_E";
          } else if (tournamentId === "chaos-ii") {
            adminDocId = "1htkH0PQWbWefE5XFIdf2AGqTxpWMwLyGDMZMfOOL-2E";
          }
          
          if (adminDocId) {
            const adminDoc = SpreadsheetApp.openById(adminDocId);
            const bracketsSheet = adminDoc.getSheetByName("Brackets");
            if (bracketsSheet) {
              const bData = bracketsSheet.getDataRange().getValues();
              const matches = [];
              
              for (let i = 1; i < bData.length; i++) {
                const row = bData[i];
                const id = (row[0] || "").toString().trim();
                const round = (row[1] || "").toString().trim();
                const team1 = (row[2] || "").toString().trim();
                const team2 = (row[3] || "").toString().trim();
                const status = (row[4] || "").toString().trim().toUpperCase();
                const winner = (row[5] || "").toString().trim();
                const score = (row[6] || "").toString().trim();
                const time = (row[7] || "").toString().trim();
                const stream = (row[8] || "").toString().trim();
                const source1 = (row[9] || "").toString().trim();
                const source2 = (row[10] || "").toString().trim();
                const format = (row[11] || "BO1").toString().trim();
                const maps = (row[12] || "").toString().trim();
                
                if (id) {
                  matches.push({
                    id: id,
                    round: round,
                    team1: team1,
                    team2: team2,
                    status: status,
                    winner: winner,
                    score: score,
                    time: time,
                    stream: stream,
                    source1: source1,
                    source2: source2,
                    format: format,
                    maps: maps
                  });
                }
              }
              
              return generateResponse({
                type: "live",
                matches: matches,
                schedule: schedule,
                bracketUrl: bracketUrl
              });
            }
          }
        } catch (liveErr) {
          console.error("Live bracket load failed: " + liveErr.toString());
        }
      }

      // 3. IMAGE FALLBACK (Default)
      return generateResponse({ type: "image", bracketUrl: bracketUrl, schedule: schedule });
    }

    return generateResponse({ error: "NOT_FOUND: Endpoint " + endpoint + " not found." }, 404);
  } catch (error) {
    return generateResponse({ error: error.toString() }, 500);
  }
}

function generateResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  return output;
}

function isHeaderRow_(row) {
  var first = (row[0] || "").toString().trim().toLowerCase();
  return first === "time stamp" || first === "timestamp" || first === "team id";
}

function ensureInviteCodesSheet(doc) {
  ensureInviteCodes(doc);
}

function onEdit(e) {
  if (!e) return;
  const range  = e.range;
  const sheet  = range.getSheet();
  const doc    = sheet.getParent();
  const sheetName = sheet.getName();

  // Audit and State Lock for Raw Sheet status transitions
  if (sheetName === "Sheet1") {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastRow()).getValues()[0];
    const cols = getRawColMap_(headers);
    if (cols.status !== undefined && range.getColumn() === (cols.status + 1)) {
      const oldValue = e.oldValue ? e.oldValue.toString().trim().toUpperCase() : "";
      const newValue = range.getValue().toString().trim().toUpperCase();
      
      const validTransitions = {
        "PENDING": ["APPROVED", "REJECTED", "WAITLISTED"],
        "APPROVED": ["ROSTER_LOCKED", "REJECTED", "DISQUALIFIED"],
        "ROSTER_LOCKED": ["CHECKED_IN", "APPROVED", "DISQUALIFIED"],
        "CHECKED_IN": ["ELIMINATED", "DISQUALIFIED", "CHAMPION"],
        "WAITLISTED": ["APPROVED", "REJECTED"],
        "REJECTED": ["PENDING"],
        "DISQUALIFIED": [],
        "CHAMPION": [],
        "ELIMINATED": []
      };
      
      const currentOld = oldValue || "PENDING";
      const allowed = validTransitions[currentOld] || [];
      
      if (allowed.indexOf(newValue) === -1 && oldValue !== "") {
        range.setValue(e.oldValue);
        try {
          SpreadsheetApp.getUi().alert("⚠️ INVALID STATE TRANSITION\n\nThe status transition from '" + oldValue + "' to '" + newValue + "' is forbidden by the tournament state machine.");
        } catch (uiErr) {}
        return;
      }
      
      logAuditEntry(sheetName, range.getRow(), "STATUS_CHANGE", oldValue, newValue);

      // Real-time status sync back to Admin Operations Sheet
      const teamName = sheet.getRange(range.getRow(), cols.teamName + 1).getValue().toString().trim();
      if (teamName) {
        syncStatusToAdmin(teamName, newValue);
      }
    }
  }
}

function logAuditEntry(sheetName, rowNum, action, oldValue, newValue) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName("AuditLog");
    if (!logSheet) {
      logSheet = ss.insertSheet("AuditLog");
      logSheet.appendRow(["Timestamp", "Editor", "Target Table", "Record Row", "Action", "Old Value", "New Value"]);
      logSheet.setFrozenRows(1);
    }
    const timestamp = new Date().toISOString();
    const editor = Session.getActiveUser().getEmail() || "System Admin";
    logSheet.appendRow([timestamp, editor, sheetName, rowNum, action, oldValue, newValue]);
  } catch (err) {}
}

/**
 * Real-time write-through sync to Admin Operations Sheet
 */
function appendToAdminSheet(payload, teamId) {
  const tournamentId = payload.tournament_id || "community-cup-2";
  let adminSheetId = "";
  let maxPlayers = 7;
  
  if (tournamentId === "community-cup-2") {
    adminSheetId = "1_B_ovDmGuA1rAityrgAz_G3csBtLl4OFfwJUMWXXe_E";
    maxPlayers = 7;
  } else if (tournamentId === "chaos-ii") {
    adminSheetId = "1htkH0PQWbWefE5XFIdf2AGqTxpWMwLyGDMZMfOOL-2E";
    maxPlayers = 3;
  } else {
    return; // Fallback or unsupported tournament
  }

  try {
    const adminDoc = SpreadsheetApp.openById(adminSheetId);
    const adminSheet = adminDoc.getSheetByName("Admin_Ops") || adminDoc.getSheetByName("Sheet1") || adminDoc.getSheets()[0];
    
    const adminData = adminSheet.getDataRange().getValues();
    const existingTeams = new Set();
    const nameIdx = 1; // Both now use Col B (index 1) under the 33-column layout
    for (let i = 1; i < adminData.length; i++) {
      if (adminData[i][nameIdx]) existingTeams.add(adminData[i][nameIdx].toString().toLowerCase().trim());
    }
    
    const teamName = payload.team_name ? payload.team_name.trim() : "";
    if (!teamName || existingTeams.has(teamName.toLowerCase())) return;

    const sn = "TEAM " + (existingTeams.size + 1);
    const startRowIndex = adminSheet.getLastRow() + 1;
    const rowsToAppend = [];
    
    const teamTag = payload.team_tag ? payload.team_tag.trim() : "";
    const region = payload.region ? payload.region.trim() : "";
    const logoUrl = payload.logo_url ? payload.logo_url.trim() : "";
    
    let eloSum = 0;
    let eloCount = 0;
    for (let p = 1; p <= maxPlayers; p++) {
      const eloVal = parseInt(payload[`p${p}FaceitElo`]);
      const ign = payload[`p${p}IGN`];
      if (ign && ign.trim() !== "") {
        if (!isNaN(eloVal) && eloVal > 0) {
          eloSum += eloVal;
          eloCount++;
        }
      }
    }
    const averageElo = eloCount > 0 ? Math.round(eloSum / eloCount) : 0;

    // Both tournaments now use the 33-column layout (maxPlayers = 3 or 7)
    const roleTags = maxPlayers === 3
      ? [" ©", "", " (Sub)"]
      : [" ©", "", "", "", "", " (Sub)", " (Sub)"];
    const roles = maxPlayers === 3
      ? ["Captain", "Player 2", "Substitute"]
      : ["Captain", "Player 2", "Player 3", "Player 4", "Player 5", "Substitute", "Substitute"];
    
    for (let p = 0; p < maxPlayers; p++) {
      const pNum = p + 1;
      const discord = payload[`p${pNum}Discord`] || "N/A";
      const steam = payload[`p${pNum}Steam`] || "N/A";
      const faceit = payload[`p${pNum}Faceit`] || "N/A";
      const pName = faceit && faceit !== "N/A"
        ? faceit.replace(/\/$/, "").split("/").pop() + roleTags[p]
        : (discord && discord !== "N/A" ? discord + roleTags[p] : "N/A");
        
      const r = new Array(33).fill("");
      r[0]  = p === 0 ? sn : "";                     // Col A (1): S.N
      r[1]  = p === 0 ? teamName : "";               // Col B (2): Team Name
      r[2]  = p === 0 ? teamTag : "";                // Col C (3): Team Tag
      r[3]  = p === 0 ? (logoUrl ? `=IMAGE("${logoUrl}")` : "") : ""; // Col D (4): Logo
      r[4]  = p === 0 ? region : "";                 // Col E (5): Region
      r[5]  = pName;                                 // Col F (6): Player Name
      r[6]  = discord || "N/A";                      // Col G (7): Discord
      r[7]  = steam || "N/A";                        // Col H (8): Steam URL
      r[8]  = "";                                    // Col I (9): Joined Discord
      r[9]  = "";                                    // Col J (10): Role Issued
      r[10] = "";                                    // Col K (11): Private VC
      r[11] = faceit || "N/A";                       // Col L (12): FACEIT URL
      r[12] = "⏳";                                  // Col M (13): Live ELO
      r[13] = p === 0 ? "⏳" : "";                    // Col N (14): Avg ELO
      r[14] = p === 0 ? "Pending" : "";              // Col O (15): Reg. Status
      r[15] = p === 0 ? "TBD" : "";                  // Col P (16): Team Seed
      r[16] = "";                                    // Col Q (17): Remarks
      r[17] = roles[p];                              // Col R (18): Role
      r[32] = p === 0 ? "⏳" : "";                    // Col AG (33): Risk Flag
      
      rowsToAppend.push(r);
    }
    
    adminSheet.getRange(startRowIndex, 1, maxPlayers, 33).setValues(rowsToAppend);
    [1, 2, 3, 4, 5, 14, 15, 16, 17, 33].forEach(col => {
       adminSheet.getRange(startRowIndex, col, maxPlayers, 1).merge().setVerticalAlignment("middle").setHorizontalAlignment("center");
    });
    adminSheet.setRowHeightsForced(startRowIndex, maxPlayers, 28);
             
  } catch (err) {
    console.error("Failed to append to admin sheet:", err);
  }
}

/**
 * Real-time status sync back to Admin Operations Sheet
 */
function syncStatusToAdmin(teamName, newStatus) {
  const adminSheets = [
    { id: "1_B_ovDmGuA1rAityrgAz_G3csBtLl4OFfwJUMWXXe_E", teamNameIdx: 1, statusCol: 15 }, // CC2 (Col B, Col O)
    { id: "1htkH0PQWbWefE5XFIdf2AGqTxpWMwLyGDMZMfOOL-2E", teamNameIdx: 1, statusCol: 15 }  // Chaos II (Col B, Col O)
  ];
  
  adminSheets.forEach(cfg => {
    try {
      const adminDoc = SpreadsheetApp.openById(cfg.id);
      const adminSheet = adminDoc.getSheetByName("Admin_Ops") || adminDoc.getSheetByName("Sheet1") || adminDoc.getSheets()[0];
      const data = adminSheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        const existingTeamName = data[i][cfg.teamNameIdx] ? data[i][cfg.teamNameIdx].toString().trim() : "";
        if (existingTeamName.toLowerCase() === teamName.toLowerCase()) {
          const currentStatus = data[i][cfg.statusCol - 1] ? data[i][cfg.statusCol - 1].toString().trim() : "";
          if (currentStatus.toUpperCase() !== newStatus.toUpperCase()) {
            adminSheet.getRange(i + 1, cfg.statusCol).setValue(newStatus);
          }
          break;
        }
      }
    } catch (err) {
      console.error("Failed to sync status to Admin ID " + cfg.id + ":", err);
    }
  });
}

function generateInviteCodes(doc, count) {
  const sheet = doc.getSheetByName('InviteCodes');
  if (!sheet) return;
  const prefix = 'PP-CCII-';
  const codes = [];
  for (let i = 0; i < count; i++) {
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push([prefix + suffix, '', '']); // VIP Codes | Used By | Reference/Allocation
  }
  // Append after header row (row 1)
  sheet.getRange(sheet.getLastRow() + 1, 1, codes.length, 3).setValues(codes);
}

function ensureInviteCodes(doc) {
  var sheet = doc.getSheetByName("InviteCodes");
  if (!sheet) {
    sheet = doc.insertSheet("InviteCodes");
    sheet.appendRow(["Access Code", "Claimed By", "Allocation Reference"]);
    sheet.setFrozenRows(1);
    generateInviteCodes(doc, 6);
  }
}

function ensureInviteCodesSheet(doc) {
  ensureInviteCodes(doc);
}

function getLevelFromElo_(elo) {
  var val = parseInt(elo);
  if (isNaN(val) || val <= 0) return "N/A";
  if (val <= 500)  return "1";
  if (val <= 750)  return "2";
  if (val <= 900)  return "3";
  if (val <= 1050) return "4";
  if (val <= 1200) return "5";
  if (val <= 1350) return "6";
  if (val <= 1530) return "7";
  if (val <= 1750) return "8";
  if (val <= 2000) return "9";
  return "10";
}

function getRawMetadataMap_(doc) {
  const map = {};
  const rawSheet = doc.getSheetByName("Sheet1");
  if (!rawSheet) return map;
  const data = rawSheet.getDataRange().getValues();
  if (data.length < 2) return map;
  
  const header = data[0];
  let teamNameCol = 3;
  let teamTagCol = 4;
  let logoCol = 6;
  for (let h = 0; h < header.length; h++) {
    if (header[h] === undefined || header[h] === null) continue;
    const val = header[h].toString().trim().toLowerCase();
    if (val.indexOf("team") !== -1 && val.indexOf("name") !== -1) teamNameCol = h;
    if (val.indexOf("tag") !== -1) teamTagCol = h;
    if (val.indexOf("logo") !== -1) logoCol = h;
  }
  
  for (let i = 1; i < data.length; i++) {
    const name = (data[i][teamNameCol] || "").toString().trim().toLowerCase();
    const tag = (data[i][teamTagCol] || "").toString().trim();
    const logo = (data[i][logoCol] || "").toString().trim();
    if (name) {
      map[name] = { tag: tag, logo: logo };
    }
  }
  return map;
}

/**
 * Parses the spreadsheet headers to map column indices dynamically.
 */
function getRawColMap_(headerRow) {
  var map = {};
  for (var h = 0; h < headerRow.length; h++) {
    var k = headerRow[h].toString().trim().toLowerCase()
              .replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
    map[k] = h;
  }
  var get = function(keys) {
    for (var x = 0; x < keys.length; x++) {
      if (map[keys[x]] !== undefined) return map[keys[x]];
    }
    return undefined;
  };
  
  // Find first player column (P1 Discord) to set the base index
  let playerBase = get(['p1_discord', 'p1discord', 'p1_discord_id', 'p1_discord_username']);
  if (playerBase === undefined) {
    playerBase = 9;
  }
  
  return {
    teamId:     get(['team_id', 'teamid']),
    timestamp:  get(['timestamp', 'time_stamp', 'timestamp_id']),
    tournament: get(['tournament_id', 'tournament', 'tournamentid']),
    subId:      get(['submission_id', 'submissionid']),
    status:     get(['status', 'registration_status']),
    teamName:   get(['team_name', 'teamname']),
    teamTag:    get(['team_tag', 'teamtag']),
    region:     get(['region']),
    logo:       get(['logo_url', 'logo_url_image', 'logo']),
    playerBase: playerBase,
    inviteCode: get(['vip_code_used', 'vipcode', 'vip_code'])
  };
}

/**
 * Automatically detects and fixes shifted rows in Sheet1 (Layout B).
 * Shifted rows contain a "PP-" Team ID in column 0 (which has header Timestamp/Time Stamp).
 */
function autoAlignRawSheet(doc) {
  try {
    const rawSheet = doc.getSheetByName("Sheet1");
    if (!rawSheet) return;
    const range = rawSheet.getDataRange();
    const values = range.getValues();
    if (values.length < 2) return;

    const headers = values[0];
    const col0Header = (headers[0] || "").toString().trim().toLowerCase();
    
    // Check if the sheet header represents Layout B (no Team ID column)
    if (col0Header === "time stamp" || col0Header === "timestamp") {
      let updated = false;
      
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const val0 = (row[0] || "").toString().trim();
        
        // If the row starts with "PP-", it was written with Team ID in Col A, which shifted it
        if (val0.startsWith("PP-")) {
          const originalLength = row.length;
          // Splice index 4 (Status) first
          row.splice(4, 1);
          // Splice index 0 (Team ID)
          row.splice(0, 1);
          // Pad to original length
          while (row.length < originalLength) {
            row.push("");
          }
          
          // Write the aligned row back to the sheet
          rawSheet.getRange(i + 1, 1, 1, originalLength).setValues([row]);
          updated = true;
        }
      }
      
      if (updated) {
        SpreadsheetApp.flush();
        console.log("autoAlignRawSheet: Shifted rows corrected successfully.");
      }
    }
  } catch (err) {
    console.error("autoAlignRawSheet error: " + err);
  }
}
