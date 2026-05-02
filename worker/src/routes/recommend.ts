// worker/src/routes/recommend.ts

import { Hono } from "hono";
import type { Env } from "../index";

type TasteInput = {
  brix: number;
  acid: number;
  bitterness: number;
  aroma: number;
  moisture: number;
  texture: number;
};

type CitrusFeature = TasteInput & {
  id: number;
  name?: string;
};

type ScoredResult = {
  id: number;
  rank: number;
  score: number;
};

const FEATURE_KEYS: (keyof TasteInput)[] = [
  "brix",
  "acid",
  "bitterness",
  "aroma",
  "moisture",
  "texture",
];

export const recommendRoute = new Hono<{ Bindings: Env }>();

recommendRoute.post("/", async (c) => {
  const input = await c.req.json<TasteInput>().catch(() => null);

  if (!input || !isValidTasteInput(input)) {
    return c.json(
      {
        ok: false,
        error: "Invalid taste input",
      },
      400
    );
  }

  const object = await c.env.R2.get("citrus_features.csv");

  if (!object) {
    return c.json(
      {
        ok: false,
        error: "citrus_features.csv not found in R2",
      },
      500
    );
  }

  const csvText = await object.text();
  const features = parseCitrusFeaturesCsv(csvText);

  if (features.length === 0) {
    return c.json(
      {
        ok: false,
        error: "No valid citrus feature rows found",
      },
      500
    );
  }

  const result = calculateTop3(input, features);

  return c.json({
    ok: true,
    source: "r2:citrus_features.csv",
    result,
  });
});

function isValidTasteInput(value: Partial<TasteInput>): value is TasteInput {
  return FEATURE_KEYS.every((key) => {
    const v = value[key];
    return typeof v === "number" && Number.isFinite(v);
  });
}

function calculateTop3(input: TasteInput, features: CitrusFeature[]): ScoredResult[] {
  const maxDist = Math.sqrt(FEATURE_KEYS.length * 25);

  return features
    .map((item) => {
      const dist = Math.sqrt(
        FEATURE_KEYS.reduce((sum, key) => {
          const diff = input[key] - item[key];
          return sum + diff * diff;
        }, 0)
      );

      const score = Math.max(0, Math.min(1, 1 - dist / maxDist));

      return {
        id: item.id,
        score,
        dist,
      };
    })
    .sort((a, b) => b.score - a.score || a.id - b.id)
    .slice(0, 3)
    .map((item, index) => ({
      id: item.id,
      rank: index + 1,
      score: Number(item.score.toFixed(4)),
    }));
}

function parseCitrusFeaturesCsv(csvText: string): CitrusFeature[] {
  const rows = parseCsv(csvText);

  if (rows.length <= 1) {
    return [];
  }

  const headers = rows[0].map((header) => normalizeHeader(header));
  const dataRows = rows.slice(1);

  return dataRows
    .map((row) => parseFeatureRow(headers, row))
    .filter((item): item is CitrusFeature => item !== null);
}

function parseFeatureRow(headers: string[], row: string[]): CitrusFeature | null {
  const get = (...names: string[]): string | undefined => {
    for (const name of names) {
      const index = headers.indexOf(normalizeHeader(name));
      if (index >= 0) {
        return row[index];
      }
    }

    return undefined;
  };

  const id = toNumber(get("id", "item_id", "品種id", "品種ID", "番号"));
  const brix = toNumber(get("brix", "sweetness", "甘さ", "糖度"));
  const acid = toNumber(get("acid", "sourness", "酸味"));
  const bitterness = toNumber(get("bitterness", "bitter", "苦味"));
  const aroma = toNumber(get("aroma", "smell", "香り"));
  const moisture = toNumber(get("moisture", "juicy", "ジューシーさ", "果汁"));
  const texture = toNumber(get("texture", "elastic", "食感", "弾力"));
  const name = get("name", "item_name", "品種名", "citrus_name");

  if (
    id === null ||
    brix === null ||
    acid === null ||
    bitterness === null ||
    aroma === null ||
    moisture === null ||
    texture === null
  ) {
    return null;
  }

  return {
    id,
    name,
    brix,
    acid,
    bitterness,
    aroma,
    moisture,
    texture,
  };
}

function toNumber(value: string | undefined): number | null {
  if (value == null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value.trim());

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function normalizeHeader(value: string): string {
  return value.trim().replace(/^\uFEFF/, "").toLowerCase();
}

function parseCsv(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }

      row.push(field);
      field = "";

      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    field += char;
  }

  row.push(field);

  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function detectDelimiter(text: string): "," | "\t" {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const tabCount = (firstLine.match(/\t/g) ?? []).length;
  const commaCount = (firstLine.match(/,/g) ?? []).length;

  return tabCount > commaCount ? "\t" : ",";
}
