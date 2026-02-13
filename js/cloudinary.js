/**
 * cloudinary.js — Cloudinary Upload Widget Integration for MonkaCraft
 *
 * Wraps the Cloudinary Upload Widget for easy use from the admin panel.
 * Lazy-loads the widget script on first use. Reads credentials from localStorage.
 *
 * Dependencies: None (vanilla JS). The Cloudinary Upload Widget script is loaded dynamically.
 * Exposed globally as window.CloudinaryUpload.
 *
 * localStorage keys:
 *   monkacraft_cloudinary_cloud_name   — Cloudinary cloud name
 *   monkacraft_cloudinary_upload_preset — Cloudinary unsigned upload preset
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  var WIDGET_SCRIPT_URL = 'https://upload-widget.cloudinary.com/global/all.js';
  var LS_CLOUD_NAME = 'monkacraft_cloudinary_cloud_name';
  var LS_UPLOAD_PRESET = 'monkacraft_cloudinary_upload_preset';

  var IMAGE_MAX_SIZE = 10485760;  // 10 MB
  var VIDEO_MAX_SIZE = 52428800;  // 50 MB

  var IMAGE_FORMATS = ['jpg', 'png', 'gif', 'webp'];
  var VIDEO_FORMATS = ['mp4', 'webm'];

  var ALERT_MESSAGE = '\u26a0\ufe0f \u041f\u044a\u0440\u0432\u043e \u043d\u0430\u0441\u0442\u0440\u043e\u0439 Cloudinary \u0432 \u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438! / Configure Cloudinary in Settings first!';

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  var scriptLoaded = false;
  var scriptLoading = false;
  var scriptLoadCallbacks = [];

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Read cloud_name from localStorage.
   * Falls back to the legacy key used by admin.js for compatibility.
   */
  function getCloudName() {
    return localStorage.getItem(LS_CLOUD_NAME)
      || localStorage.getItem('monkacraft_cloud_name')
      || '';
  }

  /**
   * Read upload_preset from localStorage.
   * Falls back to the legacy key used by admin.js for compatibility.
   */
  function getUploadPreset() {
    return localStorage.getItem(LS_UPLOAD_PRESET)
      || localStorage.getItem('monkacraft_upload_preset')
      || '';
  }

  /**
   * Dynamically load the Cloudinary Upload Widget script if not already loaded.
   * Calls back with (error) — null on success, Error on failure.
   */
  function ensureWidgetScript(callback) {
    // Already loaded
    if (scriptLoaded && typeof window.cloudinary !== 'undefined' && typeof window.cloudinary.createUploadWidget === 'function') {
      callback(null);
      return;
    }

    // Currently loading — queue the callback
    if (scriptLoading) {
      scriptLoadCallbacks.push(callback);
      return;
    }

    // Start loading
    scriptLoading = true;
    scriptLoadCallbacks.push(callback);

    var script = document.createElement('script');
    script.src = WIDGET_SCRIPT_URL;
    script.async = true;

    script.onload = function () {
      scriptLoaded = true;
      scriptLoading = false;
      var cbs = scriptLoadCallbacks.slice();
      scriptLoadCallbacks = [];
      for (var i = 0; i < cbs.length; i++) {
        cbs[i](null);
      }
    };

    script.onerror = function () {
      scriptLoading = false;
      scriptLoaded = false;
      var cbs = scriptLoadCallbacks.slice();
      scriptLoadCallbacks = [];
      var err = new Error('Failed to load Cloudinary Upload Widget script.');
      for (var i = 0; i < cbs.length; i++) {
        cbs[i](err);
      }
    };

    document.head.appendChild(script);
  }

  /**
   * Build the widget configuration object based on upload type.
   * @param {string} type - 'image' or 'video'
   * @param {string} cloudName
   * @param {string} uploadPreset
   * @returns {Object} config for cloudinary.createUploadWidget
   */
  function buildWidgetConfig(type, cloudName, uploadPreset) {
    var isVideo = type === 'video';

    return {
      cloudName: cloudName,
      uploadPreset: uploadPreset,
      sources: ['local', 'camera'],
      multiple: false,
      maxFileSize: isVideo ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE,
      resourceType: isVideo ? 'video' : 'image',
      clientAllowedFormats: isVideo ? VIDEO_FORMATS : IMAGE_FORMATS
    };
  }

  /**
   * Extract the result fields from Cloudinary's result.info object.
   * Returns an object with both the spec-required keys and backward-compatible keys.
   */
  function extractResult(info) {
    return {
      // Required by spec
      url: info.secure_url || info.url || '',
      publicId: info.public_id || '',
      format: info.format || '',
      width: info.width || 0,
      height: info.height || 0,
      // Backward-compatible with admin.js which checks result.secure_url etc.
      secure_url: info.secure_url || info.url || '',
      original_filename: info.original_filename || '',
      public_id: info.public_id || ''
    };
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  var CloudinaryUpload = {

    /**
     * Open the Cloudinary upload widget.
     *
     * @param {string} type - 'image' or 'video'
     * @param {Function} callback - Called with result object on success, or null on cancel/error.
     *   Success result: {url, publicId, format, width, height, secure_url, original_filename, public_id}
     */
    open: function (type, callback) {
      callback = typeof callback === 'function' ? callback : function () {};

      // Validate type
      if (type !== 'image' && type !== 'video') {
        type = 'image';
      }

      // Check credentials
      var cloudName = getCloudName();
      var uploadPreset = getUploadPreset();

      if (!cloudName || !uploadPreset) {
        alert(ALERT_MESSAGE);
        callback(null);
        return;
      }

      // Ensure the widget script is loaded, then open
      ensureWidgetScript(function (err) {
        if (err) {
          alert(ALERT_MESSAGE);
          callback(null);
          return;
        }

        // Safety check: window.cloudinary must exist
        if (typeof window.cloudinary === 'undefined' || typeof window.cloudinary.createUploadWidget !== 'function') {
          alert(ALERT_MESSAGE);
          callback(null);
          return;
        }

        var callbackFired = false;

        var config = buildWidgetConfig(type, cloudName, uploadPreset);

        var widget = window.cloudinary.createUploadWidget(config, function (error, result) {
          if (callbackFired) return;

          if (error) {
            callbackFired = true;
            callback(null);
            return;
          }

          if (result && result.event === 'success' && result.info) {
            callbackFired = true;
            callback(extractResult(result.info));
            return;
          }

          // Widget closed / cancelled without uploading
          if (result && (result.event === 'close' || result.event === 'abort')) {
            if (!callbackFired) {
              callbackFired = true;
              callback(null);
            }
          }
        });

        widget.open();
      });
    },

    /**
     * Check whether Cloudinary credentials are configured.
     * @returns {boolean} true if both cloud_name and upload_preset exist in localStorage
     */
    isConfigured: function () {
      var cloudName = getCloudName();
      var uploadPreset = getUploadPreset();
      return !!(cloudName && uploadPreset);
    },

    /**
     * Get the current Cloudinary configuration from localStorage.
     * @returns {{cloudName: string, uploadPreset: string}}
     */
    getConfig: function () {
      return {
        cloudName: getCloudName(),
        uploadPreset: getUploadPreset()
      };
    },

    /**
     * Save Cloudinary configuration to localStorage.
     * @param {string} cloudName
     * @param {string} uploadPreset
     */
    saveConfig: function (cloudName, uploadPreset) {
      localStorage.setItem(LS_CLOUD_NAME, cloudName || '');
      localStorage.setItem(LS_UPLOAD_PRESET, uploadPreset || '');
    },

    /**
     * Test the Cloudinary connection by briefly opening the upload widget.
     * On a successful upload, calls callback(true). On error or cancel, calls callback(false).
     *
     * @param {Function} callback - Called with boolean: true if credentials work, false otherwise
     */
    testConnection: function (callback) {
      callback = typeof callback === 'function' ? callback : function () {};

      var cloudName = getCloudName();
      var uploadPreset = getUploadPreset();

      if (!cloudName || !uploadPreset) {
        callback(false);
        return;
      }

      ensureWidgetScript(function (err) {
        if (err) {
          callback(false);
          return;
        }

        if (typeof window.cloudinary === 'undefined' || typeof window.cloudinary.createUploadWidget !== 'function') {
          callback(false);
          return;
        }

        var callbackFired = false;

        var config = buildWidgetConfig('image', cloudName, uploadPreset);

        var widget = window.cloudinary.createUploadWidget(config, function (error, result) {
          if (callbackFired) return;

          if (error) {
            callbackFired = true;
            callback(false);
            return;
          }

          if (result && result.event === 'success') {
            callbackFired = true;
            callback(true);
            return;
          }

          if (result && (result.event === 'close' || result.event === 'abort')) {
            if (!callbackFired) {
              callbackFired = true;
              callback(false);
            }
          }
        });

        widget.open();
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Expose globally
  // ---------------------------------------------------------------------------

  window.CloudinaryUpload = CloudinaryUpload;

})();
