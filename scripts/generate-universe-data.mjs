import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SDE_URL =
  'https://developers.eveonline.com/static-data/eve-online-static-data-latest-jsonl.zip';

const K_SPACE_REGION_MIN = 10000001;
const K_SPACE_REGION_MAX = 10000070;
const SCALE_FACTOR = 1e16;

function parseJsonl(text) {
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function isKSpaceRegion(id) {
  return id >= K_SPACE_REGION_MIN && id <= K_SPACE_REGION_MAX;
}

async function main() {
  console.log('Downloading SDE JSONL ZIP...');
  const response = await fetch(SDE_URL);
  if (!response.ok) throw new Error(`Failed to download: ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);

  const zip = new AdmZip(buffer);

  const readJsonl = (name) => {
    const entry =
      zip.getEntry(name) || zip.getEntries().find((e) => e.entryName.endsWith('/' + name));
    if (!entry) {
      const entries = zip
        .getEntries()
        .map((e) => e.entryName)
        .filter((n) => n.includes('map') || n.includes('Map'));
      console.log('Available map entries:', entries);
      throw new Error(`File not found in ZIP: ${name}`);
    }
    console.log(`  Reading ${entry.entryName} (${(entry.header.size / 1024).toFixed(0)} KB)`);
    return parseJsonl(entry.getData().toString('utf-8'));
  };

  // --- Regions ---
  console.log('Parsing regions...');
  const rawRegions = readJsonl('mapRegions.jsonl');
  const kSpaceRegionIds = new Set();
  const regions = [];

  for (const r of rawRegions) {
    if (!isKSpaceRegion(r._key)) continue;
    kSpaceRegionIds.add(r._key);
    regions.push([
      r._key,
      {
        id: r._key,
        name: r.name?.ja || r.name?.en || `Region ${r._key}`,
        constellationIds: r.constellationIDs || [],
      },
    ]);
  }
  console.log(`  ${regions.length} K-space regions`);

  // --- Constellations ---
  console.log('Parsing constellations...');
  const rawConstellations = readJsonl('mapConstellations.jsonl');
  const kSpaceConstellationIds = new Set();
  const constellations = [];

  for (const c of rawConstellations) {
    if (!kSpaceRegionIds.has(c.regionID)) continue;
    kSpaceConstellationIds.add(c._key);
    constellations.push([
      c._key,
      {
        id: c._key,
        name: c.name?.ja || c.name?.en || `Constellation ${c._key}`,
        regionId: c.regionID,
        systemIds: c.solarSystemIDs || [],
        position: {
          x: c.position?.x || 0,
          y: c.position?.y || 0,
          z: c.position?.z || 0,
        },
      },
    ]);
  }
  console.log(`  ${constellations.length} K-space constellations`);

  // --- Solar Systems ---
  console.log('Parsing solar systems...');
  const rawSystems = readJsonl('mapSolarSystems.jsonl');
  const kSpaceSystemIds = new Set();
  const systems = [];

  for (const s of rawSystems) {
    if (!kSpaceRegionIds.has(s.regionID)) continue;
    kSpaceSystemIds.add(s._key);

    const x = s.position?.x || 0;
    const z = s.position?.z || 0;

    systems.push([
      s._key,
      {
        id: s._key,
        name: s.name?.ja || s.name?.en || `System ${s._key}`,
        constellationId: s.constellationID,
        regionId: s.regionID,
        securityStatus: s.securityStatus ?? 0,
        securityClass: s.securityClass || '',
        position: {
          x: s.position?.x || 0,
          y: s.position?.y || 0,
          z: s.position?.z || 0,
        },
        stargateIds: s.stargateIDs || [],
        stationIds: s.stationIDs || [],
        nx: x / SCALE_FACTOR,
        nz: z / SCALE_FACTOR,
      },
    ]);
  }
  console.log(`  ${systems.length} K-space systems`);

  // --- Stargates (connections only) ---
  console.log('Parsing stargates...');
  const rawStargates = readJsonl('mapStargates.jsonl');
  const connectionSet = new Set();
  const connections = [];

  for (const sg of rawStargates) {
    const from = sg.solarSystemID;
    const to = sg.destination?.solarSystemID;
    if (!from || !to) continue;
    if (!kSpaceSystemIds.has(from) || !kSpaceSystemIds.has(to)) continue;

    const min = Math.min(from, to);
    const max = Math.max(from, to);
    const key = `${min}-${max}`;

    if (!connectionSet.has(key)) {
      connectionSet.add(key);
      connections.push({ fromSystemId: min, toSystemId: max });
    }
  }
  console.log(`  ${connections.length} connections`);

  // --- Output ---
  const output = { regions, constellations, systems, connections };
  const json = JSON.stringify(output);

  const outDir = join(ROOT, 'assets');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, 'universe-data.json');
  writeFileSync(outPath, json, 'utf-8');
  console.log(`\nWritten to ${outPath}`);
  console.log(`  Size: ${(json.length / 1024).toFixed(0)} KB`);
  console.log(
    `  ${regions.length} regions, ${constellations.length} constellations, ${systems.length} systems, ${connections.length} connections`,
  );
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
