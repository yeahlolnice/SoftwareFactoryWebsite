(function () {
  var fig = document.querySelector('.am');
  if (!fig) return;
  var box = fig.querySelector('.am-desktop');
  if (box) {
    var width = Number(box.getAttribute('data-design-width'));
    var setScale = function () {
      box.style.setProperty('--mock-scale', String(box.clientWidth / width));
    };
    setScale();
    if ('ResizeObserver' in window) new ResizeObserver(setScale).observe(box);
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var toSec = function (t) { var p = t.split(':'); return p[0] * 3600 + p[1] * 60 + Number(p[2]); };
  var toTime = function (n) { n = n % 86400; return pad(Math.floor(n / 3600)) + ':' + pad(Math.floor(n / 60) % 60) + ':' + pad(n % 60); };
  var stream = function (ol) {
    var rows = Array.prototype.slice.call(ol.children);
    var deltas = rows.map(function (li, i) {
      var d = i ? toSec(li.firstElementChild.textContent) - toSec(rows[i - 1].firstElementChild.textContent) : 4;
      return d > 0 ? d : 4;
    });
    var clock = toSec(rows[rows.length - 1].firstElementChild.textContent);
    var caret = ol.querySelector('.am-caret');
    var step = 0;
    if (ol.classList.contains('am-log__lines--compact') && ol.offsetHeight) {
      ol.style.height = ol.offsetHeight + 'px';
    }
    ol.classList.add('am-streaming');
    var next = function () {
      if (reduce.matches) return;
      if (fig.hasAttribute('data-paused') || document.hidden || !ol.offsetParent) return;
      var first = ol.firstElementChild;
      var gap = parseFloat(getComputedStyle(ol).rowGap) || 0;
      var h = first.offsetHeight + gap;
      clock += deltas[step % deltas.length];
      first.firstElementChild.textContent = toTime(clock);
      step++;
      ol.appendChild(first);
      if (caret) first.appendChild(caret);
      var opts = { duration: 380, easing: 'ease-out' };
      Array.prototype.forEach.call(ol.children, function (li) {
        li.animate([{ transform: 'translateY(' + h + 'px)' }, { transform: 'none' }], opts);
      });
      first.animate([{ opacity: 0 }, { opacity: 1 }], opts);
    };
    window.setInterval(next, 1500);
  };
  if (!reduce.matches) {
    Array.prototype.forEach.call(fig.querySelectorAll('.am-log__lines'), stream);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      fig.toggleAttribute('data-paused', !entries[0].isIntersecting);
    }).observe(fig);
  }
})();
