// NPC Faction fixed colors
const FACTION_COLORS: Record<number, string> = {
  500001: '#4488cc', // Caldari State
  500002: '#44cc88', // Minmatar Republic
  500003: '#ccaa44', // Amarr Empire
  500004: '#44cc44', // Gallente Federation
  500010: '#cc4444', // Serpentis
  500011: '#cc8844', // Angel Cartel
  500012: '#8844cc', // Sansha's Nation
};

export const allianceColor = (allianceId: number): string => {
  // Deterministic HSL color from alliance ID
  const hue = (allianceId * 137) % 360;
  return `hsl(${hue}, 65%, 55%)`;
};

export const sovColor = (allianceId?: number, factionId?: number): string => {
  if (factionId && FACTION_COLORS[factionId]) {
    return FACTION_COLORS[factionId];
  }
  if (allianceId) {
    return allianceColor(allianceId);
  }
  return '#4a5268'; // unclaimed
};
