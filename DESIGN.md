# Design paradigm — Church Presenter

Built for **inexperienced operators** under Sunday pressure. Every choice should reduce cognitive load.

## Principles

1. **See what they see**  
   Editing is never abstract. Line breaks are always paired with a live “On screen” preview using the real theme (font, size, text box). If a line is too long or sparse, the operator sees it immediately.

2. **One primary surface**  
   The operator console is for *choosing and fixing content*, not for mirroring the audience display. Large section/slide cards navigate; the main output window is separate.

3. **Click the thing**  
   Prefer spatial actions over toolbars.  
   - Caret snaps to word edges → click to split  
   - Line edge → click to join  
   - Gap between lines → click for a new slide  
   Few or no mode buttons.

4. **Plain language**  
   Labels: “Edit lines”, “On screen”, “new slide”. Avoid jargon (canonical, viewport, etc.) in the UI.

5. **Safe defaults**  
   Imports open in review. Saving marks “reviewed”. Esc cancels. Nothing destructive without an obvious reverse (e.g. click slide break to merge).

6. **Progressive disclosure**  
   Advanced options (raw SongSelect text, theme editor, Stream Deck maps) stay out of the default path.

## Line breaks vs screen layout

| Concern | Where it lives |
|--------|----------------|
| Singing / phrase breaks | Left: caret editor |
| How it fits the screen (wrap, size, box) | Right: live preview |

They stay linked by focus: the slide you hover or edit is the one shown on the right.

## Navigation model

- Playlist (order of service) on the left  
- Large file-manager cards (sections → slides) in the centre  
- Library on the right  
- No duplicate “frontend” preview in the operator UI
