/*
 * auto-video.js — Bulletproof autoplay video web component
 *
 * Uses Shadow DOM to completely isolate the <video> element from the theme's
 * DeferredMedia, slideshow, and product-card scripts that call .pause().
 *
 * Usage in Liquid:
 *   <auto-video>
 *     <source src="..." type="video/mp4">
 *   </auto-video>
 */
(function () {
  if (customElements.get('auto-video')) return;

  class AutoVideo extends HTMLElement {
    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: 'closed' });
      this._video = null;
      this._started = false;
    }

    connectedCallback() {
      var style = document.createElement('style');
      style.textContent = [
        ':host { display: block; width: 100%; height: 100%; line-height: 0; }',
        'video { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center center; }',
        'video::-webkit-media-controls-start-playback-button { display: none !important; -webkit-appearance: none; }',
        'video::-webkit-media-controls-play-button { display: none !important; }',
        'video::-webkit-media-controls { display: none !important; }',
      ].join('\n');
      this._shadow.appendChild(style);

      var video = document.createElement('video');
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.controls = false;
      video.preload = 'auto';
      video.setAttribute('muted', '');
      video.setAttribute('autoplay', '');
      video.setAttribute('loop', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('x5-playsinline', '');
      video.setAttribute('disablepictureinpicture', '');

      // Copy class from host for styling
      if (this.getAttribute('video-class')) {
        video.className = this.getAttribute('video-class');
      }

      // Copy <source> children from light DOM into shadow video
      var sources = this.querySelectorAll('source');
      for (var i = 0; i < sources.length; i++) {
        var clone = sources[i].cloneNode(true);
        video.appendChild(clone);
      }

      // Also check for data-src attribute (single source shorthand)
      var dataSrc = this.getAttribute('data-src');
      if (dataSrc) {
        var s = document.createElement('source');
        s.src = dataSrc;
        s.type = 'video/mp4';
        video.appendChild(s);
      }

      this._shadow.appendChild(video);
      this._video = video;

      this._tryPlay();
      this._setupRetries();
      this._setupVisibility();
      this._guardPlayback();
    }

    _tryPlay() {
      var self = this;
      var v = this._video;
      if (!v) return;

      v.muted = true;
      v.defaultMuted = true;

      if (v.paused) {
        var p = v.play();
        if (p && typeof p.then === 'function') {
          p.then(function () {
            self._started = true;
          }).catch(function () {});
        } else {
          self._started = true;
        }
      }
    }

    _setupRetries() {
      var self = this;
      var events = ['touchstart', 'touchend', 'pointerdown', 'click', 'scroll', 'keydown'];

      function onInteraction() {
        self._tryPlay();
        if (self._started) {
          events.forEach(function (evt) {
            document.removeEventListener(evt, onInteraction, true);
          });
        }
      }

      events.forEach(function (evt) {
        document.addEventListener(evt, onInteraction, { passive: true, capture: true });
      });

      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) self._tryPlay();
      });

      window.addEventListener('pageshow', function () {
        self._tryPlay();
      });

      // Periodic retry for stubborn browsers
      var retryCount = 0;
      var retryInterval = setInterval(function () {
        self._tryPlay();
        retryCount++;
        if (self._started || retryCount > 30) {
          clearInterval(retryInterval);
        }
      }, 500);
    }

    _setupVisibility() {
      var self = this;
      if ('IntersectionObserver' in window) {
        // Use correct scroll root — on desktop >=990px the theme uses .page-wrapper
        var scrollRoot = null;
        if (window.matchMedia('(min-width: 990px)').matches) {
          scrollRoot = document.querySelector('.page-wrapper') || null;
        }

        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              self._tryPlay();
            }
          });
        }, { root: scrollRoot, threshold: 0.01 });

        obs.observe(this);
      }
    }

    _guardPlayback() {
      var self = this;
      var v = this._video;
      if (!v) return;

      // Poll and re-play if somehow paused
      setInterval(function () {
        if (v.paused && v.readyState >= 2) {
          v.muted = true;
          var p = v.play();
          if (p && typeof p.catch === 'function') {
            p.catch(function () {});
          }
        }
      }, 1000);
    }

    disconnectedCallback() {
      if (this._video) {
        this._video.pause();
        this._video = null;
      }
    }
  }

  customElements.define('auto-video', AutoVideo);
})();
