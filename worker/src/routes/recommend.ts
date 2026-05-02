// worker/src/routes/recommend.ts

import { Hono } from "hono";
import type { Env } from "../index";
import * as XLSX from "xlsx";

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
  name: string;
};

type CitrusDetail = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
};

type RecommendationResult = {
  id: number;
  rank: number;
  score: number;
  name: string;
  description: string;
  imageUrl: string;
  features: TasteInput;
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

  const featuresObject = await c.env.R2.get("citrus_features.csv");

  if (!featuresObject) {
    return c.json(
      {
        ok: false,
        error: "citrus_features.csv not found in R2",
      },
      500
    );
  }

  const featuresText = await featuresObject.text();
  const features = parseCitrusFeaturesCsv(featuresText);

  if (features.length === 0) {
    return c.json(
      {
        ok: false,
        error: "No valid citrus feature rows found",
      },
      500
    );
  }

  const details = await loadDetailsFromR2(c.env.R2);
  const detailMap = new Map(details.map((detail) => [detail.id, detail]));

  const result = calculateTop3(input, features, detailMap);

  return c.json({
    ok: true,
    source: {
      features: "r2:citrus_features.csv",
      details: "r2:citrus_details_list.xlsx",
    },
    result,
  });
});

function isValidTasteInput(value: Partial<TasteInput>): value is TasteInput {
  return FEATURE_KEYS.every((key) => {
    const v = value[key];
    return typeof v === "number" && Number.isFinite(v);
  });
}

function calculateTop3(
  input: TasteInput,
  features: CitrusFeature[],
  detailMap: Map<number, CitrusDetail>
): RecommendationResult[] {
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
        item,
        score,
      };
    })
    .sort((a, b) => b.score - a.score || a.item.id - b.item.id)
    .slice(0, 3)
    .map(({ item, score }, index) => {
      const detail = detailMap.get(item.id);
      const name = detail?.name || item.name || `柑橘ID ${item.id}`;

      return {
        id: item.id,
        rank: index + 1,
        score: Number(score.toFixed(4)),
        name,
        description:
          detail?.description ||
          "この柑橘の説明文は現在準備中です。",
        imageUrl:
          detail?.imageUrl ||
          buildCitrusImagePath(item.id),
        features: {
          brix: item.brix,
          acid: item.acid,
          bitterness: item.bitterness,
          aroma: item.aroma,
          moisture: item.moisture,
          texture: item.texture,
        },
      };
    });
}

async function loadDetailsFromR2(r2: R2Bucket): Promise<CitrusDetail[]> {
  const object = await r2.get("citrus_details_list.xlsx");

  if (!object) {
    return [];
  }

  const buffer = await object.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet =
    workbook.Sheets["description_image"] ??
    workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return rows
    .map(parseDetailRow)
    .filter((detail): detail is CitrusDetail => detail !== null);
}

function parseDetailRow(row: Record<string, unknown>): CitrusDetail | null {
  const id = toNumberFromUnknown(
    getCell(row, "Item_ID", "id", "品種id", "品種ID", "番号")
  );

  if (id === null) {
    return null;
  }

  const name =
    toStringFromUnknown(getCell(row, "Item_name", "name", "品種名")) ||
    `柑橘ID ${id}`;

  const description =
    toStringFromUnknown(getCell(row, "Description", "description", "説明")) ||
    "";

  const imageUrl =
    toStringFromUnknown(
      getCell(row, "Image_URL", "image_url", "Image", "image", "画像")
    ) || buildCitrusImagePath(id);

  return {
    id,
    name,
    description,
    imageUrl,
  };
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
    name: name?.trim() || `柑橘ID ${id}`,
    brix,
    acid,
    bitterness,
    aroma,
    moisture,
    texture,
  };
}

function getCell(row: Record<string, unknown>, ...keys: string[]): unknown {
  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
  );

  for (const key of keys) {
    const value = normalized.get(normalizeHeader(key));
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return undefined;
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

function toNumberFromUnknown(value: unknown): number | null {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const parsed = Number(String(value).trim());

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function toStringFromUnknown(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function normalizeHeader(value: string): string {
  return value.trim().replace(/^\uFEFF/, "").toLowerCase();
}

function buildCitrusImagePath(id: number): string {
  return `/citrus_images/citrus_${id}.JPG`;
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
