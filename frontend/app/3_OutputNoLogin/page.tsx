import Link from "next/link";

export default function OutputNoLoginPage() {
  return (
    <main className="topPage">
      <section className="heroCard">
        <h1>診断結果</h1>
        <p>未ログインユーザー向けの結果画面です。購入リンクは後でログイン時のみ有効化します。</p>

        <div className="buttonRow">
          <Link className="primaryButton" href="/3_Login">
            ログインして購入リンクを見る
          </Link>

          <Link className="secondaryButton" href="/1_Top">
            トップへ戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
