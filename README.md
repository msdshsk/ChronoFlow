# ChronoFlow カレンダー

Rust + Tauri + React + TypeScript + Tailwind CSS v4 で作成されたモダンなカレンダーアプリケーションです。

## 機能

- 📅 月間カレンダー表示
- 🇯🇵 日本の祝日表示（Google Calendar API連携）
- 🎨 日本式配色（日曜日：赤、土曜日：青）
- 🏷️ イベントチップ表示
- ⚡ 高速なパフォーマンス（Vite + Tailwind CSS v4）
- 🖥️ デスクトップアプリ（Tauri）

## セットアップ

### 前提条件

- Node.js 20.x 以上
- Rust（Tauriのため）
- npm または yarn

### インストール

1. **リポジトリをクローン**
```bash
git clone <repository-url>
cd calender
```

2. **依存関係をインストール**
```bash
npm install
```

3. **環境変数を設定**
```bash
cp .env.example .env
```

### Google Calendar API の設定（オプション）

祝日情報を取得するために、Google Calendar APIキーを設定できます。

1. **Google Cloud Console にアクセス**
   - https://console.cloud.google.com/ にアクセス

2. **プロジェクトを作成または選択**

3. **Google Calendar API を有効化**
   - 「APIとサービス」→「ライブラリ」
   - 「Google Calendar API」を検索して有効化

4. **APIキーを作成**
   - 「APIとサービス」→「認証情報」
   - 「認証情報を作成」→「APIキー」

5. **APIキーを制限（推奨）**
   - 作成したAPIキーをクリック
   - 「アプリケーションの制限」で適切な制限を設定
   - 「API の制限」で「Google Calendar API」のみを許可

6. **.env ファイルに追加**
```bash
VITE_GOOGLE_API_KEY=your_actual_api_key_here
```

**注意**: APIキーが設定されていない場合、モックデータ（2025年の祝日）が使用されます。

### 開発サーバーの起動

```bash
npm run tauri:dev
```

このコマンドで以下が実行されます：
- Vite開発サーバーが起動（http://localhost:5173）
- Tauriデスクトップアプリケーションが起動

## 技術スタック

- **フロントエンド**: React 19, TypeScript
- **バックエンド**: Rust (Tauri)
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS v4
- **API**: Google Calendar API（祝日取得）

## プロジェクト構造

```
calender/
├── src/                    # Reactアプリケーション
│   ├── components/         # Reactコンポーネント
│   │   ├── Calendar.tsx    # メインカレンダーコンポーネント
│   │   └── EventChip.tsx   # イベント表示チップ
│   ├── services/           # APIサービス
│   │   └── holidayService.ts # 祝日データ取得
│   ├── types/              # TypeScript型定義
│   │   └── calendar.ts     # カレンダー関連の型
│   ├── App.tsx             # メインアプリコンポーネント
│   └── main.tsx            # エントリーポイント
├── src-tauri/              # Tauriバックエンド
│   ├── src/                # Rustソースコード
│   ├── Cargo.toml          # Rust依存関係
│   └── tauri.conf.json     # Tauri設定
├── public/                 # 静的ファイル
├── package.json            # Node.js依存関係
├── vite.config.ts          # Vite設定
└── tailwind.config.js      # Tailwind CSS設定
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run tauri:dev

# Viteのみ起動（デバッグ用）
npm run dev

# プロダクションビルド
npm run tauri:build

# 型チェック
npm run build

# リンター実行
npm run lint
```

## 今後の予定機能

- [ ] Googleカレンダー連携
- [ ] イベント作成・編集機能
- [ ] 週表示・日表示
- [ ] 通知機能
- [ ] データエクスポート

## ライセンス

MIT License
