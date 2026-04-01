(function () {
  function applyTranslations(lang) {
    fetch('/assets/i18n/' + lang + '.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load i18n file: ' + res.status + ' ' + res.url);
        return res.json();
      })
      .then(function (strings) {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
          var key = el.getAttribute('data-i18n');
          if (strings[key] !== undefined) {
            el.textContent = strings[key];
          } else {
            console.warn('[i18n] Missing key:', key);
          }
        });

        document.documentElement.lang = lang;

        document.querySelectorAll('.lang-select').forEach(function (sel) {
          sel.value = lang;
        });
      })
      .catch(function (err) {
        console.error(err);
      });
  }

  window.setLanguage = function (lang) {
    localStorage.setItem('bii-lang', lang);
    applyTranslations(lang);
  };

  document.addEventListener('DOMContentLoaded', function () {
    var savedLang = localStorage.getItem('bii-lang') || 'en';
    applyTranslations(savedLang);
  });
})();
