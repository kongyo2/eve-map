export const securityColor = (sec: number): string => {
  const rounded = Math.round(sec * 10) / 10;
  if (rounded >= 1.0) return '#2FEFEF';
  if (rounded >= 0.9) return '#48F0C0';
  if (rounded >= 0.8) return '#00EF47';
  if (rounded >= 0.7) return '#00F000';
  if (rounded >= 0.6) return '#8FEF2F';
  if (rounded >= 0.5) return '#EFEF00';
  if (rounded >= 0.4) return '#D77700';
  if (rounded >= 0.3) return '#F06000';
  if (rounded >= 0.2) return '#F04800';
  if (rounded >= 0.1) return '#D73000';
  return '#F00000';
};

export const securityColorAlpha = (sec: number, alpha: number): string => {
  const hex = securityColor(sec);
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alphaHex}`;
};

export const dangerColor = (shipKills: number): string => {
  if (shipKills === 0) return '#334466';
  if (shipKills <= 2) return '#668844';
  if (shipKills <= 5) return '#CCCC00';
  if (shipKills <= 10) return '#FF9900';
  if (shipKills <= 20) return '#FF4400';
  return '#FF0000';
};

export const dangerRadius = (shipKills: number): number => {
  if (shipKills === 0) return 0.05;
  if (shipKills <= 5) return 0.07;
  if (shipKills <= 20) return 0.09;
  return 0.12;
};

export const trafficColor = (jumps: number, avgJumps: number): string => {
  if (jumps === 0) return '#1a2040';
  const ratio = avgJumps > 0 ? jumps / avgJumps : 0;
  if (ratio < 0.5) return '#2a4060';
  if (ratio < 1.0) return '#4a8050';
  if (ratio < 1.5) return '#6a8050';
  if (ratio < 2.5) return '#CCCC00';
  if (ratio < 4.0) return '#FF9900';
  return '#FF4400';
};

export const trafficRadius = (jumps: number, avgJumps: number): number => {
  if (jumps === 0) return 0.05;
  const ratio = avgJumps > 0 ? jumps / avgJumps : 0;
  if (ratio < 1.0) return 0.05;
  if (ratio < 2.5) return 0.07;
  if (ratio < 4.0) return 0.09;
  return 0.12;
};

export const theme = {
  background: '#0a0e1a',
  surface: '#141929',
  surfaceLight: '#1e2440',
  text: '#e0e6f0',
  textSecondary: '#8892a8',
  textDim: '#4a5268',
  accent: '#4fc3f7',
  accentDim: '#1a4a6a',
  route: '#FFD700',
  routeGlow: '#FFD70066',
  connection: '#1a2040',
  connectionLight: '#2a3460',
  selectedHighlight: '#4fc3f7',
  error: '#ef5350',
  highsec: '#00EF47',
  lowsec: '#D77700',
  nullsec: '#F00000',
  danger: '#FF4444',
  border: '#2a3050',
} as const;
