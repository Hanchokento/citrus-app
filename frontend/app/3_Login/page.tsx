"use client";
// frontend/app/3_Login/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";

const LINE_LOGIN_URL = "https://citrus-app-ts.hmkt0520.workers.dev/auth/line";

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn } = useApp();
  const [lineLoginError, setLineLoginError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLineLoginError(params.get("lineLoginError"));
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/1_TopLogin");
    }
  }, [isLoggedIn, router]);

  function handleLineLogin() {
    window.location.href = LINE_LOGIN_URL;
  }

  return (
    <main className="topPage">
      <section className="topHeroCard loginCard">
        <h1>ログイン</h1>
        <p>
          ログインすると、診断結果から
          <br />
          購入リンクに進めます。
        </p>

        <div className="loginBenefitBox">
          <div className="loginBenefitItem">
            <span className="loginBenefitIcon">🛒</span>
            <span>Amazon・楽天・ふるさと納税へ直接リンク</span>
          </div>
          <div className="loginBenefitItem">
            <span className="loginBenefitIcon">🍊</span>
            <span>お気に入りの柑橘をすぐに購入</span>
          </div>
        </div>

        {lineLoginError ? (
          <div className="loginDevNotice">
            <strong>LINEログインに失敗しました：</strong>
            {lineLoginError}
          </div>
        ) : (
          <div className="loginDevNotice">
            LINEアカウントでログインします。
          </div>
        )}

        <div className="topButtonRow loginButtonRow">
          <button
            className="lineLoginImageButton"
            type="button"
            onClick={handleLineLogin}
            aria-label="LINEでログイン"
          >
            <span className="lineLoginImage" aria-hidden="true" />
          </button>

          <button
            className="topSecondaryButton"
            type="button"
            onClick={() => router.push("/1_Top")}
          >
            ログインせずに戻る
          </button>
        </div>
      </section>
    </main>
  );
}
