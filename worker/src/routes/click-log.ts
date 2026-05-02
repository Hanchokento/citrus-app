// worker/src/routes/click-log.ts

import { Hono } from "hono";
import type { Env } from "../index";

const ALLOWED_SLOTS = new Set([
  "1_a",
  "1_r",
  "1_s",
  "2_a",
  "2_r",
  "2_s",
  "3_a",
  "3_r",
  "3_s",
]);

export const clickLogRoute = new Hono<{ Bindings: Env }>();

clickLogRoute.get("/", async (c) => {
  const url = new URL(c.req.url);

  const sessionId =
    url.searchParams.get("sid") ?? url.searchParams.get("session_id");

  const userId = url.searchParams.get("user_id");
  const slot = url.searchParams.get("slot");
  const to = url.searchParams.get("to") ?? url.searchParams.get("dest");

  if (!sessionId || !slot || !to) {
    return c.text("missing params", 400);
  }

  if (!ALLOWED_SLOTS.has(slot)) {
    return c.text("invalid slot", 400);
  }

  try {
    const sql = userId
      ? `UPDATE user_logs SET "${slot}" = 1, updated_at = CURRENT_TIMESTAMP WHERE session_id = ? AND user_id = ?`
      : `UPDATE user_logs SET "${slot}" = 1, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`;

    const stmt = c.env.DB.prepare(sql);
    const result = userId
      ? await stmt.bind(sessionId, userId).run()
      : await stmt.bind(sessionId).run();

    if ((result.meta?.changes ?? 0) === 0) {
      console.warn("click log update affected no rows", {
        sessionId,
        userId,
        slot,
        to,
      });
    }

    return c.redirect(to, 302);
  } catch (error) {
    console.error(error);
    return c.text("click log error", 500);
  }
});
