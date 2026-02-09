export type Position3D = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
};

export type SolarSystem = {
  readonly id: number;
  readonly name: string;
  readonly constellationId: number;
  readonly regionId: number;
  readonly securityStatus: number;
  readonly securityClass: string;
  readonly position: Position3D;
  readonly stargateIds: readonly number[];
  readonly stationIds: readonly number[];
};

export type NormalizedSystem = SolarSystem & {
  readonly nx: number;
  readonly nz: number;
};

export type StargateConnection = {
  readonly fromSystemId: number;
  readonly toSystemId: number;
};

export type Stargate = {
  readonly stargateId: number;
  readonly systemId: number;
  readonly destinationSystemId: number;
  readonly destinationStargateId: number;
};

export type Constellation = {
  readonly id: number;
  readonly name: string;
  readonly regionId: number;
  readonly systemIds: readonly number[];
  readonly position: Position3D;
};

export type Region = {
  readonly id: number;
  readonly name: string;
  readonly constellationIds: readonly number[];
};

export type SystemKills = {
  readonly systemId: number;
  readonly npcKills: number;
  readonly podKills: number;
  readonly shipKills: number;
};

export type SystemJumps = {
  readonly systemId: number;
  readonly shipJumps: number;
};

export type Station = {
  readonly stationId: number;
  readonly name: string;
  readonly systemId: number;
  readonly services: readonly string[];
};

export type Killmail = {
  readonly killmailId: number;
  readonly totalValue: number;
  readonly killTime: string;
  readonly attackerCount: number;
  readonly isSolo: boolean;
  readonly victimShipName: string;
  readonly victimName: string;
  readonly victimCorp: string;
};

export type SovData = {
  readonly systemId: number;
  readonly allianceId?: number;
  readonly corporationId?: number;
  readonly factionId?: number;
};

export type HeatmapMode = 'off' | 'kills' | 'jumps';

export type SecurityLevel = 'highsec' | 'lowsec' | 'nullsec';

export type RoutePreference = 'shortest' | 'secure' | 'insecure';

export type DetailLevel = 'region' | 'constellation' | 'system';
