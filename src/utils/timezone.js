/**
 * Formats an ISO string into the user's local timezone.
 * Returns a string like "20:00 (GST)"
 */
export const formatLocalTime = (isoString) => {
  if (!isoString) return 'TBA';
  
  try {
    const date = new Date(isoString);
    
    // Format: 20:00
    const timeStr = date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    });
    
    // Get timezone abbreviation (e.g. GST, PKT)
    const tzStr = new Intl.DateTimeFormat('en-US', { 
        timeZoneName: 'short' 
    }).formatToParts(date).find(p => p.type === 'timeZoneName').value;
    
    return `${timeStr} (${tzStr})`;
  } catch (e) {
    console.error("Timezone conversion failed:", e);
    return 'TIME_ERR';
  }
};
