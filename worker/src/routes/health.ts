import { Hono } from "hono";
import type { Env } from "../index";

export const healthRoute = new Hono<{ Bindings: Env }>();

healthRoute.get("/", async (c) => {
  const d1Result = await c.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();

  const features = await c.env.R2.head("citrus_features.csv");
  const details = await c.env.R2.head("citrus_details_list.xlsx");

  return c.json({
    ok: true,
    d1: d1Result?.ok === 1,
    r2: true,
    files: {
      citrus_features_csv: Boolean(features),
      citrus_details_list_xlsx: Boolean(details)
    }
  });
});
