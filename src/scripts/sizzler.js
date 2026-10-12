// Sizzler video: poster first (preload="none" in the markup, so nothing downloads until play()).
// Muted autoplay-loop only while in view and when reduced motion is not requested; otherwise click to play.
(function () {
  var root = document.querySelector('[data-sizzler]');
  if (!root) return;
  var video = root.querySelector('video');
  var play = root.querySelector('.sizzler__play');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var started = false; // the user pressed play
  var userPaused = false;
  var autoplaying = false;
  var systemPause = false;
  var inView = false;

  var setState = function (state) { root.setAttribute('data-state', state); };
  var captions = function (mode) {
    for (var i = 0; i < video.textTracks.length; i++) video.textTracks[i].mode = mode;
  };
  var toPoster = function () {
    autoplaying = false;
    video.controls = false;
    setState('poster');
  };
  var pause = function () {
    if (video.paused) return;
    systemPause = true;
    video.pause();
  };
  var start = function (auto) {
    autoplaying = auto;
    video.muted = auto; // autoplay must be muted; an explicit Play has sound
    video.loop = auto;
    video.controls = true;
    setState('playing');
    var p = video.play();
    if (p && p.catch) p.catch(function () { if (!started) toPoster(); });
  };
  var sync = function () {
    if (started || userPaused) return;
    if (inView && !reduce.matches && !document.hidden) start(true);
    else if (autoplaying) pause();
  };

  toPoster();
  // Shown again on demand: burned-in captions carry the copy while it autoplays muted.
  captions('hidden');

  play.addEventListener('click', function () {
    started = true;
    captions('showing');
    start(false);
    video.focus();
  });
  video.addEventListener('pause', function () {
    if (systemPause) { systemPause = false; return; }
    userPaused = true;
  });
  video.addEventListener('play', function () { userPaused = false; });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[entries.length - 1].isIntersecting;
      sync();
    }, { threshold: 0.5 }).observe(video);
  }
  if (reduce.addEventListener) reduce.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
})();
