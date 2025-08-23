import { TMDBSearchResult } from '../types';

export const searchMovies = async (query: string): Promise<TMDBSearchResult[]> => {
  if (query.trim().length < 2) {
    return [];
  }
  try {
    const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch from backend search');
    }
    return await response.json();
  } catch (error) {
    console.error("Error searching movies via backend:", error);
    return [];
  }
};

export const fetchMovieDetails = async (title: string, year: number, includePoster: boolean): Promise<{ overview: string; posterUrl: string | null; } | null> => {
  try {
    const response = await fetch(`/api/details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, year, includePoster }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch movie details from backend');
    }
    
    return await response.json();

  } catch (error) {
    console.error(`Error fetching details for "${title}" via backend:`, error);
    return null;
  }
};
