(function () {
  try {
    var origFetch = window.fetch;
    var activeFetch = typeof origFetch === 'function'
      ? function () { return origFetch.apply(window, arguments); }
      : origFetch;

    function ensureWritableFetch(target) {
      if (!target) return;
      try {
        var desc = Object.getOwnPropertyDescriptor(target, 'fetch');
        if (!desc || !desc.set) {
          Object.defineProperty(target, 'fetch', {
            get: function () { return activeFetch; },
            set: function (val) { activeFetch = val; },
            configurable: true,
            enumerable: true
          });
        }
      } catch (e) {
        try { target.fetch = activeFetch; } catch (_) {}
      }
    }

    ensureWritableFetch(window);
    if (typeof Window !== 'undefined' && Window.prototype) {
      ensureWritableFetch(Window.prototype);
    }
  } catch (e) {}
})();
