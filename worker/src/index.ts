// worker/src/index.ts

import { Hono } from "hono";
import { cors } from "hono/cors";
import { recommendRoute } from "./routes/recommend";
import { diagnosisLogRoute } from "./routes/diagnosis-log";
import { clickLogRoute } from "./routes/click-log";
import { healthRoute } from "./routes/health";

export type Env = {
  DB: D1Database;
  R2: R2Bucket;
};

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  })
);

app.get("/", (c) => {
  return c.json({
    ok: true,
    service: "citrus-app-api",
  });
});

app.route("/health", healthRoute);
app.route("/recommend", recommendRoute);
app.route("/logs/diagnosis", diagnosisLogRoute);
app.route("/click", clickLogRoute);

export default app;
