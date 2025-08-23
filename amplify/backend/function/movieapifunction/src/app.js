const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenAI, Type } = require('@google/genai');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json());

// These API keys are securely loaded from environment variables on the AWS server
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

let ai;
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// Endpoint to get movie suggestions from Gemini AI
app.post('/suggest', async (req, res) => {
  if (!ai) {
    return res.status(500).json({ message: 'Gemini AI client not initialized. Check API Key.' });
  }

  const { movies, exclude = [] } = req.body;
  const movieList = movies.map(m => `"${m}"`).join(', ');

  let prompt = `You are a movie recommendation expert. Based on this list of movies: [${movieList}], suggest 5 other movies that a group of people who like these movies would enjoy watching together. The suggestions should be a good mix and logical follow-ups.`;

  if (exclude.length > 0) {
    prompt += ` IMPORTANT: Do not suggest any of the following movies as they have already been suggested: [${exclude.map(e => `"${e}"`).join(', ')}].`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              year: { type: Type.NUMBER },
            },
            required: ["title", "year"],
          },
        },
      },
    });
    
    let jsonStr = response.text.trim();
    res.json(JSON.parse(jsonStr));

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ message: 'Failed to get suggestion from AI.' });
  }
});

// Endpoint to search for movies on TMDb
app.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required.' });
  }
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
  
  try {
    const tmdbRes = await fetch(url);
    const data = await tmdbRes.json();

    const uniqueMovies = new Map();
    data.results.forEach(movie => {
        if (!uniqueMovies.has(movie.title)) {
            uniqueMovies.set(movie.title, movie);
        }
    });

    const results = Array.from(uniqueMovies.values()).map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.substring(0, 4) : 'N/A',
    })).slice(0, 10); // Limit to 10 results

    res.json(results);
  } catch (error) {
    console.error('TMDb Search Error:', error);
    res.status(500).json({ message: 'Failed to search TMDb.' });
  }
});

// Endpoint to get movie details (overview and poster) from TMDb
app.post('/details', async (req, res) => {
  const { title, year, includePoster } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`;

  try {
    const tmdbRes = await fetch(url);
    const data = await tmdbRes.json();

    if (!data.results || data.results.length === 0) {
      return res.json({ overview: "No description found.", posterUrl: null });
    }

    const movie = data.results[0];
    let posterUrl = null;
    if (includePoster && movie.poster_path) {
      posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    }

    res.json({ overview: movie.overview, posterUrl });
  } catch (error) {
    console.error('TMDb Details Error:', error);
    res.status(500).json({ message: 'Failed to get movie details.' });
  }
});


app.listen(3000, function() {
    console.log("App started");
});

module.exports = app;