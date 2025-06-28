import { invoke } from '@tauri-apps/api/core';

export class WindowService {
  /**
   * 最前面表示を切り替える
   * @returns 新しい最前面状態（true: 最前面, false: 通常）
   */
  static async toggleAlwaysOnTop(): Promise<boolean> {
    try {
      return await invoke<boolean>('toggle_always_on_top');
    } catch (error) {
      console.error('最前面表示の切り替えに失敗:', error);
      throw error;
    }
  }

  /**
   * 現在の最前面状態を取得する
   * @returns 最前面状態（true: 最前面, false: 通常）
   */
  static async getAlwaysOnTop(): Promise<boolean> {
    try {
      return await invoke<boolean>('get_always_on_top');
    } catch (error) {
      console.error('最前面状態の取得に失敗:', error);
      throw error;
    }
  }
} 