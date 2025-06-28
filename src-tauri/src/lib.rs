use std::net::TcpListener;
use std::io::prelude::*;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use std::sync::LazyLock;
use tauri::Window;

// OAuth認証サーバーの状態を管理
static OAUTH_CANCEL_FLAG: LazyLock<Arc<Mutex<bool>>> = LazyLock::new(|| Arc::new(Mutex::new(false)));

#[tauri::command]
async fn find_available_port(start_port: u16) -> Result<u16, String> {
    for port in start_port..(start_port + 100) {
        if let Ok(_) = TcpListener::bind(format!("127.0.0.1:{}", port)) {
            return Ok(port);
        }
    }
    Err("利用可能なポートが見つかりません".to_string())
}

#[tauri::command]
async fn cancel_oauth_flow() -> Result<(), String> {
    // キャンセルフラグを設定
    if let Ok(mut cancel_flag) = OAUTH_CANCEL_FLAG.lock() {
        *cancel_flag = true;
        println!("OAuth認証キャンセルフラグが設定されました");
    }
    Ok(())
}

#[tauri::command]
async fn toggle_always_on_top(window: Window) -> Result<bool, String> {
    // 現在の状態を取得
    let current_state = window.is_always_on_top()
        .map_err(|e| format!("最前面状態の取得に失敗: {}", e))?;
    
    // 状態を切り替え
    let new_state = !current_state;
    window.set_always_on_top(new_state)
        .map_err(|e| format!("最前面設定に失敗: {}", e))?;
    
    println!("最前面表示を{}にしました", if new_state { "ON" } else { "OFF" });
    Ok(new_state)
}

#[tauri::command]
async fn get_always_on_top(window: Window) -> Result<bool, String> {
    window.is_always_on_top()
        .map_err(|e| format!("最前面状態の取得に失敗: {}", e))
}

#[tauri::command]
async fn start_oauth_flow(url: String, port: u16) -> Result<String, String> {
    // キャンセルフラグをリセット
    if let Ok(mut cancel_flag) = OAUTH_CANCEL_FLAG.lock() {
        *cancel_flag = false;
    }
    
    let auth_code = Arc::new(Mutex::new(None));
    let auth_code_clone = auth_code.clone();
    let cancel_flag_clone = OAUTH_CANCEL_FLAG.clone();
    
    // HTTPサーバーを起動してリダイレクトを受け取る
    let server_handle = thread::spawn(move || -> Result<(), String> {
        let listener = TcpListener::bind(format!("127.0.0.1:{}", port))
            .map_err(|e| format!("ポート{}でサーバーを起動できません: {}", port, e))?;
        
        println!("OAuth認証サーバーをポート{}で起動しました", port);
        
        // 60秒でタイムアウト（短縮）
        listener.set_nonblocking(true).map_err(|e| e.to_string())?;
        let start_time = std::time::Instant::now();
        
        loop {
            // キャンセルフラグをチェック
            if let Ok(cancel_flag) = cancel_flag_clone.lock() {
                if *cancel_flag {
                    println!("OAuth認証がキャンセルされました");
                    return Err("認証がキャンセルされました".to_string());
                }
            }
            
            // タイムアウトチェック（60秒に短縮）
            if start_time.elapsed() > Duration::from_secs(60) {
                println!("OAuth認証がタイムアウトしました");
                return Err("認証タイムアウト（60秒）".to_string());
            }
            
            match listener.accept() {
                Ok((mut stream, _)) => {
                    let mut buffer = [0; 1024];
                    if let Ok(size) = stream.read(&mut buffer) {
                        let request = String::from_utf8_lossy(&buffer[..size]);
                        
                        if let Some(code) = extract_auth_code_from_request(&request) {
                            // 成功レスポンスを送信
                            let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <title>認証完了</title>
                                    <meta charset=\"UTF-8\">
                                    <style>
                                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                                        .success { color: #28a745; }
                                        .container { max-width: 400px; margin: 0 auto; }
                                    </style>
                                </head>
                                <body>
                                    <div class=\"container\">
                                        <h1 class=\"success\">✅ 認証が完了しました！</h1>
                                        <p>ChronoFlowアプリに戻って、カレンダーをお楽しみください。</p>
                                        <p><small>このブラウザタブは閉じても構いません。</small></p>
                                    </div>
                                    <script>
                                        // 3秒後に自動でタブを閉じる（可能な場合）
                                        setTimeout(() => {
                                            try { window.close(); } catch(e) {}
                                        }, 3000);
                                    </script>
                                </body>
                                </html>";
                            let _ = stream.write_all(response.as_bytes());
                            let _ = stream.flush();
                            
                            *auth_code_clone.lock().unwrap() = Some(code);
                            return Ok(());
                        }
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    thread::sleep(Duration::from_millis(100));
                    continue;
                }
                Err(e) => {
                    return Err(format!("接続エラー: {}", e));
                }
            }
        }
    });

    // 外部ブラウザでURLを開く
    if let Err(e) = open::that(&url) {
        return Err(format!("ブラウザを開けませんでした: {}", e));
    }

    // サーバーの完了を待機
    match server_handle.join() {
        Ok(Ok(_)) => {
            // 認証コードを取得
            if let Some(code) = auth_code.lock().unwrap().take() {
                Ok(code)
            } else {
                Err("認証コードが取得できませんでした".to_string())
            }
        }
        Ok(Err(e)) => Err(e),
        Err(_) => Err("サーバースレッドエラー".to_string()),
    }
}

fn extract_auth_code_from_request(request: &str) -> Option<String> {
    // HTTPリクエストから認証コードを抽出
    let lines: Vec<&str> = request.lines().collect();
    if let Some(first_line) = lines.get(0) {
        if first_line.starts_with("GET /auth/callback") {
            if let Some(query_start) = first_line.find('?') {
                let query_part = &first_line[query_start + 1..];
                if let Some(space_pos) = query_part.find(' ') {
                    let query_params = &query_part[..space_pos];
                    
                    for param in query_params.split('&') {
                        if param.starts_with("code=") {
                            return Some(param[5..].to_string());
                        }
                    }
                }
            }
        }
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![find_available_port, cancel_oauth_flow, start_oauth_flow, toggle_always_on_top, get_always_on_top])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

