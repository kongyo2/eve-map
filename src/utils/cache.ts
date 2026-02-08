import { File, Directory, Paths } from 'expo-file-system';
import { Result, ok, err } from 'neverthrow';
import type { ApiError } from '../api/client';

const CACHE_DIR_NAME = 'universe_cache';

const getCacheDir = (): Directory => {
  return new Directory(Paths.cache, CACHE_DIR_NAME);
};

const getCacheFile = (key: string): File => {
  return new File(getCacheDir(), `${key}.json`);
};

export const writeCache = async <T>(key: string, data: T): Promise<Result<void, ApiError>> => {
  const dir = getCacheDir();
  if (!dir.exists) {
    dir.create();
  }

  const file = getCacheFile(key);
  const content = JSON.stringify({ timestamp: Date.now(), data });

  const writeResult = Result.fromThrowable(
    () => file.write(content),
    () => ({ kind: 'network' as const, message: 'キャッシュの書き込みに失敗しました' }),
  )();

  if (writeResult.isErr()) return err(writeResult.error);
  return ok(undefined);
};

export const readCache = async <T>(
  key: string,
  maxAgeMs?: number,
): Promise<Result<T | null, ApiError>> => {
  const file = getCacheFile(key);

  if (!file.exists) {
    return ok(null);
  }

  let content: string;
  const textPromise = file.text();
  const textResult = await textPromise.then(
    (text) => ({ ok: true as const, value: text }),
    () => ({ ok: false as const }),
  );

  if (!textResult.ok) return ok(null);
  content = textResult.value;

  const parsed = Result.fromThrowable(
    () => JSON.parse(content) as { timestamp: number; data: T },
    () => ({ kind: 'parse' as const, message: 'キャッシュのパースに失敗しました' }),
  )();

  if (parsed.isErr()) return ok(null);

  if (maxAgeMs !== undefined && Date.now() - parsed.value.timestamp > maxAgeMs) {
    return ok(null);
  }

  return ok(parsed.value.data);
};

export const clearCache = async (): Promise<Result<void, ApiError>> => {
  const dir = getCacheDir();
  if (dir.exists) {
    const deleteResult = Result.fromThrowable(
      () => dir.delete(),
      () => ({ kind: 'network' as const, message: 'キャッシュの削除に失敗しました' }),
    )();
    if (deleteResult.isErr()) return err(deleteResult.error);
  }
  return ok(undefined);
};
