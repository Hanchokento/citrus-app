"use client";
// frontend/app/3_Output/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import {
  buildAmazonUrl,
  buildClickLogUrl,
  buildRakutenUrl,
  buildSatofuruUrl,
} from "@/lib/api";
import { CitrusImage } from "@/components/CitrusImage";
import TasteRadarChart from "@/components/TasteRadarChart";
import type { RecommendationItem } from "@/lib/types";

const DEV_OUTPUT_ITEMS: RecommendationItem[] = [
  {
    id: 14,
    rank: 1,
    name: "日向夏",
    imageUrl: "",
    description:
      "爽やかな酸味とやさしい甘さが特徴。さっぱりとした後味が心地よい柑橘です。",
    features: {
      brix: 4,
      acid: 5,
      bitterness: 2,
      aroma: 4,
      moisture: 3,
      texture: 4,
    },
  },
  {
    id: 8,
    rank: 2,
    name: "せとか",
    imageUrl: "",
    description:
      "濃厚な甘さと華やかな香りがあり、ジューシーで食べやすい柑橘です。",
    features: {
      brix: 6,
      acid: 2,
      bitterness: 1,
      aroma: 5,
      moisture: 5,
      texture: 4,
    },
  },
  {
    id: 3,
    rank: 3,
    name: "はるみ",
    imageUrl: "",
    description:
      "甘みと酸味のバランスがよく、ぷちぷちとした食感が楽しめる柑橘です。",
    features: {
      brix: 5,
      acid: 3,
      bitterness: 1,
      aroma: 4,
      moisture: 4,
      texture: 5,
    },
  },
];

const USE_DEV_OUTPUT_ITEMS = process.env.NODE_ENV === "development";

export default function OutputPage() {
  const router = useRouter();
  const { sessionId } = useApp();
  const [items] = useState<RecommendationItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = sessionStorage.getItem("citrus_recommendations");

      if (!raw) {
        return USE_DEV_OUTPUT_ITEMS ? DEV_OUTPUT_ITEMS : [];
      }

      return JSON.parse(raw) as RecommendationItem[];
    } catch {
      return USE_DEV_OUTPUT_ITEMS ? DEV_OUTPUT_ITEMS : [];
    }
  });

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/2_Input");
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return (
      <main className="resultPage resultPageCenter">
        <section className="resultLoadingCard">
          <div className="resultLoadingEmoji">🍊</div>
          <h1>結果を準備中...</h1>
        </section>
      </main>
    );
  }

  const shareNames = items.slice(0, 3).map((item) => item.name);
  const quotedShareNames = `「${shareNames.join("」「")}」`;
  const shareText = `私におすすめの柑橘は${quotedShareNames}でした🍊\n好みから柑橘を探せる診断アプリで試してみました。`;
  const appUrl =
    typeof window === "undefined" ? "" : `${window.location.origin}/1_Top`;
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText,
  )}${appUrl ? `&url=${encodeURIComponent(appUrl)}` : ""}`;

  return (
    <main className="resultPage">
      <header className="resultHeader">
        <button
          className="backButton"
          type="button"
          onClick={() => router.push("/2_Input")}
        >
          ← 入力に戻る
        </button>

        <div>
          <h1 className="resultTitle">診断結果</h1>
          <p className="resultLead">
            気になる柑橘は、そのまま購入ページで探せます。
          </p>
        </div>

        <button
          className="secondarySmallButton"
          type="button"
          onClick={() => router.push("/1_Top")}
        >
          トップへ
        </button>
      </header>

      <section className="resultStack">
        {items.map((item) => {
          const amazonUrl = buildClickLogUrl(
            sessionId,
            `${item.rank}_a`,
            item.amazonUrl || buildAmazonUrl(item.name),
          );

          const rakutenUrl = buildClickLogUrl(
            sessionId,
            `${item.rank}_r`,
            item.rakutenUrl || buildRakutenUrl(item.name),
          );

          const satofuruUrl = buildClickLogUrl(
            sessionId,
            `${item.rank}_s`,
            item.satofuruUrl || buildSatofuruUrl(item.name),
          );

          return (
            <article className="resultCard" key={item.id}>
              <div className="rankBadgeLarge">{item.rank}位</div>

              <div className="resultGrid">
                <div className="resultImageWrap">
                  <CitrusImage
                    id={item.id}
                    alt={item.name}
                    className="resultImage"
                  />
                  {/* TODO: item.infoUrl が追加されたら href={item.infoUrl ?? `https://...`} に変更する */}
                  <a
                    className="varietyInfoLink"
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      `${item.name} 柑橘 品種`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    この品種について調べる →
                  </a>
                </div>

                <div className="resultInfo">
                  <h2>{item.name}</h2>
                  <p className="resultDescription">{item.description}</p>
                </div>

                <div className="featurePanel">
                  <h3>特徴</h3>
                  <TasteRadarChart features={item.features} />
                </div>

                <div className="linkColumn">
                  <a
                    className="ecButton ecAmazon"
                    href={amazonUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Amazonで探す
                  </a>

                  <a
                    className="ecButton ecRakuten"
                    href={rakutenUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    楽天で探す
                  </a>

                  <a
                    className="ecButton ecSatofuru"
                    href={satofuruUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    ふるさと納税で探す
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="resultShareCard">
        <p className="resultShareEyebrow">まとめ</p>
        <h2 className="resultShareTitle">
          あなたにおすすめの柑橘は
          <br />
          <span>{quotedShareNames}</span>
          でした
        </h2>
        <p className="resultShareText">
          診断結果を保存したり、気になる人に共有できます。
        </p>
        <a
          className="xShareButton"
          href={xShareUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Xでシェア
        </a>
      </section>

      <footer className="resultFooter">
        <button
          className="topPrimaryButton"
          type="button"
          onClick={() => router.push("/2_Input")}
        >
          もう一度診断する
        </button>

        <button
          className="topSecondaryButton"
          type="button"
          onClick={() => router.push("/1_Top")}
        >
          トップへ戻る
        </button>
      </footer>
    </main>
  );
}