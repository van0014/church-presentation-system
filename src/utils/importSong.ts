import type { Song } from '../types';
import { parseSongText } from './songText';

/**
 * Import a SongSelect-style .txt file (or any plain text using the same conventions).
 *
 * Format:
 *   [Section Name]
 *   line
 *   line
 *
 *   next slide (blank line above)
 *
 *   [Next Section]
 *   ...
 */
export async function importSongFromFile(file: File): Promise<Song> {
  const text = await file.text();
  return importSongFromText(text, file.name);
}

export function importSongFromText(text: string, filenameHint?: string): Song {
  const sections = parseSongText(text);

  // Try to derive a title from the filename or first section
  let title = 'Imported Song';
  if (filenameHint) {
    title = filenameHint
      .replace(/\.txt$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();
    // Capitalize simply
    title = title.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Some SongSelect exports put the title on the first line before any [Section]
  // parseSongText already handles leading lyrics as an implicit section.

  const id = `song-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  return {
    id,
    title,
    sections,
    translations: [],
    lineBreaksReviewed: false,
    rawSource: text,
  };
}

/** Accept a FileList / input change event and return parsed songs */
export async function importSongsFromFiles(files: FileList | File[]): Promise<Song[]> {
  const list = Array.from(files).filter(
    (f) => f.name.toLowerCase().endsWith('.txt') || f.type.startsWith('text/')
  );
  const songs: Song[] = [];
  for (const file of list) {
    try {
      songs.push(await importSongFromFile(file));
    } catch (err) {
      console.warn('Failed to import', file.name, err);
    }
  }
  return songs;
}
