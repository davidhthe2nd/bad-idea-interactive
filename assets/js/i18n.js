(function () {
  var BASE_LANG = 'en';
  var SUPPORTED = ['en', 'es', 'fr', 'zh-tw'];
  var cache = {};
  var requestToken = 0;

  function loadStrings(lang) {
    if (cache[lang]) return Promise.resolve(cache[lang]);
    return fetch('/assets/i18n/' + lang + '.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load i18n file: ' + res.status + ' ' + res.url);
        return res.json();
      })
      .then(function (json) {
        cache[lang] = json;
        return json;
      });
  }

  // Target language overlays the English base, so any key not yet translated
  // resolves to its English value instead of falling through to markup.
  function resolve(lang) {
    if (lang === BASE_LANG) return loadStrings(BASE_LANG);
    return Promise.all([
      loadStrings(BASE_LANG),
      loadStrings(lang).catch(function (err) {
        console.warn('[i18n] Falling back to ' + BASE_LANG + ':', err.message);
        return {};
      })
    ]).then(function (results) {
      var merged = {};
      Object.keys(results[0]).forEach(function (k) { merged[k] = results[0][k]; });
      Object.keys(results[1]).forEach(function (k) { merged[k] = results[1][k]; });
      return merged;
    });
  }

  function applyTranslations(lang) {
    var token = ++requestToken;

    return resolve(lang)
      .then(function (strings) {
        // A slower earlier request must not overwrite a newer one.
        if (token !== requestToken) return;

        // Text content: <span data-i18n="home.hero.headline">
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
          var key = el.getAttribute('data-i18n');
          if (strings[key] !== undefined) {
            el.textContent = strings[key];
          } else {
            console.warn('[i18n] Missing key:', key);
          }
        });

        // Inline markup: <p data-i18n-html="home.featured.link">
        // Values may contain <a>, <strong>, <em>. Authored content only.
        document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
          var key = el.getAttribute('data-i18n-html');
          if (strings[key] !== undefined) {
            el.innerHTML = strings[key];
          } else {
            console.warn('[i18n] Missing key:', key);
          }
        });

        // Attributes: <meta data-i18n-attr="content:home.meta.description">
        // Multiple pairs separated by commas.
        document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
          el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
            var parts = pair.split(':');
            var attr = (parts[0] || '').trim();
            var key = (parts[1] || '').trim();
            if (!attr || !key) return;
            if (strings[key] !== undefined) {
              el.setAttribute(attr, strings[key]);
            } else {
              console.warn('[i18n] Missing key:', key);
            }
          });
        });

        document.documentElement.lang = lang;

        document.querySelectorAll('.lang-select').forEach(function (sel) {
          sel.value = lang;
        });

        // data-i18n-html replaces innerHTML wholesale, which would wipe out
        // #year (normally set once by each page's own inline script) if the
        // footer legal line is bound that way. Re-stamp it after every apply.
        var yearEl = document.getElementById('year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
      })
      .catch(function (err) {
        console.error(err);
      });
  }

  function normalize(lang) {
    return SUPPORTED.indexOf(lang) !== -1 ? lang : BASE_LANG;
  }

  window.setLanguage = function (lang) {
    var safe = normalize(lang);
    localStorage.setItem('bii-lang', safe);
    return applyTranslations(safe);
  };

  document.addEventListener('DOMContentLoaded', function () {
    // ?lang= wins over the stored preference, so language-specific links work.
    var param = new URLSearchParams(window.location.search).get('lang');
    var stored = localStorage.getItem('bii-lang');
    var lang = normalize(param || stored || BASE_LANG);
    if (param) localStorage.setItem('bii-lang', lang);
    applyTranslations(lang);
  });
})();