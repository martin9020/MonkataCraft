/**
 * MonkaCraft Admin Panel — Complete Controller
 *
 * Handles authentication (SHA-256), dashboard, 6 tabs (video, screenshot,
 * blog post, stream, chat, settings), content CRUD list, auto-save drafts,
 * modals, and all admin interactions.
 *
 * Dependencies: content.js (ContentStore), cloudinary.js (CloudinaryUpload),
 *               emailjs.js (EmailService)
 *
 * Exposed globally as window.AdminPanel.
 */
(function () {
  'use strict';

  // =====================================================================
  // A) CONSTANTS & CONFIG
  // =====================================================================

  /** SHA-256 hex of "monkacraft2024" — the default passphrase hash. */
  var DEFAULT_HASH = '0e96ec1f64c97fc4524a4a4a5147c04c62af2bd5a73941c205fef49debaba1e1';

  var AUTH_SESSION_KEY = 'monkacraft_auth';
  var HASH_STORAGE_KEY = 'monkacraft_passphrase_hash';
  var DRAFT_PREFIX = 'monkacraft_draft_';
  var MAX_ATTEMPTS = 5;
  var COOLDOWN_SECONDS = 60;

  var _attempts = 0;
  var _cooldownTimer = null;
  var _cooldownRemaining = 0;

  // Tab name -> panel ID mapping
  var TAB_MAP = {
    video: 'tab-video',
    screenshot: 'tab-screenshot',
    blog: 'tab-post',
    stream: 'tab-stream',
    chat: 'tab-chat',
    settings: 'tab-settings'
  };

  // Type icons for content list
  var TYPE_ICONS = {
    video: '\u{1F4F9}',
    screenshot: '\u{1F5BC}\uFE0F',
    post: '\u{1F4DD}',
    stream: '\u{1F3AC}'
  };

  // =====================================================================
  // B) UTILITY HELPERS
  // =====================================================================

  /** Return today's date as YYYY-MM-DD. */
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  /** Safely get a DOM element by ID. */
  function $(id) {
    return document.getElementById(id);
  }

  /**
   * SHA-256 hash via Web Crypto API.
   * @param {string} str
   * @returns {Promise<string>} hex digest
   */
  async function hashPassphrase(str) {
    var encoder = new TextEncoder();
    var data = encoder.encode(str);
    var hashBuffer = await crypto.subtle.digest('SHA-256', data);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  /**
   * Extract YouTube video ID from various URL formats.
   * @param {string} url
   * @returns {string|null}
   */
  function extractYouTubeId(url) {
    if (!url) return null;
    var patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (var i = 0; i < patterns.length; i++) {
      var match = url.match(patterns[i]);
      if (match) return match[1];
    }
    return null;
  }

  /** Get the tag CSS class for a game tag name. */
  function tagClass(gameTag) {
    if (!gameTag) return 'tag-other';
    var lower = gameTag.toLowerCase();
    if (lower === 'minecraft') return 'tag-minecraft';
    if (lower === 'roblox') return 'tag-roblox';
    return 'tag-other';
  }

  // =====================================================================
  // C) AUTHENTICATION MODULE
  // =====================================================================

  /** Check if already authenticated via sessionStorage. */
  function checkAuth() {
    return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
  }

  /** Get the stored passphrase hash (from localStorage or default). */
  function getStoredHash() {
    return localStorage.getItem(HASH_STORAGE_KEY) || DEFAULT_HASH;
  }

  /** Attempt login with given passphrase. */
  async function login(passphrase) {
    if (_cooldownRemaining > 0) return;

    var authError = $('auth-error');
    var authWrapper = $('auth-input-wrapper');

    if (!passphrase || passphrase.trim() === '') {
      authError.textContent = '\u274C \u041C\u043E\u043B\u044F, \u043D\u0430\u043F\u0438\u0448\u0438 \u043F\u0430\u0440\u043E\u043B\u0430\u0442\u0430! / Please enter the passphrase!';
      authError.style.display = 'block';
      return;
    }

    var inputHash = await hashPassphrase(passphrase.trim());
    var storedHash = getStoredHash();

    if (inputHash === storedHash) {
      // Success
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      _attempts = 0;
      authError.style.display = 'none';

      // Show success animation
      authError.style.display = 'block';
      authError.style.color = 'var(--color-primary)';
      authError.textContent = '\u2705 ACCESS GRANTED!';

      setTimeout(function () {
        $('auth-screen').style.display = 'none';
        showDashboard();
      }, 800);

    } else {
      // Failure
      _attempts++;
      authWrapper.classList.add('shake');
      setTimeout(function () {
        authWrapper.classList.remove('shake');
      }, 500);

      if (_attempts >= MAX_ATTEMPTS) {
        startCooldown();
        authError.textContent = '\u274C \u041F\u0440\u0435\u043A\u0430\u043B\u0435\u043D\u043E \u043C\u043D\u043E\u0433\u043E \u043E\u043F\u0438\u0442\u0438! \u0418\u0437\u0447\u0430\u043A\u0430\u0439... / Too many attempts!';
      } else {
        authError.textContent = '\u274C \u0413\u0440\u0435\u0448\u0435\u043D \u043A\u043E\u0434! \u041E\u043F\u0438\u0442\u0430\u0439 \u043F\u0430\u043A! (' + (MAX_ATTEMPTS - _attempts) + ' \u043E\u0441\u0442\u0430\u0432\u0430\u0449\u0438)';
      }
      authError.style.color = '';
      authError.style.display = 'block';
    }
  }

  /** Start cooldown timer after too many failed attempts. */
  function startCooldown() {
    _cooldownRemaining = COOLDOWN_SECONDS;
    var cooldownEl = $('auth-cooldown');
    var enterBtn = $('auth-enter-btn');

    cooldownEl.style.display = 'block';
    enterBtn.disabled = true;
    enterBtn.style.opacity = '0.4';

    function tick() {
      if (_cooldownRemaining <= 0) {
        clearInterval(_cooldownTimer);
        _cooldownTimer = null;
        cooldownEl.style.display = 'none';
        enterBtn.disabled = false;
        enterBtn.style.opacity = '1';
        _attempts = 0;
        return;
      }
      cooldownEl.textContent = '\u23F3 ' + _cooldownRemaining + '\u0441 / ' + _cooldownRemaining + 's';
      _cooldownRemaining--;
    }
    tick();
    _cooldownTimer = setInterval(tick, 1000);
  }

  /** Logout: clear session, show auth screen. */
  function logout() {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    $('admin-dashboard').classList.remove('visible');
    $('auth-screen').style.display = '';
    $('auth-passphrase').value = '';
    $('auth-error').style.display = 'none';
  }

  // =====================================================================
  // D) DASHBOARD INITIALIZATION
  // =====================================================================

  /** Show the admin dashboard and populate data. */
  function showDashboard() {
    $('admin-dashboard').classList.add('visible');
    updateStats();
    renderContentList();
    loadSettingsValues();
    setDateDefaults();
    restoreAllDrafts();
  }

  /** Update the stats counters in the top bar. */
  function updateStats() {
    var stats = ContentStore.getStats();
    $('stat-videos').textContent = stats.videos;
    $('stat-screenshots').textContent = stats.screenshots;
    $('stat-posts').textContent = stats.posts;
    $('stat-streams').textContent = stats.streams;
  }

  /** Set today's date as default for all date inputs. */
  function setDateDefaults() {
    var today = todayISO();
    var dateInputs = ['video-date', 'screenshot-date', 'post-date', 'stream-date'];
    dateInputs.forEach(function (id) {
      var el = $(id);
      if (el && !el.value) el.value = today;
    });
  }

  // =====================================================================
  // E) TAB SWITCHING
  // =====================================================================

  // Map tab names to content types for filtering the content list
  var TAB_TYPE_MAP = {
    'video': 'video',
    'screenshot': 'screenshot',
    'blog': 'post',
    'stream': 'stream'
  };

  var activeTab = 'video';

  /** Switch to a specific tab by name. */
  function switchTab(tabName) {
    activeTab = tabName;

    // Update tab buttons
    var buttons = document.querySelectorAll('.admin-tab-btn');
    buttons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    // Update tab panels
    var panels = document.querySelectorAll('.admin-tab-panel');
    panels.forEach(function (panel) {
      panel.classList.remove('active');
    });

    var targetPanel = $(TAB_MAP[tabName]);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }

    // Re-render content list filtered by active tab type
    renderContentList();

    // Ensure date fields have today's date
    setDateDefaults();
  }

  // =====================================================================
  // F) TAB 1 — VIDEO FORM
  // =====================================================================

  function initVideoTab() {
    var form = $('form-video');
    var ytUrl = $('video-youtube-url');
    var ytPreview = $('video-yt-preview');
    var ytIframeWrapper = $('video-yt-iframe-wrapper');
    var ytSection = $('video-youtube-section');
    var uploadSection = $('video-upload-section');
    var uploadBtn = $('video-upload-btn');

    // Video type toggle: YouTube vs Upload
    document.querySelectorAll('input[name="video-type"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (this.value === 'youtube') {
          ytSection.style.display = '';
          uploadSection.style.display = 'none';
        } else {
          ytSection.style.display = 'none';
          uploadSection.style.display = '';
        }
        saveDraft('video');
      });
    });

    // YouTube URL preview
    ytUrl.addEventListener('input', function () {
      var id = extractYouTubeId(this.value);
      if (id) {
        ytIframeWrapper.innerHTML = '<iframe style="position:absolute;inset:0;width:100%;height:100%;border:none;" src="https://www.youtube.com/embed/' + id + '" allowfullscreen></iframe>';
        ytPreview.style.display = '';
      } else {
        ytIframeWrapper.innerHTML = '';
        ytPreview.style.display = 'none';
      }
      saveDraft('video');
    });

    // Cloudinary upload button
    uploadBtn.addEventListener('click', function () {
      if (typeof CloudinaryUpload !== 'undefined' && CloudinaryUpload.open) {
        CloudinaryUpload.open('video', function (result) {
          if (result && result.secure_url) {
            $('video-upload-url').value = result.secure_url;
            $('video-upload-filename').textContent = '\u2705 ' + (result.original_filename || 'Video') + '.' + (result.format || 'mp4');
            $('video-upload-preview').style.display = '';
            saveDraft('video');
          }
        });
      } else {
        showError('\u041D\u0430\u0441\u0442\u0440\u043E\u0439 Cloudinary \u0432 \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438! / Configure Cloudinary in Settings!');
      }
    });

    // Form submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      saveVideo();
    });
  }

  function saveVideo() {
    var title = $('video-title').value.trim();
    if (!title) {
      showError('\u041C\u043E\u043B\u044F \u043D\u0430\u043F\u0438\u0448\u0438 \u0437\u0430\u0433\u043B\u0430\u0432\u0438\u0435! / Please enter a title!');
      return;
    }

    var videoType = document.querySelector('input[name="video-type"]:checked').value;
    var url = '';
    var thumbnail = '';

    if (videoType === 'youtube') {
      url = $('video-youtube-url').value.trim();
      var ytId = extractYouTubeId(url);
      if (!ytId) {
        showError('\u041C\u043E\u043B\u044F \u0432\u044A\u0432\u0435\u0434\u0438 \u0432\u0430\u043B\u0438\u0434\u0435\u043D YouTube \u043B\u0438\u043D\u043A! / Please enter a valid YouTube URL!');
        return;
      }
      url = 'https://www.youtube.com/watch?v=' + ytId;
      thumbnail = 'https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg';
    } else {
      url = $('video-upload-url').value;
      if (!url) {
        showError('\u041C\u043E\u043B\u044F \u043A\u0430\u0447\u0438 \u0432\u0438\u0434\u0435\u043E! / Please upload a video!');
        return;
      }
      thumbnail = url;
    }

    var entry = {
      type: 'video',
      title: title,
      url: url,
      thumbnail: thumbnail,
      videoType: videoType,
      gameTag: $('video-gametag').value,
      category: $('video-category').value,
      description: $('video-description').value.trim(),
      date: $('video-date').value || todayISO()
    };

    var editId = $('video-edit-id').value;
    if (editId) {
      ContentStore.update(editId, entry);
    } else {
      ContentStore.add(entry);
    }

    showSuccess('\u2705 \u0417\u0410\u041F\u0410\u0417\u0415\u041D\u041E! / SAVED!');
    resetVideoForm();
    updateStats();
    renderContentList();
    clearDraft('video');
  }

  function resetVideoForm() {
    $('form-video').reset();
    $('video-edit-id').value = '';
    $('video-yt-preview').style.display = 'none';
    $('video-yt-iframe-wrapper').innerHTML = '';
    $('video-upload-preview').style.display = 'none';
    $('video-upload-url').value = '';
    $('video-youtube-section').style.display = '';
    $('video-upload-section').style.display = 'none';
    $('video-date').value = todayISO();
  }

  // =====================================================================
  // G) TAB 2 — SCREENSHOT FORM
  // =====================================================================

  function initScreenshotTab() {
    var form = $('form-screenshot');
    var uploadBtn = $('screenshot-upload-btn');

    uploadBtn.addEventListener('click', function () {
      if (typeof CloudinaryUpload !== 'undefined' && CloudinaryUpload.open) {
        CloudinaryUpload.open('image', function (result) {
          if (result && result.secure_url) {
            $('screenshot-upload-url').value = result.secure_url;
            $('screenshot-preview-img').src = result.secure_url;
            $('screenshot-upload-preview').style.display = '';
            saveDraft('screenshot');
          }
        });
      } else {
        showError('\u041D\u0430\u0441\u0442\u0440\u043E\u0439 Cloudinary \u0432 \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438! / Configure Cloudinary in Settings!');
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      saveScreenshot();
    });
  }

  function saveScreenshot() {
    var title = $('screenshot-title').value.trim();
    if (!title) {
      showError('\u041C\u043E\u043B\u044F \u043D\u0430\u043F\u0438\u0448\u0438 \u0437\u0430\u0433\u043B\u0430\u0432\u0438\u0435! / Please enter a title!');
      return;
    }

    var url = $('screenshot-upload-url').value;
    if (!url) {
      showError('\u041C\u043E\u043B\u044F \u043A\u0430\u0447\u0438 \u0441\u043D\u0438\u043C\u043A\u0430! / Please upload an image!');
      return;
    }

    var entry = {
      type: 'screenshot',
      title: title,
      url: url,
      thumbnail: url,
      gameTag: $('screenshot-gametag').value,
      category: $('screenshot-category').value,
      description: $('screenshot-caption').value.trim(),
      date: $('screenshot-date').value || todayISO()
    };

    var editId = $('screenshot-edit-id').value;
    if (editId) {
      ContentStore.update(editId, entry);
    } else {
      ContentStore.add(entry);
    }

    showSuccess('\u2705 \u0417\u0410\u041F\u0410\u0417\u0415\u041D\u041E! / SAVED!');
    resetScreenshotForm();
    updateStats();
    renderContentList();
    clearDraft('screenshot');
  }

  function resetScreenshotForm() {
    $('form-screenshot').reset();
    $('screenshot-edit-id').value = '';
    $('screenshot-upload-preview').style.display = 'none';
    $('screenshot-preview-img').src = '';
    $('screenshot-upload-url').value = '';
    $('screenshot-date').value = todayISO();
  }

  // =====================================================================
  // H) TAB 3 — BLOG POST FORM
  // =====================================================================

  function initPostTab() {
    var form = $('form-post');
    var editor = $('post-editor');
    var excerptInput = $('post-excerpt');

    // WYSIWYG toolbar buttons
    $('wysiwyg-bold').addEventListener('click', function () {
      document.execCommand('bold', false, null);
      editor.focus();
    });

    $('wysiwyg-heading').addEventListener('click', function () {
      document.execCommand('formatBlock', false, 'h3');
      editor.focus();
    });

    $('wysiwyg-link').addEventListener('click', function () {
      var url = prompt('\u0412\u044A\u0432\u0435\u0434\u0438 URL (Enter URL):');
      if (url) {
        document.execCommand('createLink', false, url);
      }
      editor.focus();
    });

    $('wysiwyg-image').addEventListener('click', function () {
      var url = prompt('\u0412\u044A\u0432\u0435\u0434\u0438 URL \u043D\u0430 \u0441\u043D\u0438\u043C\u043A\u0430\u0442\u0430 (Enter image URL):');
      if (url) {
        document.execCommand('insertImage', false, url);
      }
      editor.focus();
    });

    // Auto-excerpt from editor content
    editor.addEventListener('input', function () {
      var text = editor.textContent || '';
      if (text.length > 0) {
        excerptInput.value = text.substring(0, 150);
      }
      saveDraft('post');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      savePost();
    });
  }

  function savePost() {
    var title = $('post-title').value.trim();
    if (!title) {
      showError('\u041C\u043E\u043B\u044F \u043D\u0430\u043F\u0438\u0448\u0438 \u0437\u0430\u0433\u043B\u0430\u0432\u0438\u0435! / Please enter a title!');
      return;
    }

    var content = $('post-editor').innerHTML.trim();
    if (!content || content === '<br>') {
      showError('\u041C\u043E\u043B\u044F \u043D\u0430\u043F\u0438\u0448\u0438 \u043D\u0435\u0449\u043E \u0432 \u043F\u043E\u0441\u0442\u0430! / Please write something in the post!');
      return;
    }

    var entry = {
      type: 'post',
      title: title,
      content: content,
      gameTag: $('post-gametag').value,
      excerpt: $('post-excerpt').value.trim() || ($('post-editor').textContent || '').substring(0, 150),
      date: $('post-date').value || todayISO()
    };

    var editId = $('post-edit-id').value;
    if (editId) {
      ContentStore.update(editId, entry);
    } else {
      ContentStore.add(entry);
    }

    showSuccess('\u2705 \u0417\u0410\u041F\u0410\u0417\u0415\u041D\u041E! / SAVED!');
    resetPostForm();
    updateStats();
    renderContentList();
    clearDraft('post');
  }

  function resetPostForm() {
    $('form-post').reset();
    $('post-edit-id').value = '';
    $('post-editor').innerHTML = '';
    $('post-excerpt').value = '';
    $('post-date').value = todayISO();
  }

  // =====================================================================
  // I) TAB 4 — STREAM FORM
  // =====================================================================

  function initStreamTab() {
    var form = $('form-stream');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      saveStream();
    });
  }

  function saveStream() {
    var title = $('stream-title').value.trim();
    if (!title) {
      showError('\u041C\u043E\u043B\u044F \u043D\u0430\u043F\u0438\u0448\u0438 \u0437\u0430\u0433\u043B\u0430\u0432\u0438\u0435! / Please enter a title!');
      return;
    }

    var url = $('stream-url').value.trim();
    var isLive = $('stream-is-live').checked;

    var entry = {
      type: 'stream',
      title: title,
      url: url,
      isLive: isLive,
      gameTag: $('stream-gametag').value,
      date: $('stream-date').value || todayISO()
    };

    // Extract thumbnail for YouTube
    var ytId = extractYouTubeId(url);
    if (ytId) {
      entry.thumbnail = 'https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg';
    }

    var editId = $('stream-edit-id').value;
    if (editId) {
      ContentStore.update(editId, entry);
      // Also set live status via the dedicated method
      ContentStore.setLive(editId, isLive);
    } else {
      var saved = ContentStore.add(entry);
      if (saved && isLive) {
        ContentStore.setLive(saved.id, true);
      }
    }

    showSuccess('\u2705 \u0417\u0410\u041F\u0410\u0417\u0415\u041D\u041E! / SAVED!');
    resetStreamForm();
    updateStats();
    renderContentList();
    clearDraft('stream');
  }

  function resetStreamForm() {
    $('form-stream').reset();
    $('stream-edit-id').value = '';
    $('stream-is-live').checked = false;
    $('stream-date').value = todayISO();
  }

  // =====================================================================
  // I-b) TAB 5 — CHAT WITH UNCLE (ЧАТ С ЧИЧИ)
  // =====================================================================

  function initChatTab() {
    var sendBtn = $('chat-send-btn');
    var clearBtn = $('chat-clear-history');
    var uploadBtn = $('chat-upload-btn');

    // Update remaining counter on tab load
    updateChatRemaining();
    renderChatHistory();

    // Send button
    sendBtn.addEventListener('click', function () {
      var subject = $('chat-subject').value.trim();
      var message = $('chat-message').value.trim();
      var imageUrl = $('chat-upload-url') ? $('chat-upload-url').value : '';
      var statusEl = $('chat-status');

      if (!subject) {
        showError('\u041D\u0430\u043F\u0438\u0448\u0438 \u0442\u0435\u043C\u0430! / Please enter a subject!');
        return;
      }
      if (!message) {
        showError('\u041D\u0430\u043F\u0438\u0448\u0438 \u0441\u044A\u043E\u0431\u0449\u0435\u043D\u0438\u0435! / Please enter a message!');
        return;
      }

      if (typeof EmailService === 'undefined') {
        showError('\u274C EmailJS \u043D\u0435 \u0435 \u043D\u0430\u043B\u0438\u0447\u0435\u043D! / EmailJS not available!');
        return;
      }

      if (EmailService.getRemainingToday() <= 0) {
        showError('\u0414\u043E\u0441\u0442\u0438\u0433\u043D\u0430 \u043B\u0438\u043C\u0438\u0442\u0430 \u0437\u0430 \u0434\u043D\u0435\u0441! / Daily limit reached!');
        return;
      }

      // Show loading
      statusEl.style.display = '';
      statusEl.innerHTML = '<span style="color:var(--color-secondary);">\u{1F4E8} \u0418\u0437\u043F\u0440\u0430\u0449\u0430\u043C... / Sending...</span>';
      sendBtn.disabled = true;

      EmailService.send(subject, message, imageUrl || null)
        .then(function () {
          statusEl.innerHTML = '<span style="color:var(--color-primary);font-size:1.2rem;">\u2705 \u0418\u0437\u043F\u0440\u0430\u0442\u0435\u043D\u043E! \u0427\u0438\u0447\u0438 \u0449\u0435 \u0433\u043E \u0432\u0438\u0434\u0438 \u0441\u043A\u043E\u0440\u043E! \u{1F389} / Sent!</span>';
          showSuccess('\u{1F4E8} \u0418\u0437\u043F\u0440\u0430\u0442\u0435\u043D\u043E \u043D\u0430 \u0427\u0438\u0447\u0438! / Sent to Uncle!');
          // Clear form
          $('chat-subject').value = '';
          $('chat-message').value = '';
          if ($('chat-upload-url')) $('chat-upload-url').value = '';
          var previewEl = $('chat-upload-preview');
          if (previewEl) previewEl.style.display = 'none';
          // Refresh UI
          updateChatRemaining();
          renderChatHistory();
        })
        .catch(function (err) {
          var msg = err && err.message ? err.message : '\u041D\u0435\u0449\u043E \u043D\u0435 \u0435 \u043D\u0430\u0440\u0435\u0434. \u041E\u043F\u0438\u0442\u0430\u0439 \u043F\u0430\u043A!';
          statusEl.innerHTML = '<span style="color:var(--color-danger);">\u274C ' + escapeHtml(msg) + '</span>';
        })
        .finally(function () {
          sendBtn.disabled = false;
        });
    });

    // Upload button for chat image attachment
    if (uploadBtn) {
      uploadBtn.addEventListener('click', function () {
        if (typeof CloudinaryUpload !== 'undefined' && CloudinaryUpload.open) {
          CloudinaryUpload.open('image', function (result) {
            if (result && result.secure_url) {
              $('chat-upload-url').value = result.secure_url;
              $('chat-preview-img').src = result.secure_url;
              $('chat-upload-preview').style.display = '';
            }
          });
        } else {
          showError('\u041D\u0430\u0441\u0442\u0440\u043E\u0439 Cloudinary \u0432 \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438! / Configure Cloudinary in Settings first!');
        }
      });
    }

    // Clear history button
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        showConfirmModal(
          '\u0418\u0437\u0447\u0438\u0441\u0442\u0438 \u0438\u0441\u0442\u043E\u0440\u0438\u044F\u0442\u0430? / Clear history?',
          '\u0422\u043E\u0432\u0430 \u0449\u0435 \u0438\u0437\u0442\u0440\u0438\u0435 \u0432\u0441\u0438\u0447\u043A\u0438 \u0437\u0430\u043F\u0438\u0441\u0438 \u0437\u0430 \u0438\u0437\u043F\u0440\u0430\u0442\u0435\u043D\u0438 \u0441\u044A\u043E\u0431\u0449\u0435\u043D\u0438\u044F. / This will delete all sent message records.',
          function () {
            EmailService.clearHistory();
            renderChatHistory();
            showSuccess('\u{1F5D1}\uFE0F \u0418\u0441\u0442\u043E\u0440\u0438\u044F\u0442\u0430 \u0435 \u0438\u0437\u0447\u0438\u0441\u0442\u0435\u043D\u0430! / History cleared!');
          }
        );
      });
    }
  }

  /** Update the "remaining messages today" counter. */
  function updateChatRemaining() {
    var el = $('chat-remaining');
    if (!el) return;
    if (typeof EmailService === 'undefined') {
      el.textContent = '';
      return;
    }
    var remaining = EmailService.getRemainingToday();
    el.innerHTML = '\u{1F4EC} \u041E\u0441\u0442\u0430\u0432\u0430\u0442 \u0442\u0438 <strong>' + remaining + '</strong> \u0441\u044A\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0437\u0430 \u0434\u043D\u0435\u0441 / <strong>' + remaining + '</strong> messages left today';
    el.style.color = remaining <= 2 ? 'var(--color-warning)' : 'var(--color-text-dim)';
  }

  /** Render the chat message history list. */
  function renderChatHistory() {
    var container = $('chat-history');
    var clearBtn = $('chat-clear-history');
    if (!container) return;

    if (typeof EmailService === 'undefined') {
      container.innerHTML = '<p style="color:var(--color-text-dim);font-size:var(--fs-sm);">EmailJS \u043D\u0435 \u0435 \u043D\u0430\u043B\u0438\u0447\u0435\u043D.</p>';
      return;
    }

    var history = EmailService.getHistory();
    if (history.length === 0) {
      container.innerHTML = '<p style="color:var(--color-text-dim);font-size:var(--fs-sm);">\u041D\u044F\u043C\u0430 \u0438\u0437\u043F\u0440\u0430\u0442\u0435\u043D\u0438 \u0441\u044A\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043E\u0449\u0435. / No messages sent yet.</p>';
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }

    if (clearBtn) clearBtn.style.display = '';

    var html = '';
    history.forEach(function (entry) {
      html += '<div style="padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:6px;border-left:3px solid var(--color-primary);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="font-weight:700;color:var(--color-text);">\u2705 ' + escapeHtml(entry.subject) + '</span>' +
          '<span style="font-size:0.8rem;color:var(--color-text-dim);">' + escapeHtml(entry.date) + '</span>' +
        '</div>' +
        '<div style="font-size:0.85rem;color:var(--color-text-dim);margin-top:2px;">' + escapeHtml(entry.preview) + '</div>' +
      '</div>';
    });

    container.innerHTML = html;
  }

  // =====================================================================
  // J) CONTENT LIST — RENDER, SEARCH, EDIT, DELETE
  // =====================================================================

  /** Render the full content list (desktop table + mobile cards). */
  function renderContentList(filter) {
    var search = (filter || $('content-search').value || '').toLowerCase().trim();

    // Gather entries — filter by active tab type if on a content tab
    var allEntries = [];
    var activeType = TAB_TYPE_MAP[activeTab];
    var types = activeType ? [activeType] : ['video', 'screenshot', 'post', 'stream'];
    types.forEach(function (type) {
      var items = ContentStore.getAll(type);
      items.forEach(function (item) {
        allEntries.push(Object.assign({ _type: type }, item));
      });
    });

    // Sort newest first
    allEntries.sort(function (a, b) {
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

    // Filter by search
    if (search) {
      allEntries = allEntries.filter(function (item) {
        return (item.title || '').toLowerCase().indexOf(search) !== -1;
      });
    }

    // Render table rows (desktop)
    var tbody = $('content-list-tbody');
    var tbodyHTML = '';

    allEntries.forEach(function (item) {
      var typeKey = item._type || item.type;
      var icon = TYPE_ICONS[typeKey] || '\u{1F4C4}';
      var tc = tagClass(item.gameTag);

      tbodyHTML += '<tr>' +
        '<td class="type-icon">' + icon + '</td>' +
        '<td class="entry-title" title="' + escapeAttr(item.title) + '">' + escapeHtml(item.title || '\u0411\u0435\u0437 \u0437\u0430\u0433\u043B\u0430\u0432\u0438\u0435') + '</td>' +
        '<td><span class="tag ' + tc + '">' + escapeHtml(item.gameTag || '') + '</span></td>' +
        '<td class="entry-date">' + escapeHtml(item.date || '') + '</td>' +
        '<td><div class="content-list-actions">' +
          '<button class="edit-btn" data-id="' + item.id + '" data-type="' + typeKey + '" title="\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u0430\u0439 / Edit">\u{270F}\uFE0F</button>' +
          '<button class="delete-btn" data-id="' + item.id + '" data-title="' + escapeAttr(item.title) + '" title="\u0418\u0437\u0442\u0440\u0438\u0439 / Delete">\u{1F5D1}\uFE0F</button>' +
        '</div></td>' +
        '</tr>';
    });

    tbody.innerHTML = tbodyHTML;

    // Render mobile cards
    var cardsContainer = $('content-list-cards');
    var cardsHTML = '';

    allEntries.forEach(function (item) {
      var typeKey = item._type || item.type;
      var icon = TYPE_ICONS[typeKey] || '\u{1F4C4}';
      var tc = tagClass(item.gameTag);

      cardsHTML += '<div class="list-entry">' +
        '<span style="font-size:1.5rem;">' + icon + '</span>' +
        '<div class="list-entry-info">' +
          '<div class="entry-title">' + escapeHtml(item.title || '\u0411\u0435\u0437 \u0437\u0430\u0433\u043B\u0430\u0432\u0438\u0435') + '</div>' +
          '<div class="entry-meta">' +
            '<span class="tag ' + tc + '">' + escapeHtml(item.gameTag || '') + '</span>' +
            '<span>' + escapeHtml(item.date || '') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="content-list-actions">' +
          '<button class="edit-btn" data-id="' + item.id + '" data-type="' + typeKey + '" title="\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u0430\u0439">\u{270F}\uFE0F</button>' +
          '<button class="delete-btn" data-id="' + item.id + '" data-title="' + escapeAttr(item.title) + '" title="\u0418\u0437\u0442\u0440\u0438\u0439">\u{1F5D1}\uFE0F</button>' +
        '</div>' +
        '</div>';
    });

    cardsContainer.innerHTML = cardsHTML;

    // Attach event listeners
    attachContentListEvents();
  }

  /** Attach edit/delete event handlers to the content list buttons. */
  function attachContentListEvents() {
    // Edit buttons
    document.querySelectorAll('.content-list .edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        var type = this.getAttribute('data-type');
        editEntry(id, type);
      });
    });

    // Delete buttons
    document.querySelectorAll('.content-list .delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        var title = this.getAttribute('data-title');
        confirmDelete(id, title);
      });
    });
  }

  /** Open a form tab pre-filled with the entry data for editing. */
  function editEntry(id, type) {
    // Find the entry
    var entries = ContentStore.getAll(type);
    var entry = null;
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].id === id) {
        entry = entries[i];
        break;
      }
    }
    if (!entry) return;

    // Switch to the appropriate tab
    var tabName = type;
    if (type === 'post') tabName = 'blog';
    switchTab(tabName);

    // Pre-fill form based on type
    switch (type) {
      case 'video':
        $('video-edit-id').value = id;
        $('video-title').value = entry.title || '';
        $('video-gametag').value = entry.gameTag || 'Minecraft';
        $('video-category').value = entry.category || "Let's Play";
        $('video-description').value = entry.description || '';
        $('video-date').value = entry.date || todayISO();
        if (entry.videoType === 'upload') {
          $('video-type-upload').checked = true;
          $('video-youtube-section').style.display = 'none';
          $('video-upload-section').style.display = '';
          $('video-upload-url').value = entry.url || '';
          $('video-upload-filename').textContent = '\u2705 \u041A\u0430\u0447\u0435\u043D\u043E \u0432\u0438\u0434\u0435\u043E';
          $('video-upload-preview').style.display = '';
        } else {
          $('video-type-yt').checked = true;
          $('video-youtube-section').style.display = '';
          $('video-upload-section').style.display = 'none';
          $('video-youtube-url').value = entry.url || '';
          // Trigger preview
          var ytId = extractYouTubeId(entry.url);
          if (ytId) {
            $('video-yt-iframe-wrapper').innerHTML = '<iframe style="position:absolute;inset:0;width:100%;height:100%;border:none;" src="https://www.youtube.com/embed/' + ytId + '" allowfullscreen></iframe>';
            $('video-yt-preview').style.display = '';
          }
        }
        break;

      case 'screenshot':
        $('screenshot-edit-id').value = id;
        $('screenshot-title').value = entry.title || '';
        $('screenshot-gametag').value = entry.gameTag || 'Minecraft';
        $('screenshot-category').value = entry.category || 'Build';
        $('screenshot-caption').value = entry.description || '';
        $('screenshot-date').value = entry.date || todayISO();
        if (entry.url) {
          $('screenshot-upload-url').value = entry.url;
          $('screenshot-preview-img').src = entry.url;
          $('screenshot-upload-preview').style.display = '';
        }
        break;

      case 'post':
        $('post-edit-id').value = id;
        $('post-title').value = entry.title || '';
        $('post-editor').innerHTML = entry.content || '';
        $('post-gametag').value = entry.gameTag || 'Minecraft';
        $('post-excerpt').value = entry.excerpt || '';
        $('post-date').value = entry.date || todayISO();
        break;

      case 'stream':
        $('stream-edit-id').value = id;
        $('stream-title').value = entry.title || '';
        $('stream-url').value = entry.url || '';
        $('stream-is-live').checked = !!entry.isLive;
        $('stream-gametag').value = entry.gameTag || 'Minecraft';
        $('stream-date').value = entry.date || todayISO();
        break;
    }

    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Show delete confirmation modal. */
  function confirmDelete(id, title) {
    var modal = $('modal-confirm');
    $('modal-confirm-text').textContent = '\u0418\u0437\u0442\u0440\u0438\u0439 "' + (title || '') + '"? \u041D\u0435 \u043C\u043E\u0436\u0435 \u0434\u0430 \u0441\u0435 \u0432\u044A\u0440\u043D\u0435! / Delete "' + (title || '') + '"? Cannot be undone!';
    modal.classList.add('active');

    var okBtn = $('modal-confirm-ok');
    var cancelBtn = $('modal-confirm-cancel');
    var closeBtn = $('modal-confirm-close');

    function cleanup() {
      modal.classList.remove('active');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
    }

    function onOk() {
      ContentStore.delete(id);
      cleanup();
      updateStats();
      renderContentList();
      showSuccess('\u{1F5D1}\uFE0F \u0418\u0437\u0442\u0440\u0438\u0442\u043E! / Deleted!');
    }

    function onCancel() {
      cleanup();
    }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
  }

  // =====================================================================
  // K) SETTINGS TAB HANDLERS
  // =====================================================================

  function initSettingsTab() {
    // ---- Change Passphrase ----
    $('settings-save-pass').addEventListener('click', async function () {
      var current = $('settings-current-pass').value;
      var newPass = $('settings-new-pass').value;
      var confirm = $('settings-confirm-pass').value;
      var errorEl = $('settings-pass-error');

      if (!current || !newPass || !confirm) {
        errorEl.textContent = '\u041C\u043E\u043B\u044F \u043F\u043E\u043F\u044A\u043B\u043D\u0438 \u0432\u0441\u0438\u0447\u043A\u0438 \u043F\u043E\u043B\u0435\u0442\u0430! / Please fill all fields!';
        errorEl.style.display = 'block';
        return;
      }

      if (newPass !== confirm) {
        errorEl.textContent = '\u041D\u043E\u0432\u0438\u0442\u0435 \u043F\u0430\u0440\u043E\u043B\u0438 \u043D\u0435 \u0441\u044A\u0432\u043F\u0430\u0434\u0430\u0442! / Passwords don\'t match!';
        errorEl.style.display = 'block';
        return;
      }

      if (newPass.length < 4) {
        errorEl.textContent = '\u041F\u0430\u0440\u043E\u043B\u0430\u0442\u0430 \u0435 \u043F\u0440\u0435\u043A\u0430\u043B\u0435\u043D\u043E \u043A\u044A\u0441\u0430! / Password too short!';
        errorEl.style.display = 'block';
        return;
      }

      var currentHash = await hashPassphrase(current);
      if (currentHash !== getStoredHash()) {
        errorEl.textContent = '\u0422\u0435\u043A\u0443\u0449\u0430\u0442\u0430 \u043F\u0430\u0440\u043E\u043B\u0430 \u0435 \u0433\u0440\u0435\u0448\u043D\u0430! / Current passphrase is wrong!';
        errorEl.style.display = 'block';
        return;
      }

      var newHash = await hashPassphrase(newPass);
      localStorage.setItem(HASH_STORAGE_KEY, newHash);
      errorEl.style.display = 'none';
      $('settings-current-pass').value = '';
      $('settings-new-pass').value = '';
      $('settings-confirm-pass').value = '';
      showSuccess('\u{1F511} \u041F\u0430\u0440\u043E\u043B\u0430\u0442\u0430 \u0435 \u0441\u043C\u0435\u043D\u0435\u043D\u0430! / Passphrase changed!');
    });

    // ---- Cloudinary Settings ----
    $('settings-save-cloudinary').addEventListener('click', function () {
      var cloudName = $('settings-cloud-name').value.trim();
      var uploadPreset = $('settings-upload-preset').value.trim();
      if (!cloudName || !uploadPreset) {
        showError('\u041C\u043E\u043B\u044F \u043F\u043E\u043F\u044A\u043B\u043D\u0438 \u0434\u0432\u0435\u0442\u0435 \u043F\u043E\u043B\u0435\u0442\u0430! / Please fill both fields!');
        return;
      }
      localStorage.setItem('monkacraft_cloud_name', cloudName);
      localStorage.setItem('monkacraft_upload_preset', uploadPreset);
      $('settings-cloudinary-status').innerHTML = '\u{1F7E2} \u0421\u0432\u044A\u0440\u0437\u0430\u043D / Connected';
      $('settings-cloudinary-status').style.color = 'var(--color-primary)';
      showSuccess('\u2601\uFE0F Cloudinary \u0437\u0430\u043F\u0430\u0437\u0435\u043D\u043E! / Cloudinary saved!');
    });

    $('settings-test-cloudinary').addEventListener('click', function () {
      if (typeof CloudinaryUpload !== 'undefined' && CloudinaryUpload.open) {
        CloudinaryUpload.open('image', function (result) {
          if (result && result.secure_url) {
            showSuccess('\u2705 Cloudinary \u0440\u0430\u0431\u043E\u0442\u0438! / Cloudinary works!');
            $('settings-cloudinary-status').innerHTML = '\u{1F7E2} \u0421\u0432\u044A\u0440\u0437\u0430\u043D / Connected';
            $('settings-cloudinary-status').style.color = 'var(--color-primary)';
          }
        });
      } else {
        showError('\u274C Cloudinary \u043D\u0435 \u0435 \u043D\u0430\u043B\u0438\u0447\u0435\u043D! / Cloudinary not available!');
        $('settings-cloudinary-status').innerHTML = '\u{1F534} \u041D\u0435 \u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D';
        $('settings-cloudinary-status').style.color = 'var(--color-danger)';
      }
    });

    // ---- EmailJS Settings ----
    $('settings-save-emailjs').addEventListener('click', function () {
      var serviceId = $('settings-emailjs-service').value.trim();
      var templateId = $('settings-emailjs-template').value.trim();
      var publicKey = $('settings-emailjs-key').value.trim();
      if (!serviceId || !templateId || !publicKey) {
        showError('\u041C\u043E\u043B\u044F \u043F\u043E\u043F\u044A\u043B\u043D\u0438 \u0432\u0441\u0438\u0447\u043A\u0438 \u043F\u043E\u043B\u0435\u0442\u0430! / Please fill all fields!');
        return;
      }
      // Use EmailService.saveConfig so the keys match what emailjs.js expects
      if (typeof EmailService !== 'undefined' && EmailService.saveConfig) {
        EmailService.saveConfig(serviceId, templateId, publicKey);
      } else {
        // Fallback: save directly with the correct key names
        localStorage.setItem('monkacraft_emailjs_service_id', serviceId);
        localStorage.setItem('monkacraft_emailjs_template_id', templateId);
        localStorage.setItem('monkacraft_emailjs_public_key', publicKey);
      }
      $('settings-emailjs-status').innerHTML = '\u{1F7E2} \u0413\u043E\u0442\u043E\u0432 \u0437\u0430 \u0447\u0430\u0442 / Ready to chat';
      $('settings-emailjs-status').style.color = 'var(--color-primary)';
      showSuccess('\u{1F4E7} EmailJS \u0437\u0430\u043F\u0430\u0437\u0435\u043D\u043E! / EmailJS saved!');
    });

    $('settings-test-emailjs').addEventListener('click', function () {
      if (typeof EmailService !== 'undefined' && EmailService.sendTest) {
        EmailService.sendTest().then(function () {
          showSuccess('\u2705 \u0422\u0435\u0441\u0442\u043E\u0432 \u0438\u043C\u0435\u0439\u043B \u0438\u0437\u043F\u0440\u0430\u0442\u0435\u043D! / Test email sent!');
          $('settings-emailjs-status').innerHTML = '\u{1F7E2} \u0413\u043E\u0442\u043E\u0432 \u0437\u0430 \u0447\u0430\u0442';
          $('settings-emailjs-status').style.color = 'var(--color-primary)';
        }).catch(function (err) {
          showError('\u274C EmailJS \u0442\u0435\u0441\u0442\u044A\u0442 \u0441\u0435 \u043F\u0440\u043E\u0432\u0430\u043B\u0438! / EmailJS test failed!' + (err && err.message ? ' ' + err.message : ''));
        });
      } else {
        showError('\u274C EmailJS \u043D\u0435 \u0435 \u043D\u0430\u043B\u0438\u0447\u0435\u043D! / EmailJS not available!');
      }
    });

    // ---- Backup / Export ----
    $('settings-export').addEventListener('click', function () {
      ContentStore.exportJSON();
      showSuccess('\u{1F4E5} \u0415\u043A\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u0430\u043D\u043E! / Exported!');
    });

    // ---- Backup / Import ----
    $('settings-import').addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;

      showConfirmModal(
        '\u26A0\uFE0F \u0418\u043C\u043F\u043E\u0440\u0442 / Import',
        '\u0421\u0438\u0433\u0443\u0440\u0435\u043D \u043B\u0438 \u0441\u0438? \u0422\u043E\u0432\u0430 \u0449\u0435 \u0437\u0430\u043C\u0435\u043D\u0438 \u0432\u0441\u0438\u0447\u043A\u043E! / This will replace all content!',
        function () {
          ContentStore.importJSON(file).then(function () {
            showSuccess('\u{1F4E4} \u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u0430\u043D\u043E! / Imported!');
            updateStats();
            renderContentList();
          }).catch(function (err) {
            showError('\u274C \u0413\u0440\u0435\u0448\u043A\u0430: ' + err.message);
          });
        }
      );
      // Reset input so the same file can be picked again
      this.value = '';
    });

    // ---- Cloud Backup: Upload JSON to Cloudinary ----
    $('settings-cloud-backup').addEventListener('click', function () {
      var cloudName = localStorage.getItem('monkacraft_cloud_name');
      var uploadPreset = localStorage.getItem('monkacraft_upload_preset');
      if (!cloudName || !uploadPreset) {
        showError('\u274C \u041F\u044A\u0440\u0432\u043E \u043D\u0430\u0441\u0442\u0440\u043E\u0439 Cloudinary! / Configure Cloudinary first!');
        return;
      }

      var rawData = ContentStore._getData ? ContentStore._getData() : {
        videos: ContentStore.getAll('video'),
        screenshots: ContentStore.getAll('screenshot'),
        posts: ContentStore.getAll('post'),
        streams: ContentStore.getAll('stream')
      };
      var jsonStr = JSON.stringify(rawData, null, 2);

      var blob = new Blob([jsonStr], { type: 'application/json' });
      var formData = new FormData();
      formData.append('file', blob, 'monkacraft_content.json');
      formData.append('upload_preset', uploadPreset);
      formData.append('resource_type', 'raw');
      formData.append('public_id', 'monkacraft_content');
      formData.append('overwrite', 'true');

      showSuccess('\u2601\uFE0F \u041A\u0430\u0447\u0432\u0430\u043C... / Uploading...');

      fetch('https://api.cloudinary.com/v1_1/' + cloudName + '/raw/upload', {
        method: 'POST',
        body: formData
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.secure_url) {
            $('settings-cloud-json-url').value = data.secure_url;
            ContentStore.setCloudJsonUrl(data.secure_url);
            showSuccess('\u2601\uFE0F \u041A\u0430\u0447\u0435\u043D\u043E \u0432 Cloudinary! / Uploaded to cloud!');
          } else {
            showError('\u274C ' + (data.error ? data.error.message : 'Upload failed'));
          }
        })
        .catch(function (err) {
          showError('\u274C \u0413\u0440\u0435\u0448\u043A\u0430: ' + err.message);
        });
    });

    // ---- Cloud Backup: Save URL ----
    $('settings-save-cloud-url').addEventListener('click', function () {
      var url = $('settings-cloud-json-url').value.trim();
      ContentStore.setCloudJsonUrl(url);
      showSuccess('\u2601\uFE0F URL \u0437\u0430\u043F\u0430\u0437\u0435\u043D! / Cloud URL saved!');
    });

    // Load saved cloud URL on settings init
    var savedCloudUrl = ContentStore.getCloudJsonUrl ? ContentStore.getCloudJsonUrl() : '';
    if (savedCloudUrl) {
      $('settings-cloud-json-url').value = savedCloudUrl;
    }

    // ---- Nuclear Delete ----
    $('settings-nuclear').addEventListener('click', function () {
      nuclearDeleteStep1();
    });
  }

  /** Migrate old EmailJS keys to the correct ones used by emailjs.js */
  function migrateEmailJSKeys() {
    var oldKeys = [
      ['monkacraft_emailjs_service', 'monkacraft_emailjs_service_id'],
      ['monkacraft_emailjs_template', 'monkacraft_emailjs_template_id'],
      ['monkacraft_emailjs_key', 'monkacraft_emailjs_public_key']
    ];
    oldKeys.forEach(function (pair) {
      var oldVal = localStorage.getItem(pair[0]);
      if (oldVal && !localStorage.getItem(pair[1])) {
        localStorage.setItem(pair[1], oldVal);
        localStorage.removeItem(pair[0]);
      } else if (oldVal) {
        localStorage.removeItem(pair[0]);
      }
    });
  }

  /** Load saved settings values into the settings form fields. */
  function loadSettingsValues() {
    // Migrate any old EmailJS keys first
    migrateEmailJSKeys();

    // Cloudinary
    var cloudName = localStorage.getItem('monkacraft_cloud_name') || '';
    var uploadPreset = localStorage.getItem('monkacraft_upload_preset') || '';
    $('settings-cloud-name').value = cloudName;
    $('settings-upload-preset').value = uploadPreset;
    if (cloudName && uploadPreset) {
      $('settings-cloudinary-status').innerHTML = '\u{1F7E2} \u0421\u0432\u044A\u0440\u0437\u0430\u043D / Connected';
      $('settings-cloudinary-status').style.color = 'var(--color-primary)';
    }

    // EmailJS — read from EmailService if available, otherwise direct localStorage
    var emailConfig = (typeof EmailService !== 'undefined' && EmailService.getConfig)
      ? EmailService.getConfig()
      : {
          serviceID:  localStorage.getItem('monkacraft_emailjs_service_id') || '',
          templateID: localStorage.getItem('monkacraft_emailjs_template_id') || '',
          publicKey:  localStorage.getItem('monkacraft_emailjs_public_key') || ''
        };
    $('settings-emailjs-service').value = emailConfig.serviceID;
    $('settings-emailjs-template').value = emailConfig.templateID;
    $('settings-emailjs-key').value = emailConfig.publicKey;
    if (emailConfig.serviceID && emailConfig.templateID && emailConfig.publicKey) {
      $('settings-emailjs-status').innerHTML = '\u{1F7E2} \u0413\u043E\u0442\u043E\u0432 \u0437\u0430 \u0447\u0430\u0442 / Ready to chat';
      $('settings-emailjs-status').style.color = 'var(--color-primary)';
    }
  }

  // =====================================================================
  // L) NUCLEAR DELETE — TRIPLE CONFIRMATION
  // =====================================================================

  function nuclearDeleteStep1() {
    showConfirmModal(
      '\u26A0\uFE0F \u0421\u0438\u0433\u0443\u0440\u0435\u043D \u043B\u0438 \u0441\u0438? / Are you sure?',
      '\u0422\u043E\u0432\u0430 \u0449\u0435 \u0438\u0437\u0442\u0440\u0438\u0435 \u0432\u0441\u0438\u0447\u043A\u043E\u0442\u043E \u0442\u0438 \u0441\u044A\u0434\u044A\u0440\u0436\u0430\u043D\u0438\u0435! / This will delete all your content!',
      function () {
        nuclearDeleteStep2();
      }
    );
  }

  function nuclearDeleteStep2() {
    var modal = $('modal-nuclear-2');
    modal.classList.add('active');

    var okBtn = $('modal-nuclear-2-ok');
    var cancelBtn = $('modal-nuclear-2-cancel');
    var closeBtn = $('modal-nuclear-2-close');

    function cleanup() {
      modal.classList.remove('active');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
    }

    function onOk() {
      cleanup();
      nuclearDeleteStep3();
    }

    function onCancel() {
      cleanup();
    }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
  }

  function nuclearDeleteStep3() {
    var modal = $('modal-nuclear-3');
    var input = $('nuclear-confirm-input');
    var okBtn = $('modal-nuclear-3-ok');
    var cancelBtn = $('modal-nuclear-3-cancel');
    var closeBtn = $('modal-nuclear-3-close');

    input.value = '';
    okBtn.disabled = true;
    modal.classList.add('active');

    function onInput() {
      okBtn.disabled = input.value.trim().toUpperCase() !== 'DELETE';
    }

    function cleanup() {
      modal.classList.remove('active');
      input.removeEventListener('input', onInput);
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
    }

    function onOk() {
      if (input.value.trim().toUpperCase() !== 'DELETE') return;
      // Perform nuclear delete
      localStorage.removeItem('monkacraft_content');
      cleanup();
      // Re-init ContentStore (fetch defaults from content.json)
      ContentStore.init().then(function () {
        updateStats();
        renderContentList();
        showSuccess('\u{1F4A5} \u0412\u0441\u0438\u0447\u043A\u043E \u0435 \u0438\u0437\u0442\u0440\u0438\u0442\u043E! \u0417\u0430\u0440\u0435\u0434\u0435\u043D\u0438 \u0441\u0430 \u043D\u0430\u0447\u0430\u043B\u043D\u0438\u0442\u0435 \u0434\u0430\u043D\u043D\u0438. / Everything deleted! Defaults reloaded.');
      });
    }

    function onCancel() {
      cleanup();
    }

    input.addEventListener('input', onInput);
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
  }

  // =====================================================================
  // M) AUTO-SAVE DRAFTS
  // =====================================================================

  /** Save draft state for a form to sessionStorage. */
  function saveDraft(tabName) {
    var data = {};
    switch (tabName) {
      case 'video':
        data = {
          title: $('video-title').value,
          youtubeUrl: $('video-youtube-url').value,
          uploadUrl: $('video-upload-url').value,
          gametag: $('video-gametag').value,
          category: $('video-category').value,
          description: $('video-description').value,
          date: $('video-date').value,
          type: document.querySelector('input[name="video-type"]:checked').value
        };
        break;
      case 'screenshot':
        data = {
          title: $('screenshot-title').value,
          uploadUrl: $('screenshot-upload-url').value,
          gametag: $('screenshot-gametag').value,
          category: $('screenshot-category').value,
          caption: $('screenshot-caption').value,
          date: $('screenshot-date').value
        };
        break;
      case 'post':
        data = {
          title: $('post-title').value,
          content: $('post-editor').innerHTML,
          gametag: $('post-gametag').value,
          excerpt: $('post-excerpt').value,
          date: $('post-date').value
        };
        break;
      case 'stream':
        data = {
          title: $('stream-title').value,
          url: $('stream-url').value,
          isLive: $('stream-is-live').checked,
          gametag: $('stream-gametag').value,
          date: $('stream-date').value
        };
        break;
    }
    try {
      sessionStorage.setItem(DRAFT_PREFIX + tabName, JSON.stringify(data));
    } catch (e) {
      // Ignore storage errors
    }
  }

  /** Restore a draft for a specific tab from sessionStorage. */
  function restoreDraft(tabName) {
    var raw;
    try {
      raw = sessionStorage.getItem(DRAFT_PREFIX + tabName);
    } catch (e) {
      return;
    }
    if (!raw) return;

    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return;
    }

    switch (tabName) {
      case 'video':
        if (data.title) $('video-title').value = data.title;
        if (data.youtubeUrl) $('video-youtube-url').value = data.youtubeUrl;
        if (data.uploadUrl) $('video-upload-url').value = data.uploadUrl;
        if (data.gametag) $('video-gametag').value = data.gametag;
        if (data.category) $('video-category').value = data.category;
        if (data.description) $('video-description').value = data.description;
        if (data.date) $('video-date').value = data.date;
        if (data.type === 'upload') {
          $('video-type-upload').checked = true;
          $('video-youtube-section').style.display = 'none';
          $('video-upload-section').style.display = '';
        }
        // Trigger YT preview if URL exists
        if (data.youtubeUrl) {
          var ytId = extractYouTubeId(data.youtubeUrl);
          if (ytId) {
            $('video-yt-iframe-wrapper').innerHTML = '<iframe style="position:absolute;inset:0;width:100%;height:100%;border:none;" src="https://www.youtube.com/embed/' + ytId + '" allowfullscreen></iframe>';
            $('video-yt-preview').style.display = '';
          }
        }
        break;
      case 'screenshot':
        if (data.title) $('screenshot-title').value = data.title;
        if (data.gametag) $('screenshot-gametag').value = data.gametag;
        if (data.category) $('screenshot-category').value = data.category;
        if (data.caption) $('screenshot-caption').value = data.caption;
        if (data.date) $('screenshot-date').value = data.date;
        if (data.uploadUrl) {
          $('screenshot-upload-url').value = data.uploadUrl;
          $('screenshot-preview-img').src = data.uploadUrl;
          $('screenshot-upload-preview').style.display = '';
        }
        break;
      case 'post':
        if (data.title) $('post-title').value = data.title;
        if (data.content) $('post-editor').innerHTML = data.content;
        if (data.gametag) $('post-gametag').value = data.gametag;
        if (data.excerpt) $('post-excerpt').value = data.excerpt;
        if (data.date) $('post-date').value = data.date;
        break;
      case 'stream':
        if (data.title) $('stream-title').value = data.title;
        if (data.url) $('stream-url').value = data.url;
        if (data.isLive) $('stream-is-live').checked = true;
        if (data.gametag) $('stream-gametag').value = data.gametag;
        if (data.date) $('stream-date').value = data.date;
        break;
    }
  }

  /** Restore all drafts. */
  function restoreAllDrafts() {
    restoreDraft('video');
    restoreDraft('screenshot');
    restoreDraft('post');
    restoreDraft('stream');
  }

  /** Clear a saved draft. */
  function clearDraft(tabName) {
    try {
      sessionStorage.removeItem(DRAFT_PREFIX + tabName);
    } catch (e) {
      // Ignore
    }
  }

  /** Set up auto-save listeners for all form inputs. */
  function setupAutoSave() {
    // Video form inputs
    ['video-title', 'video-youtube-url', 'video-gametag', 'video-category', 'video-description', 'video-date'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', function () { saveDraft('video'); });
    });

    // Screenshot form inputs
    ['screenshot-title', 'screenshot-gametag', 'screenshot-category', 'screenshot-caption', 'screenshot-date'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', function () { saveDraft('screenshot'); });
    });

    // Post form inputs
    ['post-title', 'post-gametag', 'post-excerpt', 'post-date'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', function () { saveDraft('post'); });
    });

    // Stream form inputs
    ['stream-title', 'stream-url', 'stream-gametag', 'stream-date'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', function () { saveDraft('stream'); });
    });
    $('stream-is-live').addEventListener('change', function () { saveDraft('stream'); });
  }

  // =====================================================================
  // N) SUCCESS / ERROR / CONFIRM ANIMATIONS
  // =====================================================================

  /** Show a big green success overlay that auto-dismisses. */
  function showSuccess(message) {
    var overlay = $('success-overlay');
    overlay.textContent = message;
    overlay.style.display = '';
    // Force re-animation
    overlay.style.animation = 'none';
    overlay.offsetHeight; // trigger reflow
    overlay.style.animation = '';

    setTimeout(function () {
      overlay.style.display = 'none';
    }, 2200);
  }

  /** Show a red error toast. */
  function showError(message) {
    // Create a temporary toast element
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:4000;background:var(--color-danger);color:#fff;padding:12px 24px;border-radius:8px;font-weight:700;font-size:0.95rem;box-shadow:0 4px 20px rgba(255,34,68,0.4);animation:slideDown 0.3s ease;max-width:90vw;text-align:center;';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }

  /** Show a reusable confirmation modal. */
  function showConfirmModal(title, message, onConfirm) {
    var modal = $('modal-confirm');
    $('modal-confirm-title').textContent = title;
    $('modal-confirm-text').textContent = message;
    modal.classList.add('active');

    var okBtn = $('modal-confirm-ok');
    var cancelBtn = $('modal-confirm-cancel');
    var closeBtn = $('modal-confirm-close');

    function cleanup() {
      modal.classList.remove('active');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
    }

    function onOk() {
      cleanup();
      if (typeof onConfirm === 'function') onConfirm();
    }

    function onCancel() {
      cleanup();
    }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
  }

  // =====================================================================
  // O) HTML ESCAPING UTILITIES
  // =====================================================================

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // =====================================================================
  // P) INITIALIZATION — WIRE EVERYTHING UP
  // =====================================================================

  function init() {
    // Wait for ContentStore to be ready
    if (typeof ContentStore === 'undefined') {
      console.error('[AdminPanel] ContentStore not loaded.');
      return;
    }

    ContentStore.init().then(function () {
      // Check for existing session
      if (checkAuth()) {
        $('auth-screen').style.display = 'none';
        showDashboard();
      }

      // ---- Auth screen event listeners ----
      $('auth-enter-btn').addEventListener('click', function () {
        login($('auth-passphrase').value);
      });

      $('auth-passphrase').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          login($('auth-passphrase').value);
        }
      });

      $('auth-toggle-eye').addEventListener('click', function () {
        var input = $('auth-passphrase');
        if (input.type === 'password') {
          input.type = 'text';
          this.textContent = '\u{1F648}';
        } else {
          input.type = 'password';
          this.textContent = '\u{1F441}';
        }
      });

      // ---- Logout ----
      $('btn-logout').addEventListener('click', function () {
        logout();
      });

      // ---- Tab switching ----
      document.querySelectorAll('.admin-tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var tab = this.getAttribute('data-tab');
          switchTab(tab);
        });
      });

      // ---- Content search ----
      $('content-search').addEventListener('input', function () {
        renderContentList(this.value);
      });

      // ---- Initialize all tab handlers ----
      initVideoTab();
      initScreenshotTab();
      initPostTab();
      initStreamTab();
      initChatTab();
      initSettingsTab();
      setupAutoSave();
    });
  }

  // =====================================================================
  // Q) EXPOSE GLOBALLY & AUTO-INIT
  // =====================================================================

  window.AdminPanel = {
    init: init,
    switchTab: switchTab,
    showSuccess: showSuccess,
    showError: showError,
    showConfirmModal: showConfirmModal,
    updateStats: updateStats,
    renderContentList: renderContentList,
    hashPassphrase: hashPassphrase,
    logout: logout
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
