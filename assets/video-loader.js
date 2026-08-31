/**
 * video-loader.js
 * 
 * High-performance video loader and ARZ-style hover playback manager.
 * Supports native Shopify video streams (.mov, .mp4, WebM, HLS).
 * Ensures instant first-frame painting, pre-buffering, unbroken continuous autoplay,
 * and immediate hover playback across product cards in grids, carousels, and marquees.
 */

(function () {
  'use strict';

  const processedVideos = new WeakSet();

  /**
   * Initializes and accelerates a video element.
   * @param {HTMLVideoElement} video
   */
  function initVideo(video) {
    if (!video || processedVideos.has(video)) return;
    processedVideos.add(video);

    // Enforce essential inline autoplay attributes and aggressive preloading
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('x5-playsinline', '');
    video.setAttribute('disablepictureinpicture', '');
    video.preload = 'auto';
    video.setAttribute('preload', 'auto');

    // Instantly trigger background fetch so videos are buffered in advance
    if (video.readyState === 0) {
      try {
        video.load();
      } catch (_) {}
    }

    const wrapper = video.closest('.hero__media-wrapper, .card-gallery__hover-video, .product-standalone-video, .video-background__media') || video.parentElement;

    const markLoaded = () => {
      if (wrapper) {
        wrapper.classList.add('is-video-loaded');
        wrapper.classList.remove('video-skeleton-active');
      }
    };

    if (video.readyState >= 2) {
      markLoaded();
    } else {
      video.addEventListener('loadeddata', markLoaded, { once: true });
      video.addEventListener('canplay', markLoaded, { once: true });
      video.addEventListener('playing', markLoaded, { once: true });
    }

    // If video has autoplay, trigger play with gesture fallback
    if (video.autoplay || video.hasAttribute('autoplay')) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const tryResume = () => {
            video.play();
          };
          window.addEventListener('touchstart', tryResume, { once: true, passive: true });
          window.addEventListener('click', tryResume, { once: true, passive: true });
          window.addEventListener('scroll', tryResume, { once: true, passive: true });
        });
      }
    }
  }

  /**
   * Scans and initializes all video elements in the DOM.
   * Hover-video playback for product cards is managed exclusively by
   * ProductCard.#setupHoverVideo() in product-card.js to avoid duplicate
   * event listeners and race conditions.
   */
  function scanMedia() {
    const videos = document.querySelectorAll('video');
    for (let i = 0; i < videos.length; i++) {
      initVideo(videos[i]);
    }
  }

  // Run on ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanMedia);
  } else {
    scanMedia();
  }

  // Observe dynamically added videos and product cards
  if ('MutationObserver' in window) {
    const observer = new MutationObserver(() => {
      scanMedia();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Resume playback on tab visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const autoplayers = document.querySelectorAll('video[autoplay]');
      for (let k = 0; k < autoplayers.length; k++) {
        const v = autoplayers[k];
        if (v.paused) {
          v.play().catch(() => {});
        }
      }
    }
  });
})();
