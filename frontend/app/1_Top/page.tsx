"use client";
// frontend/app/1_Top/page.tsx

import { useRouter } from "next/navigation";
import { CitrusImage } from "@/components/CitrusImage";
import TasteRadarChart from "@/components/TasteRadarChart";
import type { TasteInput } from "@/lib/types";

const SAMPLE_FEATURES: TasteInput = {
  brix: 4,
  acid: 5,
  bitterness: 2,
  aroma: 4,
  moisture: 3,
  texture: 4,
};

const SAMPLE_RESULT = {
  id: 14,
  rank: 1,
  name: "日向夏",
  description:
    "爽やかな酸味とやさしい甘さが特徴。さっぱりとした後味が心地よい柑橘です。",
  features: SAMPLE_FEATURES,
};

const STEPS = [
  {
    number: "01",
    emoji: "✏️",
    title: "好みを選ぶ",
    description:
      "甘さ・酸味・香りなど、6つの項目を1〜6のボタンで直感的に選びます。",
  },
  {
    number: "02",
    emoji: "🍊",
    title: "おすすめを見る",
    description:
      "入力した好みに近い柑橘をランキング形式で上位3品種まで紹介します。",
  },
  {
    number: "03",
    emoji: "🛒",
    title: "気になる柑橘を探す",
    description:
      "Amazon・楽天・ふるさと納税サイトでそのまま探せます。",
  },
];

const FEATURES = [
  {
    emoji: "🎯",
    title: "6つの好みから推薦",
    description:
      "甘さ・酸味・苦味・香り・ジューシーさ・食感をもとに、あなたにぴったりの品種を探します。",
  },
  {
    emoji: "📊",
    title: "見た目で分かる特徴",
    description:
      "レーダーチャートで柑橘の特徴を一目で把握。自分の好みとの比較も簡単です。",
  },
  {
    emoji: "🔍",
    title: "購入先もすぐ探せる",
    description:
      "気になった柑橘はAmazon・楽天・ふるさと納税サイトでそのまま探せます。",
  },
];

export default function TopPage() {
  const router = useRouter();

  return (
    <main className="topLanding">
      <div className="topOrb topOrb1" aria-hidden="true" />
      <div className="topOrb topOrb2" aria-hidden="true" />
      <div className="topOrb topOrb3" aria-hidden="true" />

      <section className="topHero">
        <div className="topHeroInner">
          <div className="topHeroContent">
            <div className="topHeroBadge">🍊 柑橘おすすめ診断</div>

            <h1 className="topHeroTitle">
              あなたにぴったりの<br />
              <span className="topHeroAccent">柑橘</span>を見つけよう
            </h1>

            <p className="topHeroLead">
              甘さ・酸味・香りなど、好みを選ぶだけで
              <br className="topBreakSm" />
              あなたにぴったりの品種をおすすめします。
            </p>

            <div className="topHeroActions">
              <button
                className="topCtaButton"
                type="button"
                onClick={() => router.push("/2_Input")}
              >
                さっそく診断してみる →
              </button>

              <p className="topHeroNote">無料・アカウント不要</p>
            </div>
          </div>

          <div className="topHeroVisual" aria-hidden="true">
            <div className="topHeroOrb">
              <span className="topEmojiFloat topEmojiFloat1">🍊</span>
              <span className="topEmojiFloat topEmojiFloat2">🍋</span>
              <span className="topEmojiFloat topEmojiFloat3">🍈</span>
              <span className="topEmojiFloat topEmojiFloat4">🍑</span>
            </div>
          </div>
        </div>
      </section>

      <section className="topSection">
        <div className="topSectionInner">
          <h2 className="topSectionTitle">使い方はかんたん3ステップ</h2>

          <div className="topStepGrid">
            {STEPS.map((step, i) => (
              <div
                className="topStepCard"
                key={step.number}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="topStepNumber">{step.number}</div>
                <div className="topStepEmoji">{step.emoji}</div>
                <h3 className="topStepTitle">{step.title}</h3>
                <p className="topStepDesc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="topSection topSectionAlt">
        <div className="topSectionInner">
          <h2 className="topSectionTitle">診断結果のイメージ</h2>
          <p className="topSectionLead">
            実際の診断では、あなたの好みに近い柑橘を上位3品種まで表示します。
          </p>

          <div className="topOutputPreview">
            <article className="resultCard">
              <div className="rankBadgeLarge">{SAMPLE_RESULT.rank}位</div>

              <div className="resultGrid">
                <div className="resultImageWrap">
                  <CitrusImage
                    id={SAMPLE_RESULT.id}
                    alt={SAMPLE_RESULT.name}
                    className="resultImage"
                  />
                </div>

                <div className="resultInfo">
                  <h2>{SAMPLE_RESULT.name}</h2>
                  <p className="resultDescription">
                    {SAMPLE_RESULT.description}
                  </p>
                </div>

                <div className="featurePanel">
                  <h3>特徴</h3>
                  <TasteRadarChart features={SAMPLE_RESULT.features} />
                </div>

                <div className="linkColumn">
                  <button
                    className="ecButton ecAmazon topPreviewEcButton"
                    type="button"
                  >
                    Amazonで探す
                  </button>

                  <button
                    className="ecButton ecRakuten topPreviewEcButton"
                    type="button"
                  >
                    楽天で探す
                  </button>

                  <button
                    className="ecButton ecSatofuru topPreviewEcButton"
                    type="button"
                  >
                    ふるさと納税で探す
                  </button>
                </div>
              </div>
            </article>

            <p className="topOutputPreviewNote">
              実際の結果画面では、この形式のカードが上位3品種分表示され、各購入サイトで探せます。
            </p>
          </div>
        </div>
      </section>

      <section className="topSection">
        <div className="topSectionInner">
          <h2 className="topSectionTitle">このアプリの特徴</h2>

          <div className="topFeatureGrid">
            {FEATURES.map((feature, i) => (
              <div
                className="topFeatureCard"
                key={feature.title}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="topFeatureEmoji">{feature.emoji}</div>
                <h3 className="topFeatureTitle">{feature.title}</h3>
                <p className="topFeatureDesc">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="topCtaSection">
        <div className="topCtaInner">
          <p className="topCtaEyebrow" aria-hidden="true">
            🍊
          </p>

          <h2 className="topCtaTitle">
            あなたに合う柑橘を<br />
            探してみませんか？
          </h2>

          <p className="topCtaLead">
            好みを選ぶだけ。無料で今すぐ診断できます。
          </p>

          <button
            className="topCtaButton topCtaButtonLarge"
            type="button"
            onClick={() => router.push("/2_Input")}
          >
          </button>
        </div>
      </section>
    </main>
  );
}
