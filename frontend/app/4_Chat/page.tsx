"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import {
  appendDiagnosisLog,
  requestRecommendation,
} from "@/lib/api";
import {
  analyzeCitrusTurn,
  isWebGpuAvailable,
  prepareLocalCitrusModel,
  type CitrusChatMessage,
} from "@/lib/local-citrus-ai";
import type { RecommendationItem, TasteInput, UserPreferences } from "@/lib/types";

type ModelStatus =
  | "idle"
  | "loading"
  | "ready"
  | "thinking"
  | "error"
  | "unsupported";

const INITIAL_MESSAGES: CitrusChatMessage[] = [
  {
    role: "assistant",
    content:
      "こんにちは！柑橘ソムリエのシトラです🍊 甘さや酸味、香り、ジューシーさなど、今日食べたい柑橘のイメージを気軽に聞かせてください。",
  },
];

const SUGGESTIONS = [
  {
    emoji: "🍯",
    label: "甘くてジューシー",
    message: "甘くてジューシー、酸味は控えめが好き",
  },
  {
    emoji: "🍋",
    label: "さっぱり爽やか",
    message: "酸味と香りが強い、さっぱりしたものが好き",
  },
  {
    emoji: "☁️",
    label: "やわらか食感",
    message: "苦味が少なく、やわらかい食感が好き",
  },
];

const TASTE_KEYS: (keyof TasteInput)[] = [
  "brix",
  "acid",
  "bitterness",
  "aroma",
  "moisture",
  "texture",
];

export default function CitrusChatPage() {
  const router = useRouter();
  const { userId, setUserPreferences, setTopIds } = useApp();
  const [status, setStatus] = useState<ModelStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] =
    useState<CitrusChatMessage[]>(INITIAL_MESSAGES);
  const [preferences, setPreferences] = useState<Partial<TasteInput>>({});
  const [recommendations, setRecommendations] = useState<
    RecommendationItem[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startLocalAi() {
    if (!isWebGpuAvailable()) {
      setStatus("unsupported");
      return;
    }

    setStatus("loading");
    setError("");
    setProgress(0);

    try {
      await prepareLocalCitrusModel((report) => {
        setProgress(Math.max(0, Math.min(100, Math.round(report.progress * 100))));
      });
      setProgress(100);
      setStatus("ready");
    } catch (loadError) {
      console.error(loadError);
      setError(toErrorMessage(loadError));
      setStatus("error");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input);
  }

  async function sendMessage(rawMessage: string) {
    const content = rawMessage.trim();

    if (!content || status !== "ready") {
      return;
    }

    const userMessage: CitrusChatMessage = { role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setStatus("thinking");

    try {
      const analysis = await analyzeCitrusTurn({
        messages: nextMessages,
        currentPreferences: preferences,
        recommendations,
      });
      const nextPreferences = analysis.preferences;
      const enoughPreferences = countPreferences(nextPreferences) >= 3;
      const preferencesChanged = !samePreferences(
        preferences,
        nextPreferences,
      );
      const shouldRecommend =
        enoughPreferences &&
        (recommendations.length === 0 || preferencesChanged);

      setPreferences(nextPreferences);

      if (!shouldRecommend) {
        setMessages([
          ...nextMessages,
          { role: "assistant", content: analysis.reply },
        ]);
        setStatus("ready");
        return;
      }

      const result = await requestRecommendation(nextPreferences);
      setRecommendations(result);

      const reply =
        "あなたへのおすすめをご紹介します。下のボタンから診断結果をご覧ください。";

      const sessionId = crypto.randomUUID();
      const userPreferences: UserPreferences = {
        ...nextPreferences,
        userId,
      };

      setUserPreferences(userPreferences);
      setTopIds(
        result.map((item) => item.id),
        sessionId,
      );
      sessionStorage.setItem("citrus_recommendations", JSON.stringify(result));

      appendDiagnosisLog({
        sessionId,
        userId,
        inputJson: userPreferences,
        result: result.map((item) => ({ id: item.id, rank: item.rank })),
        timestamp: new Date().toISOString(),
      }).catch((logError) => {
        console.warn("Failed to append diagnosis log", logError);
      });

      setMessages([...nextMessages, { role: "assistant", content: reply }]);
      setStatus("ready");
    } catch (chatError) {
      console.error(chatError);
      setError(toErrorMessage(chatError));
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "うまく聞き取れませんでした。短い言葉にして、もう一度教えてください。",
        },
      ]);
      setStatus("ready");
    }
  }

  const isBusy = status === "loading" || status === "thinking";

  return (
    <main className="chatPage">
      <header className="chatHeader">
        <button
          className="backButton"
          type="button"
          onClick={() => router.push("/1_Top")}
        >
          ← 戻る
        </button>

        <div className="chatHeaderTitle">
          <p className="chatEyebrow">あなたの柑橘探しパートナー</p>
          <h1>柑橘ソムリエ シトラ</h1>
          <p>おしゃべりしながら、今日の気分にぴったりの一品を見つけよう。</p>
        </div>

        <div className="chatPrivacyBadge" title="会話は外部サービスに送信されません">
          <span aria-hidden="true">🔒</span>
          ふたりだけの会話
        </div>
      </header>

      <div className="chatLayout">
        <section className="chatMainCard">
          {status === "idle" || status === "loading" || status === "error" ? (
            <div className="chatSetupCard">
              <div className="chatWelcomeVisual" aria-hidden="true">
                <span className="chatWelcomeFruit chatWelcomeFruitLemon">🍋</span>
                <span className="chatWelcomeFruit chatWelcomeFruitLeaf">🌿</span>
                <div className="chatSetupCharacter">
                  <Image
                    src="/other_images/ai-citrus-sommelier.png"
                    alt=""
                    width={132}
                    height={132}
                    priority
                  />
                </div>
                <span className="chatWelcomeHello">お待ちしてました！</span>
              </div>
              <p className="chatSetupLabel">シトラとおしゃべり</p>
              <h2>今日の「好き」を聞かせてください</h2>
              <p className="chatSetupText">
                甘い、すっぱい、香りがいい。うまく言葉にできなくても大丈夫。
                おしゃべりしながら、あなた好みの柑橘を一緒に探します。
              </p>

              <div className="chatMoodChips" aria-hidden="true">
                <span>🍯 甘め</span>
                <span>🍋 さっぱり</span>
                <span>🌸 香り重視</span>
              </div>

              {status === "loading" ? (
                <div className="chatProgress" aria-live="polite">
                  <p className="chatLoadingTitle">
                    <span aria-hidden="true">🍊</span>
                    シトラがお店を開いています…
                  </p>
                  <div
                    className="chatProgressTrack"
                    role="progressbar"
                    aria-label="おしゃべりの準備"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                  >
                    <div
                      className="chatProgressBar"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p>初めてのご来店は少しだけ時間がかかります。もうすぐお話しできます。</p>
                </div>
              ) : (
                <button
                  className="chatStartButton"
                  type="button"
                  onClick={startLocalAi}
                >
                  {status === "error" ? "もう一度会いにいく" : "シトラに会いにいく"} →
                </button>
              )}

              {error ? <p className="chatInlineError">{error}</p> : null}
              <p className="chatSetupNote">あなたのペースで、何度でもおしゃべりできます。</p>
            </div>
          ) : null}

          {status === "unsupported" ? (
            <div className="chatSetupCard">
              <div className="chatSetupEmoji" aria-hidden="true">
                🧭
              </div>
              <h2>シトラを呼び出せませんでした</h2>
              <p className="chatSetupText">
                最新版のChromeまたはEdgeで、もう一度お試しください。いつもの診断はこのまま利用できます。
              </p>
              <button
                className="chatStartButton"
                type="button"
                onClick={() => router.push("/2_Input")}
              >
                通常の診断を使う →
              </button>
            </div>
          ) : null}

          {status === "ready" || status === "thinking" ? (
            <>
              <div className="chatMessages" aria-live="polite">
                {messages.map((message, index) => (
                  <div
                    className={`chatMessageRow chatMessageRow${
                      message.role === "user" ? "User" : "Assistant"
                    }`}
                    key={`${message.role}-${index}`}
                  >
                    {message.role === "assistant" ? (
                      <div className="chatAvatar" aria-hidden="true">
                        <Image
                          src="/other_images/ai-citrus-sommelier.png"
                          alt=""
                          width={36}
                          height={36}
                        />
                      </div>
                    ) : null}
                    <div className={`chatBubble chatBubble${message.role}`}>
                      {message.content}

                      {message.role === "assistant" &&
                      index === messages.length - 1 &&
                      recommendations.length > 0 ? (
                        <button
                          className="chatMessageResultLink"
                          type="button"
                          onClick={() => router.push("/3_Output")}
                        >
                          あなたへのおすすめを見る →
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}

                {status === "thinking" ? (
                  <div className="chatMessageRow chatMessageRowAssistant">
                    <div className="chatAvatar" aria-hidden="true">
                      <Image
                        src="/other_images/ai-citrus-sommelier.png"
                        alt=""
                        width={36}
                        height={36}
                      />
                    </div>
                    <div className="chatBubble chatBubbleassistant chatTyping">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>

              {messages.length === 1 ? (
                <div className="chatSuggestions" aria-label="気分から選ぶ">
                  <p>気になる気分から選んでもOK</p>
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion.label}
                      onClick={() => sendMessage(suggestion.message)}
                    >
                      <span aria-hidden="true">{suggestion.emoji}</span>
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {error ? <p className="chatInlineError chatConversationError">{error}</p> : null}

              <form className="chatComposer" onSubmit={submit}>
                <label className="chatComposerLabel" htmlFor="citrus-chat-input">
                  好みや質問を入力
                </label>
                <div className="chatComposerRow">
                  <textarea
                    id="citrus-chat-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder="例：甘くて、酸味は控えめ。果汁が多いものが好き"
                    rows={2}
                    disabled={isBusy}
                  />
                  <button
                    type="submit"
                    disabled={isBusy || input.trim().length === 0}
                    aria-label="メッセージを送信"
                  >
                    送信
                  </button>
                </div>
                <p>Enterで送信・Shift＋Enterで改行</p>
              </form>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function countPreferences(preferences: Partial<TasteInput>): number {
  return TASTE_KEYS.filter((key) => typeof preferences[key] === "number")
    .length;
}

function samePreferences(
  left: Partial<TasteInput>,
  right: Partial<TasteInput>,
): boolean {
  return TASTE_KEYS.every((key) => left[key] === right[key]);
}

function toErrorMessage(error: unknown): string {
  void error;
  return "準備に少しつまずきました。通信環境を確認して、もう一度お試しください。";
}
