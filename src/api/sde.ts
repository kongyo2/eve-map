import { Result, ok, err } from 'neverthrow';
import type { ApiError } from './client';
import type { Landmark } from '../types/universe';
import { SdeLandmarkSchema } from './schemas';
import { readCache, writeCache } from '../utils/cache';

const SDE_BASE = 'https://sde.jita.space/latest';

const LANDMARKS_CACHE_KEY = 'sde-landmarks';
const LANDMARKS_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const fetchSdeJson = async <T>(path: string): Promise<Result<T, ApiError>> => {
  const response = await fetch(`${SDE_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  }).catch((): null => null);

  if (!response) {
    return err({ kind: 'network', message: 'SDE APIに接続できません' });
  }

  if (!response.ok) {
    if (response.status === 404) {
      return err({ kind: 'not_found', message: 'SDE リソースが見つかりません', statusCode: 404 });
    }
    return err({
      kind: 'server',
      message: `SDE HTTP ${response.status}`,
      statusCode: response.status,
    });
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return err({ kind: 'parse', message: 'SDE JSONパースに失敗しました' });
  }

  return ok(data as T);
};

const toLandmark = (raw: {
  landmarkID: number;
  name: Record<string, string>;
  description?: Record<string, string>;
  position: { x: number; y: number; z: number };
}): Landmark => ({
  id: raw.landmarkID,
  name: raw.name.ja ?? raw.name.en ?? `Landmark #${raw.landmarkID}`,
  description: raw.description?.ja ?? raw.description?.en ?? '',
  position: raw.position,
});

export const fetchLandmarkIds = async (): Promise<Result<readonly number[], ApiError>> =>
  fetchSdeJson<number[]>('/universe/landmarks');

export const fetchLandmark = async (id: number): Promise<Result<Landmark, ApiError>> => {
  const result = await fetchSdeJson<unknown>(`/universe/landmarks/${id}`);
  return result.andThen((data) => {
    const parsed = SdeLandmarkSchema.safeParse(data);
    if (!parsed.success) {
      return err({
        kind: 'validation' as const,
        message: `ランドマーク ${id} のバリデーション失敗`,
      });
    }
    return ok(toLandmark(parsed.data));
  });
};

export const fetchAllLandmarks = async (): Promise<Result<readonly Landmark[], ApiError>> => {
  // Try cache first
  const cached = await readCache<Landmark[]>(LANDMARKS_CACHE_KEY, LANDMARKS_MAX_AGE);
  if (cached.isOk() && cached.value) {
    return ok(cached.value);
  }

  // Fetch landmark IDs
  const idsResult = await fetchLandmarkIds();
  if (idsResult.isErr()) return err(idsResult.error);

  const ids = idsResult.value;
  const landmarks: Landmark[] = [];

  // Batch fetch with concurrency control (20 parallel, 50ms delay)
  const concurrency = 20;
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((id) => fetchLandmark(id)));
    for (const result of results) {
      if (result.isOk()) {
        landmarks.push(result.value);
      }
    }
    if (i + concurrency < ids.length) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  // Cache results
  await writeCache(LANDMARKS_CACHE_KEY, landmarks);

  return ok(landmarks);
};
