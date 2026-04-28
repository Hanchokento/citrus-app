import Link from "next/link";

export default function TopLoginPage() {
  return (
    <main className="topPage">
      <section className="heroCard">
        <h1>柑橘類の推薦システム</h1>
        <p>ログイン中のトップ画面です。</p>

        <div className="buttonRow">
          <Link className="primaryButton" href="/2_Input">
            🍊 診断を始める
          </Link>

          <Link className="secondaryButton" href="/1_Top">
            ログアウト
          </Link>
        </div>
      </section>
    </main>
  );
}
