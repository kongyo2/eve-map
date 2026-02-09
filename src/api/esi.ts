import { Result } from 'neverthrow';
import type { ApiError } from './client';
import { fetchJson, batchFetch } from './client';
import {
  EsiSystemSchema,
  EsiConstellationSchema,
  EsiRegionSchema,
  EsiStargateSchema,
  EsiSystemKillsSchema,
  EsiSystemJumpsSchema,
  EsiRouteSchema,
  EsiRegionIdsSchema,
} from './schemas';
import type {
  EsiSystemResponse,
  EsiConstellationResponse,
  EsiRegionResponse,
  EsiStargateResponse,
} from './schemas';
import type {
  Region,
  Constellation,
  SolarSystem,
  Stargate,
  SystemKills,
  SystemJumps,
  RoutePreference,
} from '../types/universe';

const ESI_BASE = 'https://esi.evetech.net/latest';
const LANG = 'ja';

const esiUrl = (path: string, params?: Record<string, string>): string => {
  const searchParams = new URLSearchParams({
    datasource: 'tranquility',
    language: LANG,
    ...params,
  });
  return `${ESI_BASE}${path}?${searchParams.toString()}`;
};

const toRegion = (r: EsiRegionResponse): Region => ({
  id: r.region_id,
  name: r.name,
  constellationIds: r.constellations,
});

const toConstellation = (c: EsiConstellationResponse): Constellation => ({
  id: c.constellation_id,
  name: c.name,
  regionId: c.region_id,
  systemIds: c.systems,
  position: c.position,
});

const toSystem = (s: EsiSystemResponse, regionId: number): SolarSystem => ({
  id: s.system_id,
  name: s.name,
  constellationId: s.constellation_id,
  regionId,
  securityStatus: s.security_status,
  securityClass: s.security_class ?? '',
  position: s.position,
  stargateIds: s.stargates ?? [],
  stationIds: s.stations ?? [],
});

const toStargate = (sg: EsiStargateResponse): Stargate => ({
  stargateId: sg.stargate_id,
  systemId: sg.system_id,
  destinationSystemId: sg.destination.system_id,
  destinationStargateId: sg.destination.stargate_id,
});

// K-space region IDs: 10000001 - 10000070 (excluding 10000024, 10000026)
const isKSpaceRegion = (id: number): boolean => id >= 10000001 && id <= 10000070;

export const fetchRegionIds = async (): Promise<Result<readonly number[], ApiError>> => {
  const result = await fetchJson(esiUrl('/universe/regions/'), EsiRegionIdsSchema);
  return result.map((ids) => ids.filter(isKSpaceRegion));
};

export const fetchRegion = async (regionId: number): Promise<Result<Region, ApiError>> => {
  const result = await fetchJson(esiUrl(`/universe/regions/${regionId}/`), EsiRegionSchema);
  return result.map(toRegion);
};

export const fetchRegions = async (
  regionIds: readonly number[],
): Promise<Result<readonly Region[], ApiError>> => {
  const urls = regionIds.map((id) => esiUrl(`/universe/regions/${id}/`));
  const result = await batchFetch(urls, EsiRegionSchema);
  return result.map((regions) => regions.map(toRegion));
};

export const fetchConstellation = async (
  constellationId: number,
): Promise<Result<Constellation, ApiError>> => {
  const result = await fetchJson(
    esiUrl(`/universe/constellations/${constellationId}/`),
    EsiConstellationSchema,
  );
  return result.map(toConstellation);
};

export const fetchConstellations = async (
  constellationIds: readonly number[],
): Promise<Result<readonly Constellation[], ApiError>> => {
  const urls = constellationIds.map((id) => esiUrl(`/universe/constellations/${id}/`));
  const result = await batchFetch(urls, EsiConstellationSchema);
  return result.map((constellations) => constellations.map(toConstellation));
};

export const fetchSystem = async (
  systemId: number,
  regionId: number,
): Promise<Result<SolarSystem, ApiError>> => {
  const result = await fetchJson(esiUrl(`/universe/systems/${systemId}/`), EsiSystemSchema);
  return result.map((s) => toSystem(s, regionId));
};

export const fetchSystems = async (
  systemEntries: readonly { systemId: number; regionId: number }[],
): Promise<Result<readonly SolarSystem[], ApiError>> => {
  const urls = systemEntries.map((e) => esiUrl(`/universe/systems/${e.systemId}/`));
  const result = await batchFetch(urls, EsiSystemSchema, 20, 100);
  return result.map((systems) =>
    systems.map((s) => {
      const entry = systemEntries.find((e) => e.systemId === s.system_id);
      return toSystem(s, entry?.regionId ?? 0);
    }),
  );
};

export const fetchStargate = async (stargateId: number): Promise<Result<Stargate, ApiError>> => {
  const result = await fetchJson(esiUrl(`/universe/stargates/${stargateId}/`), EsiStargateSchema);
  return result.map(toStargate);
};

export const fetchStargates = async (
  stargateIds: readonly number[],
): Promise<Result<readonly Stargate[], ApiError>> => {
  const urls = stargateIds.map((id) => esiUrl(`/universe/stargates/${id}/`));
  const result = await batchFetch(urls, EsiStargateSchema, 20, 100);
  return result.map((stargates) => stargates.map(toStargate));
};

export const calculateRoute = async (
  origin: number,
  destination: number,
  preference: RoutePreference,
  avoid?: readonly number[],
): Promise<Result<readonly number[], ApiError>> => {
  let url = esiUrl(`/route/${origin}/${destination}/`, { flag: preference });
  if (avoid && avoid.length > 0) {
    const avoidParams = avoid.map((id) => `avoid=${id}`).join('&');
    url += `&${avoidParams}`;
  }
  return fetchJson(url, EsiRouteSchema);
};

export const fetchSystemKills = async (): Promise<Result<readonly SystemKills[], ApiError>> => {
  const result = await fetchJson(esiUrl('/universe/system_kills/'), EsiSystemKillsSchema.array());
  return result.map((kills) =>
    kills.map((k) => ({
      systemId: k.system_id,
      npcKills: k.npc_kills,
      podKills: k.pod_kills,
      shipKills: k.ship_kills,
    })),
  );
};

export const fetchSystemJumps = async (): Promise<Result<readonly SystemJumps[], ApiError>> => {
  const result = await fetchJson(esiUrl('/universe/system_jumps/'), EsiSystemJumpsSchema.array());
  return result.map((jumps) =>
    jumps.map((j) => ({
      systemId: j.system_id,
      shipJumps: j.ship_jumps,
    })),
  );
};
