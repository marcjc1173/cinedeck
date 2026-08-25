import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CONFIG_PATH = path.join(__dirname, 'config.json');
const POSTERS_CACHE_PATH = path.join(__dirname, 'bad_posters_cache.json');

// Helpers for poster audit cache
function readPosterCache() {
  try {
    if (fs.existsSync(POSTERS_CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(POSTERS_CACHE_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to read poster cache:', e.message);
  }
  return {};
}

function writePosterCache(cache) {
  try {
    fs.writeFileSync(POSTERS_CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write poster cache:', e.message);
  }
}

// Helper to read config
function readConfig() {
  let config = {
    plex: { url: 'http://localhost:32400', token: '', logPath: '', useMockLogs: false },
    cleanup: { targetDir: './quarantine', rules: { deleteDuplicates: true, preferHigherResolution: true, preferHigherBitrate: true, maxLowQualityResolution: '720p', maxLowQualityBitrate: 1500 } },
    predictiveMaintenance: { checkIntervalMinutes: 5, errorThresholdCount: 5 },
    pathMappings: {}
  };

  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      config = {
        ...config,
        ...parsed,
        plex: { ...config.plex, ...parsed.plex },
        cleanup: {
          ...config.cleanup,
          ...parsed.cleanup,
          rules: { ...config.cleanup.rules, ...(parsed.cleanup?.rules || {}) }
        },
        predictiveMaintenance: { ...config.predictiveMaintenance, ...parsed.predictiveMaintenance }
      };
    }
  } catch (e) {
    console.error('Error reading config.json:', e);
  }

  // Environment variables overrides (secrets)
  if (process.env.PLEX_URL) config.plex.url = process.env.PLEX_URL;
  if (process.env.PLEX_TOKEN) config.plex.token = process.env.PLEX_TOKEN;
  if (process.env.PLEX_LOG_PATH) config.plex.logPath = process.env.PLEX_LOG_PATH;
  if (process.env.PLEX_USE_MOCK_LOGS) config.plex.useMockLogs = process.env.PLEX_USE_MOCK_LOGS === 'true';
  if (process.env.CLEANUP_TARGET_DIR) config.cleanup.targetDir = process.env.CLEANUP_TARGET_DIR;

  return config;
}

// Helper to write config
function writeConfig(cfg) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error writing config.json:', e);
    return false;
  }
}

// Helper to get sanitized/normalized Plex URL
function getPlexUrl(config) {
  let url = config?.plex?.url || 'http://localhost:32400';
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url.replace(/\/+:/, ':');
}

function shouldMockPlex(config) {
  return config?.plex?.useMockLogs === true || !config?.plex?.token || config?.plex?.token === 'YOUR_X_PLEX_TOKEN_HERE';
}

// Helper to translate Plex container paths to local host filesystem paths
function translatePath(filePath) {
  const config = readConfig();
  const mappings = config.pathMappings || {};
  for (const [containerPath, hostPath] of Object.entries(mappings)) {
    if (filePath.startsWith(containerPath)) {
      return filePath.replace(containerPath, hostPath);
    }
  }
  return filePath;
}

// Helper to check Plex connectivity and retrieve basic data
async function fetchPlex(endpoint, method = 'GET') {
  const config = readConfig();
  const baseUrl = getPlexUrl(config);
  const url = `${baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}X-Plex-Token=${config.plex.token}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Accept': 'application/json',
        'X-Plex-Token': config.plex.token
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`Plex returned HTTP status ${res.status}`);
    }
    const text = await res.text();
    if (!text || text.trim() === '') {
      return {};
    }
    try {
      return JSON.parse(text);
    } catch (parseErr) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        throw parseErr;
      }
      return {};
    }
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// --- MOCK DATA ---
const MOCK_IDENTITY = {
  MediaContainer: {
    size: 1,
    myPlex: true,
    platform: 'Linux (Ubuntu 24.04.1 LTS)',
    platformVersion: '6.8.0-40-generic',
    product: 'Plex Media Server',
    version: '1.40.2.8312-683a45',
    transcoderVideo: true,
    transcoderAudio: true,
    transcoderActiveVideoSessions: 1,
    friendlyName: 'Plex-Main-Media'
  }
};

const MOCK_LIBRARIES = {
  MediaContainer: {
    Directory: [
      { key: '1', type: 'movie', title: 'Movies', agent: 'tv.plex.agents.movie', scanner: 'Plex Movie', updatedAt: 1718000000 },
      { key: '2', type: 'show', title: 'TV Shows', agent: 'tv.plex.agents.series', scanner: 'Plex TV Series', updatedAt: 1718050000 }
    ]
  }
};

// Terminated mock session cache
const terminatedMockSessions = new Set();

// Generates dynamic playback session updates
function getMockSessions() {
  const time = Date.now();
  const progressBob = Math.floor((time / 3000) % 100);
  const progressAlice = Math.floor((time / 6000) % 100);

  const mockSessions = [
    {
      addedAt: 1712000000,
      key: '/library/metadata/101',
      ratingKey: '101',
      sessionKey: '101',
      Session: { id: '101' },
      type: 'movie',
      title: 'Dune: Part Two',
      year: 2024,
      duration: 9960000,
      viewOffset: Math.floor((progressAlice / 100) * 9960000),
      User: { id: '1', title: 'alice' },
      Player: { title: 'Living Room Apple TV', product: 'Plex for Apple TV', state: 'playing', address: '192.168.1.55' },
      Media: [
        {
          videoResolution: '4k',
          videoCodec: 'hevc',
          audioCodec: 'truehd',
          bitrate: 45000,
          container: 'mkv'
        }
      ]
      // Absence of TranscodeSession means Direct Play
    },
    {
      addedAt: 1712050000,
      key: '/library/metadata/202',
      ratingKey: '202',
      sessionKey: '202',
      Session: { id: '202' },
      type: 'episode',
      title: 'And the Bag\'s in the River',
      grandparentTitle: 'Breaking Bad',
      parentTitle: 'Season 1',
      index: 3,
      duration: 2880000,
      viewOffset: Math.floor((progressBob / 100) * 2880000),
      User: { id: '2', title: 'bob' },
      Player: { title: 'Bob\'s Chromebook', product: 'Plex Web (Chrome)', state: 'playing', address: '192.168.1.102' },
      Media: [
        {
          videoResolution: '1080',
          videoCodec: 'h264',
          audioCodec: 'aac',
          bitrate: 8000,
          container: 'mp4'
        }
      ],
      TranscodeSession: {
        key: 'bob-session-1',
        throttled: false,
        progress: progressBob,
        speed: 0.85, // Low speed triggers alert
        videoDecision: 'transcode',
        audioDecision: 'copy',
        subtitleDecision: 'none'
      }
    }
  ];

  const filteredSessions = mockSessions.filter(s => {
    const sId = s.Session?.id || s.sessionKey;
    return !terminatedMockSessions.has(sId);
  });

  return {
    MediaContainer: {
      size: filteredSessions.length,
      Metadata: filteredSessions
    }
  };
}

const MOCK_HISTORY = {
  MediaContainer: {
    size: 5,
    Metadata: [
      { title: 'The Matrix', type: 'movie', year: 1999, viewedAt: Date.now() - 3600000, User: { title: 'alice' } },
      { title: 'Pilot', grandparentTitle: 'Breaking Bad', type: 'episode', viewedAt: Date.now() - 7200000, User: { title: 'bob' } },
      { title: 'Interstellar', type: 'movie', year: 2014, viewedAt: Date.now() - 86400000, User: { title: 'charlie' } },
      { title: 'Inception', type: 'movie', year: 2010, viewedAt: Date.now() - 172800000, User: { title: 'alice' } },
      { title: 'Oppenheimer', type: 'movie', year: 2023, viewedAt: Date.now() - 259200000, User: { title: 'guest' } }
    ]
  }
};

const MOCK_LIBRARY_ITEMS = {
  '1': {
    MediaContainer: {
      Metadata: [
        {
          ratingKey: '101',
          type: 'movie',
          title: 'Dune: Part Two',
          year: 2024,
          thumb: '/mock/dune.jpg',
          guid: 'plex://movie/101',
          summary: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
          Media: [
            {
              id: 'm101_1',
              videoResolution: '4k',
              bitrate: 45000,
              videoCodec: 'hevc',
              audioCodec: 'truehd',
              Part: [{ id: 'p101_1', file: '/data/media/movies/Dune Part Two (2024)/Dune.Part.Two.2024.2160p.mkv', size: 54300000000, Stream: [{ streamType: 3, language: 'English', languageCode: 'eng' }] }]
            }
          ]
        },
        {
          ratingKey: '102',
          type: 'movie',
          title: 'Interstellar',
          year: 2014,
          thumb: '/mock/interstellar.jpg',
          guid: 'plex://movie/102',
          summary: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
          Media: [
            {
              id: 'm102_1',
              videoResolution: '4k',
              bitrate: 22000,
              videoCodec: 'hevc',
              audioCodec: 'dts',
              Part: [{ id: 'p102_1', file: '/data/media/movies/Interstellar (2014)/Interstellar.2014.2160p.mkv', size: 26500000000, Stream: [{ streamType: 3, language: 'English', languageCode: 'eng' }] }]
            },
            {
              id: 'm102_2',
              videoResolution: '720',
              bitrate: 1200,
              videoCodec: 'h264',
              audioCodec: 'aac',
              Part: [{ id: 'p102_2', file: '/data/media/movies/Interstellar (2014)/Interstellar.2014.720p.mp4', size: 1400000000, Stream: [] }]
            }
          ] // Multiple media indicates duplicate
        },
        {
          ratingKey: '103',
          type: 'movie',
          title: 'Gladiator',
          year: 2000,
          thumb: '/mock/gladiator.jpg',
          guid: 'plex://movie/103',
          summary: 'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.',
          Media: [
            {
              id: 'm103_1',
              videoResolution: '1080',
              bitrate: 8000,
              videoCodec: 'h264',
              audioCodec: 'ac3',
              Part: [{ id: 'p103_1', file: '/data/media/movies/Gladiator (2000)/Gladiator.2000.1080p.mkv', size: 9500000000, Stream: [] }] // No Stream with streamType=3 -> missing subtitles
            }
          ]
        },
        {
          ratingKey: '104',
          type: 'movie',
          title: 'Untold Indie Story',
          year: 2023,
          thumb: '', // Missing Poster
          summary: '', // Missing Summary
          guid: 'local://104', // Unmatched
          Media: [
            {
              id: 'm104_1',
              videoResolution: 'sd', // Low resolution
              bitrate: 800, // Low bitrate
              videoCodec: 'mpeg4',
              audioCodec: 'mp3',
              Part: [{ id: 'p104_1', file: '/data/media/movies/Untold Indie Story (2023)/movie.avi', size: 700000000, Stream: [] }]
            }
          ]
        }
      ]
    }
  },
  '2': {
    MediaContainer: {
      Metadata: [
        {
          ratingKey: '201',
          type: 'episode',
          title: 'Pilot',
          grandparentTitle: 'Breaking Bad',
          parentTitle: 'Season 1',
          index: 1,
          thumb: '/mock/bb_pilot.jpg',
          summary: 'High school chemistry teacher Walter White is diagnosed with stage III cancer and turns to manufacturing methamphetamine.',
          Media: [
            {
              id: 'm201_1',
              videoResolution: '1080',
              bitrate: 4500,
              videoCodec: 'h264',
              audioCodec: 'aac',
              Part: [{ id: 'p201_1', file: '/data/media/tv/Breaking Bad/Season 01/Breaking.Bad.S01E01.1080p.mkv', size: 1800000000, Stream: [{ streamType: 3, language: 'English', languageCode: 'eng' }] }]
            }
          ]
        }
      ]
    }
  }
};

// Simulated Plex Logs
const MOCK_LOG_LINES = [
  'INFO - Plex Media Server v1.40.2.8312-683a45 starting up.',
  'INFO - Database clean utility loaded.',
  'WARNING - Slow query: SELECT * FROM metadata_items WHERE hash=? (1050ms)',
  'INFO - Library scan requested for section 1 (Movies).',
  'INFO - [Transcoder] Video transcode session bob-session-1 established.',
  'WARNING - Transcode speed is low (0.85x), buffering may occur for session bob-session-1.',
  'ERROR - Transcoder: Failed to start transcoder process for hardware acceleration QSV.',
  'ERROR - [Transcoder] [h264_qsv] Error during encoding: device write error.',
  'INFO - Database cleanup complete (took 1420ms).',
  'WARNING - Slow query: SELECT * FROM media_parts WHERE size > ? (980ms)',
  'ERROR - [Transcoder] Failed to write segment to pipe.',
  'ERROR - Transcode session bob-session-1 encountered critical error.'
];

// --- END MOCK DATA ---

// API Routes

// Connection status check
app.get('/api/plex/status', async (req, res) => {
  const config = readConfig();
  const result = {
    connected: false,
    url: getPlexUrl(config),
    serverInfo: null,
    isMock: false
  };

  if (shouldMockPlex(config)) {
    result.connected = true;
    result.serverInfo = MOCK_IDENTITY.MediaContainer;
    result.isMock = true;
    return res.json(result);
  }

  try {
    const data = await fetchPlex('/');
    result.connected = true;
    result.serverInfo = data.MediaContainer;
    res.json(result);
  } catch (err) {
    console.warn('Failed to connect to real Plex:', err.message);
    result.connected = false;
    result.serverInfo = null;
    result.isMock = false;
    result.error = `Connection failed: ${err.message}`;
    res.json(result);
  }
});

app.get('/api/config', (req, res) => {
  const config = readConfig();
  const clientConfig = { ...config };
  // Mask the token in UI except if empty or requested specifically
  if (clientConfig.plex.token && clientConfig.plex.token !== 'YOUR_X_PLEX_TOKEN_HERE') {
    clientConfig.plex.token = clientConfig.plex.token.substring(0, 4) + '...MASKED...' + clientConfig.plex.token.slice(-4);
  }
  
  // Add overridden status
  clientConfig.overridden = {
    url: !!process.env.PLEX_URL,
    token: !!process.env.PLEX_TOKEN,
    logPath: !!process.env.PLEX_LOG_PATH
  };

  res.json(clientConfig);
});

// Update Configuration
app.post('/api/config', (req, res) => {
  const config = readConfig();
  const updates = req.body;

  // Process Updates
  if (updates.plex) {
    if (updates.plex.token && updates.plex.token.includes('MASKED')) {
      // Keep old token if masked value wasn't changed
      updates.plex.token = config.plex.token;
    }
    config.plex = { ...config.plex, ...updates.plex };
  }
  if (updates.cleanup) {
    config.cleanup = { 
      ...config.cleanup, 
      ...updates.cleanup,
      rules: { ...config.cleanup.rules, ...updates.cleanup.rules }
    };
  }
  if (updates.predictiveMaintenance) {
    config.predictiveMaintenance = { ...config.predictiveMaintenance, ...updates.predictiveMaintenance };
  }

  const success = writeConfig(config);
  if (success) {
    res.json({ success: true, config });
  } else {
    res.status(500).json({ success: false, message: 'Failed to write configuration file' });
  }
});

// Get active playbacks and transcoding sessions
app.get('/api/plex/sessions', async (req, res) => {
  const config = readConfig();
  if (shouldMockPlex(config)) {
    return res.json(getMockSessions().MediaContainer);
  }

  try {
    const data = await fetchPlex('/status/sessions');
    res.json(data.MediaContainer || { size: 0, Metadata: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Terminate an active session (Banish)
app.post('/api/plex/sessions/terminate', async (req, res) => {
  const { sessionId, reason } = req.body;
  const config = readConfig();
  const isMock = shouldMockPlex(config);

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'Session ID is required' });
  }

  try {
    if (isMock) {
      terminatedMockSessions.add(String(sessionId));
      return res.json({
        success: true,
        message: `[Simulated] Stream terminated for session ${sessionId}. Message sent: "${reason || 'No reason provided'}"`
      });
    }

    const endpoint = `/status/sessions/terminate?sessionId=${sessionId}&reason=${encodeURIComponent(reason || '')}`;
    await fetchPlex(endpoint, 'GET');
    res.json({ success: true, message: 'Playback session terminated successfully.' });
  } catch (err) {
    console.error('Error terminating session:', err.message);
    res.status(500).json({ success: false, message: `Failed to terminate stream: ${err.message}` });
  }
});

// Update an item's poster (upload artwork)
app.post('/api/plex/metadata/poster', async (req, res) => {
  const { ratingKey, posterUrl } = req.body;
  const config = readConfig();
  const isMock = shouldMockPlex(config);

  if (!ratingKey || !posterUrl) {
    return res.status(400).json({ success: false, message: 'Rating key and poster URL are required' });
  }

  try {
    if (isMock) {
      let found = false;
      for (const libKey of Object.keys(MOCK_LIBRARY_ITEMS)) {
        const metadata = MOCK_LIBRARY_ITEMS[libKey]?.MediaContainer?.Metadata || [];
        const item = metadata.find(m => String(m.ratingKey) === String(ratingKey));
        if (item) {
          item.thumb = posterUrl;
          found = true;
          break;
        }
      }
      
      if (!found) {
        return res.status(404).json({ success: false, message: 'Mock item not found' });
      }

      return res.json({
        success: true,
        message: `[Simulated] Poster updated successfully for item ${ratingKey}.`
      });
    }

    const endpoint = `/library/metadata/${ratingKey}/posters?url=${encodeURIComponent(posterUrl)}`;
    await fetchPlex(endpoint, 'POST');
    res.json({ success: true, message: 'Poster updated successfully.' });
  } catch (err) {
    console.error('Error updating poster:', err.message);
    res.status(500).json({ success: false, message: `Failed to update poster: ${err.message}` });
  }
});

// Get list of available posters for a specific item
app.get('/api/plex/metadata/posters', async (req, res) => {
  const { ratingKey } = req.query;
  const config = readConfig();
  const isMock = shouldMockPlex(config);

  if (!ratingKey) {
    return res.status(400).json({ success: false, message: 'Rating key is required' });
  }

  try {
    if (isMock) {
      return res.json({
        success: true,
        posters: [
          {
            key: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200',
            thumb: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200',
            selected: true,
            provider: 'tmdb'
          },
          {
            key: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200',
            thumb: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200',
            selected: false,
            provider: 'imdb'
          }
        ]
      });
    }

    const endpoint = `/library/metadata/${ratingKey}/posters`;
    const data = await fetchPlex(endpoint, 'GET');
    const posters = data.MediaContainer?.Metadata || [];
    res.json({ success: true, posters });
  } catch (err) {
    console.error('Error fetching posters:', err.message);
    res.status(500).json({ success: false, message: `Failed to fetch posters: ${err.message}` });
  }
});

// Search for potential metadata matches for a specific item
app.get('/api/plex/metadata/matches', async (req, res) => {
  const { ratingKey } = req.query;
  const config = readConfig();
  const isMock = shouldMockPlex(config);

  if (!ratingKey) {
    return res.status(400).json({ success: false, message: 'Rating key is required' });
  }

  try {
    if (isMock) {
      return res.json({
        success: true,
        matches: [
          {
            guid: 'plex://movie/mock1',
            name: 'Untold Indie Story (Official)',
            year: 2023,
            thumb: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200',
            summary: 'The official acclaimed cut of the Untold Indie Story.'
          },
          {
            guid: 'plex://movie/mock2',
            name: 'Untold Indie Story: Reloaded',
            year: 2025,
            thumb: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=200',
            summary: 'The sci-fi sequel to the original indie story.'
          }
        ]
      });
    }

    const endpoint = `/library/metadata/${ratingKey}/matches?manual=1`;
    const data = await fetchPlex(endpoint, 'GET');
    const matches = data.MediaContainer?.SearchResult || [];
    res.json({ success: true, matches });
  } catch (err) {
    console.error('Error fetching matches:', err.message);
    res.status(500).json({ success: false, message: `Failed to fetch matches: ${err.message}` });
  }
});

// Apply a selected metadata match to an item
app.post('/api/plex/metadata/match', async (req, res) => {
  const { ratingKey, guid, name } = req.body;
  const config = readConfig();
  const isMock = shouldMockPlex(config);

  if (!ratingKey || !guid || !name) {
    return res.status(400).json({ success: false, message: 'Rating key, guid, and name are required' });
  }

  try {
    if (isMock) {
      let found = false;
      for (const libKey of Object.keys(MOCK_LIBRARY_ITEMS)) {
        const metadata = MOCK_LIBRARY_ITEMS[libKey]?.MediaContainer?.Metadata || [];
        const item = metadata.find(m => String(m.ratingKey) === String(ratingKey));
        if (item) {
          item.title = name;
          item.thumb = guid === 'plex://movie/mock1' 
            ? 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200'
            : 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=200';
          found = true;
          break;
        }
      }
      
      if (!found) {
        return res.status(404).json({ success: false, message: 'Mock item not found' });
      }

      return res.json({
        success: true,
        message: `[Simulated] Item matched to "${name}" successfully.`
      });
    }

    const endpoint = `/library/metadata/${ratingKey}/match?guid=${encodeURIComponent(guid)}&name=${encodeURIComponent(name)}`;
    await fetchPlex(endpoint, 'PUT');
    res.json({ success: true, message: `Item successfully matched to "${name}".` });
  } catch (err) {
    console.error('Error matching item:', err.message);
    res.status(500).json({ success: false, message: `Failed to match item: ${err.message}` });
  }
});

// Get playback history
app.get('/api/plex/history', async (req, res) => {
  const config = readConfig();
  if (shouldMockPlex(config)) {
    return res.json(MOCK_HISTORY.MediaContainer.Metadata || []);
  }

  try {
    const data = await fetchPlex('/status/sessions/history/all?sort=viewedAt:desc&limit=25');
    const items = data?.MediaContainer?.Metadata || [];
    
    // Attempt to translate accountIDs to usernames
    let accountsMap = {};
    try {
      const accountsData = await fetchPlex('/accounts');
      const accounts = accountsData?.MediaContainer?.Account || [];
      accounts.forEach(acc => {
        if (acc.id) {
          accountsMap[acc.id] = acc.name || `User ${acc.id}`;
        }
      });
    } catch (e) {
      console.warn('Could not load Plex accounts mapping:', e.message);
    }

    const enrichedItems = items.map(item => {
      const username = accountsMap[item.accountID] || `User ${item.accountID || 'unknown'}`;
      return {
        ...item,
        User: { title: username }
      };
    });

    res.json(enrichedItems);
  } catch (err) {
    console.error('Error loading history:', err.message);
    res.json([]);
  }
});

// Get libraries list
app.get('/api/plex/libraries', async (req, res) => {
  const config = readConfig();
  if (shouldMockPlex(config)) {
    return res.json(MOCK_LIBRARIES.MediaContainer.Directory);
  }

  try {
    const data = await fetchPlex('/library/sections');
    res.json(data.MediaContainer.Directory || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Perform media audit (metadata, resolution stats, duplicates)
app.get('/api/plex/metadata/audit', async (req, res) => {
  const config = readConfig();
  const isMock = shouldMockPlex(config);
  
  let libraries = [];
  try {
    if (isMock) {
      libraries = MOCK_LIBRARIES.MediaContainer.Directory;
    } else {
      const data = await fetchPlex('/library/sections');
      libraries = data.MediaContainer.Directory || [];
    }
  } catch (err) {
    libraries = MOCK_LIBRARIES.MediaContainer.Directory;
  }

  const resolutionBreakdown = { '4k': 0, '1080p': 0, '720p': 0, 'sd': 0 };
  const resolutionItems = { '4k': [], '1080p': [], '720p': [], 'sd': [] };
  const missingPoster = [];
  const missingSummary = [];
  const missingSubtitles = [];
  const unmatched = [];
  const duplicates = [];
  let totalItems = 0;
  let totalSize = 0;

  for (const lib of libraries) {
    let items = [];
    try {
      if (isMock) {
        items = MOCK_LIBRARY_ITEMS[lib.key]?.MediaContainer?.Metadata || [];
      } else {
        const data = await fetchPlex(`/library/sections/${lib.key}/all`);
        items = data.MediaContainer.Metadata || [];
      }
    } catch (e) {
      console.error(`Error loading library key ${lib.key}:`, e.message);
      if (isMock) items = MOCK_LIBRARY_ITEMS[lib.key]?.MediaContainer?.Metadata || [];
    }

    totalItems += items.length;

    for (const item of items) {
      const mediaList = item.Media || [];
      
      // Audit details
      if (!item.thumb) {
        missingPoster.push({ id: item.ratingKey, title: item.title, type: item.type, library: lib.title, reason: 'missing' });
      } else if (isMock && item.ratingKey === '103') {
        missingPoster.push({ id: item.ratingKey, title: item.title, type: item.type, library: lib.title, reason: 'placeholder' });
      }
      if (!item.summary || item.summary.trim() === '') {
        missingSummary.push({ id: item.ratingKey, title: item.title, type: item.type, library: lib.title });
      }

      // Check match status
      const isUnmatched = !item.guid || 
                          item.guid.trim() === '' || 
                          item.guid.startsWith('local://') || 
                          item.guid.includes('agents.none') || 
                          item.guid.includes('local/');
      if (isUnmatched) {
        unmatched.push({ id: item.ratingKey, title: item.title, type: item.type, library: lib.title, guid: item.guid || 'none' });
      }

      // Check duplicate status
      if (mediaList.length > 1) {
        duplicates.push({
          id: item.ratingKey,
          title: item.title,
          type: item.type,
          library: lib.title,
          files: mediaList.map(m => {
            const part = m.Part?.[0] || {};
            return {
              mediaId: m.id,
              resolution: m.videoResolution,
              bitrate: m.bitrate,
              file: part.file,
              size: part.size
            };
          })
        });
      }

      // Subtitle audit & resolution metrics
      for (const media of mediaList) {
        // Resolution tally
        const res = (media.videoResolution || '').toLowerCase();
        let resKey = 'sd';
        if (res.includes('4k') || res.includes('2160')) {
          resKey = '4k';
        } else if (res.includes('1080') || res.includes('2k') || res.includes('1440')) {
          resKey = '1080p';
        } else if (res.includes('720')) {
          resKey = '720p';
        } else {
          resKey = 'sd';
        }

        resolutionBreakdown[resKey]++;

        // Add to resolutionItems if not already added to this category
        const alreadyAdded = resolutionItems[resKey].some(itemInRes => itemInRes.id === item.ratingKey);
        if (!alreadyAdded) {
          const itemTitle = item.type === 'episode' && item.grandparentTitle 
            ? `${item.grandparentTitle} - ${item.title}` 
            : item.title;
          resolutionItems[resKey].push({
            id: item.ratingKey,
            title: itemTitle,
            type: item.type || 'unknown',
            library: lib.title,
            resolution: media.videoResolution ? `${media.videoResolution}p` : 'unknown'
          });
        }

        const part = media.Part?.[0] || {};
        totalSize += part.size || 0;

        // Subtitles check
        const streams = part.Stream || [];
        const hasSubs = streams.some(s => s.streamType === 3);
        if (!hasSubs) {
          missingSubtitles.push({
            id: item.ratingKey,
            title: item.type === 'episode' ? `${item.grandparentTitle} - ${item.title}` : item.title,
            type: item.type,
            library: lib.title,
            file: part.file
          });
        }
      }
    }

    // Batch check for bad posters (embedded/generated stills) on real Plex servers using cache
    if (!isMock) {
      const posterCache = readPosterCache();
      let cacheUpdated = false;

      const itemsToScan = items.filter(item => {
        const isUnmatched = !item.guid || 
                            item.guid.trim() === '' || 
                            item.guid.startsWith('local://') || 
                            item.guid.includes('agents.none') || 
                            item.guid.includes('local/');
        if (isUnmatched || !item.thumb) return false;

        const cached = posterCache[item.ratingKey];
        if (cached && cached.updatedAt === item.updatedAt) {
          if (cached.isBad) {
            missingPoster.push({
              id: item.ratingKey,
              title: item.title,
              type: item.type,
              library: lib.title,
              reason: 'placeholder'
            });
          }
          return false;
        }
        return true;
      });

      if (itemsToScan.length > 0) {
        console.log(`CineDeck: Scanning posters for ${itemsToScan.length} items (out of ${items.length}) in library "${lib.title}"...`);
        const batchSize = 15;
        for (let i = 0; i < itemsToScan.length; i += batchSize) {
          const batch = itemsToScan.slice(i, i + batchSize);
          await Promise.all(batch.map(async (item) => {
            try {
              const data = await fetchPlex(`/library/metadata/${item.ratingKey}/posters`);
              const posters = data.MediaContainer?.Metadata || [];
              const selected = posters.find(p => p.selected);
              let isBad = false;
              if (selected) {
                const isEmbedded = selected.provider === 'embedded';
                const isGenerated = !selected.provider && (selected.key.includes('media://') || selected.key.includes('Contents/Thumbnails') || selected.key.includes('url=media%3A%2F%2F'));
                if (isEmbedded || isGenerated) {
                  isBad = true;
                  missingPoster.push({
                    id: item.ratingKey,
                    title: item.title,
                    type: item.type,
                    library: lib.title,
                    reason: 'placeholder'
                  });
                }
              }
              posterCache[item.ratingKey] = {
                isBad,
                updatedAt: item.updatedAt
              };
              cacheUpdated = true;
            } catch (e) {
              // Ignore to retry next time
            }
          }));
          
          if (cacheUpdated) {
            writePosterCache(posterCache);
            cacheUpdated = false;
          }
        }
      }
    }
  }

  res.json({
    totalItems,
    totalSize,
    resolutionBreakdown,
    resolutionItems,
    missingPoster,
    missingSummary,
    missingSubtitles,
    duplicates,
    unmatched
  });
});

// Log Parser & Health Trend
app.get('/api/maintenance/logs', async (req, res) => {
  const config = readConfig();
  let logLines = [];

  if (config.plex.useMockLogs || !config.plex.logPath || !fs.existsSync(config.plex.logPath)) {
    logLines = MOCK_LOG_LINES;
  } else {
    try {
      const data = await fs.promises.readFile(config.plex.logPath, 'utf-8');
      const lines = data.split('\n');
      logLines = lines.slice(-200); // Fetch last 200 lines
    } catch (err) {
      console.warn('Failed reading real log file, using simulated logs', err.message);
      logLines = MOCK_LOG_LINES;
    }
  }

  // Parse lines for stats
  let errors = 0;
  let warnings = 0;
  let slowQueries = 0;
  let transcodeErrors = 0;

  const parsedLogs = logLines.map((line, idx) => {
    let type = 'INFO';
    if (line.includes('ERROR -') || line.includes('critical error')) {
      type = 'ERROR';
      errors++;
      if (line.toLowerCase().includes('transcoder') || line.toLowerCase().includes('transcode')) {
        transcodeErrors++;
      }
    } else if (line.includes('WARNING -') || line.includes('Slow query:')) {
      type = 'WARNING';
      warnings++;
      if (line.includes('Slow query:')) slowQueries++;
    }
    return { id: idx, type, text: line, timestamp: new Date().toLocaleTimeString() };
  });

  // Trend prediction
  let healthScore = 100 - (errors * 10) - (warnings * 3);
  healthScore = Math.max(0, Math.min(100, healthScore));

  let status = 'HEALTHY';
  let message = 'Server is running normally with no recent transcode stutters.';

  if (transcodeErrors > 2 || (errors > 5 && warnings > 5)) {
    status = 'DANGER';
    message = 'Critical Trend: Failed transcode operations and device errors found. Users will experience buffering.';
  } else if (transcodeErrors > 0 || warnings > 3) {
    status = 'WARNING';
    message = 'Warning Trend: Multiple slow queries or transcode slow-downs detected. Review hardware acceleration.';
  }

  res.json({
    status,
    healthScore,
    message,
    counts: { errors, warnings, slowQueries, transcodeErrors },
    logs: parsedLogs
  });
});

// Library Maintenance Trigger
app.post('/api/plex/maintenance', async (req, res) => {
  const { action, sectionId } = req.body;
  const config = readConfig();
  const isMock = shouldMockPlex(config);

  try {
    if (action === 'refresh') {
      if (!isMock) await fetchPlex(`/library/sections/${sectionId}/refresh`);
      return res.json({ success: true, message: `Library scan triggered for section ${sectionId}` });
    } else if (action === 'emptyTrash') {
      if (!isMock) {
        const baseUrl = getPlexUrl(config);
        const url = `${baseUrl}/library/sections/${sectionId}/emptyTrash?X-Plex-Token=${config.plex.token}`;
        await fetch(url, { method: 'PUT' });
      }
      return res.json({ success: true, message: `Empty trash triggered for section ${sectionId}` });
    } else if (action === 'optimize') {
      if (!isMock) {
        const baseUrl = getPlexUrl(config);
        const url = `${baseUrl}/library/clean/databases?X-Plex-Token=${config.plex.token}`;
        await fetch(url, { method: 'PUT' });
      }
      return res.json({ success: true, message: 'Database optimization triggered successfully' });
    }
    return res.status(400).json({ success: false, message: 'Invalid maintenance action specified' });
  } catch (err) {
    // If mock mode, pretend it worked.
    if (isMock) {
      return res.json({ success: true, message: `[Simulated] Action '${action}' completed successfully.` });
    }
    res.status(500).json({ success: false, message: `Action failed: ${err.message}` });
  }
});

// Cleanup Proposals Generator
app.get('/api/cleanup/proposals', async (req, res) => {
  const config = readConfig();
  const isMock = shouldMockPlex(config);
  const rules = config.cleanup.rules;

  let libraries = [];
  try {
    if (isMock) {
      libraries = MOCK_LIBRARIES.MediaContainer.Directory;
    } else {
      const data = await fetchPlex('/library/sections');
      libraries = data.MediaContainer.Directory || [];
    }
  } catch (err) {
    libraries = MOCK_LIBRARIES.MediaContainer.Directory;
  }

  const proposals = [];

  for (const lib of libraries) {
    let items = [];
    try {
      if (isMock) {
        items = MOCK_LIBRARY_ITEMS[lib.key]?.MediaContainer?.Metadata || [];
      } else {
        const data = await fetchPlex(`/library/sections/${lib.key}/all`);
        items = data.MediaContainer.Metadata || [];
      }
    } catch (e) {
      if (isMock) items = MOCK_LIBRARY_ITEMS[lib.key]?.MediaContainer?.Metadata || [];
    }

    for (const item of items) {
      const mediaList = item.Media || [];

      // Rule 1: Duplicates Cleanup
      if (rules.deleteDuplicates && mediaList.length > 1) {
        // Sort media items
        const sortedMedia = [...mediaList].sort((a, b) => {
          // Resolution ranking
          const resA = (a.videoResolution || '').toLowerCase().replace(/p$/, '');
          const resB = (b.videoResolution || '').toLowerCase().replace(/p$/, '');
          const rank = {
            '4k': 5,
            '2160': 5,
            '2k': 4,
            '1440': 4,
            '1080': 3,
            '720': 2,
            '576': 1.2,
            '480': 1.1,
            'sd': 1
          };
          
          const rankA = rank[resA] || 0;
          const rankB = rank[resB] || 0;

          if (rules.preferHigherResolution && rankA !== rankB) {
            return rankB - rankA; // Higher resolution first
          }

          if (rules.preferHigherBitrate) {
            return (b.bitrate || 0) - (a.bitrate || 0); // Higher bitrate first
          }
          return 0;
        });

        // The first is our "keep" candidate, the rest are "cleanup" candidates
        const keepMedia = sortedMedia[0];
        const discardMediaList = sortedMedia.slice(1);

        for (const media of discardMediaList) {
          const part = media.Part?.[0] || {};
          if (part.file) {
            proposals.push({
              id: `${item.ratingKey}_dup_${media.id}`,
              ratingKey: item.ratingKey,
              title: item.title,
              library: lib.title,
              type: 'Duplicate File',
              filePath: part.file,
              fileSize: part.size || 0,
              details: `Duplicate of kept file (${keepMedia.videoResolution || 'unknown'} resolution). Discard candidate resolution is ${media.videoResolution || 'unknown'}.`,
              fileId: part.id
            });
          }
        }
      }

      // Rule 2: Low Quality Cleanup
      const lowQualityRes = (rules.maxLowQualityResolution || 'sd').toLowerCase().replace(/p$/, '');
      const lowQualityBitrate = rules.maxLowQualityBitrate || 1500;

      for (const media of mediaList) {
        const res = (media.videoResolution || '').toLowerCase().replace(/p$/, '');
        const bitrate = media.bitrate || 0;

        // Resolution ranks
        const rank = {
          '4k': 5,
          '2160': 5,
          '2k': 4,
          '1440': 4,
          '1080': 3,
          '720': 2,
          '576': 1.2,
          '480': 1.1,
          'sd': 1
        };
        const itemRank = rank[res] || 1;
        const limitRank = rank[lowQualityRes] || 1;

        if (itemRank <= limitRank && bitrate < lowQualityBitrate && mediaList.length === 1) {
          // Flag only if it's not already flagged in duplicates (to prevent double proposals)
          const part = media.Part?.[0] || {};
          if (part.file) {
            proposals.push({
              id: `${item.ratingKey}_lq_${media.id}`,
              ratingKey: item.ratingKey,
              title: item.title,
              library: lib.title,
              type: 'Low Quality File',
              filePath: part.file,
              fileSize: part.size || 0,
              details: `Meets low quality criteria: Resolution is ${res || 'unknown'} (<= ${lowQualityRes}) and bitrate is ${bitrate} kbps (< ${lowQualityBitrate} kbps).`,
              fileId: part.id
            });
          }
        }
      }
    }
  }

  res.json(proposals);
});

// Perform Proposal Action (delete or move)
app.post('/api/cleanup/action', async (req, res) => {
  const { proposalId, action, filePath } = req.body;
  const config = readConfig();
  const isMock = shouldMockPlex(config);

  if (!filePath) {
    return res.status(400).json({ success: false, message: 'File path is required' });
  }

  try {
    if (isMock) {
      // Simulate action
      return res.json({ 
        success: true, 
        message: `[Simulated] Success: File at '${filePath}' ${action === 'delete' ? 'deleted' : 'quarantined'} successfully.` 
      });
    }

    const localPath = translatePath(filePath);

    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ success: false, message: `File not found on system at translated path: ${localPath} (originally: ${filePath})` });
    }

    if (action === 'delete') {
      await fs.promises.unlink(localPath);
      return res.json({ success: true, message: `File deleted successfully: ${localPath}` });
    } else if (action === 'move') {
      const targetDir = config.cleanup.targetDir || './quarantine';
      await fs.promises.mkdir(targetDir, { recursive: true });
      const destPath = path.join(targetDir, path.basename(localPath));
      await fs.promises.rename(localPath, destPath);
      return res.json({ success: true, message: `File moved to quarantine: ${destPath}` });
    }

    res.status(400).json({ success: false, message: 'Invalid cleanup action requested' });
  } catch (err) {
    console.error('File cleanup action error:', err);
    res.status(500).json({ success: false, message: `Failed to complete cleanup: ${err.message}` });
  }
});

// SSE endpoint for live stats & log alerts
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial message
  res.write(`data: ${JSON.stringify({ type: 'connected', time: Date.now() })}\n\n`);

  // Interval to push session updates
  const sessionInterval = setInterval(async () => {
    try {
      const config = readConfig();
      let sessionData = {};
      if (shouldMockPlex(config)) {
        sessionData = getMockSessions().MediaContainer;
      } else {
        const data = await fetchPlex('/status/sessions');
        sessionData = data.MediaContainer;
      }
      res.write(`data: ${JSON.stringify({ type: 'sessions', data: sessionData })}\n\n`);
    } catch (e) {
      // Return empty if real request fails to avoid spamming mock data
      res.write(`data: ${JSON.stringify({ type: 'sessions', data: { size: 0, Metadata: [] } })}\n\n`);
    }
  }, 5000);

  // Interval to push log status updates
  const logInterval = setInterval(async () => {
    try {
      const config = readConfig();
      let logData = {};
      
      let logLines = [];
      if (config.plex.useMockLogs || !config.plex.logPath || !fs.existsSync(config.plex.logPath)) {
        logLines = MOCK_LOG_LINES;
      } else {
        const data = await fs.promises.readFile(config.plex.logPath, 'utf-8');
        logLines = data.split('\n').slice(-200);
      }

      let errors = 0, warnings = 0, transcodeErrors = 0;
      logLines.forEach(line => {
        if (line.includes('ERROR -') || line.includes('critical error')) {
          errors++;
          if (line.toLowerCase().includes('transcoder') || line.toLowerCase().includes('transcode')) transcodeErrors++;
        } else if (line.includes('WARNING -') || line.includes('Slow query:')) {
          warnings++;
        }
      });

      let healthScore = Math.max(0, Math.min(100, 100 - (errors * 10) - (warnings * 3)));
      let status = 'HEALTHY';
      if (transcodeErrors > 2 || (errors > 5 && warnings > 5)) status = 'DANGER';
      else if (transcodeErrors > 0 || warnings > 3) status = 'WARNING';

      res.write(`data: ${JSON.stringify({ type: 'health', data: { status, healthScore, errors, warnings, transcodeErrors } })}\n\n`);
    } catch (e) {
      // Ignore
    }
  }, 10000);

  req.on('close', () => {
    clearInterval(sessionInterval);
    clearInterval(logInterval);
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`CineDeck Server running at http://localhost:${PORT}`);
});
