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
} as const;
