import { invoke } from '@tauri-apps/api/core';

// OAuth設定
const GOOGLE_OAUTH_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  // ポート番号を環境変数で設定可能にする（デフォルト: 8081）
  redirectPort: import.meta.env.VITE_OAUTH_REDIRECT_PORT || '8081',
  scope: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ].join(' '),
  responseType: 'code',
  accessType: 'offline',
};

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

class GoogleAuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  };

  private readonly STORAGE_KEY = 'google_auth_tokens';

  constructor() {
    this.loadStoredTokens();
  }

  /**
   * Google OAuth認証を開始
   */
  async authenticate(): Promise<boolean> {
    try {
      // 利用可能なポートを検出
      const availablePort = await this.findAvailablePort();
      
      // 認証URLを生成
      const authUrl = this.buildAuthUrl(availablePort);
      
      // Tauriで認証フローを開始
      const authCode = await this.openAuthWindow(authUrl, availablePort);
      
      if (!authCode) {
        throw new Error('認証がキャンセルされました');
      }

      // 認証コードをアクセストークンに交換
      const tokens = await this.exchangeCodeForTokens(authCode, availablePort);
      
      // トークンを保存
      this.saveTokens(tokens);
      
      return true;
    } catch (error) {
      console.error('認証エラー:', error);
      return false;
    }
  }

  /**
   * ログアウト
   */
  logout(): void {
    this.authState = {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    };
    
    // ローカルストレージから削除
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * OAuth認証をキャンセル
   */
  async cancelAuthentication(): Promise<void> {
    try {
      // Tauriのコマンドを使用してOAuth認証をキャンセル
      await invoke('cancel_oauth_flow');
    } catch (error) {
      console.error('認証キャンセルエラー:', error);
      throw error;
    }
  }

  /**
   * 有効なアクセストークンを取得
   */
  async getValidAccessToken(): Promise<string | null> {
    if (!this.authState.isAuthenticated) {
      return null;
    }

    // トークンの有効期限をチェック
    const now = Date.now();
    if (this.authState.expiresAt && now >= this.authState.expiresAt) {
      // トークンが期限切れの場合、リフレッシュを試行
      if (this.authState.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          return null;
        }
      } else {
        return null;
      }
    }

    return this.authState.accessToken;
  }

  /**
   * 認証状態を取得
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * 利用可能なポートを検出
   */
  private async findAvailablePort(): Promise<number> {
    try {
      // Tauriのコマンドで利用可能なポートを検出
      const port = await invoke<number>('find_available_port', { 
        startPort: parseInt(GOOGLE_OAUTH_CONFIG.redirectPort) 
      });
      return port;
    } catch (error) {
      console.warn('ポート検出に失敗、デフォルトポートを使用:', error);
      return parseInt(GOOGLE_OAUTH_CONFIG.redirectPort);
    }
  }

  /**
   * 認証URLを構築
   */
  private buildAuthUrl(port: number): string {
    const redirectUri = `http://localhost:${port}/auth/callback`;
    
    const params = new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      redirect_uri: redirectUri,
      scope: GOOGLE_OAUTH_CONFIG.scope,
      response_type: GOOGLE_OAUTH_CONFIG.responseType,
      access_type: GOOGLE_OAUTH_CONFIG.accessType,
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * 認証ウィンドウを開いて認証コードを取得
   */
  private async openAuthWindow(authUrl: string, port: number): Promise<string | null> {
    try {
      // Tauriのコマンドを使用して認証フローを開始
      const result = await invoke<string>('start_oauth_flow', { 
        url: authUrl,
        port: port
      });
      return result;
    } catch (error) {
      console.error('認証ウィンドウエラー:', error);
      return null;
    }
  }

  /**
   * 認証コードをアクセストークンに交換
   */
  private async exchangeCodeForTokens(code: string, port: number): Promise<GoogleTokenResponse> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const redirectUri = `http://localhost:${port}/auth/callback`;
    
    const body = new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`トークン取得エラー: ${response.status}`);
    }

    return response.json();
  }

  /**
   * アクセストークンをリフレッシュ
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.authState.refreshToken) {
      return false;
    }

    try {
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      
      const body = new URLSearchParams({
        client_id: GOOGLE_OAUTH_CONFIG.clientId,
        client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
        refresh_token: this.authState.refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        return false;
      }

      const tokens: GoogleTokenResponse = await response.json();
      this.saveTokens(tokens);
      
      return true;
    } catch (error) {
      console.error('トークンリフレッシュエラー:', error);
      return false;
    }
  }

  /**
   * トークンを保存
   */
  private saveTokens(tokens: GoogleTokenResponse): void {
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    
    this.authState = {
      isAuthenticated: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || this.authState.refreshToken,
      expiresAt,
    };

    // ローカルストレージに保存
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || this.authState.refreshToken,
      expiresAt,
    }));
  }

  /**
   * 保存されたトークンを読み込み
   */
  private loadStoredTokens(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const tokens = JSON.parse(stored);
        
        // 有効期限をチェック
        if (tokens.expiresAt && Date.now() < tokens.expiresAt) {
          this.authState = {
            isAuthenticated: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
          };
        }
      }
    } catch (error) {
      console.error('保存されたトークンの読み込みエラー:', error);
    }
  }
}

export const googleAuthService = new GoogleAuthService(); 