import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Store } from "@tauri-apps/plugin-store";
import { appConfigDir } from "@tauri-apps/api/path";
import { motion } from "framer-motion";

const appWindow = getCurrentWebviewWindow();

function App() {
  const [content, setContent] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [fontSize, setFontSize] = useState(1.25); // 1.25rem = text-xl
  const [showSuccess, setShowSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Log para monitorar mudanças no showSuccess
  useEffect(() => {
    console.log("🟢 showSuccess mudou para:", showSuccess);
  }, [showSuccess]);

  // Função para tocar o som de clique
  const playSuccessSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/src/assets/click.wav");
        audioRef.current.volume = 0.5; // Volume moderado
        audioRef.current.playbackRate = 2.2; // Acelera o som em 120%
      }
      audioRef.current.currentTime = 0; // Reinicia do início
      audioRef.current.play().catch((err) => {
        console.error("Erro ao tocar som:", err);
      });
    } catch (err) {
      console.error("Erro ao carregar som:", err);
    }
  };

  useEffect(() => {
    textareaRef.current?.focus();

    // Carregar configurações salvas
    const loadSettings = async () => {
      try {
        const dataDir = await appConfigDir();
        const store = await Store.load(`${dataDir}store.json`);

        const savedTheme = await store.get<boolean>("theme");
        if (savedTheme !== null && savedTheme !== undefined) {
          setIsDark(savedTheme);
        }

        const savedFontSize = await store.get<number>("fontSize");
        if (
          savedFontSize !== null &&
          savedFontSize !== undefined &&
          savedFontSize > 0
        ) {
          setFontSize(savedFontSize);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const handleBlur = () => {
      setContent("");
      appWindow.hide();
    };

    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const handleSave = async () => {
    console.log(
      "🔵 handleSave iniciado, content:",
      content.trim() ? "tem conteúdo" : "vazio"
    );

    if (content.trim()) {
      console.log("💾 Salvando nota...");

      // Salvar a nota
      invoke("save_note", { content }).catch((err) =>
        console.error("Erro ao salvar nota:", err)
      );

      console.log("🎵 Tocando som...");
      // Tocar som de sucesso
      playSuccessSound();

      console.log("✅ Ativando showSuccess = true");
      // Mostrar animação de sucesso
      setShowSuccess(true);

      console.log("⏱️ Aguardando 350ms...");
      // Aguardar animação completar antes de fechar
      await new Promise((resolve) => setTimeout(resolve, 350));

      console.log("🔄 Limpando estados e fechando...");
      // Limpar estado e fechar
      setShowSuccess(false);
      setContent("");
      appWindow
        .hide()
        .catch((err) => console.error("Erro ao fechar janela:", err));

      console.log("✔️ handleSave completo");
    } else {
      console.log("⚠️ Conteúdo vazio, apenas fechando");
      // Se não houver conteúdo, apenas fechar
      setContent("");
      appWindow
        .hide()
        .catch((err) => console.error("Erro ao fechar janela:", err));
    }
  };

  const handleFontSizeChange = async (increase: boolean) => {
    const newSize = increase
      ? Math.min(fontSize + 0.125, 3) // Máximo 3rem
      : Math.max(fontSize - 0.125, 0.5); // Mínimo 0.5rem

    setFontSize(newSize);
    try {
      const dataDir = await appConfigDir();
      const store = await Store.load(`${dataDir}store.json`);
      await store.set("fontSize", newSize);
      await store.save();
    } catch (err) {
      console.error("Erro ao salvar tamanho da fonte:", err);
    }
  };

  return (
    <div
      className={`p-0 m-0 flex h-screen w-screen items-center justify-center overflow-hidden group ${
        isDark ? "bg-zinc-950" : "bg-(--creme-claro)"
      }`}
    >
      <motion.div
        className="w-full p-0 h-full relative rounded-lg overflow-hidden"
        initial={{ x: 100, opacity: 0, scale: 0.96 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        transition={{
          duration: 0.35,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {/* Fundo verde de sucesso */}
        {showSuccess && (
          <>
            {console.log("🟩 Renderizando fundo verde, isDark:", isDark)}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0.35, 0] }}
              transition={{
                duration: 0.35,
                times: [0, 0.15, 0.7, 1],
                ease: "easeInOut",
              }}
              style={{
                backgroundColor: isDark
                  ? "rgba(34, 197, 94, 0.15)" // Verde escuro sutil para tema dark
                  : "rgba(187, 247, 208, 0.5)", // Verde claro suave para tema light
              }}
            />
          </>
        )}
        <button
          onClick={async () => {
            const newTheme = !isDark;
            setIsDark(newTheme);
            try {
              const dataDir = await appConfigDir();
              const store = await Store.load(`${dataDir}store.json`);
              await store.set("theme", newTheme);
              await store.save();
            } catch (err) {
              console.error("Erro ao salvar tema:", err);
            }
          }}
          className="absolute top-2 right-4 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/10"
          aria-label={
            isDark ? "Alternar para tema claro" : "Alternar para tema escuro"
          }
        >
          {isDark ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-zinc-100"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v2.25m6.364 6.364l-1.591 1.591M21 12h-2.25m-6.364 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-(--marrom-quente)"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
              />
            </svg>
          )}
        </button>
        <div className="flex items-center justify-center m-0 w-full h-full p-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }

              if (e.key === "Escape") {
                e.preventDefault();
                setContent("");
                appWindow.hide();
              }

              // Ctrl++ para aumentar fonte (detectado como "=" ou "+")
              if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "=" || e.key === "+")
              ) {
                e.preventDefault();
                handleFontSizeChange(true);
              }

              // Ctrl+- para diminuir fonte
              if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "-" || e.key === "_")
              ) {
                e.preventDefault();
                handleFontSizeChange(false);
              }
            }}
            placeholder="O que você quer lembrar?"
            style={{ fontSize: `${fontSize}rem` }}
            className={`w-full h-full font-light tracking-wide leading-tight outline-none bg-transparent resize-none ${
              isDark
                ? "text-zinc-100 placeholder-zinc-700"
                : "text-(--marrom-quente) placeholder-(--taupe-suave)"
            }`}
          />
        </div>

        {/* Checkmark de sucesso */}
        {showSuccess && (
          <>
            {console.log("✓ Renderizando checkmark")}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <motion.div
                className="flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  duration: 0.2,
                }}
              >
                <div className="relative">
                  <motion.div
                    className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-10 h-10 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{
                        pathLength: {
                          duration: 0.2,
                          ease: "easeInOut",
                          delay: 0.05,
                        },
                        opacity: { duration: 0.05, delay: 0.05 },
                      }}
                    >
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default App;
