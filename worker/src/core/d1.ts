// worker/src/core/d1.ts
export async function healthCheckD1(db: D1Database): Promise<boolean> {
  const result = await db.prepare("SELECT 1 AS ok").first<{ ok: number }>();
  return result?.ok === 1;
}
