use std::collections::HashMap;

#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub enum Locale {
    PtBR,
    En,
}

impl Locale {
    pub fn from_str(locale_str: &str) -> Self {
        let locale_lower = locale_str.to_lowercase();
        if locale_lower.starts_with("pt") {
            Locale::PtBR
        } else {
            Locale::En
        }
    }
}

pub fn get_system_locale() -> Locale {
    use std::env;
    
    // Tentar variáveis de ambiente comuns
    if let Ok(lang) = env::var("LANG") {
        return Locale::from_str(&lang);
    }
    
    if let Ok(lc_all) = env::var("LC_ALL") {
        return Locale::from_str(&lc_all);
    }
    
    if let Ok(lc_messages) = env::var("LC_MESSAGES") {
        return Locale::from_str(&lc_messages);
    }

    #[cfg(windows)]
    {
        // No Windows, tentar variáveis de ambiente específicas
        if let Ok(lang) = env::var("LANGUAGE") {
            return Locale::from_str(&lang);
        }
        
        if let Ok(lang) = env::var("LOCALE") {
            return Locale::from_str(&lang);
        }
    }

    // Fallback para inglês
    Locale::En
}

type Translations = HashMap<&'static str, HashMap<Locale, &'static str>>;

fn get_translations() -> Translations {
    let mut translations: Translations = HashMap::new();

    // menu.config_dir
    let mut config_dir = HashMap::new();
    config_dir.insert(Locale::PtBR, "Configurar diretório...");
    config_dir.insert(Locale::En, "Configure directory...");
    translations.insert("menu.config_dir", config_dir);

    // menu.autostart
    let mut autostart = HashMap::new();
    #[cfg(windows)]
    {
        autostart.insert(Locale::PtBR, "Iniciar com Windows");
        autostart.insert(Locale::En, "Start with Windows");
    }
    #[cfg(target_os = "macos")]
    {
        autostart.insert(Locale::PtBR, "Iniciar com macOS");
        autostart.insert(Locale::En, "Start with macOS");
    }
    #[cfg(target_os = "linux")]
    {
        autostart.insert(Locale::PtBR, "Iniciar com o sistema");
        autostart.insert(Locale::En, "Start with system");
    }
    translations.insert("menu.autostart", autostart);

    // menu.mute_sound
    let mut mute_sound = HashMap::new();
    mute_sound.insert(Locale::PtBR, "Mutar som");
    mute_sound.insert(Locale::En, "Mute sound");
    translations.insert("menu.mute_sound", mute_sound);

    // menu.quit
    let mut quit = HashMap::new();
    quit.insert(Locale::PtBR, "Sair do AuraNote");
    quit.insert(Locale::En, "Quit AuraNote");
    translations.insert("menu.quit", quit);

    // error.monitor_size
    let mut monitor_size = HashMap::new();
    monitor_size.insert(Locale::PtBR, "Não foi possível obter o tamanho do monitor");
    monitor_size.insert(Locale::En, "Could not get monitor size");
    translations.insert("error.monitor_size", monitor_size);

    // error.icon_load
    let mut icon_load = HashMap::new();
    icon_load.insert(Locale::PtBR, "Não foi possível carregar o ícone padrão");
    icon_load.insert(Locale::En, "Could not load default icon");
    translations.insert("error.icon_load", icon_load);

    // error.shortcut
    let mut shortcut = HashMap::new();
    shortcut.insert(Locale::PtBR, "Erro ao registrar atalho");
    shortcut.insert(Locale::En, "Error registering shortcut");
    translations.insert("error.shortcut", shortcut);

    // file.note_prefix
    let mut note_prefix = HashMap::new();
    note_prefix.insert(Locale::PtBR, "nota");
    note_prefix.insert(Locale::En, "note");
    translations.insert("file.note_prefix", note_prefix);

    translations
}

static mut CURRENT_LOCALE: Option<Locale> = None;
static mut TRANSLATIONS: Option<Translations> = None;

pub fn init_locale() {
    unsafe {
        CURRENT_LOCALE = Some(get_system_locale());
        TRANSLATIONS = Some(get_translations());
    }
}

pub fn set_locale_from_str(locale_str: &str) {
    unsafe {
        CURRENT_LOCALE = Some(Locale::from_str(locale_str));
        TRANSLATIONS = Some(get_translations());
    }
}

pub fn t(key: &str) -> String {
    unsafe {
        let locale = CURRENT_LOCALE.unwrap_or(Locale::En);
        let translations = TRANSLATIONS.get_or_insert_with(get_translations);
        
        translations
            .get(key)
            .and_then(|map| map.get(&locale))
            .or_else(|| {
                // Fallback para inglês se não encontrar tradução no locale atual
                translations
                    .get(key)
                    .and_then(|map| map.get(&Locale::En))
            })
            .unwrap_or(&key)
            .to_string()
    }
}
