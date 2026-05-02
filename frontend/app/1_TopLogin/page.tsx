"use client";
// frontend/app/1_TopLogin/page.tsx

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";

export default function TopLoginPage() {
  const router = useRouter();
  const { isLoggedIn, userName, userPicture, authProvider, logout } = useApp();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/1_Top");
    }
  }, [isLoggedIn, router]);

  function handleLogout() {
    logout();
    router.push("/1_Top");
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
