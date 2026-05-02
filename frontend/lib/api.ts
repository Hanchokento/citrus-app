// frontend/lib/api.ts
// Cloudflare Worker との通信を担うAPIクライアント
// frontend はAPI本体を持たず、worker/ のエンドポイントを呼ぶだけにする

import type {
  DiagnosisLogEntry,
  RankedItem,
  TasteInput,
  UserPreferences,
} from "./types";

const WORKER_BASE_URL =
  process.env.NEXT_PUBLIC_WORKER_BASE_URL || "http://localhost:8787";

type WorkerRankedItem = RankedItem & {
  score?: number;
};

type RecommendResponse =
  | {
      ok: true;
      result: WorkerRankedItem[];
    }
  | {
      ok: true;
      topIds: number[];
    };

function normalizeRankedItems(data: RecommendResponse): RankedItem[] {
  if ("result" in data) {
    return data.result.map((item, index) => ({
      id: item.id,
      rank: item.rank ?? index + 1,
    }));
  }

  return data.topIds.map((id, index) => ({
    id,
    rank: index + 1,
  }));
}

export async function requestRecommendation(
  input: TasteInput | UserPreferences
): Promise<RankedItem[]> {
  const res = await fetch(`${WORKER_BASE_URL}/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("Failed to request recommendation");
  }

  const data = (await res.json()) as RecommendResponse;
  return normalizeRankedItems(data);
}

export async function appendDiagnosisLog(
  entry: DiagnosisLogEntry
): Promise<void> {
  const res = await fetch(`${WORKER_BASE_URL}/logs/diagnosis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entry),
  });

  if (!res.ok) {
    throw new Error("Failed to append diagnosis log");
  }
}

export function buildClickLogUrl(
  sessionId: string | null,
  slot: string,
  destination: string
): string {
  if (!sessionId) {
    return destination;
  }

  const params = new URLSearchParams({
    sid: sessionId,
    slot,
    to: destination,
  });

  return `${WORKER_BASE_URL}/click?${params.toString()}`;
}

export function buildAmazonUrl(name: string): string {
  const q = encodeURIComponent(`${name} 柑橘 みかん 生果 -苗 -苗木 -種`);
  return `https://www.amazon.co.jp/s?k=${q}`;
}

export function buildRakutenUrl(name: string): string {
  const q = encodeURIComponent(`${name} 柑橘 みかん 家庭用 贈答`);
  return `https://search.rakuten.co.jp/search/mall/${q}/`;
}

export function buildSatofuruUrl(name: string): string {
  const q = encodeURIComponent(`site:satofull.jp ${name} みかん 柑橘`);
  return `https://www.google.com/search?q=${q}`;
}
