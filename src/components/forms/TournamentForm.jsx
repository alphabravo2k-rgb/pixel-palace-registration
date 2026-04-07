import React, { useState } from 'react';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { TextInput, EmailInput, PhoneInput, SteamIDInput, DiscordInput } from './Inputs';

// Helper to map field names to proper components and labels
const fieldConfig = {
  teamName: { component: TextInput, label: "Team Name", required: true },
  captainName: { component: TextInput, label: "Captain Name", required: true },
  captainSteamID: { component: SteamIDInput, label: "Captain Steam ID", required: true },
  captainDiscord: { component: DiscordInput, label: "Captain Discord", required: true },
  captainEmail: { component: EmailInput, label: "Captain Email", required: true },
  captainPhone: { component: PhoneInput, label: "Captain Phone", required: true },
  player2Name: { component: TextInput, label: "Player 2 Name", required: true },
  player2SteamID: { component: SteamIDInput, label: "Player 2 Steam ID", required: true },
  player3Name: { component: TextInput, label: "Player 3 Name", required: true },
  player3SteamID: { component: SteamIDInput, label: "Player 3 Steam ID", required: true },
  player4Name: { component: TextInput, label: "Player 4 Name", required: true },
  player4SteamID: { component: SteamIDInput, label: "Player 4 Steam ID", required: true },
  player5Name: { component: TextInput, label: "Player 5 Name", required: true },
  player5SteamID: { component: SteamIDInput, label: "Player 5 Steam ID", required: true },
};

export const TournamentForm = ({ tournament }) => {
  const { submit, isSubmitting, error, isSuccess } = useFormSubmit(tournament.id);
  const [formData, setFormData] = useState({});

  if (isSuccess) {
    return (
      <div className="glass-panel p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-4xl text-esports-accent font-heading font-bold uppercase mb-4 shadow-esports-accent">
          Roster Secured
        </h2>
        <p className="text-gray-300 font-body uppercase tracking-widest text-sm mb-8">
          Your registration for {tournament.name} is confirmed.
        </p>
        {formData.teamName && (
          <p className="text-xl font-heading text-white mb-8 border border-white/10 px-6 py-3 bg-black/50">
            TEAM: {formData.teamName}
          </p>
        )}
        <a href="https://discord.gg/your-pixel-palace-discord" target="_blank" rel="noopener noreferrer" className="btn-primary">
          Join Discord Server
        </a>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-10 w-full max-w-4xl mx-auto">
      <div className="mb-8 border-b border-white/10 pb-4">
        <h2 className="text-3xl text-white font-heading font-bold uppercase">Registration</h2>
        <p className="text-gray-400 font-body text-xs mt-1 uppercase tracking-wider">{tournament.name}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-esports-warning bg-esports-warning/10 text-esports-warning font-body text-sm text-center uppercase tracking-widest">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
        {tournament.fields.map((fieldName) => {
          const config = fieldConfig[fieldName];
          if (!config) return null; // Fallback if missing config
          
          const Component = config.component;
          return (
            <div key={fieldName} className={fieldName.includes('Team') || fieldName.includes('Email') ? 'md:col-span-2' : ''}>
              <Component
                name={fieldName}
                label={config.label}
                required={config.required}
                value={formData[fieldName] || ''}
                onChange={handleChange}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-10">
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-xl py-4 flex justify-center items-center">
          {isSubmitting ? 'TRANSMITTING...' : 'SUBMIT REGISTRATION'}
        </button>
      </div>
    </form>
  );
};
