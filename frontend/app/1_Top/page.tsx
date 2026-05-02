"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";

export default function TopPage() {
  const router = useRouter();
  const { isLoggedIn } = useApp();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/1_TopLogin");
    }
  }, [isLoggedIn, router]);

  return (
    <main className="topPage">
      <section className="topHeroCard">
        <h1>柑橘類の推薦システム</h1>
        <p>あなたにぴったりの品種を紹介します</p>

        <div className="topButtonRow">
          <button
            className="topPrimaryButton"
            type="button"
            onClick={() => router.push("/2_Input")}
          >
            🍊 お試しで推薦してもらう
          </button>

          <button
            className="topSecondaryButton"
            type="button"
            onClick={() => router.push("/3_Login")}
          >
            ログイン
          </button>
        </div>
      </section>
    </main>
  );
}
