import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { motion } from "framer-motion";

const appWindow = getCurrentWebviewWindow();

function App() {
  const [content, setContent] = useState("");
  const [isDark, setIsDark] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
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

  const handleSave = () => {
    console.log("handleSave chamado!");

    if (content.trim()) {
      invoke("save_note", { content })
        .then(() => console.log("Nota salva com sucesso"))
        .catch((err) => console.error("Erro ao salvar nota:", err));
    }

    setContent("");

    console.log("Fechando janela...");
    appWindow
      .hide()
      .then(() => console.log("Janela fechada!"))
      .catch((err) => console.error("Erro ao fechar janela:", err));
  };

  return (
    <div
      className={`p-0 m-0 flex h-screen w-screen items-center justify-center overflow-hidden group ${
        isDark ? "bg-zinc-950" : "bg-(--creme-claro)"
      }`}
    >
      <motion.div
        className="w-full p-0 h-full relative"
        initial={{ x: 100, opacity: 0, scale: 0.96 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        transition={{
          duration: 0.35,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        <button
          onClick={() => setIsDark(!isDark)}
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
            }}
            placeholder="O que você quer lembrar?"
            className={`w-full h-full text-xl font-light tracking-wide leading-tight outline-none bg-transparent resize-none ${
              isDark
                ? "text-zinc-100 placeholder-zinc-700"
                : "text-(--marrom-quente) placeholder-(--taupe-suave)"
            }`}
          />
        </div>
      </motion.div>
    </div>
  );
}

export default App;
