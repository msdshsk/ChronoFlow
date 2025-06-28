import { useState, useEffect } from 'react';
import { googleAuthService } from '../services/googleAuthService';
import type { AuthState } from '../types/calendar';

interface AuthButtonProps {
  onAuthStateChange?: (isAuthenticated: boolean) => void;
}

export function AuthButton({ onAuthStateChange }: AuthButtonProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const currentAuthState = googleAuthService.getAuthState();
    setAuthState(currentAuthState);
    onAuthStateChange?.(currentAuthState.isAuthenticated);
  }, [onAuthStateChange]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await googleAuthService.authenticate();
      if (success) {
        const newAuthState = googleAuthService.getAuthState();
        setAuthState(newAuthState);
        onAuthStateChange?.(newAuthState.isAuthenticated);
      }
    } catch (error) {
      console.error('認証エラー:', error);
      if (error instanceof Error && error.message.includes('キャンセル')) {
        // キャンセルの場合は特別なメッセージを表示しない
        console.log('認証がキャンセルされました');
      } else {
        alert('認証に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await googleAuthService.cancelAuthentication();
      setIsLoading(false);
    } catch (error) {
      console.error('認証キャンセルエラー:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    googleAuthService.logout();
    const newAuthState = googleAuthService.getAuthState();
    setAuthState(newAuthState);
    onAuthStateChange?.(newAuthState.isAuthenticated);
  };

  if (authState.isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Googleアカウントに接続済み</span>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200 transition-colors"
        >
          ログアウト
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>認証中...</span>
        </div>
        <button
          onClick={handleCancel}
          className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md border border-gray-300 transition-colors"
        >
          キャンセル
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Googleでログイン
    </button>
  );
} 