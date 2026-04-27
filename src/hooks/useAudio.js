import { useCallback } from 'react';

// A singleton audio context so we don't spam the browser with contexts.
let audioCtx;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
};

export const useAudio = () => {
  const playHover = useCallback(() => {
    try {
      initAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime); // High pitch start
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05); // Rapid drop
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.01); // Very quiet
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch(e) {}
  }, []);

  const playClick = useCallback(() => {
    try {
      initAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // Very high tech beep
      osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch(e) {}
  }, []);

  const playSuccess = useCallback(() => {
    try {
      initAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      // Play a chord (C major)
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
      
      frequencies.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + (i * 0.1));
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + (i * 0.1));
        gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + (i * 0.1) + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (i * 0.1) + 0.5);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(audioCtx.currentTime + (i * 0.1));
        osc.stop(audioCtx.currentTime + (i * 0.1) + 0.5);
      });
    } catch(e) {}
  }, []);

  return { playHover, playClick, playSuccess };
};
