import type { TasteInput, RankedItem } from "./types";

const WORKER_BASE_URL =
  process.env.NEXT_PUBLIC_WORKER_BASE_URL || "http://localhost:8787";

export async function requestRecommendation(input: TasteInput): Promise<RankedItem[]> {
  const res = await fetch(`${WORKER_BASE_URL}/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    throw new Error("Failed to request recommendation");
  }

  const data = await res.json();

  return data.result;
}
