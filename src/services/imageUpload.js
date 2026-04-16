/**
 * Generic unsigned image upload targetting Cloudinary
 */

export const uploadToCloudinary = async (file, cloudName, uploadPreset) => {
    if (!file || !cloudName || !uploadPreset) return null;
  
    try {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
  
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${response.status}`);
      }
  
      const data = await response.json();
      return data.secure_url;
      
    } catch (error) {
      console.error('Cloudinary API Error:', error);
      throw error;
    }
  };
