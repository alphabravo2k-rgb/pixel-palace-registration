/**
 * PIXEL PALACE — Image Upload Service
 *
 * Uploads team logos to Google Drive via the Apps Script web app endpoint.
 * The Apps Script saves the file to the PP_Logos Drive folder and returns
 * a public direct-access URL in the format:
 *   https://drive.google.com/uc?export=view&id=FILE_ID
 *
 * @param {File}   file         - The image File object from the file input
 * @param {string} endpoint     - The Apps Script web app URL (sheetsEndpoint from tournament config)
 * @param {string} teamName     - Used to name the file in Drive (e.g. "BSV_logo.png")
 * @returns {Promise<string>}   - Resolves to the public logo URL
 */
export const uploadToDrive = async (file, endpoint, teamName = "team") => {
  if (!file || !endpoint) throw new Error("uploadToDrive: file and endpoint are required.");

  // Validate type and size before sending
  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only PNG, JPG, WEBP, and GIF images are supported.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("File size must be under 2MB.");
  }

  // Convert file to base64
  const base64 = await fileToBase64_(file);

  // Build a clean filename from team name + original extension
  const ext = file.name.split(".").pop() || "png";
  const safeName = teamName.replace(/[^a-zA-Z0-9_\-]/g, "_").substring(0, 32);
  const fileName = `${safeName}_logo_${Date.now()}.${ext}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: "/api/v1/uploadLogo",
      fileData: base64,
      fileName: fileName,
      mimeType: file.type,
    }),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.success || !data.logoUrl) {
    throw new Error(data.error || "Upload failed: no URL returned from server.");
  }

  return data.logoUrl;
};

/**
 * Converts a File to a base64-encoded string (without the data: prefix).
 */
const fileToBase64_ = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Strip "data:image/png;base64," prefix — Apps Script only needs the raw base64
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * LEGACY — Cloudinary upload (kept for backwards compatibility / fallback).
 * @deprecated Use uploadToDrive instead.
 */
export const uploadToCloudinary = async (file, cloudName, uploadPreset) => {
  if (!file || !cloudName || !uploadPreset) return null;

  try {
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(url, { method: "POST", body: formData });
    if (!response.ok) throw new Error(`Cloudinary upload failed: ${response.status}`);

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary API Error:", error);
    throw error;
  }
};
