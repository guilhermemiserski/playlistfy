import React, { useEffect, useState } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import { FaSpotify } from 'react-icons/fa';
import { TbHandClick } from 'react-icons/tb';
import './App.css';
import { TailSpin } from 'react-loader-spinner';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const spotifyApi = new SpotifyWebApi();

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [topArtists, setTopArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [generatePlaylist, setGeneratePlaylist] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeSpotifyAPI = async () => {
      const urlParams = new URLSearchParams(window.location.hash.substr(1));
      const accessToken = urlParams.get('access_token');

      if (accessToken) {
        localStorage.setItem('spotifyAccessToken', accessToken);
        window.history.replaceState({}, document.title, '/');

        spotifyApi.setAccessToken(accessToken);
        setLoggedIn(true);
        setLoading(true);

        try {
          const userData = await spotifyApi.getMe();
          setUser(userData);

          const [artistsResponse, tracksResponse] = await Promise.all([
            spotifyApi.getMyTopArtists({ limit: 5 }),
            spotifyApi.getMyTopTracks({ limit: 5 }),
          ]);

          setTopArtists(artistsResponse.items);
          setTopTracks(tracksResponse.items);
          setLoading(false);
        } catch (error) {
          console.error('Error occurred while fetching user data:', error);
          setLoading(false);
        }
      }
    };

    initializeSpotifyAPI();
  }, []);

  const handleLogin = () => {
    const clientID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const redirectURI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
    const scope =
      'user-read-private user-read-email user-top-read playlist-modify-public playlist-modify-private';
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientID}&redirect_uri=${redirectURI}&scope=${encodeURIComponent(
      scope
    )}&response_type=token`;
  };

  const handleLogout = () => {
    localStorage.removeItem('spotifyAccessToken');
    setLoggedIn(false);
  };

  const handleHome = () => {
    setGeneratePlaylist(false);
  };

  const handleSpotifyInfo = (card) => {
    if (card) {
        const url = card.external_urls.spotify;
        window.open(url, '_blank');
    }
  };

  const fetchSearchResults = async (query) => {
    if (query) {
      try {
        const response = await spotifyApi.searchTracks(query, { limit: 5 });
        const tracks = response.tracks.items;
        return tracks;
      } catch (error) {
        console.error('Error occurred while searching tracks:', error);
        return [];
      }
    } else {
      return [];
    }
  };

  const handleSearch = async (query) => {
    setSearchValue(query);
    const results = await fetchSearchResults(query);
    setSearchResults(results);
    setSelectedTrack(null);
    setPlaylist([]);
  };

  const handleSelectTrack = (track) => {
    setSelectedTrack(track);
  };

  const handleGeneratePlaylist = async () => {
    if (selectedTrack) {
      const trackId = selectedTrack.id;
      try {
        setLoading(true);
        const response = await spotifyApi.getRecommendations({
          seed_tracks: [trackId],
          limit: 20,
        });
        const recommendedTracks = response.tracks;
        setPlaylist(recommendedTracks);
        setSearchResults([]);
        setSelectedTrack(null);
        setSearchValue('');
        setLoading(false);
      } catch (error) {
        console.error('Error occurred while generating playlist:', error);
      }
    }
  };

  const handleCreatePlaylistOnSpotify = async () => {
    if (playlist) {
      try {
        const trackUris = playlist.map((track) => track.uri);
        const response = await spotifyApi.createPlaylist(user.id, {
          name: 'playlist gerada pelo playlistfy',
          public: true,
          description: 'se quiser gerar mais playlists use o playlistfy',
        });

        const responseAdd = await spotifyApi.addTracksToPlaylist(
          response.id,
          trackUris
        );

        if (responseAdd.snapshot_id) {
          toast.success('playlist criada com sucesso', {
            position: 'bottom-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'dark',
          });
        }
      } catch (error) {
        console.error('Error occurred while creating playlist:', error);
      }
    }
  };

  return (
    <div className="App">
      <ToastContainer />
      {!loggedIn ? (
        <div className="login">
          <div className="login-text">
            <h1>
              bem-vindo ao <span className="green-text">playlistfy</span>
            </h1>
            <p>
              crie suas playlists personalizadas com apenas um clique{' '}
              <TbHandClick className="spotify-icon"></TbHandClick>
            </p>
          </div>
          <button className="button" onClick={handleLogin}>
            clique aqui <FaSpotify className="spotify-icon" />
          </button>
        </div>
      ) : (
        <div>
          {loading && (
            <div className="loader-container">
              <TailSpin
                height="80"
                width="80"
                color="#00ffa0"
                ariaLabel="tail-spin-loading"
                radius="1"
                wrapperStyle={{}}
                wrapperClass=""
                visible={true}
              />
            </div>
          )}
          <header>
            <span className="link-header" onClick={handleLogout}>
              logout
            </span>
            <span className="link-header" onClick={handleHome}>
              home
            </span>
          </header>

          <div>
            {!loading && !generatePlaylist && (
              <div>
                <h1 className="welcome-text">
                  eae, <span className="green-text">{user?.display_name}</span>{' '}
                  qual a boa?{' '}
                  <span
                    className="link"
                    onClick={() => setGeneratePlaylist(true)}
                  >
                    bora criar uma playlist
                  </span>
                </h1>

                <div className="artistas-favoritos">
                  <h2 className="section-title">
                    seus <span className="green-text">artistas</span> favoritos.
                  </h2>
                  <div className="card-container">
                    {topArtists.map((artist) => (
                      <div onClick={() => handleSpotifyInfo(artist)}>
                        <img
                          className="spotify-logo"
                          src={
                            process.env.PUBLIC_URL +
                            '/Spotify_Logo_RGB_White.png'
                          }
                          alt="spotify-logo"
                        ></img>
                        <div className="card" key={artist.id}>
                          <img
                            src={artist.images[0].url}
                            alt={artist.name}
                            className="card-image"
                          />
                          <h3 className="card-title">{artist.name}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="musicas-favoritas">
                  <h2 className="section-title">
                    suas <span className="green-text">músicas</span> favoritas.
                  </h2>
                  <div className="card-container">
                    {topTracks.map((track) => (
                      <div onClick={() => handleSpotifyInfo(track)}>
                        <img
                          className="spotify-logo"
                          src={
                            process.env.PUBLIC_URL +
                            '/Spotify_Logo_RGB_White.png'
                          }
                          alt="spotify-logo"
                        ></img>
                        <div className="card" key={track.id}>
                          <img
                            src={track.album.images[0].url}
                            alt={track.name}
                            className="card-image"
                          />
                          <h3 className="card-title">{track.name}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {generatePlaylist && (
              <div>
                <div className="search-container">
                  <div className="search-input-button">
                    <input
                      className="search-input"
                      type="search"
                      placeholder="digite o nome da música"
                      value={searchValue}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                    <button
                      className="button"
                      onClick={handleGeneratePlaylist}
                      disabled={!selectedTrack}
                    >
                      gerar playlist
                    </button>

                    {playlist.length > 0 && (
                      <>
                        <button
                          className="button"
                          onClick={handleCreatePlaylistOnSpotify}
                        >
                          adicionar playlist no spotify{' '}
                          <FaSpotify className="spotify-icon" />
                        </button>
                      </>
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="select-options">
                      {searchResults.map((track) => (
                        <div
                          className={`selected-track ${
                            selectedTrack && selectedTrack.id === track.id
                              ? 'selected'
                              : ''
                          }`}
                          key={track.id}
                          onClick={() => handleSelectTrack(track)}
                        >
                          <img
                            src={track.album.images[0].url}
                            alt={track.name}
                            className="selected-track-image"
                          />
                          <div className="selected-track-info">
                            <h3 className="selected-track-title">
                              {track.name}
                            </h3>
                            <p className="selected-track-artist">
                              {track.artists[0].name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {playlist.length > 0 && (
                  <div>
                    <div className="card-container">
                      {playlist.map((track) => (
                        <div
                          className="generated-playlist"
                          onClick={() => handleSpotifyInfo(track)}
                        >
                          <img
                            className="spotify-logo"
                            src={
                              process.env.PUBLIC_URL +
                              '/Spotify_Logo_RGB_White.png'
                            }
                            alt="spotify-logo"
                          ></img>
                          <div className="card" key={track.id}>
                            <img
                              src={track.album.images[0].url}
                              alt={track.name}
                              className="card-image"
                            />
                            <div className="playlist-track-info">
                              <h3 className="card-title">{track.name}</h3>
                              <p className="card-artist">
                                {track.artists[0].name}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
