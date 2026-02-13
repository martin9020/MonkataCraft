/**
 * MonkaCraft — EmailJS "Chat with Uncle" (Чат с ЧИЧИ) Module
 *
 * Handles sending messages from Simeon to his uncle Martin via EmailJS.
 * Features: send emails, rate limiting (10/day), message history, test emails.
 *
 * SDK loaded dynamically (lazy) on first use.
 * All credentials stored in localStorage, entered via Admin Settings tab.
 *
 * Exposed as window.EmailService (IIFE pattern).
 */

window.EmailService = (function () {
    'use strict';

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    var STORAGE_KEYS = {
        SERVICE_ID:   'monkacraft_emailjs_service_id',
        TEMPLATE_ID:  'monkacraft_emailjs_template_id',
        PUBLIC_KEY:   'monkacraft_emailjs_public_key',
        SENT_HISTORY: 'monkacraft_email_sent_history'
    };

    var SDK_URL = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';

    var MAX_MESSAGES_PER_DAY = 10;

    var sdkLoaded = false;
    var sdkLoading = false;
    var sdkLoadPromise = null;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Format the current date/time as "DD.MM.YYYY, HH:MM"
     */
    function formatDate(date) {
        var d = date || new Date();
        var day   = String(d.getDate()).padStart(2, '0');
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var year  = d.getFullYear();
        var hours = String(d.getHours()).padStart(2, '0');
        var mins  = String(d.getMinutes()).padStart(2, '0');
        return day + '.' + month + '.' + year + ', ' + hours + ':' + mins;
    }

    /**
     * Get today's date string in YYYY-MM-DD format for comparison purposes.
     */
    function todayKey() {
        var d = new Date();
        return d.getFullYear() + '-' +
               String(d.getMonth() + 1).padStart(2, '0') + '-' +
               String(d.getDate()).padStart(2, '0');
    }

    /**
     * Read an array from localStorage by key. Returns [] on failure.
     */
    function readArray(key) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return [];
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }

    /**
     * Write an array to localStorage.
     */
    function writeArray(key, arr) {
        localStorage.setItem(key, JSON.stringify(arr));
    }

    /**
     * Count how many messages were sent today.
     */
    function countSentToday() {
        var history = readArray(STORAGE_KEYS.SENT_HISTORY);
        var today = todayKey();
        var count = 0;
        for (var i = 0; i < history.length; i++) {
            if (history[i].dateKey === today) {
                count++;
            }
        }
        return count;
    }

    /**
     * Save a sent message record to history.
     */
    function saveToHistory(subject, message) {
        var history = readArray(STORAGE_KEYS.SENT_HISTORY);
        var preview = message.length > 50 ? message.substring(0, 50) + '...' : message;
        history.unshift({
            date:    formatDate(new Date()),
            dateKey: todayKey(),
            subject: subject,
            preview: preview
        });
        writeArray(STORAGE_KEYS.SENT_HISTORY, history);
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    return {

        /**
         * init() — Dynamically load the EmailJS SDK from CDN.
         * Returns a Promise that resolves when the SDK is ready.
         * Initializes with the public key from localStorage if available.
         */
        init: function () {
            if (sdkLoaded) {
                return Promise.resolve();
            }

            if (sdkLoading && sdkLoadPromise) {
                return sdkLoadPromise;
            }

            sdkLoading = true;

            sdkLoadPromise = new Promise(function (resolve, reject) {
                var script = document.createElement('script');
                script.src = SDK_URL;
                script.async = true;

                script.onload = function () {
                    sdkLoaded = true;
                    sdkLoading = false;

                    // Initialize with public key if available
                    var publicKey = localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
                    if (publicKey && typeof emailjs !== 'undefined' && emailjs.init) {
                        try {
                            emailjs.init(publicKey);
                        } catch (_) {
                            // Non-critical — init can also happen at send time
                        }
                    }

                    resolve();
                };

                script.onerror = function () {
                    sdkLoaded = false;
                    sdkLoading = false;
                    sdkLoadPromise = null;
                    reject(new Error(
                        'EmailJS SDK не може да се зареди. Провери интернет връзката! / ' +
                        'Failed to load EmailJS SDK. Check your internet connection!'
                    ));
                };

                document.head.appendChild(script);
            });

            return sdkLoadPromise;
        },

        /**
         * isConfigured() — Returns true if serviceID, templateID, and publicKey
         * are all present in localStorage.
         */
        isConfigured: function () {
            var serviceID  = localStorage.getItem(STORAGE_KEYS.SERVICE_ID);
            var templateID = localStorage.getItem(STORAGE_KEYS.TEMPLATE_ID);
            var publicKey  = localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
            return !!(serviceID && templateID && publicKey);
        },

        /**
         * getConfig() — Returns the current EmailJS configuration from localStorage.
         */
        getConfig: function () {
            return {
                serviceID:  localStorage.getItem(STORAGE_KEYS.SERVICE_ID)  || '',
                templateID: localStorage.getItem(STORAGE_KEYS.TEMPLATE_ID) || '',
                publicKey:  localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY)  || ''
            };
        },

        /**
         * saveConfig(serviceID, templateID, publicKey) — Save EmailJS credentials
         * to localStorage.
         */
        saveConfig: function (serviceID, templateID, publicKey) {
            localStorage.setItem(STORAGE_KEYS.SERVICE_ID, serviceID);
            localStorage.setItem(STORAGE_KEYS.TEMPLATE_ID, templateID);
            localStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, publicKey);

            // Re-init SDK with new public key if already loaded
            if (sdkLoaded && typeof emailjs !== 'undefined' && emailjs.init) {
                try {
                    emailjs.init(publicKey);
                } catch (_) {
                    // Non-critical
                }
            }
        },

        /**
         * send(subject, message, imageUrl) — Send an email via EmailJS.
         * Returns a Promise that resolves on success.
         *
         * Checks rate limit and configuration before sending.
         * On success, saves the message to localStorage history.
         * Throws user-friendly bilingual error messages on failure.
         */
        send: function (subject, message, imageUrl) {
            var self = this;

            // Validate inputs
            if (!subject || !subject.trim()) {
                return Promise.reject(new Error(
                    'Напиши тема на съобщението! / Please enter a subject!'
                ));
            }
            if (!message || !message.trim()) {
                return Promise.reject(new Error(
                    'Напиши съобщение! / Please enter a message!'
                ));
            }

            // Check configuration
            if (!self.isConfigured()) {
                return Promise.reject(new Error(
                    'EmailJS не е настроен! Отиди в Настройки и въведи данните. / ' +
                    'EmailJS is not configured! Go to Settings and enter your credentials.'
                ));
            }

            // Check rate limit
            var remaining = self.getRemainingToday();
            if (remaining <= 0) {
                return Promise.reject(new Error(
                    'Достигна лимита за днес! Остават 0 съобщения. / Daily limit reached!'
                ));
            }

            var config = self.getConfig();

            var templateParams = {
                subject:   subject.trim(),
                message:   message.trim(),
                date:      formatDate(new Date()),
                image_url: imageUrl || 'Без снимка / No image attached'
            };

            // Load SDK if not yet loaded, then send
            return self.init().then(function () {
                if (typeof emailjs === 'undefined') {
                    throw new Error(
                        'EmailJS SDK не е наличен. Презареди страницата! / ' +
                        'EmailJS SDK not available. Please reload the page!'
                    );
                }

                return emailjs.send(
                    config.serviceID,
                    config.templateID,
                    templateParams,
                    config.publicKey
                );
            }).then(function (response) {
                // Success — save to history
                saveToHistory(subject.trim(), message.trim());
                return response;
            }).catch(function (error) {
                // If it's already one of our custom errors, re-throw as-is
                if (error && error.message && (
                    error.message.indexOf('EmailJS не е настроен') !== -1 ||
                    error.message.indexOf('Достигна лимита') !== -1 ||
                    error.message.indexOf('SDK не може да се зареди') !== -1 ||
                    error.message.indexOf('SDK не е наличен') !== -1 ||
                    error.message.indexOf('Напиши тема') !== -1 ||
                    error.message.indexOf('Напиши съобщение') !== -1
                )) {
                    throw error;
                }

                // Generic EmailJS send failure
                var detail = '';
                if (error && error.text) {
                    detail = ' (' + error.text + ')';
                } else if (error && error.message) {
                    detail = ' (' + error.message + ')';
                }

                throw new Error(
                    'Нещо не е наред. Опитай пак!' + detail + ' / ' +
                    'Something went wrong. Please try again!' + detail
                );
            });
        },

        /**
         * getHistory() — Returns array of sent messages from localStorage.
         * Each entry: {date, subject, preview}
         * Sorted newest first (already stored in that order).
         */
        getHistory: function () {
            var history = readArray(STORAGE_KEYS.SENT_HISTORY);
            return history.map(function (entry) {
                return {
                    date:    entry.date,
                    subject: entry.subject,
                    preview: entry.preview
                };
            });
        },

        /**
         * clearHistory() — Clears the entire message history from localStorage.
         */
        clearHistory: function () {
            localStorage.removeItem(STORAGE_KEYS.SENT_HISTORY);
        },

        /**
         * getRemainingToday() — Returns how many messages can still be sent today.
         * Maximum is 10 per day.
         */
        getRemainingToday: function () {
            var sentToday = countSentToday();
            var remaining = MAX_MESSAGES_PER_DAY - sentToday;
            return remaining > 0 ? remaining : 0;
        },

        /**
         * sendTest() — Send a test email to verify EmailJS configuration.
         * Uses a fixed test subject and message.
         * Returns a Promise.
         */
        sendTest: function () {
            return this.send(
                '\uD83E\uDDEA Тест / Test',
                'Това е тестово съобщение от MonkaCraft! / This is a test message from MonkaCraft!',
                null
            );
        }
    };

})();
