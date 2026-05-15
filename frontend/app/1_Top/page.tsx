"use client";
// frontend/app/1_Top/page.tsx

import { useRouter } from "next/navigation";

export default function TopPage() {
  const router = useRouter();

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
        </div>
      </section>
    </main>
  );
}
