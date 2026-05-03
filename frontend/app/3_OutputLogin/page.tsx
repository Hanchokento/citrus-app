"use client";
// frontend/app/3_OutputLogin/page.tsx

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
import type { RecommendationItem } from "@/lib/types";

export default function OutputLoginPage() {
  const router = useRouter();
  const { isLoggedIn, topIds, sessionId, userId } = useApp();
  const [items, setItems] = useState<RecommendationItem[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/3_OutputNoLogin");
      return;
    }

    const raw = sessionStorage.getItem("citrus_recommendations");

    if (!raw || topIds.length === 0) {
      router.replace("/2_Input");
      return;
    }

    try {
      setItems(JSON.parse(raw) as RecommendationItem[]);
    } catch {
      router.replace("/2_Input");
    }
  }, [isLoggedIn, router, topIds.length]);

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
          onClick={() => router.push("/1_TopLogin")}
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
            userId
          );

          const rakutenUrl = buildClickLogUrl(
            sessionId,
            `${item.rank}_r`,
            item.rakutenUrl || buildRakutenUrl(item.name),
            userId
          );

          const satofuruUrl = buildClickLogUrl(
            sessionId,
            `${item.rank}_s`,
            item.satofuruUrl || buildSatofuruUrl(item.name),
            userId
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
                </div>

                <div className="resultInfo">
                  <h2>{item.name}</h2>
                  <p className="resultDescription">{item.description}</p>
                </div>

                <div className="featurePanel">
                  <h3>特徴</h3>
                  <div className="radarBox">
                    <div className="radarItem">甘さ {item.features.brix}</div>
                    <div className="radarItem">酸味 {item.features.acid}</div>
                    <div className="radarItem">苦味 {item.features.bitterness}</div>
                    <div className="radarItem">香り {item.features.aroma}</div>
                    <div className="radarItem">果汁 {item.features.moisture}</div>
                    <div className="radarItem">食感 {item.features.texture}</div>
                  </div>
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
          onClick={() => router.push("/1_TopLogin")}
        >
          トップへ戻る
        </button>
      </footer>
    </main>
  );
}
