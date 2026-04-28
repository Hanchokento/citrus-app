import Link from "next/link";

export default function OutputLoginPage() {
  return (
    <main className="topPage">
      <section className="heroCard">
        <h1>診断結果</h1>
        <p>ログイン済みユーザー向けの結果画面です。</p>

        <div className="buttonRow">
          <Link className="primaryButton" href="/2_Input">
            もう一度診断する
          </Link>

          <Link className="secondaryButton" href="/1_TopLogin">
            トップへ戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
