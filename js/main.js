/**
 * ==========================================================================
 * PARADOX ARENA — js/main.js
 * High-Performance Techno-Cultural Experience Engine
 * ==========================================================================
 * Features:
 * 1. Lenis Smooth Scrolling synchronized with GSAP ScrollTrigger
 * 2. Cyber Terminal Boot Preloader & Hero Cinematic Entrance Stagger
 * 3. Live HUD Festival Countdown Telemetry Timer (30-day target)
 * 4. Dynamic Event Category Filtering with GSAP Staggered Transitions
 * 5. 3D Perspective Card Tilt & Specular Light Reflection
 * 6. Real-time Holographic Admission Badge Synchronization
 * 7. Desktop-Only Reticle Velocity Cursor (quickTo lerp)
 * 8. Ambient Cybernetic Web Audio Synthesizer Toggle
 * 9. Lucide Icon Initialization and Dynamic Re-hydration
 * ==========================================================================
 */

(function () {
  'use strict';

  // Check if system prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(hover: none)').matches;

  /**
   * --------------------------------------------------------------------------
   * 1. LUCIDE ICONS INITIALIZATION
   * --------------------------------------------------------------------------
   */
  function initIcons() {
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  }

  /**
   * --------------------------------------------------------------------------
   * 2. LENIS SMOOTH SCROLL & GSAP SCROLLTRIGGER INTEGRATION
   * --------------------------------------------------------------------------
   */
  let lenisInstance = null;

  function initSmoothScroll() {
    if (prefersReducedMotion) return;

    if (typeof Lenis !== 'undefined') {
      lenisInstance = new Lenis({
        duration: 0.65,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.0,
        syncTouch: false,
        infinite: false,
      });

      // Synchronize Lenis with GSAP ScrollTrigger if present
      if (typeof ScrollTrigger !== 'undefined') {
        lenisInstance.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
          lenisInstance.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(500, 33);
      } else {
        function raf(time) {
          lenisInstance.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }

      // Smooth anchor scrolling
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
          const targetId = this.getAttribute('href');
          if (targetId && targetId !== '#') {
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
              e.preventDefault();
              lenisInstance.scrollTo(targetEl, {
                offset: -40,
                duration: 0.8,
              });

              // Close mobile nav menu if open
              const navToggle = document.getElementById('nav-toggle');
              if (navToggle && navToggle.checked) {
                navToggle.checked = false;
              }
            }
          }
        });
      });
    } else {
      // Fallback: smooth anchor scroll without Lenis
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function () {
          const navToggle = document.getElementById('nav-toggle');
          if (navToggle && navToggle.checked) {
            navToggle.checked = false;
          }
        });
      });
    }
  }

  /**
   * --------------------------------------------------------------------------
   * 3. TERMINAL BOOT SEQUENCE PRELOADER & CINEMATIC HERO ENTRANCE
   * --------------------------------------------------------------------------
   */
  function initPreloader() {
    const preloader = document.getElementById('preloader');
    const progressBar = document.getElementById('preloader-progress');
    const statusText = document.getElementById('preloader-status');
    const curtain = document.querySelector('.preloader__curtain');

    if (!preloader) return;

    // Fast-path for reduced motion or test environments
    if (prefersReducedMotion) {
      preloader.style.display = 'none';
      revealHeroInstant();
      return;
    }

    let progress = 0;
    let isDismissed = false;

    // Allow user to click anywhere or press any key to skip
    function dismissImmediately() {
      if (isDismissed) return;
      isDismissed = true;
      clearInterval(progressInterval);
      completePreloader();
    }

    preloader.addEventListener('click', dismissImmediately);
    window.addEventListener('keydown', dismissImmediately, { once: true });

    // Progress counter simulation
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        setTimeout(dismissImmediately, 150);
      }
      if (progressBar) progressBar.style.width = progress + '%';
      if (statusText) statusText.textContent = `SYSTEM_READY // ${progress}%`;
    }, 45);

    // Fallback safety timeout: guarantee dismissal within 1.8 seconds max
    setTimeout(() => {
      if (!isDismissed) dismissImmediately();
    }, 1800);

    function completePreloader() {
      if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline({
          onComplete: () => {
            preloader.style.display = 'none';
            if (lenisInstance) lenisInstance.start();
          }
        });

        // Curtain wipe transition
        if (curtain) {
          tl.to(curtain, {
            scaleY: 1,
            transformOrigin: 'bottom center',
            duration: 0.35,
            ease: 'power3.inOut'
          });
        }

        tl.to(preloader, {
          yPercent: -100,
          duration: 0.65,
          ease: 'power4.inOut'
        });

        // Hero staggered entrance animation
        tl.add(animateHeroEntrance, '-=0.25');
      } else {
        preloader.style.opacity = '0';
        preloader.style.pointerEvents = 'none';
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 400);
        revealHeroInstant();
      }
    }

    function animateHeroEntrance() {
      if (typeof gsap === 'undefined' || prefersReducedMotion) {
        revealHeroInstant();
        return;
      }

      gsap.from('.hero__presents', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
      });

      gsap.from('.hero__line', {
        y: 50,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power3.out'
      });

      gsap.from('.hero__label', {
        opacity: 0,
        x: -20,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.2
      });

      gsap.from('#festival-countdown', {
        scale: 0.94,
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'back.out(1.4)'
      });

      gsap.from('.hero__footer > *', {
        y: 25,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power2.out'
      });
    }

    function revealHeroInstant() {
      const heroContent = document.querySelector('.hero__content');
      if (heroContent) heroContent.style.opacity = '1';
    }
  }

  /**
   * --------------------------------------------------------------------------
   * 4. LIVE HUD FESTIVAL COUNTDOWN TIMER WIDGET (30 DAYS TARGET)
   * --------------------------------------------------------------------------
   */
  function initCountdown() {
    const cdDays = document.getElementById('cd-days');
    const cdHours = document.getElementById('cd-hours');
    const cdMinutes = document.getElementById('cd-minutes');
    const cdSeconds = document.getElementById('cd-seconds');

    if (!cdDays || !cdHours || !cdMinutes || !cdSeconds) return;

    // Use localStorage to maintain consistent countdown target across reloads
    const STORAGE_KEY = 'paradox_arena_target_epoch';
    let targetEpoch = localStorage.getItem(STORAGE_KEY);

    if (!targetEpoch || isNaN(targetEpoch)) {
      // 30 days from now in milliseconds
      targetEpoch = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, targetEpoch);
    } else {
      targetEpoch = parseInt(targetEpoch, 10);
      // Reset if date is in the past
      if (targetEpoch <= Date.now()) {
        targetEpoch = Date.now() + 30 * 24 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY, targetEpoch);
      }
    }

    function updateTimer() {
      const now = Date.now();
      const diff = Math.max(0, targetEpoch - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      cdDays.textContent = String(days).padStart(2, '0');
      cdHours.textContent = String(hours).padStart(2, '0');
      cdMinutes.textContent = String(minutes).padStart(2, '0');
      cdSeconds.textContent = String(seconds).padStart(2, '0');

      // Pulse seconds unit
      cdSeconds.classList.add('tick-pulse');
      setTimeout(() => cdSeconds.classList.remove('tick-pulse'), 300);
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  /**
   * --------------------------------------------------------------------------
   * 5. EVENT CATEGORY FILTER TABS WITH GSAP ANIMATIONS
   * --------------------------------------------------------------------------
   */
  function initEventFilters() {
    const filterContainer = document.getElementById('event-filters');
    const filterButtons = document.querySelectorAll('.filter-tab');
    const eventCards = document.querySelectorAll('.event-card');

    if (!filterContainer || !filterButtons.length || !eventCards.length) return;

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', function () {
        const filter = this.getAttribute('data-filter');

        // Update active button state
        filterButtons.forEach((b) => {
          b.classList.remove('filter-tab--active');
          b.setAttribute('aria-selected', 'false');
        });
        this.classList.add('filter-tab--active');
        this.setAttribute('aria-selected', 'true');

        // Filter event cards
        const toShow = [];
        const toHide = [];

        eventCards.forEach((card) => {
          const cardCat = card.getAttribute('data-category');
          if (filter === 'all' || cardCat === filter) {
            toShow.push(card);
          } else {
            toHide.push(card);
          }
        });

        if (typeof gsap !== 'undefined' && !prefersReducedMotion) {
          // Animate out non-matching cards
          if (toHide.length > 0) {
            gsap.to(toHide, {
              opacity: 0,
              scale: 0.95,
              duration: 0.2,
              ease: 'power2.in',
              onComplete: () => {
                toHide.forEach((card) => {
                  card.style.display = 'none';
                });
                // Animate in matching cards
                showMatchingCards();
              }
            });
          } else {
            showMatchingCards();
          }

          function showMatchingCards() {
            toShow.forEach((card) => {
              card.style.display = 'flex';
            });
            gsap.fromTo(
              toShow,
              { opacity: 0, scale: 0.95, y: 15 },
              {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.35,
                stagger: 0.05,
                ease: 'power2.out',
                onComplete: () => {
                  if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.refresh();
                  }
                }
              }
            );
          }
        } else {
          // Instant switch for reduced motion or without GSAP
          toHide.forEach((c) => (c.style.display = 'none'));
          toShow.forEach((c) => {
            c.style.display = 'flex';
            c.style.opacity = '1';
            c.style.transform = 'none';
          });
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
        }
      });
    });
  }

  /**
   * --------------------------------------------------------------------------
   * 6. 3D PERSPECTIVE MOUSEMOVE CARD TILT & SPECULAR HIGHLIGHT
   * --------------------------------------------------------------------------
   */
  function initCardTilt() {
    if (isTouchDevice || prefersReducedMotion) return;

    const tiltCards = document.querySelectorAll(
      '.event-card, .pillar-card, .exp-card, .zone-card, .performer-card, .pass-card, .live-ticket-badge'
    );

    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate rotation [-7deg, 7deg]
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        // Update specular light gradient coordinates
        const mouseXPercent = (x / rect.width) * 100;
        const mouseYPercent = (y / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${mouseXPercent}%`);
        card.style.setProperty('--mouse-y', `${mouseYPercent}%`);

        if (typeof gsap !== 'undefined') {
          gsap.to(card, {
            rotationX: rotateX,
            rotationY: rotateY,
            transformPerspective: 1000,
            duration: 0.25,
            ease: 'power1.out',
          });
        } else {
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
      });

      card.addEventListener('mouseleave', function () {
        if (typeof gsap !== 'undefined') {
          gsap.to(card, {
            rotationX: 0,
            rotationY: 0,
            duration: 0.5,
            ease: 'power2.out',
          });
        } else {
          card.style.transform = 'none';
        }
      });
    });
  }

  /**
   * --------------------------------------------------------------------------
   * 7. REAL-TIME INPUT SYNCHRONIZATION FOR LIVE ADMISSION BADGE
   * --------------------------------------------------------------------------
   */
  function initLiveBadgeSync() {
    const nameInput = document.getElementById('reg-name');
    const collegeInput = document.getElementById('reg-college');
    const passSelect = document.getElementById('reg-pass');
    const eventSelect = document.getElementById('reg-category');

    const previewName = document.getElementById('preview-name');
    const previewCollege = document.getElementById('preview-college');
    const previewPass = document.getElementById('preview-pass');
    const previewEvent = document.getElementById('preview-event');
    const previewSerial = document.getElementById('preview-serial');
    const previewAccess = document.getElementById('preview-access');

    // Also support selection from pass tier cards directly
    const passCardBtns = document.querySelectorAll('.pass-card__btn');
    passCardBtns.forEach((btn) => {
      btn.addEventListener('click', function (e) {
        const passCard = this.closest('.pass-card');
        if (passCard && passSelect) {
          const passTitle = passCard.querySelector('.pass-card__name');
          if (passTitle) {
            const titleText = passTitle.textContent.trim().toLowerCase();
            for (let i = 0; i < passSelect.options.length; i++) {
              if (passSelect.options[i].text.toLowerCase().includes(titleText)) {
                passSelect.selectedIndex = i;
                passSelect.dispatchEvent(new Event('change'));
                break;
              }
            }
          }
        }
      });
    });

    function generateSerial(name) {
      let hash = 84920;
      const cleanName = (name || 'DELEGATE').toUpperCase();
      for (let i = 0; i < cleanName.length; i++) {
        hash = (hash * 31 + cleanName.charCodeAt(i)) % 99999;
      }
      return `PDX-${String(hash).padStart(5, '0')}-X7`;
    }

    function syncBadge() {
      if (previewName && nameInput) {
        previewName.textContent = nameInput.value.trim().toUpperCase() || 'PARTICIPANT NAME';
      }

      if (previewCollege && collegeInput) {
        previewCollege.textContent = collegeInput.value.trim().toUpperCase() || 'NRI UNIVERSITY';
      }

      if (previewPass && passSelect) {
        const selectedPass = passSelect.options[passSelect.selectedIndex]?.text || 'TECH INNOVATOR PASS';
        previewPass.textContent = selectedPass.split('(')[0].trim().toUpperCase();

        if (previewAccess) {
          if (selectedPass.includes('All-Access')) {
            previewAccess.textContent = 'LEVEL 4 // VIP ALL-ARENA';
          } else if (selectedPass.includes('Tech')) {
            previewAccess.textContent = 'LEVEL 3 // HACK & PIT LABS';
          } else if (selectedPass.includes('Cultural')) {
            previewAccess.textContent = 'LEVEL 2 // STAGE & BACKSTAGE';
          } else {
            previewAccess.textContent = 'LEVEL 1 // GENERAL DELEGATE';
          }
        }
      }

      if (previewEvent && eventSelect) {
        const selectedEvent = eventSelect.options[eventSelect.selectedIndex]?.text || 'CAMPUS-WIDE ACCESS';
        previewEvent.textContent = selectedEvent.split(':')[0].trim().toUpperCase();
      }

      if (previewSerial && nameInput) {
        previewSerial.textContent = generateSerial(nameInput.value.trim());
      }
    }

    if (nameInput) nameInput.addEventListener('input', syncBadge);
    if (collegeInput) collegeInput.addEventListener('input', syncBadge);
    if (passSelect) passSelect.addEventListener('change', syncBadge);
    if (eventSelect) eventSelect.addEventListener('change', syncBadge);

    // Initial sync
    syncBadge();

    // Modal submit handler
    const regForm = document.getElementById('paradox-reg-form');
    const passModal = document.getElementById('pass-modal');
    const modalClose = document.getElementById('modal-close');
    const modalConfirm = document.getElementById('modal-confirm-btn');

    if (regForm && passModal) {
      regForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const nameVal = (nameInput && nameInput.value.trim()) || 'Delegate';
        const collegeVal = (collegeInput && collegeInput.value.trim()) || 'NRI University';
        const passVal = (passSelect && passSelect.options[passSelect.selectedIndex]?.text) || 'General Delegate';
        const eventVal = (eventSelect && eventSelect.options[eventSelect.selectedIndex]?.text) || 'Festival Attendee';

        const ticketName = document.getElementById('ticket-name');
        const ticketCollege = document.getElementById('ticket-college');
        const ticketPass = document.getElementById('ticket-pass');
        const ticketEvent = document.getElementById('ticket-event');

        if (ticketName) ticketName.textContent = nameVal;
        if (ticketCollege) ticketCollege.textContent = collegeVal;
        if (ticketPass) ticketPass.textContent = passVal;
        if (ticketEvent) ticketEvent.textContent = eventVal;

        passModal.classList.add('pass-modal--active');
        passModal.setAttribute('aria-hidden', 'false');

        // Shimmer flash effect on live badge
        const liveBadge = document.getElementById('live-ticket-preview');
        if (liveBadge) {
          liveBadge.classList.add('badge--confirmed');
          setTimeout(() => liveBadge.classList.remove('badge--confirmed'), 1000);
        }
      });

      function closeModal() {
        passModal.classList.remove('pass-modal--active');
        passModal.setAttribute('aria-hidden', 'true');
      }

      if (modalClose) modalClose.addEventListener('click', closeModal);
      if (modalConfirm) modalConfirm.addEventListener('click', closeModal);
      passModal.addEventListener('click', function (e) {
        if (e.target === passModal) closeModal();
      });
    }
  }

  /**
   * --------------------------------------------------------------------------
   * 8. DESKTOP-ONLY RETICLE CURSOR TRACKING (lerp/quickTo)
   * --------------------------------------------------------------------------
   */
  function initCustomCursor() {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor || isTouchDevice || prefersReducedMotion) {
      if (cursor) cursor.style.display = 'none';
      return;
    }

    const dot = cursor.querySelector('.custom-cursor__dot');
    const ring = cursor.querySelector('.custom-cursor__ring');

    if (!dot || !ring) return;

    let xToDot, yToDot, xToRing, yToRing;

    if (typeof gsap !== 'undefined') {
      gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
      xToDot = gsap.quickTo(dot, 'x', { duration: 0.05, ease: 'power3' });
      yToDot = gsap.quickTo(dot, 'y', { duration: 0.05, ease: 'power3' });
      xToRing = gsap.quickTo(ring, 'x', { duration: 0.18, ease: 'power2.out' });
      yToRing = gsap.quickTo(ring, 'y', { duration: 0.18, ease: 'power2.out' });
    }

    let isVisible = false;

    window.addEventListener('mousemove', (e) => {
      if (!isVisible) {
        cursor.classList.add('custom-cursor--visible');
        isVisible = true;
      }

      if (xToDot && yToDot && xToRing && yToRing) {
        xToDot(e.clientX);
        yToDot(e.clientY);
        xToRing(e.clientX);
        yToRing(e.clientY);
      } else {
        dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        ring.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    });

    document.addEventListener('mouseleave', () => {
      cursor.classList.remove('custom-cursor--visible');
      isVisible = false;
    });

    // Expand reticle over interactive elements
    const interactiveSelector = 'a, button, input, select, textarea, .filter-tab, .pass-card, .event-card, .form-check, [role="button"]';
    document.querySelectorAll(interactiveSelector).forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('custom-cursor--hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('custom-cursor--hover'));
      el.addEventListener('mousedown', () => cursor.classList.add('custom-cursor--click'));
      el.addEventListener('mouseup', () => cursor.classList.remove('custom-cursor--click'));
    });
  }

  /**
   * --------------------------------------------------------------------------
   * 9. OPTIONAL WEB AUDIO API CYBER AMBIENT SOUND SYNTHESIZER
   * --------------------------------------------------------------------------
   */
  function initAudioSynthesizer() {
    const soundToggle = document.getElementById('sound-toggle');
    if (!soundToggle) return;

    let audioCtx = null;
    let osc1 = null;
    let osc2 = null;
    let subOsc = null;
    let filter = null;
    let masterGain = null;
    let lfo = null;
    let lfoGain = null;
    let isPlaying = false;

    function buildAudioGraph() {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;

      audioCtx = new AudioContextClass();

      // Master gain for fade in / fade out
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);

      // Lowpass Filter for warm atmospheric hum
      filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, audioCtx.currentTime);
      filter.Q.setValueAtTime(3.0, audioCtx.currentTime);
      filter.connect(masterGain);

      // Oscillator 1: 55Hz (A1) Sawtooth
      osc1 = audioCtx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, audioCtx.currentTime);

      // Oscillator 2: 110Hz (A2) detuned by +4 cents
      osc2 = audioCtx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(110.25, audioCtx.currentTime);

      // Sub Oscillator: 27.5Hz (A0) Sine wave for tactile low rumble
      subOsc = audioCtx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(27.5, audioCtx.currentTime);

      // LFO for slow breathing filter modulation
      lfo = audioCtx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.2, audioCtx.currentTime); // 0.2Hz cycle

      lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(140, audioCtx.currentTime); // Filter sweep depth

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      // Connect oscillators to filter
      const oscGain = audioCtx.createGain();
      oscGain.gain.setValueAtTime(0.25, audioCtx.currentTime);

      osc1.connect(oscGain);
      osc2.connect(oscGain);
      subOsc.connect(oscGain);
      oscGain.connect(filter);

      osc1.start();
      osc2.start();
      subOsc.start();
      lfo.start();

      return true;
    }

    soundToggle.addEventListener('click', function () {
      if (!audioCtx) {
        const initialized = buildAudioGraph();
        if (!initialized) return;
      }

      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const label = soundToggle.querySelector('.sound-toggle__label');

      if (!isPlaying) {
        // Fade in to gentle ambient level (-22dB)
        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 1.2);

        soundToggle.classList.add('sound-toggle--active');
        soundToggle.setAttribute('aria-pressed', 'true');
        if (label) label.textContent = 'AUDIO: ON';
        isPlaying = true;
      } else {
        // Fade out
        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);

        soundToggle.classList.remove('sound-toggle--active');
        soundToggle.setAttribute('aria-pressed', 'false');
        if (label) label.textContent = 'AUDIO: OFF';
        isPlaying = false;
      }
    });
  }

  /**
   * --------------------------------------------------------------------------
   * 10. DOM READY ORCHESTRATION
   * --------------------------------------------------------------------------
   */
  function init() {
    initIcons();
    initSmoothScroll();
    initPreloader();
    initCountdown();
    initEventFilters();
    initCardTilt();
    initLiveBadgeSync();
    initCustomCursor();
    initAudioSynthesizer();

    // Cyber Visual Subsystems & Attribution
    if (typeof window.initScrambleText === 'function') {
      window.initScrambleText();
    }
    if (typeof window.initDigitalRain === 'function') {
      window.initDigitalRain();
    }
    if (typeof window.initFlowerBorder === 'function') {
      window.initFlowerBorder();
    }

    // Re-run icon hydration once DOM is fully stable
    setTimeout(initIcons, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
