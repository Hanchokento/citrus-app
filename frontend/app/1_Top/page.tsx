import Link from "next/link";

export default function TopPage() {
  return (
    <main className="pageShell centerShell">
      <section className="heroCard">
        <h1 className="heroTitle">柑橘類の推薦システム</h1>
        <p className="heroLead">あなたにぴったりの品種を紹介します</p>

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
