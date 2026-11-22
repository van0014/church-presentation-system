# Church Presentation System

Modern multi-screen church presentation software designed as a reliable replacement for Big Screen Church.

**Repository:** https://github.com/van0014/church-presentation-system

## Features (current foundation)

- **Operator UI** with playlist, live preview, item detail, and control bar
- **Keyboard-first** operation:
  - `Space` / `↓` → Next item
  - `↑` → Previous item
  - `←` / `→` → Previous / next slide within item
  - `B` → Black screen
  - `C` → Clear
  - `Esc` → Cancel black/clear
- **Songs** with multi-line slides, translation blocks (English above, Mandarin below), and line-break review status
- **Scriptures** with verse ranges, primary + secondary translation (NIV + CUV example)
- **Offline detection** with clear warning banner
- **Themes** foundation (dark default with text-box contrast controls)
- **Playlist model** ready for Sunday templates and free-form services
- **Cue system** hooks for Stream Deck / captions per item

## Quick start

```bash
git clone https://github.com/van0014/church-presentation-system.git
cd church-presentation-system
npm install
npm run dev
```

Open the URL shown by Vite (usually http://localhost:5173).

## Architecture direction

Currently a pure web React + TypeScript app for fast development and testing.

**Recommended next step**: wrap with **Electron** or **Tauri** to gain:

- Reliable multi-window (Main audience output + Stage monitor)
- Local file system + media caching
- yt-dlp integration for ad-free YouTube
- Stream Deck / HID support
- Robust offline media handling

The UI is structured so the same React components can drive both the operator window and the output windows (via BroadcastChannel or Electron IPC).

## Project structure

```
src/
  components/
    layout/          Operator shell
    playlist/        Playlist list + items
    lyrics/          Song preview (+ future line-break editor)
    scripture/       Scripture display
    controls/        Preview, control bar, status, item detail
  stores/            PresentationContext (state + actions)
  types/             Full domain model
  styles/            Global design tokens
```

## Roadmap (priority order)

1. **Line-break editor** – auto-suggest + human review → save as canonical
2. **Main + Stage output windows**
3. **Electron / Tauri packaging**
4. **Google Drive sync** for song library (online source of truth)
5. **Local cache modes** (full / day / selective)
6. **Scripture lookup** (mainstream English + Mandarin)
7. **YouTube / video** via yt-dlp + preload
8. **Theme & layout editor**
9. **Stream Deck cue mapping**
10. **Venue profiles**

## Sample data

A demo Sunday playlist is pre-loaded with:

- Welcome / QR image (with caption cue)
- Amazing Grace (English + Mandarin)
- John 3:16-17 (NIV + CUV)
- How Great Thou Art
- Blank slide

Use the keyboard or on-screen controls to navigate.

---

Built for reliability, keyboard speed, and excellent lyrics handling.
