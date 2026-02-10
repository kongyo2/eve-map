export const MAP = {
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 500,
  INITIAL_ZOOM: 3,

  // Zoom thresholds for LOD
  REGION_TO_CONSTELLATION_ZOOM: 8,
  CONSTELLATION_TO_SYSTEM_ZOOM: 30,

  // Node sizes (screen pixels)
  REGION_NODE_RADIUS: 12,
  CONSTELLATION_NODE_RADIUS: 6,
  SYSTEM_NODE_RADIUS: 4,
  SYSTEM_HUB_RADIUS: 7,

  // Label thresholds
  REGION_LABEL_MIN_ZOOM: 1,
  CONSTELLATION_LABEL_MIN_ZOOM: 8,
  SYSTEM_LABEL_MIN_ZOOM: 40,

  // Connection line widths
  REGION_CONNECTION_WIDTH: 1.5,
  CONSTELLATION_CONNECTION_WIDTH: 0.8,
  STARGATE_CONNECTION_WIDTH: 0.5,
  ROUTE_CONNECTION_WIDTH: 3,

  // Touch
  TAP_RADIUS: 30,

  // Culling
  CULL_MARGIN: 50,

  // Trade hub system IDs
  TRADE_HUBS: [
    30000142, // Jita
    30002187, // Amarr
    30002659, // Dodixie
    30002510, // Rens
    30002053, // Hek
  ] as readonly number[],
  // Trade hub region IDs
  TRADE_HUB_REGIONS: [
    10000002, // The Forge (Jita)
    10000043, // Domain (Amarr)
    10000032, // Sinq Laison (Dodixie)
    10000042, // Metropolis (Rens)
    10000030, // Heimatar (Hek)
  ] as readonly number[],
} as const;

// Global market region (PLEX etc.)
export const GLOBAL_MARKET_REGION = 19000001;

// Key market items to display
export const MARKET_ITEMS = [
  { typeId: 44992, name: 'PLEX', global: true },
  { typeId: 40519, name: 'スキルエクストラクター', global: false },
  { typeId: 40520, name: '大型スキルインジェクター', global: false },
  { typeId: 45635, name: '小型スキルインジェクター', global: false },
  { typeId: 46375, name: 'デイリー・アルファ・インジェクター', global: false },
  { typeId: 34, name: 'トリタニウム', global: false },
  { typeId: 35, name: 'パイライト', global: false },
  { typeId: 36, name: 'メキサロン', global: false },
  { typeId: 38, name: 'ノキシウム', global: false },
  { typeId: 40, name: 'メガサイト', global: false },
] as const;

export const eveImageUrl = (typeId: number, size: number = 64): string =>
  `https://images.evetech.net/types/${typeId}/icon?size=${size}`;
