import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import RegistrationForm from '../components/RegistrationForm';
import LiveTracker from '../components/LiveTracker';

// 🚨 THIS IS WHERE YOU LINK THE SPECIFIC GOOGLE SHEET SCRIPT FOR THIS TOURNAMENT 🚨
const TOURNAMENT_API_URL = 'https://script.google.com/macros/s/AKfycbxZRahhIuVNNbxqvsdfDSt6X9SaciMARwVeSXkjMSpzEoegrF_F4vqWG5HXYu50z1RM/exec';

export default function CommunityCup2() {
  const [activeTab, setActiveTab] = useState('register');
  const [slots, setSlots] = useState({ confirmed: 0, cap: 32, isFull: false, loading: true });

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await fetch(`${TOURNAMENT_API_URL}?t=${new Date().getTime()}`);
        const data = await res.json();
        setSlots({ confirmed: data.confirmed || 0, cap: data.cap || 32, isFull: data.isFull, loading: false });
      } catch (e) { 
        setSlots(s => ({ ...s, loading: false })); 
      }
    };
    fetchSlots();
    const interval = setInterval(fetchSlots, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
      
      {/* LEFT COLUMN: TOURNAMENT INFO */}
      <div className="lg:col-span-4 space-y-8">
        <div className="elite-panel p-2 text-center">
            <div className="bg-black/40 p-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Live Slots</p>
                {slots.loading ? <span className="text-zinc-500">...</span> : (
                  slots.isFull ? <span className="text-3xl text-red-500 brand-font">FULL</span> :
                  <div className="text-3xl text-[var(--neon-cyan)] brand-font leading-none text-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                    {slots.confirmed} <span className="text-zinc-600 opacity-50">/ {slots.cap}</span>
                  </div>
                )}
            </div>
        </div>

        <div className="elite-panel p-6">
            <h3 className="text-3xl text-white brand-font mb-4 border-b border-white/10 pb-3">Tournament Info</h3>
            <div className="space-y-5 data-font">
                <div>
                    <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em]">01 // TOURNAMENT DATE</p>
                    <p className="text-xl font-bold text-[var(--neon-cyan)] mt-1">APRIL 03, 2026</p>
                </div>
                <div>
                    <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em]">02 // FORMAT</p>
                    <p className="text-xl font-bold text-[var(--neon-pink)] mt-1">5v5 (GF: BO5 | QF: BO3)</p>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                    <Shield size={16} className="text-green-400"/>
                    <span className="text-sm text-green-400 font-bold tracking-widest uppercase">AKROS REQUIRED</span>
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN: TABS & CONTENT */}
      <div className="lg:col-span-8">
        <div className="flex justify-center gap-12 w-full mt-2 mb-8 relative">
            <div className="absolute bottom-0 w-full h-px bg-white/10"></div>
            <button onClick={() => setActiveTab('register')} 
              className={`cyber-tab ${activeTab === 'register' ? 'active' : ''}`}>
              Register Team
            </button>
            <button onClick={() => setActiveTab('tracker')} 
              className={`cyber-tab flex items-center gap-3 ${activeTab === 'tracker' ? 'active' : ''}`}>
              Live Roster Tracker <span className="bg-[var(--neon-pink)] text-white text-[10px] px-2 py-0.5 rounded-sm font-sans font-bold tracking-widest animate-pulse">LIVE</span>
            </button>
        </div>

        {/* Pass the specific API URL and Deadline to the components */}
        {activeTab === 'register' ? (
            <RegistrationForm API_URL={TOURNAMENT_API_URL} deadlineDate="2026-03-31T23:59:59Z" />
        ) : (
            <LiveTracker API_URL={TOURNAMENT_API_URL} />
        )}
      </div>
    </div>
  );
}
