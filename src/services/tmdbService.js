const axios = require("axios");

class TMDBService {
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    this.baseURL = process.env.TMDB_BASE_URL;
    this.imageBaseURL = "https://image.tmdb.org/t/p/";

    // Create axios instance with default config
    this.api = axios.create({
      baseURL: this.baseURL,
      params: {
        api_key: this.apiKey,
      },
      timeout: 10000,
    });
  }

  async searchMovies(query, page = 1) {
    try {
      const response = await this.api.get("/search/movie", {
        params: {
          query,
          page,
          include_adult: false,
        },
      });
      return this.formatMovieResults(response.data);
    } catch (error) {
      throw new Error("Failed to search movies");
    }
  }

  async getMovieDetails(movieId) {
    try {
      const [movieResponse, creditsResponse, videosResponse] =
        await Promise.all([
          this.api.get(`/movie/${movieId}`),
          this.api.get(`/movie/${movieId}/credits`),
          this.api.get(`/movie/${movieId}/videos`),
        ]);

      return this.formatMovieDetails(
        movieResponse.data,
        creditsResponse.data,
        videosResponse.data
      );
    } catch (error) {
      throw new Error("Failed to get movie details");
    }
  }

  async getPopularMovies(page = 1) {
    try {
      const response = await this.api.get("/movie/popular", {
        params: { page },
      });
      return this.formatMovieResults(response.data);
    } catch (error) {
      throw new Error("Failed to get popular movies");
    }
  }

  async getTopRatedMovies(page = 1) {
    try {
      const response = await this.api.get("/movie/top_rated", {
        params: { page },
      });
      return this.formatMovieResults(response.data);
    } catch (error) {
      throw new Error("Failed to get top rated movies");
    }
  }

  async getNowPlayingMovies(page = 1) {
    try {
      const response = await this.api.get("/movie/now_playing", {
        params: { page },
      });
      return this.formatMovieResults(response.data);
    } catch (error) {
      throw new Error("Failed to get now playing movies");
    }
  }

  async getUpcomingMovies(page = 1) {
    try {
      const response = await this.api.get("/movie/upcoming", {
        params: { page },
      });
      return this.formatMovieResults(response.data);
    } catch (error) {
      throw new Error("Failed to get upcoming movies");
    }
  }

  async getMoviesByGenre(genreId, page = 1) {
    try {
      const response = await this.api.get("/discover/movie", {
        params: {
          with_genres: genreId,
          page,
          sort_by: "popularity.desc",
        },
      });
      return this.formatMovieResults(response.data);
    } catch (error) {
      throw new Error("Failed to get movies by genre");
    }
  }

  async getSimilarMovies(movieId, page = 1) {
    try {
      const response = await this.api.get(`/movie/${movieId}/similar`, {
        params: { page },
      });
      return this.formatMovieResults(response.data);
    } catch (error) {
      throw new Error("Failed to get similar movies");
    }
  }

  async getMovieRecommendations(movieId, page = 1) {
    try {
      const response = await this.api.get(`/movie/${movieId}/recommendations`, {
        params: { page },
      });
      return this.formatMovieResults(response.data);
    } catch (error) {
      throw new Error("Failed to get movie recommendations");
    }
  }

  async getGenres() {
    try {
      const response = await this.api.get("/genre/movie/list");
      return response.data.genres;
    } catch (error) {
      throw new Error("Failed to get genres");
    }
  }

  async discoverMovies(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        sort_by: filters.sortBy || "popularity.desc",
        ...filters,
      };

      const response = await this.api.get("/discover/movie", { params });
      return this.formatMovieResults(response.data);
    } catch (error) {
      throw new Error("Failed to discover movies");
    }
  }

  formatMovieResults(data) {
    return {
      ...data,
      results: data.results.map((movie) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster: movie.poster_path
          ? `${this.imageBaseURL}w500${movie.poster_path}`
          : null,
        backdrop: movie.backdrop_path
          ? `${this.imageBaseURL}w1280${movie.backdrop_path}`
          : null,
        releaseDate: movie.release_date,
        rating: movie.vote_average,
        voteCount: movie.vote_count,
        genreIds: movie.genre_ids,
        adult: movie.adult,
        originalLanguage: movie.original_language,
        originalTitle: movie.original_title,
        popularity: movie.popularity,
      })),
    };
  }

  formatMovieDetails(movie, credits, videos) {
    const trailer = videos.results.find(
      (video) => video.type === "Trailer" && video.site === "YouTube"
    );

    const teaser = videos.results.find(
      (video) => video.type === "Teaser" && video.site === "YouTube"
    );

    return {
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      poster: movie.poster_path
        ? `${this.imageBaseURL}w500${movie.poster_path}`
        : null,
      backdrop: movie.backdrop_path
        ? `${this.imageBaseURL}w1280${movie.backdrop_path}`
        : null,
      releaseDate: movie.release_date,
      rating: movie.vote_average,
      voteCount: movie.vote_count,
      runtime: movie.runtime,
      budget: movie.budget,
      revenue: movie.revenue,
      status: movie.status,
      tagline: movie.tagline,
      homepage: movie.homepage,
      imdbId: movie.imdb_id,
      originalLanguage: movie.original_language,
      popularity: movie.popularity,
      adult: movie.adult,
      genres: movie.genres.map((g) => ({
        id: g.id,
        name: g.name,
      })),
      productionCompanies: movie.production_companies.map((company) => ({
        id: company.id,
        name: company.name,
        logo: company.logo_path
          ? `${this.imageBaseURL}w200${company.logo_path}`
          : null,
        country: company.origin_country,
      })),
      productionCountries: movie.production_countries,
      spokenLanguages: movie.spoken_languages,
      cast: credits.cast.slice(0, 15).map((actor) => ({
        id: actor.id,
        name: actor.name,
        character: actor.character,
        profilePath: actor.profile_path
          ? `${this.imageBaseURL}w200${actor.profile_path}`
          : null,
        order: actor.order,
      })),
      crew: credits.crew.slice(0, 10).map((person) => ({
        id: person.id,
        name: person.name,
        job: person.job,
        department: person.department,
        profilePath: person.profile_path
          ? `${this.imageBaseURL}w200${person.profile_path}`
          : null,
      })),
      director:
        credits.crew.find((person) => person.job === "Director")?.name ||
        "Unknown",
      producer:
        credits.crew.find((person) => person.job === "Producer")?.name ||
        "Unknown",
      writer:
        credits.crew.find(
          (person) => person.job === "Writer" || person.job === "Screenplay"
        )?.name || "Unknown",
      trailer: trailer
        ? `https://www.youtube.com/watch?v=${trailer.key}`
        : null,
      teaser: teaser ? `https://www.youtube.com/watch?v=${teaser.key}` : null,
      videos: videos.results.map((video) => ({
        id: video.id,
        key: video.key,
        name: video.name,
        site: video.site,
        type: video.type,
        url:
          video.site === "YouTube"
            ? `https://www.youtube.com/watch?v=${video.key}`
            : null,
      })),
    };
  }

  // Helper method to get image URL
  getImageUrl(path, size = "w500") {
    return path ? `${this.imageBaseURL}${size}${path}` : null;
  }
}

module.exports = new TMDBService();
