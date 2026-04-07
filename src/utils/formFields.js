import { MessageSquare, Gamepad2, Crosshair, Award, Users, Tag, Globe, Image as ImageIcon, Key } from 'lucide-react';

export const FIELD_METADATA = {
  inviteCode: { label: "Invite Code", icon: Key, placeholder: "Leave blank if none", type: "text" },
  teamName: { label: "Team Name", icon: Users, placeholder: "e.g. Natus Vincere", type: "text" },
  teamTag: { label: "Team Tag", icon: Tag, placeholder: "e.g. NAVI", type: "text" },
  teamRegion: { label: "Server Region", icon: Globe, placeholder: "Select Region...", type: "select", options: [
    { value: "IND", label: "India (IND)" },
    { value: "PAK", label: "Pakistan (PAK)" },
    { value: "ME", label: "Middle East (ME)" }
  ]},
  logoLink: { label: "Team Logo URL", icon: ImageIcon, placeholder: "https://i.imgur.com/yourlogo.png", type: "url" },
  
  // Player specific fields (generic patterns)
  Discord: { label: "Discord Username", icon: MessageSquare, placeholder: "e.g. s1mple", type: "text" },
  Steam: { label: "Steam URL", icon: Gamepad2, placeholder: "Steam URL", type: "url" },
  Faceit: { label: "FACEIT URL", icon: Crosshair, placeholder: "FACEIT URL", type: "url" },
  Rank: { label: "FACEIT Level", icon: Award, type: "range", min: 1, max: 10 }
};

export const getFieldMeta = (fieldName) => {
  // Check exact first
  if (FIELD_METADATA[fieldName]) return FIELD_METADATA[fieldName];
  
  // Check for player patterns: p1Discord, p10Steam, etc.
  const playerMatch = fieldName.match(/^p(\d+)(.*)$/);
  if (playerMatch) {
    const subField = playerMatch[2]; // e.g. "Discord", "Steam"
    if (FIELD_METADATA[subField]) {
      return {
        ...FIELD_METADATA[subField],
        playerNum: playerMatch[1]
      };
    }
  }
  
  return { label: fieldName, type: "text", placeholder: fieldName };
};
