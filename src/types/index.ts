// Core domain types for Church Presenter

export type MediaType = 'song' | 'scripture' | 'image' | 'video' | 'youtube' | 'slideshow' | 'empty';

export interface SongLine {
  id: string;
  text: string;
  /** Canonical line break decided by human review */
  isBreakAfter?: boolean;
}

export interface Translation {
  language: string; // e.g. 'zh', 'es'
  languageName: string;
  lines: SongLine[];
  /** Whole-block vs line-by-line display preference */
  displayMode: 'block' | 'interleaved';
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  ccli?: string;
  lines: SongLine[];
  translations: Translation[];
  /** Whether this song has been human-reviewed for line breaks */
  lineBreaksReviewed: boolean;
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
  fontSizeBase: number; // px
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
  currentSlideIndex: number; // within a multi-slide item (song/scripture)
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
