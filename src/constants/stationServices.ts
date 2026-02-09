export const SERVICE_NAMES: Record<string, string> = {
  'bounty-missions': 'バウンティミッション',
  'assasination-missions': 'アサシネーションミッション',
  'courier-missions': 'クーリエミッション',
  interbus: 'インターバス',
  'reprocessing-plant': '再処理プラント',
  refinery: 'リファイナリ',
  market: 'マーケット',
  'black-market': 'ブラックマーケット',
  'stock-exchange': 'ストックエクスチェンジ',
  cloning: 'クローニング',
  surgery: 'サージェリー',
  'dna-therapy': 'DNAセラピー',
  'repair-facilities': '修理施設',
  factory: '工場',
  labratory: '研究所',
  gambling: 'ギャンブル',
  fitting: 'フィッティング',
  paintshop: 'ペイントショップ',
  news: 'ニュース',
  storage: 'ストレージ',
  insurance: '保険',
  docking: 'ドッキング',
  'office-rental': 'オフィスレンタル',
  'jump-clone-facility': 'ジャンプクローン施設',
  'loyalty-point-store': 'LPストア',
  'navy-offices': 'ネイビーオフィス',
  'security-offices': 'セキュリティオフィス',
};

export type ServiceCategory = 'trade' | 'industry' | 'service' | 'mission';

const SERVICE_CATEGORIES: Record<string, ServiceCategory> = {
  market: 'trade',
  'black-market': 'trade',
  'stock-exchange': 'trade',
  insurance: 'trade',
  factory: 'industry',
  labratory: 'industry',
  'reprocessing-plant': 'industry',
  refinery: 'industry',
  cloning: 'service',
  surgery: 'service',
  'dna-therapy': 'service',
  'repair-facilities': 'service',
  fitting: 'service',
  'jump-clone-facility': 'service',
  storage: 'service',
  docking: 'service',
  'office-rental': 'service',
  paintshop: 'service',
  'loyalty-point-store': 'service',
  'bounty-missions': 'mission',
  'assasination-missions': 'mission',
  'courier-missions': 'mission',
  'navy-offices': 'mission',
  'security-offices': 'mission',
  interbus: 'mission',
  news: 'service',
  gambling: 'service',
};

export const CATEGORY_NAMES: Record<ServiceCategory, string> = {
  trade: '取引',
  industry: '工業',
  service: 'サービス',
  mission: 'ミッション',
};

export const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  trade: '#FFD700',
  industry: '#4fc3f7',
  service: '#00EF47',
  mission: '#ff8a65',
};

export const getServiceName = (key: string): string => SERVICE_NAMES[key] ?? key;

export const getServiceCategory = (key: string): ServiceCategory =>
  SERVICE_CATEGORIES[key] ?? 'service';

export const KEY_SERVICES = [
  'market',
  'reprocessing-plant',
  'repair-facilities',
  'cloning',
  'fitting',
] as const;
