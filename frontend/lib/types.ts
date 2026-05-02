// frontend/lib/types.ts
// フロントエンド全体で使う型定義
// UI、状態管理、Worker APIとの通信に使う

// 6軸の嗜好入力
export type TasteInput = {
  brix: number;        // 甘さ
  acid: number;        // 酸味
  bitterness: number;  // 苦味
  aroma: number;       // 香り
  moisture: number;    // ジューシーさ
  texture: number;     // 食感
};

// ユーザー情報つきの嗜好入力
export type UserPreferences = TasteInput & {
  userId?: string | null;
};

// 柑橘特徴量
// R2上の citrus_features.csv をWorker側で読んだ後、
// フロントに返す場合の型
export type CitrusFeatures = TasteInput & {
  id: number;
  name: string;
  season?: string;
};

// 柑橘詳細
// R2上の citrus_details_list.xlsx をWorker側で読んだ後、
// フロントに返す場合の型
export type CitrusDetails = {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
};

// 推薦結果の基本形
export type RankedItem = {
  id: number;
  rank: number;
};

// スコアつき推薦結果
export type ScoredCitrus = RankedItem & {
  score: number;
};

// 結果画面で表示するために結合されたアイテム
export type RecommendationItem = {
  id: number;
  rank: number;
  name: string;
  description: string;
  imageUrl: string;
  features: TasteInput;
  amazonUrl?: string;
  rakutenUrl?: string;
  satofuruUrl?: string;
};

// 診断ログ1行分
// frontendからWorkerの /logs/diagnosis に送る想定
export type DiagnosisLogEntry = {
  sessionId: string;
  userId?: string | null;
  inputJson: UserPreferences;
  result: RankedItem[];
  timestamp: string;
};

// 認証ユーザー情報
export type UserInfo = {
  isLoggedIn: boolean;
  userId: string | null;
  userName: string | null;
  userPicture: string | null;
  authProvider: string | null;
};

// AppProviderが保持する状態
// Streamlit版の st.session_state 相当
export type AppState = UserInfo & {
  userPreferences: UserPreferences | null;
  topIds: number[];
  sessionId: string | null;
};
