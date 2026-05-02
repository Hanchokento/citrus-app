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
    <main className="pageShell centerShell">
      <section>
        <div className="loginCard">
          <div className="loginUser">
            <div className="avatar">
              {userPicture ? (
                <img src={userPicture} alt="ユーザー画像" />
              ) : (
                <span>{userName?.slice(0, 1) ?? "L"}</span>
              )}
            </div>

            <div>
              <strong>ようこそ、{userName ?? "LINEユーザー"} さん</strong>
              <div>{authProvider ?? "LINE"} でログイン中</div>
            </div>
          </div>

          <div className="badge">
            <span className="badgeDot" />
            ログイン中
          </div>
        </div>

        <section className="heroCard">
          <div className="heroEmoji">🍊</div>

          <h1 className="heroTitle">柑橘おすすめ診断</h1>

          <p className="heroLead">
            今日の気分に合う柑橘を、
            <br />
            もう一度探してみましょう。
          </p>

          <div className="buttonRow">
            <button
              className="primaryButton"
              type="button"
              onClick={() => router.push("/2_Input")}
            >
              🍊 診断を始める
            </button>

            <button
              className="dangerButton"
              type="button"
              onClick={handleLogout}
            >
              ログアウト
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
