import { Hono } from "hono";
import type { Env } from "../index";

type CitrusSummary = {
  id: number;
  name: string;
};

export const citrusRoute = new Hono<{ Bindings: Env }>();

citrusRoute.get("/", async (c) => {
  const idsParam = c.req.query("ids") ?? "";
  const ids = [
    ...new Set(
      idsParam
        .split(",")
        .map((value) => toNumber(value))
        .filter((value): value is number => value !== null)
    ),
  ];

  if (ids.length === 0) {
    return c.json({ ok: true, items: [] });
  }

  const summaries = await loadCitrusSummariesFromR2(c.env.R2);

  if (summaries === null) {
    return c.json(
      {
        ok: false,
        error: "citrus_features.csv not found in R2",
      },
      500
    );
  }

  const summaryMap = new Map(summaries.map((summary) => [summary.id, summary]));

  const items = ids.map((id) => {
    const summary = summaryMap.get(id);

    return {
      id,
      name: summary?.name || `柑橘ID ${id}`,
      description: "",
      imageUrl: buildCitrusImagePath(id),
    };
  });

  return c.json({
    ok: true,
    items,
  });
});

async function loadCitrusSummariesFromR2(
  r2: R2Bucket
): Promise<CitrusSummary[] | null> {
  const object = await r2.get("citrus_features.csv");

  if (!object) {
    return null;
  }

  const csvText = await object.text();
  const rows = parseCsv(csvText);

  if (rows.length <= 1) {
    return [];
  }

  const headers = rows[0].map((header) => normalizeHeader(header));

  return rows
    .slice(1)
    .map((row) => parseSummaryRow(headers, row))
    .filter((summary): summary is CitrusSummary => summary !== null);
}

function parseSummaryRow(headers: string[], row: string[]): CitrusSummary | null {
  const get = (...names: string[]): string | undefined => {
    for (const name of names) {
      const index = headers.indexOf(normalizeHeader(name));
      if (index >= 0) {
        return row[index];
      }
    }

    return undefined;
  };

  const id = toNumber(get("Item_ID", "id", "item_id", "品種id", "品種ID", "番号"));

  if (id === null) {
    return null;
  }

  const name =
    get("Item_name", "name", "item_name", "品種名", "citrus_name")?.trim() ||
    `柑橘ID ${id}`;

  return {
    id,
    name,
  };
}

function normalizeHeader(value: string): string {
  return value.trim().replace(/^\uFEFF/, "").toLowerCase();
}

function toNumber(value: string | undefined): number | null {
  if (value == null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value.trim());

  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
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

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
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
        index += 1;
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
