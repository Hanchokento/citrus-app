# ローカルLLMをクラウドサーバーで利用できるか調査

調査日: 2026-06-24

## 結論

Qwen, Llama, Gemma などの「ローカルLLM / open-weight LLM」をクラウド上で使うことは可能。ただし、Cloudflare でまず検討する場合は、モデル重みを自分でダウンロードしてGPUサーバー上で常駐させる方式より、Cloudflare Workers AI のホスト済みモデルをAPIで呼び出す方式が現実的。

Cloudflare 上で「任意のモデル重みをHugging Faceなどからダウンロードして、自前推論サーバーとして動かす」ことは、通常のセルフサービス構成ではおすすめしにくい。Cloudflare Containers は任意コードを動かせるが、標準の最大インスタンスは 4 vCPU / 12 GiB memory / 20 GB disk で、GPU提供はドキュメント上確認できなかった。LLM推論にはGPUと大きなVRAM/メモリが重要なので、小型の量子化モデルをCPUで非常に低速に動かす実験を除くと不向き。

## Cloudflareでできること

### 1. Workers AIでホスト済みモデルを使う

Cloudflare Workers AI には、Qwen, Llama, Gemma 系のモデルが既に用意されている。2026-06-24時点のCloudflare公式ドキュメントでは、Workers AI のモデル一覧に 97 models が掲載されており、以下のようなモデルが確認できた。

- Qwen: `qwen3-30b-a3b-fp8`, `qwq-32b`, `qwen2.5-coder-32b-instruct`, `deepseek-r1-distill-qwen-32b`, Qwen embedding系など
- Llama: `llama-4-scout-17b-16e-instruct`, `llama-3.3-70b-instruct-fp8-fast`, `llama-3.2-1b-instruct`, `llama-3.2-3b-instruct`, `llama-3.2-11b-vision-instruct`, `llama-3.1-8b-instruct` など
- Gemma: `gemma-4-26b-a4b-it`, `gemma-3-12b-it`, `embeddinggemma-300m`, `gemma-7b-it-lora`, `gemma-2b-it-lora` など

Workers AI は Worker から `env.AI.run()` で呼び出せる。OpenAI互換エンドポイントもあり、OpenAI SDKの `baseURL` と `model` をCloudflare向けに変えるだけで使える。

この方式では、モデルのダウンロード、GPU管理、推論サーバー管理は不要。Webアプリから使うなら、Cloudflare Pages / Workers から Workers AI を呼ぶ構成が一番軽い。

### 2. LoRA adapterによる限定的なカスタマイズ

Workers AI は LoRA adapter をアップロードして、Cloudflare側のベースモデルに対して fine-tuned inference を行う機能を提供している。これは「モデル全体を自分でアップロードする」ものではなく、Cloudflareが用意したベースモデルに追加のLoRA重みを適用する方式。

特定タスク向けに出力傾向を変えたい場合は使えるが、任意のQwen/Llama/Gemmaモデルをまるごと持ち込む代替にはならない。

### 3. Private custom modelsは通常フローではなく問い合わせ

Cloudflare Workers AI の制限ページには、private custom models や高い上限が必要な場合は Custom Requirements Form を送るよう記載がある。つまり、完全な独自モデル利用は可能性がゼロではないが、通常のセルフサービスではなく、Cloudflareとの個別相談・契約寄りの扱い。

## Cloudflareで難しいこと

### 任意のローカルLLMをダウンロードして常駐推論すること

Cloudflare Containers は任意の言語・ランタイム・Linux風環境を動かせるため、理屈上は `llama.cpp`, `vLLM`, `Ollama` などを入れたコンテナを作ることはできる。しかし標準の上限は以下。

- 最大 vCPU: 4
- 最大メモリ: 12 GiB
- 最大ディスク: 20 GB
- 画像ストレージ合計: 50 GB / account

この制約では、7B級モデルの量子化版でも余裕は小さく、13B以上や高品質なfp16/bf16推論は厳しい。GPUが確認できないため、レスポンス速度も期待しにくい。

また、Cloudflare R2をFUSEでContainerにマウントし、モデルファイルを置くことはできる。公式ドキュメントでも「models or dependencies」や「Large static files」をR2から扱う用途が説明されている。ただしR2はオブジェクトストレージであり、ネイティブSSDのような性能は期待できないと明記されている。モデル重みの高速ロード・頻繁なランダムアクセスには不利。

## 推奨構成

### Cloudflareだけで進める場合

1. フロントエンド: Cloudflare Pages
2. API: Cloudflare Workers
3. LLM: Workers AI のホスト済み Qwen / Llama / Gemma 系モデル
4. データ保存: D1, R2, KV
5. 検索・RAG: Vectorize または外部ベクトルDB

この構成なら、サーバー管理なしでLLM機能をWebアプリに追加できる。研究・試作・小規模公開にはかなり相性が良い。

### 「本当にローカルLLMをダウンロードして動かす」場合

Cloudflareではなく、GPU付きVM/コンテナサービスを使う方が現実的。

候補:

- AWS EC2 GPU / SageMaker
- Google Cloud GPU VM / Vertex AI
- Azure GPU VM / Azure ML
- RunPod
- Lambda Cloud
- Paperspace
- Vast.ai
- 研究室や大学のGPUサーバー

この場合は、Hugging Faceなどからモデル重みをダウンロードし、`vLLM`, `llama.cpp`, `Ollama`, `Text Generation Inference` などでAPIサーバー化する。Cloudflareはその前段のCDN/WAF/API Gateway/認証/フロントエンドとして使うのがよい。

## 判断

今回の目的が「アプリにLLM機能を追加する」なら、まず Cloudflare Workers AI を使うのが最短。Qwen, Llama, Gemma 系のモデルはCloudflare上に用意されているため、モデルのダウンロード作業は不要。

一方で、目的が「特定のローカルLLM重みを自分で管理し、自由に差し替え、GPUで高速推論したい」なら、Cloudflare単体は第一候補ではない。GPU付きクラウドサーバーを別に立て、Cloudflare Workers/Pages からそのAPIを呼ぶ構成が妥当。

## Cloudflare Workers AIの料金

結論として、Cloudflare Workers AI には無料枠があるが、無料枠を超える利用には料金がかかる。

Cloudflare公式ドキュメントでは、Workers AI は Workers Free plan と Workers Paid plan の両方に含まれる。ただし、無料で使えるのは 1日あたり 10,000 Neurons まで。10,000 Neurons/day を超えて使うには Workers Paid plan が必要で、超過分は $0.011 / 1,000 Neurons で課金される。

Neurons はCloudflareがAI推論のGPU計算量を測るための単位。LLMではモデルごとに、入力トークンと出力トークンに対して必要なNeurons数、または同等のトークン単価が設定されている。出力トークンの方が入力トークンより高いことが多い。

2026-06-24時点で確認した主なLLM料金例:

- `@cf/meta/llama-3.2-1b-instruct`: $0.027 / 100万 input tokens, $0.201 / 100万 output tokens
- `@cf/meta/llama-3.2-3b-instruct`: $0.051 / 100万 input tokens, $0.335 / 100万 output tokens
- `@cf/meta/llama-3.1-8b-instruct-fp8-fast`: $0.045 / 100万 input tokens, $0.384 / 100万 output tokens
- `@cf/meta/llama-3.3-70b-instruct-fp8-fast`: $0.293 / 100万 input tokens, $2.253 / 100万 output tokens
- `@cf/qwen/qwen3-30b-a3b-fp8`: $0.051 / 100万 input tokens, $0.335 / 100万 output tokens
- `@cf/qwen/qwq-32b`: $0.660 / 100万 input tokens, $1.000 / 100万 output tokens
- `@cf/qwen/qwen2.5-coder-32b-instruct`: $0.660 / 100万 input tokens, $1.000 / 100万 output tokens
- `@cf/google/gemma-3-12b-it`: $0.345 / 100万 input tokens, $0.556 / 100万 output tokens
- `@cf/google/gemma-4-26b-a4b-it`: $0.100 / 100万 input tokens, $0.300 / 100万 output tokens

したがって、試作や少量利用なら無料枠で始められる可能性がある。一方で、公開アプリとして多数ユーザーに使わせる場合や、長い回答を大量に生成する場合は課金前提で見積もる必要がある。

### 10,000 Neurons/dayでどれくらい使えるか

10,000 Neurons/day は、使うモデルと入出力トークン数によって大きく変わる。計算式は以下。

```text
1回の消費Neurons =
  入力トークン数 * 入力側Neurons per token
  + 出力トークン数 * 出力側Neurons per token
```

例として「1回の質問で input 500 tokens / output 500 tokens」と仮定すると、無料枠 10,000 Neurons/day で使える回数はおおよそ以下。

| モデル | 目安回数 / day | 備考 |
| --- | ---: | --- |
| `@cf/meta/llama-3.2-1b-instruct` | 約966回 | 小型で安い |
| `@cf/meta/llama-3.2-3b-instruct` | 約570回 | 小型-中型 |
| `@cf/qwen/qwen3-30b-a3b-fp8` | 約570回 | Qwen系では比較的安い |
| `@cf/meta/llama-3.1-8b-instruct-fp8-fast` | 約513回 | 8B級 |
| `@cf/google/gemma-4-26b-a4b-it` | 約476回 | Gemma系 |
| `@cf/google/gemma-3-12b-it` | 約244回 | Gemma 3 12B |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | 約86回 | 70B級で高め |
| `@cf/qwen/qwq-32b` | 約66回 | reasoning系で高め |
| `@cf/qwen/qwen2.5-coder-32b-instruct` | 約66回 | coder 32Bで高め |

短い分類・抽出・要約ならもっと多く使える。逆に、長い文章を入力したり、長い回答を生成したりすると回数は大きく減る。特にLLMは出力トークン側の単価が高いモデルが多いため、回答を長くさせるほど無料枠を消費しやすい。

たとえば `@cf/qwen/qwen3-30b-a3b-fp8` では、input 500 / output 500 tokens なら約570回/day。input 1,000 / output 500 tokens なら約503回/day。input 500 / output 1,000 tokens なら約305回/day 程度になる。

料金確認用リンク:

- Cloudflare Workers AI Pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/

## 参考資料

- Cloudflare Workers AI Models: https://developers.cloudflare.com/workers-ai/models/
- Cloudflare Workers AI Workers Bindings: https://developers.cloudflare.com/workers-ai/configuration/bindings/
- Cloudflare Workers AI OpenAI compatible API endpoints: https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
- Cloudflare Workers AI Fine-tunes / LoRA: https://developers.cloudflare.com/workers-ai/features/fine-tunes/
- Cloudflare Workers AI Limits: https://developers.cloudflare.com/workers-ai/platform/limits/
- Cloudflare Containers Overview: https://developers.cloudflare.com/containers/
- Cloudflare Containers Limits and Instance Types: https://developers.cloudflare.com/containers/platform-details/limits/
- Cloudflare Containers Image Management: https://developers.cloudflare.com/containers/platform-details/image-management/
- Cloudflare Containers R2 FUSE Mount: https://developers.cloudflare.com/containers/examples/r2-fuse-mount/
