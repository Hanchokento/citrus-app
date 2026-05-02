"use client";
// frontend/app/2_Input/page.tsx

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { appendDiagnosisLog, requestRecommendation } from "@/lib/api";
import type { TasteInput, UserPreferences } from "@/lib/types";

type TasteKey = keyof TasteInput;

const INPUT_ITEMS: {
  key: TasteKey;
  label: string;
  emoji: string;
  lowHint: string;
  highHint: string;
  description: string;
}[] = [
  {
    key: "brix",
    label: "甘さ",
    emoji: "🍯",
    lowHint: "あっさり",
    highHint: "濃厚な甘み",
    description: "果実の甘みの強さ",
  },
  {
    key: "acid",
    label: "酸味",
    emoji: "🍋",
    lowHint: "マイルド",
    highHint: "きりっと酸っぱい",
    description: "さっぱり感や酸っぱさ",
  },
  {
    key: "bitterness",
    label: "苦味",
    emoji: "🌿",
    lowHint: "ほぼなし",
    highHint: "大人の苦味",
    description: "皮や白い部分に由来する苦味",
  },
  {
    key: "aroma",
    label: "香り",
    emoji: "🌸",
    lowHint: "控えめ",
    highHint: "豊かな香り",
    description: "口に入れた時の鼻に抜ける香り",
  },
  {
    key: "moisture",
    label: "ジューシーさ",
    emoji: "💧",
    lowHint: "さっくり",
    highHint: "溢れる果汁",
    description: "果汁の多さ",
  },
  {
    key: "texture",
    label: "食感",
    emoji: "✨",
    lowHint: "とろける",
    highHint: "しっかり弾力",
    description: "ぷちっと感やしっかり感",
  },
];

const HINTS = [
  {
    label: "甘さについて",
    content:
      "甘さが際立つのは、酸味とのバランスが取れている時です。甘さを高めにするなら、酸味は少し低めにすると自然な甘さとして感じやすくなります。",
  },
  {
    label: "苦味について",
    content:
      "苦味は白い繊維や薄皮から感じられます。苦味が苦手な方は1〜2、大人っぽい後味を楽しみたい方は4以上がおすすめです。",
  },
  {
    label: "香りについて",
    content:
      "ここでの香りは、食べた時に鼻に抜ける風味を指します。数字が大きいほど華やかですが、甘さや酸味とのバランスも大切です。",
  },
  {
    label: "ジューシーさについて",
    content:
      "果汁感を強くしたい場合はジューシーさを高めにしてください。甘さや酸味が低すぎると水っぽく感じることがあります。",
  },
  {
    label: "食感について",
    content:
      "ぷちっとした粒感やしっかりした果肉が好きなら高め、口の中でほどける柔らかさが好きなら低めがおすすめです。",
  },
];

export default function InputPage() {
  const router = useRouter();
  const {
    isLoggedIn,
    userId,
    setUserPreferences,
    setTopIds,
  } = useApp();

  const [values, setValues] = useState<Partial<TasteInput>>({});
  const [activeHint, setActiveHint] = useState<number | null>(null);
  const [error, setError] = useState("");

  const selectedCount = useMemo(
    () => INPUT_ITEMS.filter((item) => typeof values[item.key] === "number").length,
    [values]
  );

  const isComplete = selectedCount === INPUT_ITEMS.length;

  function selectValue(key: TasteKey, value: number) {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
    setError("");
  }

  function chooseNeutralForMissing() {
    const next: Partial<TasteInput> = { ...values };

    for (const item of INPUT_ITEMS) {
      if (typeof next[item.key] !== "number") {
        next[item.key] = 3;
      }
    }

    setValues(next);
    setError("");
  }

  async function submit() {
    if (!isComplete) {
      setError("未入力の項目があります。迷う項目は「こだわりなしで埋める」を使っても大丈夫です。");
      return;
    }

    const input = values as TasteInput;

    const prefs: UserPreferences = {
      ...input,
      userId,
    };

    try {
      const recommendations = await requestRecommendation(input);
      const topIds = recommendations.map((item) => item.id);
      const sessionId = crypto.randomUUID();

      setUserPreferences(prefs);
      setTopIds(topIds, sessionId);

      sessionStorage.setItem("citrus_recommendations", JSON.stringify(recommendations));

      appendDiagnosisLog({
        sessionId,
        userId,
        inputJson: prefs,
        result: recommendations.map((item) => ({
          id: item.id,
          rank: item.rank,
        })),
        timestamp: new Date().toISOString(),
      }).catch((logError) => {
        console.warn("Failed to append diagnosis log", logError);
      });

      router.push(isLoggedIn ? "/3_OutputLogin" : "/3_OutputNoLogin");
    } catch (error) {
      console.error(error);
      setError("推薦計算に失敗しました。時間をおいてもう一度お試しください。");
    }
  }

  return (
    <main className="inputPage">
      <header className="inputHeader">
        <button
          className="backButton"
          type="button"
          onClick={() => router.push(isLoggedIn ? "/1_TopLogin" : "/1_Top")}
        >
          ← 戻る
        </button>

        <div>
          <h1 className="inputTitle">🍊 どんな柑橘が好きですか？</h1>
          <p className="inputLead">
            6つの好みを選ぶと、あなたに近い柑橘をおすすめします。
          </p>
        </div>

        <div className="inputProgress">
          {selectedCount}/{INPUT_ITEMS.length}
        </div>
      </header>

      <div className="inputGrid">
        <section className="inputCard">
          <div className="inputCardHeader">
            <div>
              <h2>好みを選ぶ</h2>
              <p>1が弱め、6が強めです。迷う時は3〜4がおすすめです。</p>
            </div>

            <button
              className="neutralButton"
              type="button"
              onClick={chooseNeutralForMissing}
            >
              こだわりなしで埋める
            </button>
          </div>

          <div className="scaleGrid">
            {INPUT_ITEMS.map((item) => (
              <div className="inputItem" key={item.key}>
                <div className="inputItemTop">
                  <div>
                    <div className="inputLabel">
                      <span>{item.emoji}</span>
                      <strong>{item.label}</strong>
                    </div>
                    <p>{item.description}</p>
                  </div>

                  <div className="selectedBadge">
                    {values[item.key] ?? "未選択"}
                  </div>
                </div>

                <div className="scaleHintRow">
                  <span>{item.lowHint}</span>
                  <span>{item.highHint}</span>
                </div>

                <div className="scaleButtons">
                  {[1, 2, 3, 4, 5, 6].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`scaleButton ${
                        values[item.key] === value ? "scaleButtonActive" : ""
                      }`}
                      onClick={() => selectValue(item.key, value)}
                      aria-pressed={values[item.key] === value}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error ? <div className="formError">{error}</div> : null}
        </section>

        <aside className="hintCard">
          <h2>柑橘ソムリエのヒント</h2>
          <p>迷った時は、気になる項目のヒントを開いてください。</p>

          <div className="hintButtons">
            {HINTS.map((hint, index) => (
              <button
                key={hint.label}
                className={`hintButton ${
                  activeHint === index ? "hintButtonActive" : ""
                }`}
                type="button"
                onClick={() => setActiveHint(activeHint === index ? null : index)}
              >
                {hint.label}
              </button>
            ))}
          </div>

          <div className="hintText">
            {activeHint !== null
              ? HINTS[activeHint].content
              : "上のボタンを押すとヒントが表示されます。"}
          </div>

          <div className="currentSelection">
            <h3>現在の選択</h3>
            {INPUT_ITEMS.map((item) => (
              <div className="currentSelectionRow" key={item.key}>
                <span>
                  {item.emoji} {item.label}
                </span>
                <strong>{values[item.key] ?? "—"}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="submitArea">
        <button
          className="primaryButton fullButton"
          type="button"
          onClick={submit}
        >
          {isComplete
            ? "診断する 🍊"
            : `あと ${INPUT_ITEMS.length - selectedCount} 項目を選んでください`}
        </button>
      </div>
    </main>
  );
}
