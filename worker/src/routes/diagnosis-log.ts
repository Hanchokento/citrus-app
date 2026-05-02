// worker/src/routes/diagnosis-log.ts

import { Hono } from "hono";
import type { Env } from "../index";

type RankedItem = {
  id: number;
  rank: number;
};

type DiagnosisLogRequest = {
  sessionId?: string;
  session_id?: string;
  userId?: string | null;
  user_id?: string | null;
  inputJson?: unknown;
  input_json?: unknown;
  result?: RankedItem[];
  resultJson?: unknown;
  result_json?: unknown;
  timestamp?: string;
  ts?: string;
};

export const diagnosisLogRoute = new Hono<{ Bindings: Env }>();

diagnosisLogRoute.post("/", async (c) => {
  let body: DiagnosisLogRequest;

  try {
    body = await c.req.json<DiagnosisLogRequest>();
  } catch {
    return c.json({ ok: false, error: "bad request" }, 400);
  }

  const sessionId = body.sessionId ?? body.session_id ?? null;
  const userId = body.userId ?? body.user_id ?? null;
  const inputJson = body.inputJson ?? body.input_json ?? null;
  const resultJson = body.resultJson ?? body.result_json ?? body.result ?? null;

  if (!sessionId || !inputJson || !resultJson) {
    return c.json(
      {
        ok: false,
        error: "missing required fields",
        required: ["sessionId", "inputJson", "result"],
      },
      400
    );
  }

  const inputJsonText =
    typeof inputJson === "string" ? inputJson : JSON.stringify(inputJson);

  const resultJsonText =
    typeof resultJson === "string" ? resultJson : JSON.stringify(resultJson);

  const result = await c.env.DB.prepare(
    `
    INSERT INTO user_logs (
      session_id,
      user_id,
      input_json,
      result_json
    )
    VALUES (?, ?, ?, ?)
    `
  )
    .bind(sessionId, userId, inputJsonText, resultJsonText)
    .run();

  return c.json({
    ok: true,
    session_id: sessionId,
    user_id: userId,
    changes: result.meta?.changes ?? null,
    last_row_id: result.meta?.last_row_id ?? null,
  });
});
