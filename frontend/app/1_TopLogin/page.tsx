"use client";
// frontend/app/1_TopLogin/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";

export default function TopLoginPage() {
  const router = useRouter();
  const {
    isLoggedIn,
    userName,
    userPicture,
    authProvider,
    loginWithLine,
    logout,
  } = useApp();

  const [isCheckingLineCallback, setIsCheckingLineCallback] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const callbackAuthProvider = params.get("authProvider");
    const callbackUserId = params.get("userId");
    const callbackUserName = params.get("userName");
    const callbackUserPicture = params.get("userPicture");

    if (callbackAuthProvider === "line" && callbackUserId) {
      loginWithLine({
        userId: callbackUserId,
        userName: callbackUserName || "LINEユーザー",
        userPicture: callbackUserPicture || null,
        authProvider: "LINE",
      });

      window.history.replaceState(null, "", "/1_TopLogin");
    }

    setIsCheckingLineCallback(false);
  }, [loginWithLine]);

  useEffect(() => {
    if (!isCheckingLineCallback && !isLoggedIn) {
      router.replace("/1_Top");
    }
  }, [isCheckingLineCallback, isLoggedIn, router]);

  function handleLogout() {
    logout();
    router.push("/1_Top");
  }

  if (isCheckingLineCallback) {
    return (
      <main className="topPage">
        <section className="topHeroCard">
          <h1>ログイン情報を確認中...</h1>
          <p>LINEログインの結果を反映しています。</p>
        </section>
      </main>
    );
  }

  return (
    <main className="topPage">
      <section className="topHeroCard">
        <div className="topLoginUserCard">
          <div className="topLoginAvatar">
            {userPicture ? (
              <img src={userPicture} alt="ユーザー画像" />
            ) : (
              <span>{userName?.slice(0, 1) ?? "L"}</span>
            )}
          </div>

          <div className="topLoginUserInfo">
            <span className="topLoginUserName">
              {userName ?? "LINEユーザー"} さん
            </span>
            <span className="topLoginBadge">
              <span className="topLoginBadgeDot" />
              {authProvider ?? "LINE"} でログイン中
            </span>
          </div>
        </div>

        <h1>柑橘類の推薦システム</h1>
        <p>今日の気分に合う柑橘を、もう一度探してみましょう。</p>

        <div className="topButtonRow">
          <button
            className="topPrimaryButton"
            type="button"
            onClick={() => router.push("/2_Input")}
          >
            診断を始める
          </button>

          <button
            className="topSecondaryButton topLogoutButton"
            type="button"
            onClick={handleLogout}
          >
            ログアウト
          </button>
        </div>
      </section>
    </main>
  );
}
