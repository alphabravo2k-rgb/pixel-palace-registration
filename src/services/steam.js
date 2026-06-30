/**
 * Steam64 API Resolver
 * Handles pattern-matching steam URLs or resolving vanity names
 */

export const resolveSteam64 = async (profileUrl, steamApiKey = '') => {
  if (!profileUrl) return null;

  try {
    // Basic normalization
    let cleanUrl = profileUrl.trim();
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    // Attempt 1: Extract standard /profiles/STEAMID64
    const profileMatch = cleanUrl.match(/\/profiles\/([0-9]{17})\/?/);
    if (profileMatch) {
      return profileMatch[1];
    }

    // Attempt 2: Vanity URL resolution
    const idMatch = cleanUrl.match(/\/id\/([^/?#]+)/);
    if (idMatch) {
      const vanityName = idMatch[1];

      // If we don't have an API key, skip resolution — caller handles fallback
      if (!steamApiKey) {
        return null;  // Signal: vanity URL but no key — use manual fallback
      }

      // External API fetch constraint routed through a robust CORS proxy
      // to bypass Valve's strict browser restrictions
      const targetUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${steamApiKey}&vanityurl=${encodeURIComponent(vanityName)}`;
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);

      if (!response.ok) {
        throw new Error(`Steam API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.response && data.response.success === 1) {
        return data.response.steamid;
      } else {
        throw new Error('Vanity URL could not be resolved');
      }
    }
    
    throw new Error('Invalid URL pattern matched. Cannot extract identity.');
  } catch (error) {
    console.error('Steam64 resolution error:', error);
    throw error;
  }
};
