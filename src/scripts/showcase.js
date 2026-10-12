(function () {
  var root = document.querySelector('[data-tour]');
  if (!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll('.tour__slide'));
  var tabs = Array.prototype.slice.call(root.querySelectorAll('.tour__tab'));
  var toggle = root.querySelector('[data-toggle]');
  var caption = root.querySelector('[data-caption]');
  var captions = slides.map(function (s) { return s.getAttribute('data-caption') || ''; });
  var interval = Number(root.getAttribute('data-interval')) || 4500;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var index = 0;
  var userPaused = reduce.matches;
  var hover = false;
  var focus = false;
  var visible = false;
  var timer = null;

  root.querySelector('.tour__controls').hidden = false;

  var show = function (n) {
    index = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) { s.setAttribute('data-active', i === index ? 'true' : 'false'); });
    tabs.forEach(function (t, i) { t.setAttribute('aria-current', i === index ? 'true' : 'false'); });
    if (caption) caption.textContent = captions[index] || '';
  };
  var running = function () {
    return !userPaused && !hover && !focus && visible && !document.hidden && !reduce.matches;
  };
  var sync = function () {
    root.toggleAttribute('data-paused', !running());
    if (toggle) {
      var label = toggle.getAttribute(userPaused ? 'data-play-label' : 'data-pause-label');
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('aria-pressed', String(userPaused));
      toggle.textContent = userPaused ? '▶' : '❚❚';
    }
    root.querySelector('.tour__stage').setAttribute('aria-live', running() ? 'off' : 'polite');
    if (timer) { window.clearInterval(timer); timer = null; }
    if (running()) timer = window.setInterval(function () { show(index + 1); }, interval);
  };

  root.querySelector('[data-prev]').addEventListener('click', function () { show(index - 1); sync(); });
  root.querySelector('[data-next]').addEventListener('click', function () { show(index + 1); sync(); });
  tabs.forEach(function (t, i) { t.addEventListener('click', function () { show(i); sync(); }); });
  toggle.addEventListener('click', function () { userPaused = !userPaused; sync(); });
  root.addEventListener('mouseenter', function () { hover = true; sync(); });
  root.addEventListener('mouseleave', function () { hover = false; sync(); });
  root.addEventListener('focusin', function () { focus = true; sync(); });
  root.addEventListener('focusout', function () { focus = false; sync(); });
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', function (e) { if (e.matches) userPaused = true; sync(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[entries.length - 1].isIntersecting;
      sync();
    }).observe(root);
  } else {
    visible = true;
  }
  sync();
})();
