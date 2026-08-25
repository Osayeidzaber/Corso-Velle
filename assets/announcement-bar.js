import { Component } from '@theme/component';

export class AnnouncementBar extends Component {
  connectedCallback() {
    super.connectedCallback();
    this.setupMarquee();
  }

  setupMarquee() {
    const slider = this;
    const slidesContainer = slider.querySelector('.announcement-bar__slides');
    if (!slidesContainer) return;
    
    const originalSlides = Array.from(slidesContainer.children);
    if (!originalSlides.length) return;
    
    const speed = slider.getAttribute('data-speed') || 5;
    
    // Clear the slider and set up two tracks
    slider.innerHTML = '';
    
    const track1 = document.createElement('div');
    track1.className = 'announcement-bar__track';
    
    const track2 = document.createElement('div');
    track2.className = 'announcement-bar__track';
    track2.setAttribute('aria-hidden', 'true');
    
    // Append original slides to track1 initially
    originalSlides.forEach(slide => track1.appendChild(slide.cloneNode(true)));
    
    slider.appendChild(track1);
    slider.appendChild(track2);
    
    const fillTrack = () => {
      // Ensure track1 is at least as wide as the screen plus some buffer
      while (track1.offsetWidth > 0 && track1.offsetWidth < window.innerWidth * 1.5) {
        originalSlides.forEach(slide => track1.appendChild(slide.cloneNode(true)));
      }
      
      // Sync track2 with track1
      track2.innerHTML = track1.innerHTML;
      
      // Calculate duration so speed is consistent regardless of screen size
      // higher speed number = faster
      const velocity = parseInt(speed, 10) * 30; // pixels per second
      const duration = track1.offsetWidth / velocity;
      
      track1.style.animationDuration = `${duration}s`;
      track2.style.animationDuration = `${duration}s`;
    };
    
    // Need a small timeout to let the browser render and calculate offsetWidth
    setTimeout(fillTrack, 50);
    window.addEventListener('resize', fillTrack);
  }
}

if (!customElements.get('announcement-bar-component')) {
  customElements.define('announcement-bar-component', AnnouncementBar);
}
