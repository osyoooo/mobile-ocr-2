# 書籍申込 合計計算

Next.js + TypeScript + App Routerで作成した、スマホブラウザ向けの手書き冊数OCR計算アプリです。

この版では、A4の表全体を一発撮影する方式をやめ、申込冊数欄を **3分割撮影** してから手動トリミングします。これにより、スマホ撮影時の傾き・余白・ピントずれによる切り出し失敗を減らし、Tesseract.jsの手書き数字OCRを実用寄りにします。

## 主な機能

- iOS Safari / Android Chrome のブラウザで利用可能
- Vercelにそのままデプロイ可能
- 外部AI APIや有料OCR APIを使わないブラウザ完結OCR
- スマホ標準カメラを起動する `input type="file" accept="image/*" capture="environment"` をメイン採用
- 予備機能として `getUserMedia` のライブカメラ撮影も利用可能
- No1〜No8、No9〜No15、No16〜No22 の3分割撮影
- 撮影後に申込冊数欄だけを手動トリミング
- トリミング範囲を行数に応じて分割
- 「冊」の印字部分を内部で除外
- グレースケール、二値化、余白トリミング、拡大などの前処理
- Tesseract.jsによるブラウザ内OCR
- OCR結果と切り出し画像をNo別に並べて表示
- 誤読した冊数を手修正可能
- 小計は表示せず、総合計のみ大きく表示

## 利用フロー

1. トップ画面で「3分割撮影を開始」を押す
2. No1〜No8の申込冊数欄を撮影
3. 赤枠を申込冊数欄に合わせて「この範囲で読み取る」を押す
4. No9〜No15も同じように撮影・範囲調整
5. No16〜No22も同じように撮影・範囲調整
6. 確認画面で切り出し画像とOCR結果を見比べる
7. 誤読があれば冊数を修正する
8. 総合計を確認する

## 撮影のコツ

- 表全体ではなく、右端の「申込冊数」列だけを大きく撮影してください。
- ヘッダー行は入れず、対象のNo範囲だけを撮影・トリミングしてください。
- 右端の「冊」は多少写っても構いません。内部処理で右側を少し除外します。
- 手書き数字が薄い、細い、枠線に重なる場合はOCR精度が下がります。
- OCRは仮読み取りです。最終的には確認画面で修正してください。

## ローカル起動手順

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

スマホ実機で検証する場合は、同一ネットワーク内で開発サーバーへアクセスしてください。ブラウザの仕様上、カメラ利用にはHTTPSまたはlocalhostが必要です。本番確認はVercelのHTTPS URLで行うのが簡単です。

## ビルド確認

```bash
npm run build
```

## GitHubへpushする手順

```bash
git status
git add .
git commit -m "Improve mobile OCR capture flow"
git push origin main
```

別ブランチで作業する場合:

```bash
git checkout -b improve-split-capture-ocr
git add .
git commit -m "Improve mobile OCR capture flow"
git push -u origin improve-split-capture-ocr
```

## Vercelデプロイ手順

1. GitHubにこのリポジトリをpushします。
2. Vercelで対象プロジェクトを開きます。
3. GitHub連携済みなら、Production Branchへのpushで自動デプロイされます。
4. Preview Deploymentを本番化する場合は、VercelのDeployments画面から対象Deploymentの三点メニューを開き、Promote to Productionを選びます。

## 主要ファイル

- `app/page.tsx`
  アプリ全体の状態管理。3分割撮影、範囲調整、OCR、確認画面を切り替えます。

- `components/SplitCaptureFlow.tsx`
  No1〜No8、No9〜No15、No16〜No22 の撮影案内画面です。

- `components/NativeCameraInput.tsx`
  スマホ標準カメラを起動するメイン撮影ボタンです。

- `components/CropQuantityArea.tsx`
  撮影画像に赤枠を重ね、申込冊数欄だけを手動トリミングする画面です。

- `components/QuantityConfirm.tsx`
  切り出し画像とOCR結果をNo別に並べ、冊数を修正する画面です。

- `lib/layout.ts`
  3分割設定、トリミング初期値、セル内の右側「冊」除外率などを定義しています。

- `lib/imageProcessing.ts`
  画像読み込み、手動トリミング範囲の切り出し、行分割、OCR前処理を行います。

- `lib/ocr.ts`
  Tesseract.jsで各セルを数字OCRします。

- `lib/books.ts`
  No、書籍名、斡旋価格の固定マスタです。

## 調整ポイント

実際の用紙と手書きサンプルで試しながら、まずは `lib/layout.ts` の以下を調整してください。

```ts
export const CELL_CROP = {
  leftPadding: 0.08,
  rightPrintedUnitTrim: 0.3,
  topPadding: 0.14,
  bottomPadding: 0.14,
} as const;
```

- `rightPrintedUnitTrim`
  右端の「冊」印字をどれだけ除外するか。OCRに「冊」が混ざる場合は大きくします。

- `topPadding` / `bottomPadding`
  セル上下の罫線を避ける量。罫線がOCR画像に入る場合は大きくします。

- `leftPadding`
  左側の罫線や余白を避ける量です。

## 注意

Tesseract.jsは印刷文字向けのOCRであり、手書き数字認識は完全ではありません。このアプリでは、OCRを「仮入力」として使い、最終確認・修正しやすいUIで実務上のミスを減らす設計にしています。
