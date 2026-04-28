import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="topPage">
      <section className="heroCard">
        <h1>ログイン</h1>
        <p>LINEログイン画面は後で実装します。</p>

        <div className="buttonRow">
          <Link className="primaryButton" href="/1_TopLogin">
            仮ログイン
          </Link>

          <Link className="secondaryButton" href="/1_Top">
            戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
