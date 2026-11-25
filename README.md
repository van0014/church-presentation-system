# Church Presenter

Modern multi-screen church presentation software designed as a replacement for Big Screen Church.

## Features (current)

### Lyrics / Songs (SongSelect-compatible)
- **Blank line = new slide**
- **`[Section]` headers = groups** in the thumbnail / file-manager view
- Full round-trip editor (raw text ↔ structured sections/slides)
- Import `.txt` files in SongSelect style
- Auto line-break suggestions
- Save as canonical after review
- Large section/slide navigator cards

### Operator UI
- Playlist panel with keyboard selection
- Large file-manager style slide navigator (primary surface)
- Library panel
- Control bar + status bar
- Offline detection banner
- Split-view line-break editor with live On screen preview
- Font + text-size fit slider (no px numbers) + optional spacing

### Keyboard
| Key | Action |
|-----|--------|
| `Space` / `↓` | Next item |
| `↑` | Previous item |
| `←` / `→` | Previous / next slide |
| `B` | Black |
| `C` | Clear |
| `Esc` | Cancel black/clear |

### Scriptures
- Verse ranges, primary + secondary translation (NIV + CUV demo)

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

### Import a song
1. Click **Import .txt**
2. Choose a SongSelect-style `.txt` file
3. Review line breaks in the caret editor (split view with On screen preview)
4. Save when it looks right

### Example .txt format

```text
[Verse 1]
Amazing grace, how sweet the sound
That saved a wretch like me

I once was lost, but now am found
Was blind, but now I see

[Chorus]
...
```

## Roadmap

1. Main + Stage output windows
2. Electron / Tauri wrapper
3. Google Drive song library sync + offline cache
4. Scripture lookup
5. Theme / layout editor
6. Stream Deck cue mapping
7. Venue profiles

See DESIGN.md for the operator design paradigm.
