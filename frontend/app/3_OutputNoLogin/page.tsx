"use client";
// frontend/app/3_OutputNoLogin/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { CitrusImage } from "@/components/CitrusImage";
import type { RecommendationItem } from "@/lib/types";

export default function OutputNoLoginPage() {
  const router = useRouter();
  const { topIds } = useApp();
  const [items, setItems] = useState<RecommendationItem[]>([]);

  useEffect(() => {
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
  }, [router, topIds.length]);

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
            あなたの好みに近い柑橘はこちらです。
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
        {items.map((item) => (
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
                <span className="disabledButton">Amazonで探す</span>
                <span className="disabledButton">楽天で探す</span>
                <span className="disabledButton">ふるさと納税で探す</span>

                <p className="loginBenefitNote">
                  ログインすると購入リンクを開けます
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <footer className="resultFooter">
        <button
          className="topPrimaryButton"
          type="button"
          onClick={() => router.push("/3_Login")}
        >
          ログインして購入リンクを見る
        </button>

        <button
          className="topSecondaryButton"
          type="button"
          onClick={() => router.push("/2_Input")}
        >
          もう一度診断する
        </button>
      </footer>
    </main>
  );
}
