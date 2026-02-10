import { z } from 'zod/v4';

const Position3DSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const EsiSystemSchema = z.object({
  system_id: z.number(),
  name: z.string(),
  constellation_id: z.number(),
  security_status: z.number(),
  security_class: z.string().optional(),
  position: Position3DSchema,
  stargates: z.array(z.number()).optional(),
  stations: z.array(z.number()).optional(),
  star_id: z.number().optional(),
  planets: z
    .array(
      z.object({
        planet_id: z.number(),
        moons: z.array(z.number()).optional(),
        asteroid_belts: z.array(z.number()).optional(),
      }),
    )
    .optional(),
});

export const EsiConstellationSchema = z.object({
  constellation_id: z.number(),
  name: z.string(),
  region_id: z.number(),
  systems: z.array(z.number()),
  position: Position3DSchema,
});

export const EsiRegionSchema = z.object({
  region_id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  constellations: z.array(z.number()),
});

export const EsiStargateSchema = z.object({
  stargate_id: z.number(),
  name: z.string(),
  system_id: z.number(),
  type_id: z.number(),
  position: Position3DSchema,
  destination: z.object({
    stargate_id: z.number(),
    system_id: z.number(),
  }),
});

export const EsiSystemKillsSchema = z.object({
  system_id: z.number(),
  npc_kills: z.number(),
  pod_kills: z.number(),
  ship_kills: z.number(),
});

export const EsiSystemJumpsSchema = z.object({
  system_id: z.number(),
  ship_jumps: z.number(),
});

export const EsiStationSchema = z.object({
  station_id: z.number(),
  name: z.string(),
  system_id: z.number(),
  type_id: z.number(),
  owner: z.number(),
  services: z.array(z.string()),
  reprocessing_efficiency: z.number().optional(),
  max_dockable_ship_volume: z.number().optional(),
});

export const EsiSovSystemSchema = z.object({
  system_id: z.number(),
  alliance_id: z.number().optional(),
  corporation_id: z.number().optional(),
  faction_id: z.number().optional(),
});

export const EsiNameSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(),
});

export const EveKillKillmailSchema = z.object({
  killmail_id: z.number(),
  total_value: z.number(),
  system_id: z.number(),
  kill_time: z.string(),
  attackerCount: z.number(),
  is_npc: z.boolean(),
  is_solo: z.boolean(),
  victim: z.object({
    ship_name: z.record(z.string(), z.string()).optional(),
    ship_group_name: z.record(z.string(), z.string()).optional(),
    character_name: z.string(),
    corporation_name: z.string(),
    alliance_name: z.string(),
  }),
});

export const EsiRouteSchema = z.array(z.number());

export const EsiSystemIdsSchema = z.array(z.number());
export const EsiRegionIdsSchema = z.array(z.number());

// EVE Tycoon API schemas
export const EveTycoonMarketStatsSchema = z.object({
  buyVolume: z.number(),
  sellVolume: z.number(),
  buyOrders: z.number(),
  sellOrders: z.number(),
  buyOutliers: z.number(),
  sellOutliers: z.number(),
  buyThreshold: z.number(),
  sellThreshold: z.number(),
  buyAvgFivePercent: z.number(),
  sellAvgFivePercent: z.number(),
  maxBuy: z.number(),
  minSell: z.number(),
});

export const EveTycoonMarketHistoryEntrySchema = z.object({
  date: z.number(),
  regionId: z.number(),
  typeId: z.number(),
  average: z.number(),
  highest: z.number(),
  lowest: z.number(),
  orderCount: z.number(),
  volume: z.number(),
});

export type EsiSystemResponse = z.infer<typeof EsiSystemSchema>;
export type EsiConstellationResponse = z.infer<typeof EsiConstellationSchema>;
export type EsiRegionResponse = z.infer<typeof EsiRegionSchema>;
export type EsiStargateResponse = z.infer<typeof EsiStargateSchema>;
export type EsiStationResponse = z.infer<typeof EsiStationSchema>;
export type EsiSovSystemResponse = z.infer<typeof EsiSovSystemSchema>;
export type EveKillKillmailResponse = z.infer<typeof EveKillKillmailSchema>;
export type EveTycoonMarketStatsResponse = z.infer<typeof EveTycoonMarketStatsSchema>;
export type EveTycoonMarketHistoryEntry = z.infer<typeof EveTycoonMarketHistoryEntrySchema>;

// SDE API schemas (sde.jita.space)
export const SdeLandmarkSchema = z.object({
  landmarkID: z.number(),
  name: z.record(z.string(), z.string()),
  description: z.record(z.string(), z.string()).optional(),
  position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  iconID: z.number().optional(),
});

export type SdeLandmarkResponse = z.infer<typeof SdeLandmarkSchema>;

// EVE-KILL Battle schema
export const EveKillBattleSchema = z.object({
  battle_id: z.string().optional(),
  system_id: z.number(),
  system_name: z.string(),
  region_name: z.string(),
  start_time: z.string(),
  end_time: z.string().optional(),
  total_kills: z.number(),
  total_value: z.number(),
  participants: z.number().optional(),
});
