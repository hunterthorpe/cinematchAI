import React, { useState, useEffect, useCallback, useRef } from 'react';
import { suggestMovie } from './services/geminiService';
import { searchMovies, fetchMovieDetails } from './services/tmdbService';
import { MovieSuggestion, TMDBSearchResult } from './types';
import { FilmIcon } from './components/icons';

interface MovieInput {
  title: string;
  year: string | null;
}

export const API_BASE_URL = "https://2yfxzgh101.execute-api.ap-southeast-2.amazonaws.com/"; 

const App: React.FC = () => {
  const [numVoters, setNumVoters] = useState<number>(2);
  const [movieInputs, setMovieInputs] = useState<MovieInput[]>(Array(2).fill({ title: '', year: null }));
  const [suggestions, setSuggestions] = useState<MovieSuggestion[] | null>(null);
  const [suggestedMoviesHistory, setSuggestedMoviesHistory] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [tmdbSuggestions, setTmdbSuggestions] = useState<TMDBSearchResult[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState<boolean>(false);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMovieInputs(currentInputs => {
      const newInputs = Array(numVoters).fill({ title: '', year: null });
      for (let i = 0; i < Math.min(currentInputs.length, numVoters); i++) {
        newInputs[i] = currentInputs[i];
      }
      return newInputs;
    });
  }, [numVoters]);

  // Debounce effect for movie search
  useEffect(() => {
    if (activeInputIndex === null || movieInputs[activeInputIndex]?.title.trim().length < 2) {
      setTmdbSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSuggestionsLoading(true);
      const results = await searchMovies(movieInputs[activeInputIndex].title);
      setTmdbSuggestions(results);
      setIsSuggestionsLoading(false);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [movieInputs, activeInputIndex]);
  
  // Handle clicks outside suggestion box
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target as Node)) {
        setActiveInputIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMovieInputChange = (index: number, value: string) => {
    const newInputs = [...movieInputs];
    newInputs[index] = { title: value, year: null }; // Clear year on manual edit
    setMovieInputs(newInputs);
    setActiveInputIndex(index);
    if(value.trim().length < 2) {
        setTmdbSuggestions([]);
    }
  };

  const handleSuggestionClick = (index: number, movie: TMDBSearchResult) => {
    const newInputs = [...movieInputs];
    newInputs[index] = { title: movie.title, year: movie.year };
    setMovieInputs(newInputs);
    setTmdbSuggestions([]);
    setActiveInputIndex(null);
  };

  const generateRecommendations = useCallback(async (excludeList: string[]) => {
    setActiveInputIndex(null);
    const filledMovies = movieInputs
      .filter(movie => movie.title.trim() !== '')
      .map(movie => movie.year ? `${movie.title} (${movie.year})` : movie.title);

    if (filledMovies.length < 1) {
      setError("Please enter at least one movie.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Step 1: Get movie titles and years from Gemini, excluding seen ones
      const initialSuggestions = await suggestMovie(filledMovies, excludeList);

      if (initialSuggestions.length === 0) {
        setError("The AI couldn't find any new movies to suggest. Try a different set of inputs.");
        setSuggestions([]); // Clear old suggestions if any
        return;
      }

      // Step 2: Enrich suggestions with details from TMDb
      const detailedSuggestions = await Promise.all(
        initialSuggestions.map(async (suggestion, index) => {
          const details = await fetchMovieDetails(suggestion.title, suggestion.year, index === 0); // Only fetch poster for the top result
          return {
            ...suggestion,
            description: details?.overview ?? "No description available.",
            posterUrl: details?.posterUrl
          };
        })
      );
      
      setSuggestions(detailedSuggestions);
      // Update history with the new suggestions
      setSuggestedMoviesHistory(prevHistory => {
        const newHistory = new Set(prevHistory);
        detailedSuggestions.forEach(s => newHistory.add(s.title));
        return newHistory;
      });

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [movieInputs]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // For a new search, clear the history and fetch with no exclusions.
    setSuggestedMoviesHistory(new Set());
    setSuggestions(null);
    generateRecommendations([]);
  };

  const handleTryAgain = () => {
    // For a retry, fetch with the current list of already-seen movies.
    generateRecommendations(Array.from(suggestedMoviesHistory));
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4 selection:bg-purple-500/50">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <FilmIcon className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Cinematch AI
            </h1>
          </div>
          <p className="text-lg text-gray-300">
            Find the perfect movie for your group. Let AI be your guide.
          </p>
        </header>

        <main className="bg-white/5 backdrop-blur-md p-8 rounded-2xl shadow-2xl shadow-purple-500/10 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="numVoters" className="block text-lg font-medium text-gray-200 mb-2">
                How many are watching?
              </label>
              <div className="relative">
                <select
                  id="numVoters"
                  value={numVoters}
                  onChange={(e) => setNumVoters(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 appearance-none"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num} className="bg-gray-800">
                      {num} {num === 1 ? 'Person' : 'People'}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {movieInputs.map((movie, index) => (
                <div key={index} className="relative" ref={activeInputIndex === index ? suggestionBoxRef : null}>
                  <label htmlFor={`movie-${index}`} className="sr-only">
                    Person {index + 1}'s Movie
                  </label>
                  <input
                    id={`movie-${index}`}
                    type="text"
                    value={movie.title}
                    onChange={(e) => handleMovieInputChange(index, e.target.value)}
                    onFocus={() => setActiveInputIndex(index)}
                    placeholder={`Person ${index + 1}'s movie choice...`}
                    className="w-full pl-4 pr-16 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                    autoComplete="off"
                  />
                  {movie.year && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 pointer-events-none">
                      {movie.year}
                    </span>
                  )}
                  {activeInputIndex === index && (isSuggestionsLoading || tmdbSuggestions.length > 0) && (
                     <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <ul>
                            {isSuggestionsLoading && <li className="px-4 py-2 text-gray-400">Searching...</li>}
                            {!isSuggestionsLoading && tmdbSuggestions.map((s) => (
                                <li 
                                    key={s.id} 
                                    className="px-4 py-2 hover:bg-purple-500/20 cursor-pointer flex justify-between items-center"
                                    onClick={() => handleSuggestionClick(index, s)}
                                >
                                    <span>{s.title}</span>
                                    <span className="text-gray-400">{s.year}</span>
                                </li>
                            ))}
                             {!isSuggestionsLoading && tmdbSuggestions.length === 0 && movieInputs[index].title.length > 1 &&
                                <li className="px-4 py-2 text-gray-400">No results found.</li>
                             }
                        </ul>
                     </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Finding your movie...
                </>
              ) : "Find Our Movie"}
            </button>
          </form>
        </main>

        <section className="min-h-[16rem] flex items-center justify-center">
          {isLoading && !suggestions && (
            <div className="text-center text-gray-400">
              <p>The AI is thinking... this can take a moment.</p>
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-300 p-4 rounded-lg text-center">
              <h3 className="font-bold mb-2">An Error Occurred</h3>
              <p>{error}</p>
            </div>
          )}
          {suggestions && suggestions.length > 0 && (
            <div className="w-full space-y-8 animate-fade-in">
              {/* Top Suggestion */}
              <div className="w-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl shadow-lg border border-white/10 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 p-8">
                  <div className="md:col-span-1 flex justify-center items-center">
                    {suggestions[0].posterUrl ? (
                      <img src={suggestions[0].posterUrl} alt={`Poster for ${suggestions[0].title}`} className="rounded-lg shadow-2xl object-cover w-full max-w-xs md:max-w-none animate-fade-in" />
                    ) : (
                      <div className="w-full aspect-[2/3] max-w-xs md:max-w-none bg-gray-800 rounded-lg flex items-center justify-center">
                        <FilmIcon className="w-16 h-16 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2 flex flex-col justify-center text-center md:text-left">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-200 mb-2">Your Top Movie Match:</h2>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(`${suggestions[0].title} (${suggestions[0].year})`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-blue-400 to-purple-500 mb-4 hover:brightness-125 transition-all"
                    >
                      {suggestions[0].title} ({suggestions[0].year})
                    </a>
                    <p className="text-gray-300">"{suggestions[0].description}"</p>
                  </div>
                </div>
              </div>
              
              {/* Other Suggestions */}
              {suggestions.length > 1 && (
                <div>
                  <h3 className="text-xl font-bold text-center mb-4 text-gray-300">Other Great Options:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.slice(1).map((s, index) => (
                      <div key={index} className="bg-white/5 p-6 rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-300">
                        <h4 className="text-xl font-bold text-purple-300 mb-2">
                          <a 
                            href={`https://www.google.com/search?q=${encodeURIComponent(`${s.title} (${s.year})`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {s.title} ({s.year})
                          </a>
                        </h4>
                        <p className="text-gray-400">"{s.description}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Try Again Button */}
              <div className="flex justify-center pt-4">
                  <button
                    onClick={handleTryAgain}
                    disabled={isLoading}
                    className="w-full max-w-sm flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Getting new ideas...
                      </>
                    ) : "Try Again"}
                  </button>
              </div>

            </div>
          )}
        </section>
      </div>
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default App;