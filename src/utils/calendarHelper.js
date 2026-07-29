/**
 * Utility to generate Google Calendar & .ics download URLs for upcoming matches.
 */

export function getGoogleCalendarUrl(match) {
  if (!match) return '#';

  const title = encodeURIComponent(`Pixel Palace CC2: ${match.team1 || 'TBD'} vs ${match.team2 || 'TBD'} (Match #${match.id})`);
  const details = encodeURIComponent(`Watch live on Pixel Palace Esports Match Center: https://pixelpalace.lotgaming.xyz/match-center/${match.id}`);
  const location = encodeURIComponent('Pixel Palace Match Center');

  // Format start & end date to UTC YYYYMMDDTHHmmssZ
  const startDate = new Date(match.scheduledDate || "2026-07-31T20:00:00+05:00");
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  const formatUtcDate = (d) => {
    return d.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const dates = `${formatUtcDate(startDate)}/${formatUtcDate(endDate)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}
