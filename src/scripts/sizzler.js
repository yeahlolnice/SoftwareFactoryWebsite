// Sizzler video: poster first. The markup ships an empty <video>; sources and the caption track are moved in from a
// <template> on first play, so nothing downloads before then and WebKit's load event is not held up (TASK-028).
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
  var media = root.querySelector('template[data-sizzler-media]');

  var attach = function () {
    if (!media) return;
    video.appendChild(media.content.cloneNode(true));
    media = null;
    video.load();
    captions('hidden'); // burned-in captions carry the copy while it autoplays muted
  };

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
    attach();
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

  play.addEventListener('click', function () {
    started = true;
    start(false);
    captions('showing');
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
