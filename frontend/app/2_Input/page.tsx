import Link from "next/link";

export default function InputPage() {
  return (
    <main className="topPage">
      <section className="heroCard">
        <h1>どんな柑橘が好きですか？</h1>
        <p>ここに6項目の入力UIを作っていきます。</p>

        <div className="buttonRow">
          <Link className="primaryButton" href="/3_OutputNoLogin">
            結果を見る
          </Link>

          <Link className="secondaryButton" href="/1_Top">
            トップへ戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
