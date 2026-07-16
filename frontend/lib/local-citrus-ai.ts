import type {
  InitProgressReport,
  MLCEngine,
} from "@mlc-ai/web-llm";
import type { RecommendationItem, TasteInput } from "./types";

export const LOCAL_MODEL_ID = "Qwen3-0.6B-q4f16_1-MLC";
export const LOCAL_MODEL_DOWNLOAD_SIZE = "約352MB";
export const LOCAL_MODEL_MEMORY_SIZE = "約1.4GB";

export type CitrusChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type LocalAiProgress = Pick<InitProgressReport, "progress" | "text">;

export type CitrusTurnAnalysis = {
  reply: string;
  preferences: Partial<TasteInput>;
};

type ProgressListener = (progress: LocalAiProgress) => void;

const TASTE_KEYS: (keyof TasteInput)[] = [
  "brix",
  "acid",
  "bitterness",
  "aroma",
  "moisture",
  "texture",
];

const PREFERENCE_RESPONSE_SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    reply: { type: "string" },
    preferences: {
      type: "object",
      properties: Object.fromEntries(
        TASTE_KEYS.map((key) => [
          key,
          { type: "integer", minimum: 1, maximum: 6 },
        ]),
      ),
      additionalProperties: false,
    },
  },
  required: ["reply", "preferences"],
  additionalProperties: false,
});

let enginePromise: Promise<MLCEngine> | null = null;
const progressListeners = new Set<ProgressListener>();

export function isWebGpuAvailable(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return "gpu" in navigator;
}

export async function prepareLocalCitrusModel(
  onProgress?: ProgressListener,
): Promise<void> {
  if (onProgress) {
    progressListeners.add(onProgress);
  }

  try {
    await getEngine();
  } finally {
    if (onProgress) {
      progressListeners.delete(onProgress);
    }
  }
}

export async function analyzeCitrusTurn({
  messages,
  currentPreferences,
  recommendations,
}: {
  messages: CitrusChatMessage[];
  currentPreferences: Partial<TasteInput>;
  recommendations: RecommendationItem[];
}): Promise<CitrusTurnAnalysis> {
  const engine = await getEngine();
  const resultSummary = recommendations.length
    ? recommendations
        .map(
          (item) =>
            `${item.rank}位 ${item.name}: ${item.description} / 特徴=${JSON.stringify(
              item.features,
            )}`,
        )
        .join("\n")
    : "まだ推薦結果はありません。";

  const completion = await engine.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `あなたは日本語で話す親しみやすい柑橘ソムリエです。
会話から利用者の好みを1〜6の数値で整理してください。
キーは brix=甘さ, acid=酸味, bitterness=苦味, aroma=香り, moisture=ジューシーさ, texture=食感 です。
「強い・多い・甘い」は5〜6、「普通」は3〜4、「弱い・少ない・苦手」は1〜2を目安にします。
明言されていない好みを推測で追加しないでください。現在値は、利用者が変更を伝えない限り保持してください。
確認済みの好みが3項目未満なら、まだ分からない好みを自然に1つだけ質問してください。
推薦結果がある場合、品種については下の推薦結果だけを根拠に回答し、情報がなければ分からないと伝えてください。
返答は簡潔な日本語1〜3文にしてください。

現在の好み: ${JSON.stringify(currentPreferences)}
現在の推薦結果:
${resultSummary}

必ず次のJSON形式だけを返してください:
{"reply":"利用者への返答","preferences":{"brix":1から6}}
preferencesには現在値を含む確認済み項目をすべて入れ、未確認項目は入れないでください。`,
      },
      ...messages.slice(-8),
    ],
    response_format: {
      type: "json_object",
      schema: PREFERENCE_RESPONSE_SCHEMA,
    },
    temperature: 0.2,
    top_p: 0.85,
    max_tokens: 220,
    extra_body: { enable_thinking: false },
  });

  const content = completion.choices[0]?.message.content;

  if (!content) {
    throw new Error("ローカルLLMから応答を取得できませんでした。");
  }

  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user")?.content;
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant")?.content;

  return parseTurnAnalysis(
    content,
    currentPreferences,
    latestUserMessage ?? "",
    latestAssistantMessage ?? "",
  );
}

export async function writeGroundedRecommendation({
  messages,
  preferences,
  recommendations,
}: {
  messages: CitrusChatMessage[];
  preferences: Partial<TasteInput>;
  recommendations: RecommendationItem[];
}): Promise<string> {
  const engine = await getEngine();
  const candidates = recommendations
    .map(
      (item) =>
        `${item.rank}位 ${item.name}\n説明: ${item.description}\n特徴: ${JSON.stringify(
          item.features,
        )}`,
    )
    .join("\n\n");

  const completion = await engine.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `あなたは日本語で話す柑橘ソムリエです。
以下の計算済み候補だけを使い、利用者の好みに合う理由を説明してください。
候補以外の品種や、データにない産地・旬・効能は作らないでください。
1位を中心に、2位と3位との違いも短く添えてください。
見出しや箇条書きを使わず、親しみやすい日本語で3〜5文、220文字程度にしてください。

利用者の好み: ${JSON.stringify(preferences)}
計算済み候補:
${candidates}`,
      },
      ...messages.slice(-6),
      {
        role: "user",
        content: "この結果を、私の好みと結び付けておすすめしてください。",
      },
    ],
    temperature: 0.45,
    top_p: 0.9,
    max_tokens: 260,
    extra_body: { enable_thinking: false },
  });

  const content = sanitizeModelText(
    completion.choices[0]?.message.content ?? "",
  );

  const mentionsEveryCandidate = recommendations.every((item) =>
    content.includes(item.name),
  );

  if (
    !content ||
    content.length > 500 ||
    containsUnnaturalLatinText(content) ||
    !mentionsEveryCandidate
  ) {
    return buildFallbackRecommendation(recommendations);
  }

  return content;
}

export function buildFallbackRecommendation(
  recommendations: RecommendationItem[],
): string {
  const [first, second, third] = recommendations;

  if (!first) {
    return "好みをもう少し教えてください。ぴったりの柑橘を一緒に探しましょう。";
  }

  const others = [second, third]
    .filter((item): item is RecommendationItem => Boolean(item))
    .map((item) => `${item.rank}位は「${item.name}」`)
    .join("、");

  return `今の好みに最も近いのは「${first.name}」です。${first.description}${
    others ? ` ほかには、${others}が候補です。` : ""
  }`;
}

async function getEngine(): Promise<MLCEngine> {
  if (!isWebGpuAvailable()) {
    throw new Error(
      "このブラウザではWebGPUを利用できません。最新版のChromeまたはEdgeでお試しください。",
    );
  }

  if (!enginePromise) {
    enginePromise = import("@mlc-ai/web-llm")
      .then(({ CreateMLCEngine }) =>
        CreateMLCEngine(LOCAL_MODEL_ID, {
          initProgressCallback: (report) => {
            for (const listener of progressListeners) {
              listener({ progress: report.progress, text: report.text });
            }
          },
          logLevel: "WARN",
        }),
      )
      .catch((error) => {
        enginePromise = null;
        throw error;
      });
  }

  return enginePromise;
}

function parseTurnAnalysis(
  content: string,
  currentPreferences: Partial<TasteInput>,
  latestUserMessage: string,
  latestAssistantMessage: string,
): CitrusTurnAnalysis {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : null;
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("ローカルLLMの応答形式を読み取れませんでした。");
  }

  const record = parsed as Record<string, unknown>;
  const rawPreferences =
    record.preferences && typeof record.preferences === "object"
      ? (record.preferences as Record<string, unknown>)
      : {};
  const preferences: Partial<TasteInput> = { ...currentPreferences };
  const mentionedKeys = findMentionedTasteKeys(latestUserMessage);

  if (mentionedKeys.size === 0) {
    const contextualKey = findFirstMentionedTasteKey(latestAssistantMessage);

    if (contextualKey) {
      mentionedKeys.add(contextualKey);
    }
  }

  for (const key of TASTE_KEYS) {
    const value = rawPreferences[key];

    if (
      mentionedKeys.has(key) &&
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 1 &&
      value <= 6
    ) {
      preferences[key] = Math.round(value);
    }
  }

  Object.assign(preferences, inferExplicitTasteValues(latestUserMessage));

  const modelReply =
    typeof record.reply === "string" && record.reply.trim()
      ? sanitizeModelText(record.reply)
      : "";
  const reply =
    modelReply && !containsUnnaturalLatinText(modelReply)
      ? modelReply
      : buildFallbackQuestion(preferences);

  return { reply, preferences };
}

function findMentionedTasteKeys(message: string): Set<keyof TasteInput> {
  const keys = new Set<keyof TasteInput>();

  if (/甘|糖度/.test(message)) keys.add("brix");
  if (/酸味|酸っぱ|すっぱ/.test(message)) keys.add("acid");
  if (/苦味|苦み|苦い/.test(message)) keys.add("bitterness");
  if (/香り|芳香/.test(message)) keys.add("aroma");
  if (/ジューシ|果汁|みずみずし/.test(message)) keys.add("moisture");
  if (/食感|やわら|柔ら|ぷち|弾力|しゃき|シャキ|さく|サク/.test(message)) {
    keys.add("texture");
  }

  return keys;
}

function findFirstMentionedTasteKey(
  message: string,
): keyof TasteInput | null {
  const keys = findMentionedTasteKeys(message);

  for (const key of TASTE_KEYS) {
    if (keys.has(key)) return key;
  }

  return null;
}

function inferExplicitTasteValues(
  message: string,
): Partial<TasteInput> {
  const values: Partial<TasteInput> = {};
  const mentionedKeys = findMentionedTasteKeys(message);
  const clauses = message
    .split(/[、,。.!！?？]/)
    .map((clause) => clause.trim())
    .filter(Boolean);
  const clauseFor = (pattern: RegExp) =>
    clauses.find((clause) => pattern.test(clause)) ?? message;
  const brixClause = clauseFor(/甘|糖度/);
  const acidClause = clauseFor(/酸味|酸っぱ|すっぱ/);
  const bitternessClause = clauseFor(/苦味|苦み|苦い/);
  const aromaClause = clauseFor(/香り|芳香/);
  const moistureClause = clauseFor(/ジューシ|果汁|みずみずし/);
  const textureClause = clauseFor(
    /食感|やわら|柔ら|ぷち|弾力|しゃき|シャキ|さく|サク/,
  );

  if (mentionedKeys.has("brix")) {
    values.brix = /甘くない|甘さ.{0,5}(控えめ|少な|弱)|甘すぎない/.test(
      brixClause,
    )
      ? 2
      : /甘(い|め|く|さが強|みが強)|濃厚な甘|とても甘|かなり甘/.test(
            brixClause,
          )
        ? 5
        : 4;
  }

  if (mentionedKeys.has("acid")) {
    values.acid =
      /酸味.{0,6}(控えめ|少な|弱|苦手|なし)|酸っぱくない|すっぱくない/.test(
        acidClause,
      )
        ? 2
        : /酸味.{0,5}(強|多)|酸っぱい|すっぱい|きりっと/.test(
              acidClause,
            )
          ? 5
          : 4;
  }

  if (mentionedKeys.has("bitterness")) {
    values.bitterness =
      /苦味.{0,6}(控えめ|少な|弱|苦手|なし)|苦くない/.test(
        bitternessClause,
      )
        ? 1
        : /苦味.{0,5}(強|多)|苦い/.test(bitternessClause)
          ? 5
          : 3;
  }

  if (mentionedKeys.has("aroma")) {
    values.aroma = /香り.{0,6}(控えめ|少な|弱|なし)/.test(aromaClause)
      ? 2
      : /香り.{0,5}(強|豊か|華やか)|芳香/.test(aromaClause)
        ? 5
        : 4;
  }

  if (mentionedKeys.has("moisture")) {
    values.moisture =
      /ジューシ.{0,6}(控えめ|少な|弱)|果汁.{0,5}(少な|控えめ)/.test(
        moistureClause,
      )
        ? 2
        : 5;
  }

  if (mentionedKeys.has("texture")) {
    values.texture = /やわら|柔ら|とろけ/.test(textureClause)
      ? 2
      : /弾力|しっかり|ぷち|しゃき|シャキ|さく|サク/.test(
            textureClause,
          )
        ? 5
        : 4;
  }

  return values;
}

function sanitizeModelText(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>|<\/think>/gi, "")
    .replace(/\*\*|__/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .trim();
}

function containsUnnaturalLatinText(text: string): boolean {
  return /[A-Za-z]{3,}/.test(text);
}

function buildFallbackQuestion(preferences: Partial<TasteInput>): string {
  const missingLabel = TASTE_KEYS.find(
    (key) => typeof preferences[key] !== "number",
  );
  const labels: Record<keyof TasteInput, string> = {
    brix: "甘さ",
    acid: "酸味",
    bitterness: "苦味",
    aroma: "香り",
    moisture: "ジューシーさ",
    texture: "食感",
  };

  if (missingLabel) {
    return `ありがとうございます。${labels[missingLabel]}の好みも教えてください。`;
  }

  return "ありがとうございます。今の好みをもとに柑橘を選びます。";
}
