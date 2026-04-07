import React from 'react';

export const Badge = ({ status }) => {
  let styles = "bg-gray-800 text-gray-300 border-gray-600";
  let label = "Unknown";

  if (status === "active") {
    styles = "bg-esports-accent/10 text-esports-accent border-esports-accent/50 shadow-[0_0_10px_rgba(0,245,255,0.2)]";
    label = "OPEN";
  } else if (status === "upcoming") {
    styles = "bg-esports-warning/10 text-esports-warning border-esports-warning/50";
    label = "COMING SOON";
  } else if (status === "closed") {
    styles = "bg-red-900/20 text-red-500 border-red-500/50";
    label = "CLOSED";
  }

  return (
    <span className={`px-3 py-1 font-body text-xs font-bold tracking-widest border rounded inline-block ${styles}`}>
      {label}
    </span>
  );
};
