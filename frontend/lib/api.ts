// frontend/lib/api.ts
// Cloudflare Worker との通信を担うAPIクライアント

import type {
  DiagnosisLogEntry,
  RecommendationItem,
  TasteInput,
  UserPreferences,
} from "./types";

const WORKER_BASE_URL =
  process.env.NEXT_PUBLIC_WORKER_BASE_URL ||
  "https://citrus-app-ts.hmkt0520.workers.dev";

type WorkerRecommendationItem = {
  id: number;
  rank: number;
  score?: number;
  name?: string;
  description?: string;
  imageUrl?: string;
  features?: TasteInput;
};

type RecommendResponse =
  | {
      ok: true;
      source?: unknown;
      result: WorkerRecommendationItem[];
    }
  | {
      ok: false;
      error: string;
    };

export async function requestRecommendation(
  input: TasteInput | UserPreferences
): Promise<RecommendationItem[]> {
  const res = await fetch(`${WORKER_BASE_URL}/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(`Failed to request recommendation: ${res.status} ${message}`);
  }

  const data = (await res.json()) as RecommendResponse;

  if (!data.ok) {
    throw new Error(data.error);
  }

  return data.result.map((item) => {
    const name = item.name ?? `柑橘ID ${item.id}`;

    return {
      id: item.id,
      rank: item.rank,
      name,
      description:
        item.description ||
        "この柑橘の説明文は現在準備中です。",
      imageUrl:
        item.imageUrl ||
        "/other_images/no_image.png",
      features: item.features ?? input,
      amazonUrl: buildAmazonUrl(name),
      rakutenUrl: buildRakutenUrl(name),
      satofuruUrl: buildSatofuruUrl(name),
    };
  });
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
    const message = await res.text().catch(() => "");
    throw new Error(`Failed to append diagnosis log: ${res.status} ${message}`);
  }
}

export function buildClickLogUrl(
  sessionId: string | null,
  slot: string,
  destination: string,
  userId?: string | null
): string {
  if (!sessionId) {
    return destination;
  }

  const params = new URLSearchParams({
    sid: sessionId,
    slot,
    to: destination,
  });

  if (userId) {
    params.set("user_id", userId);
  }

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
