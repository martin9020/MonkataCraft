/**
 * ContentStore — Data Access Layer for MonkaCraft
 *
 * Manages all site content (videos, screenshots, posts, streams) via
 * localStorage. On first visit, fetches data/content.json as seed data.
 * Exposes CRUD operations, filtering, sorting, import/export, and
 * live-stream status helpers.
 *
 * Usage:
 *   await ContentStore.init();
 *   const videos = ContentStore.getAll('video');
 *
 * Exposed globally as window.ContentStore.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'monkacraft_content';
  var CLOUD_JSON_KEY = 'monkacraft_cloud_json_url';

  /**
   * Determine the correct path to data/content.json based on the current
   * page location. Pages served from root (index.html) use "data/content.json".
   * Pages inside a subdirectory (pages/*.html) use "../data/content.json".
   */
  function _resolveContentPath() {
    var pathname = window.location.pathname.replace(/\\/g, '/');
    // Check if we are inside the pages/ subdirectory
    if (pathname.indexOf('/pages/') !== -1) {
      return '../data/content.json';
    }
    return 'data/content.json';
  }

  /**
   * Map singular type names used by callers to the plural keys stored in JSON.
   */
  var TYPE_MAP = {
    video: 'videos',
    screenshot: 'screenshots',
    post: 'posts',
    stream: 'streams'
  };

  /**
   * Reverse map — plural key to singular type string.
   */
  var PLURAL_TO_SINGULAR = {
    videos: 'video',
    screenshots: 'screenshot',
    posts: 'post',
    streams: 'stream'
  };

  /**
   * Generate a UUID v4 string. Uses crypto.randomUUID() when available,
   * otherwise falls back to a random hex string of equivalent length.
   */
  function _generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback: build a UUID-v4-shaped string from random bytes
    var hex = '';
    for (var i = 0; i < 32; i++) {
      hex += Math.floor(Math.random() * 16).toString(16);
    }
    return (
      hex.substring(0, 8) + '-' +
      hex.substring(8, 12) + '-' +
      '4' + hex.substring(13, 16) + '-' +
      ((parseInt(hex.charAt(16), 16) & 0x3) | 0x8).toString(16) + hex.substring(17, 20) + '-' +
      hex.substring(20, 32)
    );
  }

  /**
   * Format today's date as YYYY-MM-DD.
   */
  function _todayISO() {
    var d = new Date();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + month + '-' + day;
  }

  // -----------------------------------------------------------------------
  // Internal data cache — populated on init(), kept in sync with localStorage
  // -----------------------------------------------------------------------
  var _data = null;

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * _save() — Serialize the current in-memory data object to localStorage.
   * Also triggers auto-backup to Cloudinary if configured.
   */
  var _cloudSyncTimer = null;

  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
    } catch (e) {
      console.error('[ContentStore] Failed to save to localStorage:', e);
    }
    // Debounced auto-sync to Cloudinary (waits 2s after last change)
    _scheduleCloudSync();
  }

  function _scheduleCloudSync() {
    if (_cloudSyncTimer) clearTimeout(_cloudSyncTimer);
    _cloudSyncTimer = setTimeout(_syncToCloud, 2000);
  }

  function _syncToCloud() {
    var cloudUrl = localStorage.getItem(CLOUD_JSON_KEY);
    var cloudName = localStorage.getItem('monkacraft_cloud_name');
    var uploadPreset = localStorage.getItem('monkacraft_upload_preset');

    // Only sync if Cloudinary is configured AND a cloud backup has been set up
    if (!cloudName || !uploadPreset || !cloudUrl) return;

    var jsonStr = JSON.stringify(_data, null, 2);
    var blob = new Blob([jsonStr], { type: 'application/json' });
    var formData = new FormData();
    formData.append('file', blob, 'monkacraft_content.json');
    formData.append('upload_preset', uploadPreset);
    formData.append('resource_type', 'raw');
    formData.append('public_id', 'monkacraft_content');
    formData.append('overwrite', 'true');

    fetch('https://api.cloudinary.com/v1_1/' + cloudName + '/raw/upload', {
      method: 'POST',
      body: formData
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.secure_url) {
          console.log('[ContentStore] Auto-synced to Cloudinary');
          // Update URL in case it changed
          localStorage.setItem(CLOUD_JSON_KEY, data.secure_url);
        }
      })
      .catch(function (err) {
        console.warn('[ContentStore] Cloud sync failed:', err.message);
      });
  }

  /**
   * _load() — Deserialize data from localStorage into the in-memory cache.
   * Returns true if data was found and loaded, false otherwise.
   */
  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        _data = JSON.parse(raw);
        return true;
      }
    } catch (e) {
      console.error('[ContentStore] Failed to load from localStorage:', e);
    }
    return false;
  }

  /**
   * _getData() — Return the full data object (the in-memory cache).
   */
  function _getData() {
    return _data;
  }

  /**
   * Ensure the data object has all expected top-level arrays.
   */
  function _ensureStructure(obj) {
    if (!obj || typeof obj !== 'object') {
      obj = {};
    }
    if (!Array.isArray(obj.videos)) obj.videos = [];
    if (!Array.isArray(obj.screenshots)) obj.screenshots = [];
    if (!Array.isArray(obj.posts)) obj.posts = [];
    if (!Array.isArray(obj.streams)) obj.streams = [];
    return obj;
  }

  /**
   * Sort an array of entries by date descending (newest first).
   */
  function _sortByDateDesc(arr) {
    return arr.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  var ContentStore = {

    /**
     * init() — Initialise the content store.
     *
     * If localStorage already contains data under STORAGE_KEY, use that.
     * Otherwise, fetch data/content.json (adjusting the relative path for
     * pages served from a subdirectory) and seed localStorage.
     *
     * Returns a Promise that resolves when the store is ready.
     */
    init: function () {
      return new Promise(function (resolve, reject) {
        // Try loading from localStorage first
        if (_load()) {
          _data = _ensureStructure(_data);
          resolve(_data);
          return;
        }

        // No local data — read config.json for Cloudinary URL, then fetch content
        var basePath = _resolveContentPath().replace('content.json', '');
        var configPath = basePath + 'config.json';
        var localPath = basePath + 'content.json';

        // Step 1: Try to get cloud URL from config.json (committed to repo)
        fetch(configPath)
          .then(function (r) { return r.ok ? r.json() : {}; })
          .then(function (config) {
            var cloudUrl = (config && config.cloudBackupUrl) || localStorage.getItem(CLOUD_JSON_KEY);

            if (cloudUrl) {
              // Step 2a: Fetch from Cloudinary
              return fetch(cloudUrl)
                .then(function (r) {
                  if (!r.ok) throw new Error('Cloud HTTP ' + r.status);
                  return r.json();
                })
                .catch(function (err) {
                  console.warn('[ContentStore] Cloud fetch failed, trying local:', err.message);
                  // Step 2b: Cloudinary failed, fall back to local file
                  return fetch(localPath).then(function (r) { return r.ok ? r.json() : {}; });
                });
            }
            // No cloud URL — use local file
            return fetch(localPath).then(function (r) { return r.ok ? r.json() : {}; });
          })
          .then(function (json) {
            _data = _ensureStructure(json);
            _save();
            resolve(_data);
          })
          .catch(function (err) {
            console.warn('[ContentStore] Could not fetch content.json:', err.message);
            _data = _ensureStructure({});
            _save();
            resolve(_data);
          });
      });
    },

    /** Get/set the Cloudinary JSON backup URL. */
    getCloudJsonUrl: function () {
      return localStorage.getItem(CLOUD_JSON_KEY) || '';
    },
    setCloudJsonUrl: function (url) {
      if (url) {
        localStorage.setItem(CLOUD_JSON_KEY, url);
      } else {
        localStorage.removeItem(CLOUD_JSON_KEY);
      }
    },

    // -------------------------------------------------------------------
    // Read operations
    // -------------------------------------------------------------------

    /**
     * getAll(type) — Return all entries for the given singular type.
     * @param {string} type - One of 'video', 'screenshot', 'post', 'stream'.
     * @returns {Array} Array of entry objects (empty if type is unknown).
     */
    getAll: function (type) {
      var key = TYPE_MAP[type];
      if (!key || !_data) return [];
      return (_data[key] || []).slice();
    },

    /**
     * getLatest(type, count) — Return the N newest entries of the given type,
     * sorted by date descending.
     * @param {string} type  - Singular type name.
     * @param {number} count - Maximum number of entries to return.
     * @returns {Array}
     */
    getLatest: function (type, count) {
      var all = this.getAll(type);
      return _sortByDateDesc(all).slice(0, count);
    },

    /**
     * getByTag(type, tag) — Return entries of the given type that match the
     * specified gameTag value (case-insensitive comparison).
     * @param {string} type - Singular type name.
     * @param {string} tag  - e.g. 'Minecraft', 'Roblox'.
     * @returns {Array}
     */
    getByTag: function (type, tag) {
      var all = this.getAll(type);
      var lowerTag = (tag || '').toLowerCase();
      return all.filter(function (entry) {
        return (entry.gameTag || '').toLowerCase() === lowerTag;
      });
    },

    /**
     * getByCategory(type, category) — Return entries of the given type that
     * match the specified category (case-insensitive comparison).
     * @param {string} type     - Singular type name.
     * @param {string} category - e.g. 'Tutorial', 'PVP'.
     * @returns {Array}
     */
    getByCategory: function (type, category) {
      var all = this.getAll(type);
      var lowerCat = (category || '').toLowerCase();
      return all.filter(function (entry) {
        return (entry.category || '').toLowerCase() === lowerCat;
      });
    },

    // -------------------------------------------------------------------
    // Write operations
    // -------------------------------------------------------------------

    /**
     * add(entry) — Add a new content entry.
     *
     * The entry object MUST contain a `type` field (singular: 'video',
     * 'screenshot', 'post', 'stream'). An `id` and `date` will be
     * auto-generated if not provided.
     *
     * @param {Object} entry - The content entry to add.
     * @returns {Object} The entry as stored (with generated id/date).
     */
    add: function (entry) {
      if (!entry || !entry.type) {
        console.error('[ContentStore] add() requires an entry with a "type" field.');
        return null;
      }

      var key = TYPE_MAP[entry.type];
      if (!key) {
        console.error('[ContentStore] add() unknown type:', entry.type);
        return null;
      }

      if (!_data) {
        _data = _ensureStructure({});
      }

      // Auto-generate id if missing
      if (!entry.id) {
        entry.id = _generateId();
      }

      // Auto-set date if missing
      if (!entry.date) {
        entry.date = _todayISO();
      }

      _data[key].push(entry);
      _save();
      return entry;
    },

    /**
     * update(id, updatedFields) — Find an entry by its id across ALL types,
     * merge the updated fields into it, and persist to localStorage.
     *
     * @param {string} id            - The UUID of the entry to update.
     * @param {Object} updatedFields - Key/value pairs to merge.
     * @returns {Object|null} The updated entry, or null if not found.
     */
    update: function (id, updatedFields) {
      if (!_data || !id) return null;

      var pluralKeys = Object.keys(TYPE_MAP).map(function (t) { return TYPE_MAP[t]; });

      for (var k = 0; k < pluralKeys.length; k++) {
        var key = pluralKeys[k];
        var arr = _data[key];
        if (!arr) continue;

        for (var i = 0; i < arr.length; i++) {
          if (arr[i].id === id) {
            // Merge fields
            var fields = Object.keys(updatedFields || {});
            for (var f = 0; f < fields.length; f++) {
              arr[i][fields[f]] = updatedFields[fields[f]];
            }
            _save();
            return arr[i];
          }
        }
      }

      console.warn('[ContentStore] update() entry not found:', id);
      return null;
    },

    /**
     * delete(id) — Remove an entry by its id from whichever type array
     * contains it, then persist to localStorage.
     *
     * @param {string} id - The UUID of the entry to delete.
     * @returns {boolean} True if an entry was found and removed.
     */
    delete: function (id) {
      if (!_data || !id) return false;

      var pluralKeys = Object.keys(TYPE_MAP).map(function (t) { return TYPE_MAP[t]; });

      for (var k = 0; k < pluralKeys.length; k++) {
        var key = pluralKeys[k];
        var arr = _data[key];
        if (!arr) continue;

        for (var i = 0; i < arr.length; i++) {
          if (arr[i].id === id) {
            arr.splice(i, 1);
            _save();
            return true;
          }
        }
      }

      console.warn('[ContentStore] delete() entry not found:', id);
      return false;
    },

    // -------------------------------------------------------------------
    // Import / Export
    // -------------------------------------------------------------------

    /**
     * exportJSON() — Trigger a browser download of all content as a .json file.
     * Creates a Blob, builds a temporary download link, clicks it, and cleans up.
     */
    exportJSON: function () {
      if (!_data) {
        console.error('[ContentStore] exportJSON() called before init().');
        return;
      }

      var jsonStr = JSON.stringify(_data, null, 2);
      var blob = new Blob([jsonStr], { type: 'application/json' });
      var url = URL.createObjectURL(blob);

      var a = document.createElement('a');
      a.href = url;
      a.download = 'monkacraft_content_' + _todayISO() + '.json';
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    },

    /**
     * importJSON(file) — Accept a File object (from <input type="file">),
     * read its contents, parse as JSON, replace the in-memory data and
     * localStorage entirely.
     *
     * @param {File} file - A File object containing valid JSON.
     * @returns {Promise} Resolves with the imported data object, or rejects
     *                    on parse/read error.
     */
    importJSON: function (file) {
      return new Promise(function (resolve, reject) {
        if (!file) {
          reject(new Error('No file provided.'));
          return;
        }

        var reader = new FileReader();

        reader.onload = function (e) {
          try {
            var json = JSON.parse(e.target.result);
            _data = _ensureStructure(json);
            _save();
            resolve(_data);
          } catch (err) {
            reject(new Error('Invalid JSON file: ' + err.message));
          }
        };

        reader.onerror = function () {
          reject(new Error('Failed to read file.'));
        };

        reader.readAsText(file);
      });
    },

    // -------------------------------------------------------------------
    // Stats & Live-stream helpers
    // -------------------------------------------------------------------

    /**
     * getStats() — Return an object with counts of each content type.
     * @returns {{ videos: number, screenshots: number, posts: number, streams: number }}
     */
    getStats: function () {
      if (!_data) {
        return { videos: 0, screenshots: 0, posts: 0, streams: 0 };
      }
      return {
        videos: (_data.videos || []).length,
        screenshots: (_data.screenshots || []).length,
        posts: (_data.posts || []).length,
        streams: (_data.streams || []).length
      };
    },

    /**
     * isLive() — Check whether any stream entry currently has isLive === true.
     * @returns {boolean}
     */
    isLive: function () {
      if (!_data || !_data.streams) return false;
      for (var i = 0; i < _data.streams.length; i++) {
        if (_data.streams[i].isLive === true) {
          return true;
        }
      }
      return false;
    },

    /**
     * setLive(id, bool) — Set a specific stream entry's isLive property.
     *
     * @param {string}  id   - The UUID of the stream entry.
     * @param {boolean} bool - true for live, false for offline.
     * @returns {Object|null} The updated stream entry, or null if not found.
     */
    setLive: function (id, bool) {
      if (!_data || !_data.streams) return null;

      for (var i = 0; i < _data.streams.length; i++) {
        if (_data.streams[i].id === id) {
          _data.streams[i].isLive = !!bool;
          _save();
          return _data.streams[i];
        }
      }

      console.warn('[ContentStore] setLive() stream not found:', id);
      return null;
    },

    // -------------------------------------------------------------------
    // Expose private helpers for internal / admin use
    // -------------------------------------------------------------------

    /** Private: serialize current data to localStorage. */
    _save: _save,

    /** Private: deserialize from localStorage. */
    _load: _load,

    /** Private: get the full data object. */
    _getData: _getData
  };

  // -----------------------------------------------------------------------
  // Expose globally
  // -----------------------------------------------------------------------
  window.ContentStore = ContentStore;

})();
