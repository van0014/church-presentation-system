# Church Presenter

Modern multi-screen church presentation software designed as a replacement for Big Screen Church.

## Features (current)

### Lyrics / Songs (SongSelect-compatible)
- **Blank line = new slide**
- **`[Section]` headers = groups** in the thumbnail / file-manager view
- Full round-trip editor (raw text ↔ structured sections/slides)
- Import `.txt` files in SongSelect style
- Auto line-break suggestions
- "Save as Canonical" marks a song as reviewed
- Thumbnail strip shows sections as groups and slides as cards
- Click a thumbnail to jump to that slide

### Operator UI
- Playlist panel with keyboard selection
- Live preview (Main output simulation)
- Item detail with line-break review status
- Library panel with song list + live slide thumbnails
- Control bar + status bar
- Offline detection banner

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
cd church-presenter
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

### Import a song
1. Click **Import .txt** in the header (or **+ Import** in the Library panel)
2. Choose a SongSelect-style `.txt` file
3. The song opens in the editor for review
4. Click **Save as Canonical** when line breaks look right

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

- `[Verse 1]` → section group
- Blank line → new slide inside that section
- Ordinary lines → lyric text on the current slide

## Project structure

```
src/
  components/
    layout/          Operator shell
    playlist/        Playlist list
    lyrics/          SongPreview, SongEditor, SongThumbnailStrip
    scripture/       Scripture display
    controls/        Preview, control bar, status, item detail
  stores/            PresentationContext
  types/             Domain model (sections → slides → lines)
  utils/             songText parser/serializer, importSong
```

## Roadmap

1. Main + Stage output windows
2. Electron / Tauri wrapper (multi-window, yt-dlp, Stream Deck, local media)
3. Google Drive song library sync + offline cache modes
4. Scripture lookup (mainstream English + Mandarin)
5. Theme / layout editor
6. Stream Deck cue mapping
7. Venue profiles

---

Built for reliability, keyboard speed, and excellent lyrics handling.
