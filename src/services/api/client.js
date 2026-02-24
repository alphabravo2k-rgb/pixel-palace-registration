import { mapToGoogleSheets } from './adapters/googleSheets';
import { ENV } from '../../config/env';

export const submitToGateway = async (canonicalPayload, endpoint) => {
  let networkPayload;

  if (ENV.STORAGE_MODE === 'GOOGLE_SHEETS') {
    networkPayload = mapToGoogleSheets(canonicalPayload);
  } else {
    throw new Error("Supabase adapter not yet initialized.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(networkPayload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const data = await res.json();
    
    if (data.error) throw new Error(data.error);
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error("Connection Timeout. Retry.");
    throw err;
  }
};
