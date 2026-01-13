use tauri::Manager;
use tauri::PhysicalPosition;
// Importamos o necessário para o atalho global
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn save_note(content: String) -> Result<(), String> {
    // TODO: Implementar salvamento da nota
    println!("Salvando nota: {}", content);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // 1. Registramos o plugin de atalhos globais
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // 2. Definimos o atalho: CTRL + ALT + K
            let ctrl_alt_k = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyK);

            // let app_handle = app.handle().clone();

            // 3. Registramos o atalho e definimos a função de callback
            app.global_shortcut().on_shortcut(ctrl_alt_k, move |_app, shortcut, event| {
                if shortcut == &ctrl_alt_k && event.state() == ShortcutState::Pressed {
                    let window = _app.get_webview_window("main").unwrap();
                    
                    if window.is_visible().unwrap() {
                        window.hide().unwrap();
                    } else {
                        // Posicionar no canto superior direito antes de mostrar
                        if let Some(monitor) = window.current_monitor().unwrap() {
                            let monitor_size = monitor.size();
                            let window_size = window.outer_size().unwrap();
                            
                            // Calcular posição: canto superior direito com margem de 20px
                            let x = monitor_size.width as i32 - window_size.width as i32 - 20;
                            let y = 20;
                            
                            let position = PhysicalPosition::new(x, y);
                            window.set_position(position).unwrap();
                        }
                        
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                }
            }).expect("Erro ao registrar atalho global");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, save_note])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}