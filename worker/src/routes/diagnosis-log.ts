// worker/src/routes/diagnosis-log.ts
import { Hono } from "hono";
import type { Env } from "../index";

export const diagnosisLogRoute = new Hono<{ Bindings: Env }>();

diagnosisLogRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body) {
    return c.json({ ok: false, error: "Invalid JSON" }, 400);
  }

  return c.json({
    ok: true,
    message: "diagnosis log endpoint is ready",
    body
  });
});
