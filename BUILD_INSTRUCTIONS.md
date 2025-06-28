# ChronoFlow - Rust + Tauri + React カレンダーアプリ

## 📋 概要

ChronoFlowは、Rust + Tauri + Reactで構築されたWindows向けのデスクトップカレンダーアプリケーションです。Google OAuth認証により個人のGoogleカレンダーと連携し、APIキーで日本の祝日も同時に表示できます。

## 🌟 主な機能

- **OAuth認証**: Google Calendar APIを使用した安全な個人カレンダー連携
- **個人カレンダー**: 認証後にGoogleカレンダーのイベントを表示・作成・編集
- **日本の祝日**: APIキーを使用した公式祝日カレンダーの表示
- **ハイブリッド認証**: OAuth（個人）+ APIキー（祝日）の二重認証システム
- **柔軟なポート設定**: 開発環境に応じてOAuthリダイレクトポートを変更可能
- **美しいUI**: 日本式配色（日曜日：赤、土曜日：青）とTailwind CSS

## 🔧 環境設定

### 1. Google Cloud Platform 設定

#### A. OAuth認証（個人カレンダー用）

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成、または既存のプロジェクトを選択
3. **Google Calendar API**を有効化
4. **認証情報**で「OAuth 2.0 クライアント ID」を作成
   - アプリケーションの種類: **デスクトップアプリケーション**
   - 名前: `ChronoFlow Desktop App`
   - **承認済みのリダイレクト URI**: `http://localhost:8081/auth/callback`
     （カスタムポートを使用する場合は適宜変更）
5. クライアントIDとクライアントシークレットをメモ

#### B. APIキー（祝日カレンダー用）

1. 同じプロジェクトで**認証情報**→「APIキーを作成」
2. APIキーの制限を設定（推奨）：
   - **アプリケーションの制限**: なし（デスクトップアプリのため）
   - **API の制限**: Google Calendar API のみ
3. APIキーをメモ

### 2. 環境変数設定

プロジェクトルートに`.env`ファイルを作成：

```bash
# Google OAuth設定（個人カレンダー用）
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret

# Google API キー（祝日カレンダー用）
VITE_GOOGLE_HOLIDAY_API_KEY=your-api-key

# OAuthリダイレクトポート（オプション、デフォルト: 8081）
VITE_OAUTH_REDIRECT_PORT=8081

# 開発用（オプション）
NODE_ENV=development
```

#### 📌 **ポート設定について**

**デスクトップアプリのOAuth認証**では、一時的なローカルサーバーを立ち上げて認証コードを受け取ります：

- **デフォルトポート**: `8081`
- **ポート競合時**: `VITE_OAUTH_REDIRECT_PORT`で変更可能
- **自動検出**: アプリが利用可能なポートを自動検出
- **Google設定**: リダイレクトURIを `http://localhost:[PORT]/auth/callback` に設定

**ポート使用例:**
```bash
# 8081が使用中の場合
VITE_OAUTH_REDIRECT_PORT=8082

# または任意のポート
VITE_OAUTH_REDIRECT_PORT=9000
```

**⚠️ セキュリティ注意事項:**
- `.env`ファイルをgitにコミットしないでください
- 本アプリはデスクトップアプリのため、APIキーが実行ファイルに含まれます
- APIキーは読み取り専用の Calendar API のみに制限してください
- 商用利用の場合は、より安全な認証フローを検討してください

## 🚀 ビルド & 実行

### 開発モード

```bash
# 依存関係をインストール
npm install

# 開発サーバー起動
npm run tauri:dev
```

### 本番ビルド

#### 完全機能ビルド（推奨）

```bash
# OAuth + 祝日APIキー両方を使用
npm run tauri:build:prod
```

#### 開発ビルド（モックデータ含む）

```bash
# 一部機能をモックデータで代替
npm run tauri:build
```

### ビルド成果物

ビルド完了後、以下の場所に実行ファイルが生成されます：

```
src-tauri/target/release/
├── app.exe                 # 実行ファイル
└── bundle/                 # インストーラー
    ├── msi/               # MSIインストーラー  
    └── exe/               # セットアップEXE
```

## 📱 アプリの使用方法

### 初回起動

1. アプリを起動
2. **祝日は自動表示**（APIキー設定済みの場合）
3. 右上の「Googleでログイン」ボタンをクリック
4. **ブラウザで認証画面が開きます**
5. Googleアカウントでログイン・許可
6. **認証完了ページが表示されたらブラウザを閉じてOK**
7. 個人のカレンダーイベントが追加表示されます

### OAuth認証フロー

```
[アプリ] → [ブラウザ認証] → [ローカルサーバー] → [アプリ]
    ↓           ↓              ↓            ↓
  ログイン    Google認証     認証コード受信   トークン取得
  ボタン      ページ表示     (ポート8081)    完了
```

### 機能レベル

| 設定状況 | 祝日表示 | 個人カレンダー | 機能レベル |
|---------|---------|---------------|-----------|
| 設定なし | モック | ❌ | 基本 |
| APIキーのみ | ✅ | ❌ | 中級 |
| OAuth + APIキー | ✅ | ✅ | 完全 |

### 機能説明

- **カレンダー表示**: 月間ビューで日付とイベントを表示
- **ナビゲーション**: 前月/次月ボタンと「今日」ボタン
- **イベント表示**: 
  - 祝日（赤）
  - 個人イベント（緑）
  - 最大2つまで表示、それ以上は「+N more」
- **認証状態**: 右上に接続状態を表示
- **ログアウト**: 接続状態からログアウト可能

## 🛠️ 技術スタック

### フロントエンド
- **React 19**: ユーザーインターフェース
- **TypeScript**: 型安全な開発
- **Tailwind CSS v4**: モダンなスタイリング
- **Vite**: 高速な開発環境

### バックエンド
- **Rust**: システムレベルの処理
- **Tauri**: デスクトップアプリフレームワーク
- **HTTPサーバー**: OAuth認証用ローカルサーバー

### API連携
- **Google Calendar API**: カレンダーデータの取得
- **OAuth 2.0**: 安全な個人カレンダー認証
- **API Key**: 祝日カレンダーの取得

## 📁 プロジェクト構造

```
calender/
├── src/                        # React フロントエンド
│   ├── components/
│   │   ├── Calendar.tsx        # メインカレンダー
│   │   ├── AuthButton.tsx      # 認証ボタン
│   │   └── EventChip.tsx       # イベント表示
│   ├── services/
│   │   ├── googleAuthService.ts      # OAuth認証
│   │   └── googleCalendarService.ts  # カレンダーAPI
│   └── types/
│       └── calendar.ts         # 型定義
├── src-tauri/                  # Rust バックエンド
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs             # OAuth HTTPサーバー
│   └── Cargo.toml
├── .env                        # 環境変数（要作成）
└── package.json
```

## 🔍 トラブルシューティング

### 認証エラー

1. **OAuth認証エラー**
   - クライアントIDが正しく設定されているか確認
   - Google Cloud Consoleで認証情報を再確認
   - デスクトップアプリケーション用のクライアントIDを使用
   - リダイレクトURIが `http://localhost:[PORT]/auth/callback` で設定されているか確認

2. **ポート関連エラー**
   - `VITE_OAUTH_REDIRECT_PORT`を別のポートに変更
   - Google Cloud Consoleのリダイレクト URI も同じポートに更新
   - ファイアウォールがローカルサーバーをブロックしていないか確認

3. **祝日が表示されない**
   - `VITE_GOOGLE_HOLIDAY_API_KEY`が正しく設定されているか確認
   - APIキーの制限設定を確認（Calendar API が有効か）
   - コンソールでAPIエラーメッセージを確認

### ビルドエラー

1. **Rust環境**
   ```bash
   # Rustのインストール確認
   rustc --version
   cargo --version
   ```

2. **Tauriの設定**
   ```bash
   # Tauriのインストール
   npm install -g @tauri-apps/cli
   ```

### 開発環境のポート競合

**よくあるポート競合:**
- `8080`: Webサーバー、開発サーバー
- `8081`: デフォルト設定（変更推奨）
- `3000`: React、Node.js
- `5173`: Vite

**推奨設定:**
```bash
# 使用頻度の低いポート範囲を使用
VITE_OAUTH_REDIRECT_PORT=9000
VITE_OAUTH_REDIRECT_PORT=8500
VITE_OAUTH_REDIRECT_PORT=7500
```

### API制限

Google Calendar APIには1日あたりの使用制限があります：
- **無料**: 1,000,000回/日
- **個人使用**: 通常は十分です
- **祝日API**: 年に1回の取得なので問題なし

## 🔐 セキュリティ考慮事項

### APIキーの保護
- APIキーはGoogle Calendar APIの読み取り専用に制限
- デスクトップアプリのため、完全な秘匿は不可能
- リバースエンジニアリング対策として、コード難読化を検討

### OAuth設定
- クライアントシークレットは実行ファイルに含まれる
- デスクトップアプリの一般的な制約事項
- より高いセキュリティが必要な場合は、サーバーサイド認証を検討

### ローカルサーバー
- OAuth認証時のみ一時的に起動
- 認証完了後は自動停止
- ローカルホストのみでリッスン（外部アクセス不可）

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

---

**⚡ 今すぐ始める:**

```bash
git clone <repository-url>
cd calender
cp .env.example .env  # 環境変数を設定

# .envファイルを編集
# VITE_GOOGLE_CLIENT_ID=...
# VITE_GOOGLE_CLIENT_SECRET=...  
# VITE_GOOGLE_HOLIDAY_API_KEY=...
# VITE_OAUTH_REDIRECT_PORT=8081  # 必要に応じて変更

npm install
npm run tauri:dev
```

**2つの認証方式と柔軟なポート設定で、完全なカレンダーアプリを楽しみましょう！** 🎊

- 🔐 OAuth: 個人カレンダーの管理（ポート自動検出）
- 🔑 APIキー: 日本の祝日表示
- ⚙️ 柔軟設定: ポート競合を回避 