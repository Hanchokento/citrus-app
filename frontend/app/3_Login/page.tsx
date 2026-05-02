"use client";
// frontend/app/3_Login/page.tsx

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, loginWithLine } = useApp();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/1_TopLogin");
    }
  }, [isLoggedIn, router]);

  function handleMockLogin() {
    loginWithLine({
      userId: "mock_line_user_001",
      userName: "テストユーザー",
      userPicture: null,
      authProvider: "LINE mock",
    });

    router.push("/1_TopLogin");
  }

  return (
    <main className="pageShell centerShell">
      <section className="heroCard loginHeroCard">
        <div className="heroEmoji">🍊</div>

        <h1 className="heroTitle">ログイン</h1>

        <p className="heroLead">
          ログインすると、診断結果から
          <br />
          購入リンクに進めます。
        </p>

        <div className="loginNotice">
          <strong>開発中：</strong>
          現在はLINE OAuth本実装前のため、モックログインで動作確認します。
        </div>

        <div className="buttonRow">
          <button
            className="lineButton"
            type="button"
            onClick={handleMockLogin}
          >
            💬 LINEでログインする
          </button>

          <button
            className="secondaryButton"
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
