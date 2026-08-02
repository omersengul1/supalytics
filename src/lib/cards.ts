import { T } from './i18n';
import type { MetricKey } from './prefs';

// Özetteki her kart tek tek açılıp kapatılabilir ve sürüklenebilir; düzenlemenin
// birimi metrik grubu değil, kartın kendisi. Kartın hangi metriğe ait olduğu
// yalnızca veri çekmek için önemli: görünen kartların kaynakları toplanır ve
// yalnızca onların RPC'leri çağrılır.
export type CardId =
  | 'weeklyActive'
  | 'engagement'
  | 'onlineNow'
  | 'loginsToday'
  | 'topUsers'
  | 'signups30'
  | 'totalUsers'
  | 'growth'
  | 'unconfirmed'
  | 'mfa'
  | 'openSessions'
  | 'sessionCount'
  | 'topProvider'
  | 'topDevice'
  | 'activity';

export const CARD_SOURCE: Record<CardId, MetricKey> = {
  weeklyActive: 'active',
  engagement: 'active',
  onlineNow: 'active',
  loginsToday: 'active',
  topUsers: 'active',
  signups30: 'signups',
  totalUsers: 'signups',
  growth: 'signups',
  unconfirmed: 'signups',
  mfa: 'signups',
  openSessions: 'sessions',
  sessionCount: 'sessions',
  topProvider: 'providers',
  topDevice: 'devices',
  activity: 'activity',
};

/** Kullanıcı dokunmadığı sürece özetin sırası budur. */
export const DEFAULT_CARD_ORDER: CardId[] = [
  'weeklyActive',
  'engagement',
  'onlineNow',
  'loginsToday',
  'signups30',
  'totalUsers',
  'growth',
  'unconfirmed',
  'mfa',
  'openSessions',
  'sessionCount',
  'topProvider',
  'topDevice',
  'topUsers',
  'activity',
];

const CARD_ID_SET = new Set<string>(DEFAULT_CARD_ORDER);

export function isCardId(value: unknown): value is CardId {
  return typeof value === 'string' && CARD_ID_SET.has(value);
}

/** Düzenleyicide görünen ad — özetteki kart başlığının aynısı. */
export function cardLabel(id: CardId): string {
  switch (id) {
    case 'weeklyActive':
      return T.cardWeeklyActive;
    case 'engagement':
      return T.cardEngagement;
    case 'onlineNow':
      return T.cardOnlineNow;
    case 'loginsToday':
      return T.cardLoginsToday;
    case 'topUsers':
      return T.topUsersTitle;
    case 'signups30':
      return T.cardSignups30;
    case 'totalUsers':
      return T.cardTotalUsers;
    case 'growth':
      return T.cardGrowth;
    case 'unconfirmed':
      return T.cardUnconfirmed;
    case 'mfa':
      return T.cardMfa;
    case 'openSessions':
      return T.cardOpenSessions;
    case 'sessionCount':
      return T.cardSessions;
    case 'topProvider':
      return T.cardTopProvider;
    case 'topDevice':
      return T.cardTopDevice;
    case 'activity':
      return T.activityTitle;
  }
}

/** Görünen kartların kaynak metrikleri — hangi RPC'lerin çağrılacağını belirler. */
export function metricsForCards(cards: CardId[]): MetricKey[] {
  const seen = new Set<MetricKey>();
  for (const id of cards) seen.add(CARD_SOURCE[id]);
  return [...seen];
}

/** Kart tercihi olmayan eski kurulumlar: metrics'ten varsayılan sırayla türet. */
export function cardsFromMetrics(metrics: MetricKey[]): CardId[] {
  return DEFAULT_CARD_ORDER.filter((id) => metrics.includes(CARD_SOURCE[id]));
}
