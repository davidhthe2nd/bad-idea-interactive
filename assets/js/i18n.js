(function () {
  var BASE_LANG = 'en';
  var SUPPORTED = ['en', 'es', 'fr', 'zh-tw'];
  var BCP47_TAGS = { en: 'en', es: 'es', fr: 'fr', 'zh-tw': 'zh-Hant-TW' };
  var cache = {};
  var requestToken = 0;
  // Last resolved string set, kept so refreshI18n() can re-render a subtree
  // without refetching or knowing which language is active.
  var activeStrings = null;

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

  // Matches inside a given root, plus the root itself when it matches — so a
  // caller can refresh one bound element, not only a container of them.
  function collect(root, selector) {
    var list = Array.prototype.slice.call(root.querySelectorAll(selector));
    if (root.matches && root.matches(selector)) list.unshift(root);
    return list;
  }

  // A value may carry {name} placeholders filled from the element's own
  // data-i18n-vars="name:value,other:value", parsed in the same comma/colon
  // style as data-i18n-attr. The whole sentence stays one translatable
  // string: callers set the numbers, never assemble the wording.
  //
  // Backward compatible by construction — a value with no "{" and an element
  // with no data-i18n-vars both return untouched, which is every binding that
  // existed before this was added.
  function interpolate(value, el) {
    if (typeof value !== 'string' || value.indexOf('{') === -1) return value;
    var raw = el.getAttribute('data-i18n-vars');
    if (!raw) return value;

    var vars = {};
    raw.split(',').forEach(function (pair) {
      // indexOf, not split: a value may legitimately contain a colon.
      var cut = pair.indexOf(':');
      if (cut === -1) return;
      vars[pair.slice(0, cut).trim()] = pair.slice(cut + 1).trim();
    });

    // An unfilled placeholder is left visible rather than blanked, so a
    // missing var shows up as {count} in the page instead of silently
    // producing a sentence with a hole in it.
    return value.replace(/\{(\w+)\}/g, function (match, name) {
      return Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : match;
    });
  }

  function render(root, strings) {
    // Text content: <span data-i18n="home.hero.headline">
    collect(root, '[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (strings[key] !== undefined) {
        el.textContent = interpolate(strings[key], el);
      } else {
        console.warn('[i18n] Missing key:', key);
      }
    });

    // Inline markup: <p data-i18n-html="home.featured.link">
    // Values may contain <a>, <strong>, <em>. Authored content only.
    collect(root, '[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (strings[key] !== undefined) {
        el.innerHTML = interpolate(strings[key], el);
      } else {
        console.warn('[i18n] Missing key:', key);
      }
    });

    // Attributes: <meta data-i18n-attr="content:home.meta.description">
    // Multiple pairs separated by commas.
    collect(root, '[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var parts = pair.split(':');
        var attr = (parts[0] || '').trim();
        var key = (parts[1] || '').trim();
        if (!attr || !key) return;
        if (strings[key] !== undefined) {
          el.setAttribute(attr, interpolate(strings[key], el));
        } else {
          console.warn('[i18n] Missing key:', key);
        }
      });
    });

    // data-i18n-html replaces innerHTML wholesale, which would wipe out
    // #year (normally set once by each page's own inline script) if the
    // footer legal line is bound that way. Re-stamp it after every render.
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function applyTranslations(lang) {
    var token = ++requestToken;

    return resolve(lang)
      .then(function (strings) {
        // A slower earlier request must not overwrite a newer one.
        if (token !== requestToken) return;

        activeStrings = strings;
        render(document, strings);

        document.documentElement.lang = BCP47_TAGS[lang] || lang;

        document.querySelectorAll('.lang-select').forEach(function (sel) {
          sel.value = lang;
        });
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

  // Re-renders bindings under `root` (default: the whole document) in the
  // already-active language. For content whose placeholder values change at
  // runtime: update the element's data-i18n-vars, then call this. Returns
  // false if no language has resolved yet, in which case the initial
  // DOMContentLoaded pass will cover the element anyway.
  window.refreshI18n = function (root) {
    if (!activeStrings) return false;
    render(root || document, activeStrings);
    return true;
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
