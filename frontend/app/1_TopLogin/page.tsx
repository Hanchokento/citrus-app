"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TopLoginPage() {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("citrus_is_logged_in");
    localStorage.removeItem("citrus_user_name");
    router.push("/1_Top");
  }

  return (
    <main className="pageShell centerShell">
      <section>
        <div className="loginCard">
          <div className="loginUser">
            <div className="avatar">L</div>
            <div>
              <strong>ようこそ、LINEユーザー さん</strong>
              <div>ログイン方法：LINE</div>
            </div>
          </div>
          <div className="badge">
            <span className="badgeDot" />
            ログイン中
          </div>
        </div>

        <section className="heroCard">
          <h1 className="heroTitle">柑橘類の推薦システム</h1>
          <p className="heroLead">あなたにぴったりの品種を紹介します</p>

          <div className="buttonRow">
            <Link className="primaryButton" href="/2_Input">
              🍊 診断を始める
            </Link>

            <button className="dangerButton" type="button" onClick={logout}>
              ログアウト
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
