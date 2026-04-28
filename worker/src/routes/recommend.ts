import { Hono } from "hono";
import type { Env } from "../index";

export const recommendRoute = new Hono<{ Bindings: Env }>();

recommendRoute.post("/", async (c) => {
  const input = await c.req.json().catch(() => null);

  if (!input) {
    return c.json({ ok: false, error: "Invalid JSON" }, 400);
  }

  return c.json({
    ok: true,
    message: "recommend endpoint is ready",
    input,
    result: [
      { id: 1, rank: 1 },
      { id: 2, rank: 2 },
      { id: 3, rank: 3 }
    ]
  });
});
