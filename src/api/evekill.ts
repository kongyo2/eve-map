import { Result, ok, err } from 'neverthrow';
import type { ApiError } from './client';
import type { Killmail, Battle } from '../types/universe';
import { EveKillKillmailSchema, EveKillBattleSchema } from './schemas';

const EVE_KILL_BASE = 'https://eve-kill.com/api/killlist/system';
const EVE_KILL_BATTLE_BASE = 'https://eve-kill.com/api/battles/system';

export const fetchRecentKills = async (
  systemId: number,
  limit: number = 10,
): Promise<Result<readonly Killmail[], ApiError>> => {
  const response = await fetch(`${EVE_KILL_BASE}/${systemId}?limit=${limit}`, {
    headers: { Accept: 'application/json' },
  }).catch((): null => null);

  if (!response) {
    return err({ kind: 'network', message: 'EVE-KILL APIに接続できません' });
  }

  if (!response.ok) {
    if (response.status === 404) {
      return ok([]);
    }
    return err({
      kind: 'server',
      message: `EVE-KILL HTTP ${response.status}`,
      statusCode: response.status,
    });
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return err({ kind: 'parse', message: 'EVE-KILL JSONパースに失敗しました' });
  }

  if (!Array.isArray(data)) {
    return ok([]);
  }

  const killmails: Killmail[] = [];
  for (const item of data) {
    const parsed = EveKillKillmailSchema.safeParse(item);
    if (!parsed.success) continue;
    const km = parsed.data;
    if (km.is_npc) continue;

    const shipName = km.victim.ship_name?.en ?? km.victim.ship_group_name?.en ?? 'Unknown Ship';

    killmails.push({
      killmailId: km.killmail_id,
      totalValue: km.total_value,
      killTime: km.kill_time,
      attackerCount: km.attackerCount,
      isSolo: km.is_solo,
      victimShipName: shipName,
      victimName: km.victim.character_name,
      victimCorp: km.victim.corporation_name,
    });
  }

  return ok(killmails);
};

export const fetchSystemBattles = async (
  systemId: number,
): Promise<Result<readonly Battle[], ApiError>> => {
  const response = await fetch(`${EVE_KILL_BATTLE_BASE}/${systemId}`, {
    headers: { Accept: 'application/json' },
  }).catch((): null => null);

  if (!response) {
    return ok([]); // Network failure → graceful empty
  }

  if (!response.ok) {
    return ok([]); // API error (503/404 etc.) → graceful empty
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return ok([]);
  }

  // Response may be paginated object with battles array, or direct array
  const rawBattles = Array.isArray(data)
    ? data
    : typeof data === 'object' && data !== null && 'battles' in data
      ? (data as { battles: unknown[] }).battles
      : [];

  if (!Array.isArray(rawBattles)) return ok([]);

  const battles: Battle[] = [];
  for (const item of rawBattles) {
    const parsed = EveKillBattleSchema.safeParse(item);
    if (!parsed.success) continue;
    const b = parsed.data;
    battles.push({
      battleId: b.battle_id,
      systemId: b.system_id,
      systemName: b.system_name,
      regionName: b.region_name,
      startTime: b.start_time,
      endTime: b.end_time,
      totalKills: b.total_kills,
      totalValue: b.total_value,
      participants: b.participants,
    });
  }

  return ok(battles);
};
