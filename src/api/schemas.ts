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

export const EsiRouteSchema = z.array(z.number());

export const EsiSystemIdsSchema = z.array(z.number());
export const EsiRegionIdsSchema = z.array(z.number());

export type EsiSystemResponse = z.infer<typeof EsiSystemSchema>;
export type EsiConstellationResponse = z.infer<typeof EsiConstellationSchema>;
export type EsiRegionResponse = z.infer<typeof EsiRegionSchema>;
export type EsiStargateResponse = z.infer<typeof EsiStargateSchema>;
