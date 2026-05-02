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

        <div className="loginDevNotice">
          <strong>開発中：</strong>
          現在はLINE OAuth本実装前のため、モックログインで動作確認しています。
        </div>

        <div className="topButtonRow loginButtonRow">
          <button
            className="lineLoginButton"
            type="button"
            onClick={handleMockLogin}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINEでログインする
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
