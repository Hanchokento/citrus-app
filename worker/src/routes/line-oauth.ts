// worker/src/routes/line-oauth.ts
import { Hono } from "hono";
import type { Env } from "../index";

export const lineOAuthRoute = new Hono<{ Bindings: Env }>();

lineOAuthRoute.get("/callback", async (c) => {
  const code = c.req.query("code");

  if (!code) {
    return c.json({ ok: false, error: "code is required" }, 400);
  }

  return c.json({
    ok: true,
    message: "LINE OAuth callback endpoint is ready",
    code
  });
});
