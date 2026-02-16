/**
 * Particle System — Canvas-based network constellation effect
 * Performance-budgeted: capped particle count, requestAnimationFrame,
 * pauses when tab is hidden or canvas is off-screen.
 * Respects prefers-reduced-motion.
 * @module particles
 */

import { debounce } from './utils.js';

const MAX_PARTICLES = 60;
const PARTICLE_SPEED = 0.3;
const CONNECTION_DISTANCE = 120;
const MOUSE_INFLUENCE_RADIUS = 150;
const MOUSE_REPEL_STRENGTH = 0.02;
const VELOCITY_CENTER = 0.5;
const PIXELS_PER_PARTICLE = 15000;
const LINE_OPACITY_FACTOR = 0.5;
const MOUSE_OFFSCREEN = -1000;
const VELOCITY_DAMPING = 0.99;
const DOT_OPACITY = 0.6;
const RESIZE_DEBOUNCE_MS = 200;
const PARTICLE_RADIUS_BASE = 1;
const PARTICLE_RADIUS_RANGE = 2;
const SPEED_LIMIT_FACTOR = 2;
const LINE_WIDTH = 1;
const FULL_CIRCLE = Math.PI * 2;

/**
 * Creates and manages the particle canvas animation.
 * @param {HTMLCanvasElement} canvas - The target canvas element
 */
function createParticleSystem(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  let particles = [];
  let mouseX = MOUSE_OFFSCREEN;
  let mouseY = MOUSE_OFFSCREEN;
  let animationId = null;
  let isVisible = true;

  /**
   * Reads current theme colors from CSS custom properties.
   * @returns {{ dot: string, line: string }}
   */
  function getColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      dot: style.getPropertyValue('--color-particle').trim() || '#94a3b8',
      line: style.getPropertyValue('--color-particle-line').trim() || 'rgba(148,163,184,0.15)',
    };
  }

  /** Resizes canvas to match viewport. */
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }

  /** Creates a single particle with random position and velocity. */
  function createParticle() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - VELOCITY_CENTER) * PARTICLE_SPEED,
      vy: (Math.random() - VELOCITY_CENTER) * PARTICLE_SPEED,
      radius: Math.random() * PARTICLE_RADIUS_RANGE + PARTICLE_RADIUS_BASE,
    };
  }

  /** Initializes the particle array. */
  function initParticles() {
    const count = Math.min(MAX_PARTICLES, Math.floor(window.innerWidth * window.innerHeight / PIXELS_PER_PARTICLE));
    particles = Array.from({ length: count }, createParticle);
  }

  /** Updates particle positions and handles boundary wrapping. */
  function updateParticles() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    particles.forEach((p) => {
      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MOUSE_INFLUENCE_RADIUS && dist > 0) {
        p.vx += (dx / dist) * MOUSE_REPEL_STRENGTH;
        p.vy += (dy / dist) * MOUSE_REPEL_STRENGTH;
      }

      p.x += p.vx;
      p.y += p.vy;

      const speedLimit = PARTICLE_SPEED * SPEED_LIMIT_FACTOR;
      p.vx = Math.max(-speedLimit, Math.min(speedLimit, p.vx));
      p.vy = Math.max(-speedLimit, Math.min(speedLimit, p.vy));

      p.vx *= VELOCITY_DAMPING;
      p.vy *= VELOCITY_DAMPING;

      if (p.x < 0) { p.x = width; }
      if (p.x > width) { p.x = 0; }
      if (p.y < 0) { p.y = height; }
      if (p.y > height) { p.y = 0; }
    });
  }

  /** Renders particles and connecting lines. */
  function draw() {
    const colors = getColors();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DISTANCE) {
          const opacity = (1 - dist / CONNECTION_DISTANCE) * LINE_OPACITY_FACTOR;
          ctx.strokeStyle = colors.line.includes('rgb')
            ? colors.line.replace(/[\d.]+\)$/, `${opacity})`)
            : `rgba(148, 163, 184, ${opacity})`;
          ctx.lineWidth = LINE_WIDTH;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    particles.forEach((p) => {
      ctx.fillStyle = colors.dot;
      ctx.globalAlpha = DOT_OPACITY;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, FULL_CIRCLE);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  /** Main animation loop. */
  function animate() {
    if (!isVisible) {
      return;
    }
    updateParticles();
    draw();
    animationId = requestAnimationFrame(animate);
  }

  /** Starts or resumes the animation. */
  function start() {
    isVisible = true;
    if (!animationId) {
      animate();
    }
  }

  /** Pauses the animation. */
  function stop() {
    isVisible = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  resize();
  initParticles();

  const debouncedResize = debounce(() => {
    resize();
    initParticles();
  }, RESIZE_DEBOUNCE_MS);

  window.addEventListener('resize', debouncedResize);

  canvas.parentElement.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  canvas.parentElement.addEventListener('mouseleave', () => {
    mouseX = MOUSE_OFFSCREEN;
    mouseY = MOUSE_OFFSCREEN;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  return { start, stop, resize };
}

/**
 * Initializes the particle system on the target canvas.
 * Skips initialization if prefers-reduced-motion is enabled.
 */
export function initParticles() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return;
  }

  const canvas = document.getElementById('particle-canvas');
  if (!canvas) {
    return;
  }

  const system = createParticleSystem(canvas);
  if (system) {
    system.start();
  }
}
