use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, WebviewUrl, WebviewWindowBuilder,
};

#[tauri::command]
async fn open_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("chat") {
        let _ = win.show();
        let _ = win.set_focus();
        return Ok(());
    }

    let (chat_x, chat_y) = if let Some(pet_win) = app.get_webview_window("pet") {
        if let Ok(pos) = pet_win.outer_position() {
            (pos.x as f64 - 400.0, pos.y as f64 - 150.0)
        } else {
            (600.0, 300.0)
        }
    } else {
        (600.0, 300.0)
    };

    WebviewWindowBuilder::new(
        &app,
        "chat",
        WebviewUrl::App("index.html?mode=chat".into()),
    )
    .title("ClaudePet Chat")
    .inner_size(380.0, 520.0)
    .position(chat_x.max(0.0), chat_y.max(0.0))
    .decorations(false)
    .always_on_top(true)
    .resizable(true)
    .skip_taskbar(true)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn close_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("chat") {
        let _ = win.close();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![open_chat_window, close_chat_window])
        .setup(|app| {
            let show = MenuItem::with_id(app, "show", "显示 ClaudePet", true, None::<&str>)?;
            let chat = MenuItem::with_id(app, "chat", "打开对话", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &chat, &quit])?;

            TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("ClaudePet - 晨在这里")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("pet") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "chat" => {
                        let app = app.clone();
                        tauri::async_runtime::spawn(async move {
                            let _ = open_chat_window(app).await;
                        });
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
