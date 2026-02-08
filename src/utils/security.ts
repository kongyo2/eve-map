import type { SecurityLevel } from '../types/universe';

export const classifySecurity = (securityStatus: number): SecurityLevel => {
  if (securityStatus >= 0.45) return 'highsec';
  if (securityStatus > 0.0) return 'lowsec';
  return 'nullsec';
};

export const formatSecurity = (securityStatus: number): string => {
  const rounded = Math.round(securityStatus * 10) / 10;
  return rounded.toFixed(1);
};
