// worker/src/index.ts
import { Hono } from "hono";
import { recommendRoute } from "./routes/recommend";
import { diagnosisLogRoute } from "./routes/diagnosis-log";
import { clickLogRoute } from "./routes/click-log";
import { lineOAuthRoute } from "./routes/line-oauth";
import { healthRoute } from "./routes/health";

export type Env = {
  DB: D1Database;
  R2: R2Bucket;
  LINE_CHANNEL_ID?: string;
  LINE_CHANNEL_SECRET?: string;
  LINE_REDIRECT_URI?: string;
};

const app = new Hono<{ Bindings: Env }>();

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
app.route("/auth/line", lineOAuthRoute);

export default app;
