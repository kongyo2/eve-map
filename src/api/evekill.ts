import { Result, ok, err } from 'neverthrow';
import type { ApiError } from './client';
import type { Killmail } from '../types/universe';
import { EveKillKillmailSchema } from './schemas';

const EVE_KILL_BASE = 'https://eve-kill.com/api/killlist/system';

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
