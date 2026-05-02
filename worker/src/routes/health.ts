import { Hono } from "hono";
import type { Env } from "../index";

export const healthRoute = new Hono<{ Bindings: Env }>();

healthRoute.get("/", async (c) => {
  const d1Result = await c.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();

  let r2Ok = false;

  try {
    await c.env.R2.list({ limit: 1 });
    r2Ok = true;
  } catch {
    r2Ok = false;
  }

  return c.json({
    ok: true,
    d1: d1Result?.ok === 1,
    r2: r2Ok
  });
});
