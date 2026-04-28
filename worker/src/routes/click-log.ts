import { Hono } from "hono";
import type { Env } from "../index";

export const clickLogRoute = new Hono<{ Bindings: Env }>();

clickLogRoute.get("/", async (c) => {
  const slot = c.req.query("slot");
  const to = c.req.query("to");

  if (!slot || !to) {
    return c.json({ ok: false, error: "slot and to are required" }, 400);
  }

  return c.redirect(to);
});
