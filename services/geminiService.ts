interface SimpleMovieSuggestion {
  title: string;
  year: number;
}

export const suggestMovie = async (movies: string[], exclude: string[] = []): Promise<SimpleMovieSuggestion[]> => {
  try {
    const response = await fetch('/api/suggest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ movies, exclude }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get suggestions from the backend.');
    }

    const suggestions = await response.json();
    return suggestions as SimpleMovieSuggestion[];

  } catch (error) {
    console.error("Error calling backend for suggestions:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while fetching suggestions.");
  }
};
