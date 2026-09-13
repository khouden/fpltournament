(function() {
  function clean() {
    try {
      var els = document.querySelectorAll('[bis_skin_checked], [bis_register]');
      for (var i = 0; i < els.length; i++) {
        els[i].removeAttribute('bis_skin_checked');
        els[i].removeAttribute('bis_register');
      }
    } catch (e) {}
  }
  clean();

  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'attributes') {
          if (m.attributeName === 'bis_skin_checked') {
            m.target.removeAttribute('bis_skin_checked');
          } else if (m.attributeName && m.attributeName.indexOf('__processed_') === 0) {
            m.target.removeAttribute(m.attributeName);
          } else if (m.attributeName === 'bis_register') {
            m.target.removeAttribute('bis_register');
          }
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, subtree: true });
  }
})();
