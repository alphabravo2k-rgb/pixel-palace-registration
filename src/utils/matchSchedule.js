/**
 * Official Tournament Match Schedule Utility
 * Pixel Palace 5v5 Community Cup 2
 * Maps match IDs (1 to 29) to their estimated schedule times from the official schedule sheet.
 * Times in PKT (UTC+5), with automatic conversion to visitor's local timezone.
 */

// Official Schedule Timestamps (ISO 8601 in UTC+5 / PKT)
export const OFFICIAL_MATCH_SCHEDULE = {
  // Day 1 — 31/07/2026 (Friday) — Round 1 Qualifiers
  1:  { iso: "2026-07-31T20:00:00+05:00", pkt: "8:00 PM", uae: "7:00 PM", ksa: "6:00 PM", ist: "8:30 PM", type: "BO1", round: "Round 1 - Qualifier" },
  2:  { iso: "2026-07-31T20:00:00+05:00", pkt: "8:00 PM", uae: "7:00 PM", ksa: "6:00 PM", ist: "8:30 PM", type: "BO1", round: "Round 1 - Qualifier" },
  3:  { iso: "2026-07-31T20:00:00+05:00", pkt: "8:00 PM", uae: "7:00 PM", ksa: "6:00 PM", ist: "8:30 PM", type: "BO1", round: "Round 1 - Qualifier" },
  4:  { iso: "2026-07-31T20:00:00+05:00", pkt: "8:00 PM", uae: "7:00 PM", ksa: "6:00 PM", ist: "8:30 PM", type: "BO1", round: "Round 1 - Qualifier" },
  5:  { iso: "2026-07-31T20:00:00+05:00", pkt: "8:00 PM", uae: "7:00 PM", ksa: "6:00 PM", ist: "8:30 PM", type: "BO1", round: "Round 1 - Qualifier" },
  6:  { iso: "2026-07-31T20:00:00+05:00", pkt: "8:00 PM", uae: "7:00 PM", ksa: "6:00 PM", ist: "8:30 PM", type: "BO1", round: "Round 1 - Qualifier" },
  7:  { iso: "2026-07-31T20:00:00+05:00", pkt: "8:00 PM", uae: "7:00 PM", ksa: "6:00 PM", ist: "8:30 PM", type: "BO1", round: "Round 1 - Qualifier" },
  8:  { iso: "2026-07-31T21:15:00+05:00", pkt: "9:15 PM", uae: "8:15 PM", ksa: "7:15 PM", ist: "9:45 PM", type: "BO1", round: "Round 1 - Qualifier" },
  9:  { iso: "2026-07-31T21:15:00+05:00", pkt: "9:15 PM", uae: "8:15 PM", ksa: "7:15 PM", ist: "9:45 PM", type: "BO1", round: "Round 1 - Qualifier" },
  10: { iso: "2026-07-31T21:15:00+05:00", pkt: "9:15 PM", uae: "8:15 PM", ksa: "7:15 PM", ist: "9:45 PM", type: "BO1", round: "Round 1 - Qualifier" },
  11: { iso: "2026-07-31T21:15:00+05:00", pkt: "9:15 PM", uae: "8:15 PM", ksa: "7:15 PM", ist: "9:45 PM", type: "BO1", round: "Round 1 - Qualifier" },
  12: { iso: "2026-07-31T21:15:00+05:00", pkt: "9:15 PM", uae: "8:15 PM", ksa: "7:15 PM", ist: "9:45 PM", type: "BO1", round: "Round 1 - Qualifier" },
  13: { iso: "2026-07-31T21:15:00+05:00", pkt: "9:15 PM", uae: "8:15 PM", ksa: "7:15 PM", ist: "9:45 PM", type: "BO1", round: "Round 1 - Qualifier" },
  14: { iso: "2026-07-31T21:15:00+05:00", pkt: "9:15 PM", uae: "8:15 PM", ksa: "7:15 PM", ist: "9:45 PM", type: "BO1", round: "Round 1 - Qualifier" },

  // Day 1 — 31/07/2026 (Friday) — Round 2 Qualifiers
  15: { iso: "2026-07-31T22:15:00+05:00", pkt: "10:15 PM", uae: "9:15 PM", ksa: "8:15 PM", ist: "10:45 PM", type: "BO1", round: "Round 2 - Qualifier" },
  16: { iso: "2026-07-31T22:15:00+05:00", pkt: "10:15 PM", uae: "9:15 PM", ksa: "8:15 PM", ist: "10:45 PM", type: "BO1", round: "Round 2 - Qualifier" },
  17: { iso: "2026-07-31T22:15:00+05:00", pkt: "10:15 PM", uae: "9:15 PM", ksa: "8:15 PM", ist: "10:45 PM", type: "BO1", round: "Round 2 - Qualifier" },
  18: { iso: "2026-07-31T22:15:00+05:00", pkt: "10:15 PM", uae: "9:15 PM", ksa: "8:15 PM", ist: "10:45 PM", type: "BO1", round: "Round 2 - Qualifier" },
  19: { iso: "2026-07-31T22:45:00+05:00", pkt: "10:45 PM", uae: "9:45 PM", ksa: "8:45 PM", ist: "11:15 PM", type: "BO1", round: "Round 2 - Qualifier" },
  20: { iso: "2026-07-31T22:45:00+05:00", pkt: "10:45 PM", uae: "9:45 PM", ksa: "8:45 PM", ist: "11:15 PM", type: "BO1", round: "Round 2 - Qualifier" },
  21: { iso: "2026-07-31T22:45:00+05:00", pkt: "10:45 PM", uae: "9:45 PM", ksa: "8:45 PM", ist: "11:15 PM", type: "BO1", round: "Round 2 - Qualifier" },
  22: { iso: "2026-07-31T22:45:00+05:00", pkt: "10:45 PM", uae: "9:45 PM", ksa: "8:45 PM", ist: "11:15 PM", type: "BO1", round: "Round 2 - Qualifier" },

  // Day 2 — 01/08/2026 (Saturday) — Quarter Finals
  23: { iso: "2026-08-01T20:00:00+05:00", pkt: "8:00 PM", uae: "7:00 PM", ksa: "6:00 PM", ist: "8:30 PM", type: "BO3", round: "Quarter Final" },
  24: { iso: "2026-08-01T20:00:00+05:00", pkt: "8:00 PM", uae: "7:00 PM", ksa: "6:00 PM", ist: "8:30 PM", type: "BO3", round: "Quarter Final" },
  25: { iso: "2026-08-01T22:00:00+05:00", pkt: "10:00 PM", uae: "9:00 PM", ksa: "8:00 PM", ist: "10:30 PM", type: "BO3", round: "Quarter Final" },
  26: { iso: "2026-08-01T22:00:00+05:00", pkt: "10:00 PM", uae: "9:00 PM", ksa: "8:00 PM", ist: "10:30 PM", type: "BO3", round: "Quarter Final" },

  // Day 3 — 02/08/2026 (Sunday) — Semi Finals
  27: { iso: "2026-08-02T20:00:00+05:00", pkt: "8:00 PM", uae: "7:00 PM", ksa: "6:00 PM", ist: "8:30 PM", type: "BO3", round: "Semi Final" },
  28: { iso: "2026-08-02T22:00:00+05:00", pkt: "10:00 PM", uae: "9:00 PM", ksa: "8:00 PM", ist: "10:30 PM", type: "BO3", round: "Semi Final" },

  // Day 4 — 03/08/2026 (Monday) — Grand Final
  29: { iso: "2026-08-03T22:00:00+05:00", pkt: "10:00 PM", uae: "9:00 PM", ksa: "8:00 PM", ist: "10:30 PM", type: "BO3", round: "Grand Final" },
};

/**
 * Retrieves the schedule details for a given match ID.
 * Prefers API scheduled_date if set, otherwise falls back to official lookup table.
 */
export function getMatchSchedule(matchId, apiScheduledDate = null, apiMatch = null) {
  const numericId = parseInt(matchId, 10);
  const scheduled = OFFICIAL_MATCH_SCHEDULE[numericId] || null;

  // 1. Prefer API actual played/started time if available
  const actualTime = apiMatch?.started_at || apiMatch?.startedAt || apiMatch?.finished_at || apiMatch?.finishedAt || apiScheduledDate;

  if (actualTime) {
    let isoFormatted = String(actualTime).trim();
    // Normalize MySQL format 'YYYY-MM-DD HH:mm:ss' to UTC ISO string ('Z')
    if (isoFormatted.includes(' ') && !isoFormatted.includes('T')) {
      isoFormatted = isoFormatted.replace(' ', 'T') + 'Z';
    } else if (!isoFormatted.endsWith('Z') && !isoFormatted.includes('+') && !isoFormatted.includes('-')) {
      isoFormatted = isoFormatted + 'Z';
    }

    return {
      iso: isoFormatted,
      pkt: null, uae: null, ksa: null, ist: null,
      type: apiMatch?.format || (apiMatch?.best_of ? `BO${apiMatch.best_of}` : null) || scheduled?.type || 'BO1',
      round: scheduled?.round || 'Match',
      isActualTime: Boolean(apiMatch?.started_at || apiMatch?.finished_at)
    };
  }

  return scheduled || {
    iso: "2026-07-31T20:00:00+05:00",
    pkt: "8:00 PM", uae: "7:00 PM", ksa: "6:00 PM", ist: "8:30 PM",
    type: "BO1",
    round: "Qualifier",
    isActualTime: false
  };
}

/**
 * Formats an ISO date into visitor's local browser timezone.
 * Returns { localTime, timeZoneName, fullString }
 */
export function formatVisitorLocalTime(isoString) {
  if (!isoString) return { localTime: 'TBD', timeZoneName: '', fullString: 'TBD' };
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return { localTime: isoString, timeZoneName: '', fullString: isoString };

    const timeStr = date.toLocaleTimeString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const tzParts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(date);
    const tzName = tzParts.find(p => p.type === 'timeZoneName')?.value || '';

    return {
      localTime: timeStr,
      timeZoneName: tzName,
      fullString: `${timeStr} (${tzName})`,
    };
  } catch {
    return { localTime: 'TBD', timeZoneName: '', fullString: 'TBD' };
  }
}

/**
 * Calculates live countdown timer down to seconds.
 * Returns { days, hours, minutes, seconds, isPast, formatted }
 */
export function getLiveCountdown(isoString) {
  if (!isoString) return null;
  const target = new Date(isoString).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, formatted: 'Match starting / live' };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return {
    days, hours, minutes, seconds, isPast: false,
    formatted: parts.join(' '),
  };
}
