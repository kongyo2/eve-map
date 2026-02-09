export const STRINGS = {
  // App
  appName: 'EVE Map',

  // Navigation
  mapTitle: 'ニューエデンマップ',
  searchTitle: '検索',
  systemInfoTitle: 'システム情報',

  // Loading
  loadingTitle: 'ニューエデンを読み込み中',
  loadingRegions: 'リージョンを読み込み中...',
  loadingConstellations: 'コンステレーションを読み込み中...',
  loadingSystems: 'ソーラーシステムを読み込み中...',
  loadingConnections: 'スターゲート接続を読み込み中...',
  loadingComplete: '読み込み完了',
  loadingFromCache: 'キャッシュからデータを復元中...',

  // Map controls
  zoomIn: '拡大',
  zoomOut: '縮小',
  resetView: 'リセット',

  // Search
  searchPlaceholder: 'システム名・リージョン名で検索...',
  noResults: '結果が見つかりません',
  recentSearches: '最近の検索',
  searchHint: '2文字以上入力してください',

  // System info
  securityStatus: 'セキュリティステータス',
  region: 'リージョン',
  constellation: 'コンステレーション',
  connectedSystems: '接続システム',
  stations: 'ステーション',
  stargates: 'スターゲート',

  // Stats
  killStats: 'キル統計（過去1時間）',
  jumpStats: 'ジャンプ統計（過去1時間）',
  npcKills: 'NPCキル',
  podKills: 'ポッドキル',
  shipKills: '艦船キル',
  shipJumps: '艦船ジャンプ',

  // Route
  routeFrom: '出発地',
  routeTo: '目的地',
  setAsOrigin: 'ここから出発',
  setAsDestination: 'ここへ移動',
  calculateRoute: 'ルート計算',
  clearRoute: 'ルートクリア',
  routeJumps: 'ジャンプ',
  swapRoute: '出発地と目的地を入れ替え',
  shortest: '最短',
  secure: '安全',
  insecure: '危険',
  routeCalculating: 'ルートを計算中...',
  routeResult: 'ルート結果',

  // Security classification
  highsec: 'ハイセク',
  lowsec: 'ローセク',
  nullsec: 'ヌルセク',

  // Detail levels
  regionView: 'リージョン表示',
  constellationView: 'コンステレーション表示',
  systemView: 'システム表示',

  // Actions
  viewDetails: '詳細を見る',
  close: '閉じる',
  retry: '再試行',

  // Route enhancements
  routeDetails: 'ルート詳細',
  routeOriginLabel: '出発',
  routeDestLabel: '到着',

  // Route short labels (search)
  routeFromShort: '出発',
  routeToShort: '目的',

  // Gesture hints
  gestureHintTitle: '操作ガイド',
  gestureHintTap: 'タップ: システムを選択',
  gestureHintPinch: 'ピンチ: 拡大・縮小',
  gestureHintDrag: 'ドラッグ: マップ移動',
  gestureHintDismiss: 'タップして閉じる',

  // Errors
  networkError: 'ネットワークエラーが発生しました',
  loadError: 'データの読み込みに失敗しました',
  routeError: 'ルート計算に失敗しました',
  noRoute: 'ルートが見つかりません',
} as const;
