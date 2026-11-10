// arcade-bridge.js: lets a game talk to the Flint Arcade when it's playing inside it.
// Every game loads this first, in its <head>. When the game runs on its own page it does nothing.
//
// Inside the arcade:
//  - Esc (or a gamepad's Select/Back button) opens the arcade's menu instead of reaching the game.
//  - While the menu is open the game is frozen: its animation loop stops, its sound is suspended,
//    and it never hears about losing focus, so Resume drops you straight back into the action.
(function () {
  if (window.parent === window) return;
  var raf = window.requestAnimationFrame.bind(window);
  var frozen = false, held = [], contexts = [];

  // hold the game's frames while frozen (works for any game that animates with requestAnimationFrame)
  window.requestAnimationFrame = function (cb) {
    if (frozen) { held.push(cb); return 0; }
    return raf(cb);
  };
  // remember every audio context the game makes, so its sound can be paused too
  ['AudioContext', 'webkitAudioContext'].forEach(function (name) {
    var AC = window[name];
    if (!AC) return;
    var Wrapped = function (opts) { var c = new AC(opts); contexts.push(c); return c; };
    Wrapped.prototype = AC.prototype;
    window[name] = Wrapped;
  });

  function freeze() {
    if (frozen) return;
    frozen = true;
    contexts.forEach(function (c) { if (c.state === 'running') { c._bridgeWasRunning = true; c.suspend().catch(function () {}); } });
  }
  function thaw() {
    if (!frozen) return;
    frozen = false;
    var q = held; held = [];
    q.forEach(function (cb) { raf(cb); });
    contexts.forEach(function (c) { if (c._bridgeWasRunning) { c._bridgeWasRunning = false; c.resume().catch(function () {}); } });
  }
  function askForMenu() {
    freeze();
    try { window.parent.postMessage({ type: 'flint-arcade:menu' }, '*'); } catch (e) { /* no arcade */ }
  }

  // capture on window runs before any of the game's own handlers, so the game never sees this Esc
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.code !== 'Escape') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!e.repeat) askForMenu();
  }, true);
  window.addEventListener('keyup', function (e) {
    if (e.key === 'Escape' || e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  // the menu takes focus away from the game; while frozen the game shouldn't react to that
  window.addEventListener('blur', function (e) { if (frozen) e.stopImmediatePropagation(); }, true);

  // the arcade tells us when its menu opens (e.g. from its ☰ button) and when you resume
  window.addEventListener('message', function (e) {
    if (e.source !== window.parent || !e.data) return;
    if (e.data.type === 'flint-arcade:pause') freeze();
    if (e.data.type === 'flint-arcade:resume') thaw();
  });

  // gamepad: Select / Back (button 8) opens the menu too
  var was = false;
  (function poll() {
    try {
      var pads = navigator.getGamepads ? navigator.getGamepads() : [];
      var down = false;
      for (var i = 0; i < pads.length; i++) if (pads[i] && pads[i].buttons[8] && pads[i].buttons[8].pressed) down = true;
      if (down && !was && !frozen) askForMenu();
      was = down;
    } catch (e) { /* no gamepad API */ }
    raf(poll);
  })();
})();
