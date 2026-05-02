"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  function mockLogin() {
    localStorage.setItem("citrus_is_logged_in", "true");
    localStorage.setItem("citrus_user_name", "LINEユーザー");
    router.push("/1_TopLogin");
  }

  return (
    <main className="pageShell centerShell">
      <section className="heroCard">
        <h1 className="heroTitle">ログイン</h1>
        <p className="heroLead">LINEでログインしてください</p>

        <button className="primaryButton" type="button" onClick={mockLogin}>
          LINEでログインする
        </button>

        <div style={{ marginTop: 20 }}>
          <Link className="secondaryButton" href="/1_Top">
            戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
