export interface MovieSuggestion {
  title: string;
  year: number;
  description: string;
  posterUrl?: string | null;
}

export interface TMDBSearchResult {
  id: number;
  title: string;
  year: string;
}

declare global {
  interface Window {
    APP_CONFIG: {
      API_KEY: string;
      TMDB_API_KEY: string;
    }
  }
}