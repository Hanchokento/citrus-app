import Link from "next/link";

export default function TopPage() {
  return (
    <main className="topPage">
      <section className="heroCard">
        <h1>柑橘類の推薦システム</h1>
        <p>あなたにぴったりの品種を紹介します</p>

        <div className="buttonRow">
          <Link className="primaryButton" href="/2_Input">
            🍊 お試しで推薦してもらう
          </Link>

          <Link className="secondaryButton" href="/3_Login">
            ログイン
          </Link>
        </div>
      </section>
    </main>
  );
}
