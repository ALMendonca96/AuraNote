# AuraNote ✨

**AuraNote** is a minimalist, high-end quick capture tool designed to be the frictionless entry point for your digital brain. 

Most note-taking apps are too slow. AuraNote follows a simple philosophy: **Capture Now, Organize Later.**

## 💎 The Experience
- **Instant Pop-up:** Hit `Ctrl + Alt + K`, type your insight, and hit `Enter`. The window vanishes, and your thought is safe.
- **Swipe UI:** A luxury interface with glassmorphism and fluid animations.
- **Local-First or Cloud:** Choose to save notes directly into your local Markdown files (Obsidian-friendly) or sync them via Aura Cloud for mobile triage.
- **Cross-Platform:** Beautifully native on Windows, macOS, and Linux.

## 🚀 MVP Features
1. **Instant Desktop Capture:** A lightweight Tauri-powered shell that stays out of your way.
2. **Mobile Triage (PWA):** A dedicated interface to process, archive, or move your daily captures.
3. **Smart Integration:** Send your processed notes to Notion, Obsidian, or custom Webhooks (like your own SaaS).

## 🛠 Tech Stack
- **Desktop:** [Tauri](https://tauri.app/) (Rust + React)
- **Frontend:** [Vite](https://vitejs.dev/) + React + TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + Framer Motion
- **Backend (Optional):** [Supabase](https://supabase.com/)

## 🏗 Setup & Installation
*(Work in progress)*

```bash
# Clone the repository
git clone [https://github.com/SeuUsuario/AuraNote.git](https://github.com/SeuUsuario/AuraNote.git)

# Install dependencies
pnpm install

# Run desktop app in dev mode
pnpm tauri dev
```
