use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri::{menu::{Menu, MenuItem, PredefinedMenuItem, CheckMenuItem}, tray::TrayIconBuilder};
use tauri_plugin_store::StoreBuilder;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use std::fs::{create_dir_all, File};
use std::io::Write;
use std::path::PathBuf;
use chrono::Local;

fn position_window_top_right(window: &tauri::WebviewWindow) {
    if let Ok(Some(monitor)) = window.primary_monitor() {
        let size = monitor.size();
        let window_width = 520.0;
        let padding = 16.0;
        
        let x = size.width as f64 - window_width - padding;
        let y = padding;
        
        let _ = window.set_position(tauri::LogicalPosition::new(x, y));
    }
}

fn get_save_directory(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = app.path().app_config_dir().map_err(|e| e.to_string())?;
    let store_path = path.join("store.json");
    
    let store = StoreBuilder::new(app, store_path.clone())
        .build()
        .map_err(|e| e.to_string())?;
    
    if let Some(dir) = store.get("save_directory") {
        if let Some(dir_str) = dir.as_str() {
            let dir_path = PathBuf::from(dir_str);
            if dir_path.exists() {
                return Ok(dir_path);
            }
        }
    }
    
    // Fallback para diretório padrão
    let mut default_path = app.path().document_dir().map_err(|e| e.to_string())?;
    default_path.push("AuraNote");
    Ok(default_path)
}

#[tauri::command]
fn save_note(app: tauri::AppHandle, content: String) -> Result<(), String> {
    if content.trim().is_empty() { return Ok(()); }

    let mut path = get_save_directory(&app)?;
    create_dir_all(&path).map_err(|e| e.to_string())?;

    let timestamp = Local::now().format("%Y-%m-%d-%H-%M-%S");
    let filename = format!("nota-{}.md", timestamp);
    path.push(filename);

    let mut file = File::create(path).map_err(|e| e.to_string())?;
    write!(file, "{}", content).map_err(|e| e.to_string())?;
    Ok(())
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec![])))
        .setup(|app| {
            let config_dir_i = MenuItem::with_id(app, "config_dir", "Configurar diretório...", true, None::<&str>)?;
            
            // Verificar estado inicial do autostart
            let is_enabled = app.autolaunch().is_enabled().unwrap_or(false);
            let autostart_i = CheckMenuItem::with_id(app, "autostart", "Iniciar com Windows", true, is_enabled, None::<&str>)?;
            
            let separator = PredefinedMenuItem::separator(app)?;
            let quit_i = MenuItem::with_id(app, "quit", "Sair do AuraNote", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&config_dir_i, &autostart_i, &separator, &quit_i])?;

            let icon = app.default_window_icon()
                .ok_or("Não foi possível carregar o ícone padrão")?
                .clone();

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    if event.id() == "quit" {
                        app.exit(0);
                    } else if event.id() == "config_dir" {
                        if let Some(window) = app.get_webview_window("main") {
                            let app_handle = app.clone();
                            window.dialog().file().pick_folder(move |path_opt| {
                                if let Some(path) = path_opt {
                                    let path_str = path.to_string();
                                    let config_path = app_handle.path().app_config_dir()
                                        .and_then(|p| Ok(p.join("store.json")));
                                    
                                    if let Ok(store_path) = config_path {
                                        if let Ok(store) = StoreBuilder::new(&app_handle, store_path.clone()).build() {
                                            let _ = store.set("save_directory".to_string(), serde_json::json!(path_str));
                                            let _ = store.save();
                                        }
                                    }
                                }
                            });
                        }
                    } else if event.id() == "autostart" {
                        let autostart_manager = app.autolaunch();
                        if let Ok(is_enabled) = autostart_manager.is_enabled() {
                            if is_enabled {
                                let _ = autostart_manager.disable();
                            } else {
                                let _ = autostart_manager.enable();
                            }
                        }
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                             position_window_top_right(&window);
                             let _ = window.show();
                             let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            
            let ctrl_alt_k = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyK);
            
            
            let app_handle = app.handle().clone();

            app.global_shortcut().on_shortcut(ctrl_alt_k, move |_app, shortcut, event| {
                if shortcut == &ctrl_alt_k && event.state() == ShortcutState::Pressed {
                    let window = app_handle.get_webview_window("main").unwrap();
                    if window.is_visible().unwrap() {
                        let _ = window.hide();
                    } else {
                        position_window_top_right(&window);
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }).expect("Erro ao registrar atalho");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![save_note])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
