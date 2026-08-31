/**
 * video-loader.js
 * 
 * High-performance video loader and skeleton state manager for Shopify videos (.mov, .mp4, WebM, HLS).
 * Ensures instant first-frame painting, pre-buffering, and unbroken continuous autoplay on desktop and mobile.
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

    // Enforce essential inline autoplay attributes
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('x5-playsinline', '');
    video.setAttribute('disablepictureinpicture', '');
    if (!video.hasAttribute('preload')) {
      video.preload = 'auto';
      video.setAttribute('preload', 'auto');
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
      if (wrapper) wrapper.classList.add('video-skeleton-active');
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
   * Scans and initializes all video elements currently in the DOM.
   */
  function scanVideos() {
    const videos = document.querySelectorAll('video');
    for (let i = 0; i < videos.length; i++) {
      initVideo(videos[i]);
    }
  }

  // Run on ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanVideos);
  } else {
    scanVideos();
  }

  // Observe dynamically added videos (e.g. infinite scroll, collection filters, quick view)
  if ('MutationObserver' in window) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLVideoElement) {
            initVideo(node);
          } else if (node instanceof HTMLElement) {
            const nested = node.querySelectorAll('video');
            for (let j = 0; j < nested.length; j++) {
              initVideo(nested[j]);
            }
          }
        }
      }
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
