import { Result, ok, err } from 'neverthrow';
import type { z } from 'zod/v4';

export type ApiError = {
  readonly kind: 'network' | 'parse' | 'validation' | 'not_found' | 'rate_limited' | 'server';
  readonly message: string;
  readonly statusCode?: number;
};

const createNetworkError = (message: string): ApiError => ({
  kind: 'network',
  message,
});

const createServerError = (statusCode: number, message: string): ApiError => ({
  kind: statusCode === 404 ? 'not_found' : statusCode === 420 ? 'rate_limited' : 'server',
  message,
  statusCode,
});

const createParseError = (message: string): ApiError => ({
  kind: 'parse',
  message,
});

const createValidationError = (message: string): ApiError => ({
  kind: 'validation',
  message,
});

export const fetchJson = async <T>(
  url: string,
  schema: z.ZodType<T>,
  headers?: Record<string, string>,
): Promise<Result<T, ApiError>> => {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', ...headers },
  }).catch((): null => null);

  if (!response) {
    return err(createNetworkError('ネットワークエラーが発生しました'));
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return err(createServerError(response.status, `HTTP ${response.status}: ${body}`));
  }

  const text = await response.text().catch((): null => null);
  if (text === null) {
    return err(createParseError('レスポンスの読み取りに失敗しました'));
  }

  let json: unknown;
  const parseResult = Result.fromThrowable(
    () => JSON.parse(text) as unknown,
    () => createParseError('JSONパースに失敗しました'),
  )();

  if (parseResult.isErr()) {
    return err(parseResult.error);
  }
  json = parseResult.value;

  const validation = schema.safeParse(json);
  if (!validation.success) {
    return err(createValidationError(`バリデーションエラー: ${validation.error.message}`));
  }

  return ok(validation.data);
};

export const fetchJsonArray = async <T>(
  url: string,
  schema: z.ZodType<T>,
  headers?: Record<string, string>,
): Promise<Result<readonly T[], ApiError>> => {
  const arraySchema = schema.array() as z.ZodType<T[]>;
  return fetchJson(url, arraySchema, headers);
};

export const batchFetch = async <T>(
  urls: readonly string[],
  schema: z.ZodType<T>,
  concurrency: number = 20,
  delayMs: number = 50,
): Promise<Result<readonly T[], ApiError>> => {
  const results: T[] = [];
  const errors: ApiError[] = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((url) => fetchJson(url, schema)));

    for (const result of batchResults) {
      if (result.isOk()) {
        results.push(result.value);
      } else {
        errors.push(result.error);
      }
    }

    if (i + concurrency < urls.length && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  if (errors.length > 0 && results.length === 0) {
    return err(errors[0]);
  }

  return ok(results);
};
