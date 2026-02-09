import { Result, ok } from 'neverthrow';
import type { ApiError } from './client';
import { fetchJson } from './client';
import { EveTycoonMarketStatsSchema, EveTycoonMarketHistoryEntrySchema } from './schemas';
import type { MarketStats, MarketHistoryEntry } from '../types/universe';

const EVETYCOON_BASE = 'https://evetycoon.com/api';

const toMarketStats = (raw: {
  buyVolume: number;
  sellVolume: number;
  buyOrders: number;
  sellOrders: number;
  maxBuy: number;
  minSell: number;
  buyAvgFivePercent: number;
  sellAvgFivePercent: number;
}): MarketStats => ({
  buyVolume: raw.buyVolume,
  sellVolume: raw.sellVolume,
  buyOrders: raw.buyOrders,
  sellOrders: raw.sellOrders,
  maxBuy: raw.maxBuy,
  minSell: raw.minSell,
  buyAvgFivePercent: raw.buyAvgFivePercent,
  sellAvgFivePercent: raw.sellAvgFivePercent,
});

export const fetchMarketStats = async (
  regionId: number,
  typeId: number,
): Promise<Result<MarketStats, ApiError>> => {
  const url = `${EVETYCOON_BASE}/v1/market/stats/${regionId}/${typeId}`;
  const result = await fetchJson(url, EveTycoonMarketStatsSchema);
  return result.map(toMarketStats);
};

export const fetchMarketHistory = async (
  regionId: number,
  typeId: number,
): Promise<Result<readonly MarketHistoryEntry[], ApiError>> => {
  const url = `${EVETYCOON_BASE}/v1/market/history/${regionId}/${typeId}`;
  const result = await fetchJson(url, EveTycoonMarketHistoryEntrySchema.array());
  return result.map((entries) =>
    entries.map((e) => ({
      date: e.date,
      average: e.average,
      highest: e.highest,
      lowest: e.lowest,
      volume: e.volume,
      orderCount: e.orderCount,
    })),
  );
};

export const fetchMultipleMarketStats = async (
  regionId: number,
  typeIds: readonly number[],
): Promise<Result<ReadonlyMap<number, MarketStats>, ApiError>> => {
  const results = await Promise.all(
    typeIds.map(async (typeId) => {
      const result = await fetchMarketStats(regionId, typeId);
      return { typeId, result };
    }),
  );

  const map = new Map<number, MarketStats>();
  for (const { typeId, result } of results) {
    if (result.isOk()) {
      map.set(typeId, result.value);
    }
  }

  return ok(map);
};
