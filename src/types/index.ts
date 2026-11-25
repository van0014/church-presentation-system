// Core domain types for Church Presenter

export type MediaType = 'song' | 'scripture' | 'image' | 'video' | 'youtube' | 'slideshow' | 'empty';

/**
 * A single line of lyrics text.
 * Blank lines in the source text become slide breaks (they are not stored as SongLine).
 */
export interface SongLine {
  id: string;
  text: string;
}

/**
 * One slide = a group of consecutive non-blank lines.
 * In SongSelect-style .txt, slides are separated by a blank line.
 */
export interface SongSlide {
  id: string;
  lines: SongLine[];
}

/**
 * A named section / container (e.g. [Verse 1], [Chorus], [Intro]).
 * In the thumbnail / file-manager view each section is a distinct group.
 * Inside a section, blank lines create separate slides.
 */
export interface SongSection {
  id: string;
  /** Label as it appears in the file, e.g. "Verse 1", "Chorus", "Intro" */
  label: string;
  slides: SongSlide[];
}

export interface Translation {
  language: string; // e.g. 'zh', 'es'
  languageName: string;
  /** Same section/slide structure as the primary lyrics */
  sections: SongSection[];
  /** Whole-block vs line-by-line display preference */
  displayMode: 'block' | 'interleaved';
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  ccli?: string;
  /**
   * Canonical structure:
   * - [Section] headers → SongSection (groups in thumbnail view)
   * - blank line inside a section → new SongSlide
   */
  sections: SongSection[];
  translations: Translation[];
  /** Whether line breaks / slide breaks have been human-reviewed */
  lineBreaksReviewed: boolean;
  /** Raw source text (SongSelect-style) kept for round-trip editing */
  rawSource?: string;
  tags?: string[];
  lastUsed?: string; // ISO date
  googleDriveFileId?: string;
}

export interface Scripture {
  id: string;
  reference: string; // e.g. "John 3:16-18"
  translation: string; // e.g. "NIV", "ESV", "CUV"
  verses: { number: number; text: string }[];
  /** Optional second translation for side-by-side / below */
  secondaryTranslation?: {
    code: string;
    verses: { number: number; text: string }[];
  };
}

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  /** For songs */
  songId?: string;
  /** For scriptures */
  scripture?: Scripture;
  /** For image / video / youtube */
  source?: string; // local path, URL, or YouTube ID
  thumbnail?: string;
  duration?: number; // seconds
  /** Looping video flag */
  loop?: boolean;
  /** Stream Deck / cue triggers */
  cues?: {
    streamDeckAction?: string;
    lightingScene?: string;
    startCaptions?: boolean;
  };
  notes?: string;
}

export interface PlaylistItem extends MediaItem {
  order: number;
  /** Optional override theme for this item */
  themeOverrideId?: string;
}

export interface Playlist {
  id: string;
  name: string;
  date?: string; // ISO date for Sunday services
  items: PlaylistItem[];
  isTemplate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Theme {
  id: string;
  name: string;
  isDefault?: boolean;
  // Visual
  backgroundColor: string;
  backgroundImage?: string;
  textColor: string;
  secondaryTextColor: string;
  fontFamily: string;
  /** Internal px — operators only see a "fit" slider, never this number */
  fontSizeBase: number;
  /** em — letter spacing (config) */
  letterSpacing?: number;
  /** em — word spacing (config) */
  wordSpacing?: number;
  // Text backing box
  textBoxEnabled: boolean;
  textBoxColor: string;
  textBoxOpacity: number; // 0-1
  textBoxPadding: number;
  textBoxBorderRadius: number;
  // Layout
  lyricsPosition: 'center' | 'lower-third' | 'top' | 'bottom';
  scriptureLayout: 'centered' | 'side-by-side' | 'stacked';
  maxLinesPerSlide: number;
  // Opacity / transitions
  transitionMs: number;
}

export interface Venue {
  id: string;
  name: string;
  defaultThemeId: string;
  mainScreenResolution?: string;
  stageScreenResolution?: string;
  streamDeckMappings?: Record<string, string>;
  notes?: string;
}

export interface AppSettings {
  currentVenueId?: string;
  defaultThemeId: string;
  preferredBibleTranslations: string[]; // e.g. ['NIV', 'ESV', 'CUV']
  cacheMode: 'full' | 'day' | 'selective';
  offlineWarningEnabled: boolean;
  youtubeQuality: '1080p' | '720p' | 'best';
  keyboardShortcuts: Record<string, string>;
}

export interface PresentationState {
  currentPlaylistId: string | null;
  currentItemIndex: number;
  /** Slide currently shown on Main / Stage (live) */
  currentSlideIndex: number;
  /**
   * Operator cursor within the current item (preview highlight).
   * Arrows move this; Space commits it to currentSlideIndex (presented).
   */
  cursorSlideIndex: number;
  isBlack: boolean;
  isClear: boolean;
  isOnline: boolean;
  stageVisible: boolean;
  mainVisible: boolean;
}

// For multi-window communication
export type WindowMessage =
  | { type: 'PRESENTATION_UPDATE'; payload: PresentationState & { item?: PlaylistItem; song?: Song; scripture?: Scripture } }
  | { type: 'THEME_UPDATE'; payload: Theme }
  | { type: 'BLACK'; }
  | { type: 'CLEAR'; }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'GOTO'; index: number };
