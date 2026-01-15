import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Store } from "@tauri-apps/plugin-store";
import { appConfigDir } from "@tauri-apps/api/path";
import { listen } from "@tauri-apps/api/event";
import { motion } from "framer-motion";

const appWindow = getCurrentWebviewWindow();

function App() {
  const [content, setContent] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [fontSize, setFontSize] = useState(1.25);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSuccessSound = () => {
    if (isMuted) return;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/src/assets/click.wav");
        audioRef.current.volume = 0.5;
        audioRef.current.playbackRate = 2.2;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch (err) {}
  };

  useEffect(() => {
    textareaRef.current?.focus();

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

        const savedMute = await store.get<boolean>("mute_sound");
        if (savedMute !== null && savedMute !== undefined) {
          setIsMuted(savedMute);
        }
      } catch (err) {}
    };

    loadSettings();
  }, []);

  const hideWindowWithSlideOut = async () => {
    try {
      const { LogicalPosition } = await import("@tauri-apps/api/dpi");
      const [monitorWidth] = await invoke<[number, number]>("get_monitor_size");

      const currentPosition = await appWindow.outerPosition();
      const currentX = currentPosition.x;
      const currentY = currentPosition.y;

      const finalX = monitorWidth;
      const distance = finalX - currentX;

      const steps = 15;
      const duration = 200;
      const stepDuration = duration / steps;

      for (let i = 1; i <= steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, stepDuration));
        const progress = i / steps;
        const easedProgress = progress * progress;
        const newX = currentX + distance * easedProgress;
        await appWindow.setPosition(new LogicalPosition(newX, currentY));
      }

      await appWindow.setPosition(new LogicalPosition(finalX, currentY));
      await appWindow.hide();
    } catch (err) {
      await appWindow.hide();
    }
  };

  useEffect(() => {
    const handleBlur = async () => {
      setContent("");
      await hideWindowWithSlideOut();
    };

    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let unlistenShow: (() => void) | undefined;
    let unlistenHide: (() => void) | undefined;

    const registerListeners = async () => {
      try {
        unlisten = await listen<boolean>("mute_changed", (event) => {
          setIsMuted(!!event.payload);
        });

        unlistenShow = await listen("window-show", async () => {
          try {
            const { LogicalPosition } = await import("@tauri-apps/api/dpi");
            const [monitorWidth] = await invoke<[number, number]>(
              "get_monitor_size"
            );

            const windowWidth = 520;
            const padding = 16;

            const finalX = monitorWidth - windowWidth - padding;
            const finalY = padding;

            const startX = monitorWidth;
            const startY = padding;

            await appWindow.setPosition(new LogicalPosition(startX, startY));

            await new Promise((resolve) => setTimeout(resolve, 16));

            const steps = 20;
            const duration = 200;
            const stepDuration = duration / steps;
            const distance = startX - finalX;

            for (let i = 1; i <= steps; i++) {
              const progress = i / steps;
              const easedProgress =
                progress < 1 ? 1 - Math.pow(1 - progress, 3) : 1;
              const currentX = startX - distance * easedProgress;
              await appWindow.setPosition(
                new LogicalPosition(currentX, finalY)
              );

              if (i < steps) {
                await new Promise((resolve) =>
                  setTimeout(resolve, stepDuration)
                );
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 10));
            await appWindow.setPosition(new LogicalPosition(finalX, finalY));
          } catch (err) {}
        });

        unlistenHide = await listen("window-hide", async () => {
          try {
            const { LogicalPosition } = await import("@tauri-apps/api/dpi");
            const [monitorWidth] = await invoke<[number, number]>(
              "get_monitor_size"
            );

            const currentPosition = await appWindow.outerPosition();
            const currentX = currentPosition.x;
            const currentY = currentPosition.y;

            const finalX = monitorWidth;
            const distance = finalX - currentX;

            const steps = 15;
            const duration = 200;
            const stepDuration = duration / steps;

            for (let i = 1; i <= steps; i++) {
              await new Promise((resolve) => setTimeout(resolve, stepDuration));
              const progress = i / steps;
              const easedProgress = progress * progress;
              const newX = currentX + distance * easedProgress;
              await appWindow.setPosition(new LogicalPosition(newX, currentY));
            }

            await appWindow.setPosition(new LogicalPosition(finalX, currentY));
          } catch (err) {}
        });
      } catch (err) {}
    };

    registerListeners();

    return () => {
      if (unlisten) unlisten();
      if (unlistenShow) unlistenShow();
      if (unlistenHide) unlistenHide();
    };
  }, []);

  const handleSave = async () => {
    if (content.trim()) {
      invoke("save_note", { content }).catch(() => {});

      playSuccessSound();
      setShowSuccess(true);

      await new Promise((resolve) => setTimeout(resolve, 350));

      setShowSuccess(false);
      setContent("");
      await hideWindowWithSlideOut();
    } else {
      setContent("");
      await hideWindowWithSlideOut();
    }
  };

  const handleFontSizeChange = async (increase: boolean) => {
    const newSize = increase
      ? Math.min(fontSize + 0.125, 3)
      : Math.max(fontSize - 0.125, 0.5);

    setFontSize(newSize);
    try {
      const dataDir = await appConfigDir();
      const store = await Store.load(`${dataDir}store.json`);
      await store.set("fontSize", newSize);
      await store.save();
    } catch (err) {}
  };

  return (
    <div
      className={`p-0 m-0 flex h-screen w-screen items-center justify-center overflow-hidden group ${
        isDark ? "bg-zinc-950" : "bg-(--creme-claro)"
      }`}
    >
      <div className="w-full p-0 h-full relative rounded-lg overflow-hidden">
        {showSuccess && (
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
                ? "rgba(34, 197, 94, 0.15)"
                : "rgba(187, 247, 208, 0.5)",
            }}
          />
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
            } catch (err) {}
          }}
          className="absolute top-2 right-4 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/10"
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
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
                hideWindowWithSlideOut();
              }

              if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "=" || e.key === "+")
              ) {
                e.preventDefault();
                handleFontSizeChange(true);
              }

              if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "-" || e.key === "_")
              ) {
                e.preventDefault();
                handleFontSizeChange(false);
              }
            }}
            placeholder="What's on your mind?"
            style={{ fontSize: `${fontSize}rem` }}
            className={`w-full h-full font-light tracking-wide leading-tight outline-none bg-transparent resize-none ${
              isDark
                ? "text-zinc-100 placeholder-zinc-700"
                : "text-(--marrom-quente) placeholder-(--taupe-suave)"
            }`}
          />
        </div>

        {showSuccess && (
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
        )}
      </div>
    </div>
  );
}

export default App;
