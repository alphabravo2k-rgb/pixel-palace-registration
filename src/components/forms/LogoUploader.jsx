import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, X, Image as ImageIcon } from 'lucide-react';
import { uploadToCloudinary } from '../../services/imageUpload';

export const LogoUploader = ({ 
  tournament, 
  formRegister, 
  errorMessage, 
  onUploadSuccess, 
  onUploadRemove 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState('EMPTY'); // EMPTY | UPLOADING | SUCCESS | ERROR
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [errorText, setErrorText] = useState('');
  
  const inputRef = useRef(null);

  const fallbackMode = !tournament.supportsLogoUpload || !tournament.cloudinaryCloudName || !tournament.cloudinaryUploadPreset;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErrorText('Only PNG, JPG, and WEBP are supported.');
      setUploadState('ERROR');
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorText('File exceeds 2MB limit.');
      setUploadState('ERROR');
      return false;
    }
    return true;
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    if (!validateFile(file)) return;

    setUploadState('UPLOADING');
    setProgress(20);

    try {
      // Fake progress increment for visual feedback while awaiting Cloudinary post
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 100);

      const url = await uploadToCloudinary(file, tournament.cloudinaryCloudName, tournament.cloudinaryUploadPreset);
      
      clearInterval(interval);
      setProgress(100);
      
      setPreviewData({ url, name: file.name });
      setUploadState('SUCCESS');
      onUploadSuccess(url);
    } catch (err) {
      setErrorText('Upload failed. Check network or config.');
      setUploadState('ERROR');
    }
  };

  const removeImage = () => {
    setUploadState('EMPTY');
    setPreviewData(null);
    setProgress(0);
    setErrorText('');
    onUploadRemove();
  };

  // ─── FALLBACK MODE (Direct URL input if missing config) ───────────────
  if (fallbackMode) {
    return (
      <div>
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block font-body">
          Team Logo URL <span className="text-red-500">*</span>
        </label>
        <div className="input-group">
          <ImageIcon className="ml-3 w-4 h-4 text-white/30" />
          <input
            {...formRegister('logoLink')}
            type="url"
            placeholder="https://i.imgur.com/yourlogo.png"
            className="input-ghost"
          />
        </div>
        <p className="text-zinc-500 text-[9px] mt-1 font-body">Must be a direct image link. Right-click your image → Copy image address.</p>
        {errorMessage && (
          <p className="text-red-400 text-[10px] mt-1 font-body uppercase tracking-widest">{errorMessage}</p>
        )}
      </div>
    );
  }

  // ─── CLOUDINARY UPLOAD COMPONENT ─────────────────────────────────────────
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block font-body">
        Team Logo Upload <span className="text-red-500">*</span>
      </label>
      
      {uploadState === 'EMPTY' && (
        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          htmlFor="logo-upload"
          className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
            dragActive ? 'border-neon-cyan bg-neon-cyan/5' : 'border-white/10 bg-black/40 hover:border-white/30 hover:bg-black/60'
          }`}
        >
          <input 
            ref={inputRef}
            type="file" 
            id="logo-upload" 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={handleChange}
          />
          <UploadCloud className={`w-8 h-8 mb-3 ${dragActive ? 'text-neon-cyan' : 'text-zinc-500'}`} />
          <span className="text-sm text-zinc-300 font-bold tracking-wider mb-1">
            Drop team logo here or click to browse
          </span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-body">
            PNG / JPG / WEBP — Max 2MB
          </span>
        </label>
      )}

      {uploadState === 'UPLOADING' && (
        <div className="flex flex-col items-center justify-center p-6 border border-white/10 rounded-md bg-black/40">
          <UploadCloud className="w-8 h-8 mb-3 text-neon-cyan animate-pulse" />
          <span className="text-sm text-neon-cyan font-bold tracking-wider mb-3">UPLOADING...</span>
          <div className="w-full bg-black rounded-full h-1.5 mb-1 overflow-hidden border border-white/5">
            <div className="bg-neon-cyan h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-xs text-zinc-400">{progress}%</span>
        </div>
      )}

      {uploadState === 'SUCCESS' && previewData && (
        <div className="flex items-center justify-between p-4 border border-green-500/30 rounded-md bg-green-900/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-black flex items-center justify-center border border-white/10 overflow-hidden">
               <img src={previewData.url} alt="Logo preview" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-white font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Upload Success
              </span>
              <span className="text-[10px] text-zinc-400 truncate max-w-[200px]">{previewData.name}</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={removeImage}
            className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 hover:text-red-400 transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      {uploadState === 'ERROR' && (
        <div className="flex flex-col items-center justify-center p-6 border border-red-500/50 rounded-md bg-red-900/10 relative">
          <button 
            type="button" 
            onClick={() => setUploadState('EMPTY')}
            className="absolute top-3 right-3 text-red-500/50 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
          <AlertCircle className="w-8 h-8 mb-3 text-red-500" />
          <span className="text-sm text-red-500 font-bold tracking-wider mb-1">UPLOAD FAILED</span>
          <span className="text-xs text-red-400/80 mb-3 text-center">{errorText}</span>
          <button 
            type="button" 
            onClick={() => setUploadState('EMPTY')}
            className="px-4 py-2 border border-red-500 text-red-500 text-xs font-bold tracking-widest hover:bg-red-500/10 transition-colors uppercase"
          >
            Try Again
          </button>
        </div>
      )}

      {errorMessage && uploadState !== 'SUCCESS' && ( // Only show Zod validation errors if not success state
        <p className="text-red-400 text-[10px] mt-1 font-body uppercase tracking-widest">{errorMessage}</p>
      )}
    </div>
  );
};
