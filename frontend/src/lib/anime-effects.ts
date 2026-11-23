import anime from 'animejs';

export function animateHeroEntrance(containerSelector: string) {
  anime({
    targets: `${containerSelector} .hero-fade`,
    opacity: [0, 1],
    translateY: [25, 0],
    delay: anime.stagger(120, { start: 100 }),
    easing: 'easeOutCubic',
    duration: 800,
  });

  anime({
    targets: `${containerSelector} .hero-tux`,
    scale: [0.8, 1],
    opacity: [0, 1],
    rotate: [-8, 0],
    easing: 'easeOutElastic(1, .7)',
    duration: 1200,
  });
}

export function animateArchitectureStack(container: HTMLElement | string) {
  const layerTargets = typeof container === 'string'
    ? `${container} .arch-layer-card`
    : container.querySelectorAll('.arch-layer-card');

  const synergyTargets = typeof container === 'string'
    ? `${container} .synergy-badge`
    : container.querySelectorAll('.synergy-badge');

  const timeline = anime.timeline({
    easing: 'easeOutExpo',
  });

  // Layer cards stagger in bottom-to-top (Kernel first, then Init, Distro, DE, Tools)
  timeline.add({
    targets: layerTargets,
    opacity: [0, 1],
    translateX: [-40, 0],
    scale: [0.95, 1],
    delay: anime.stagger(150, { from: 'last' }), // from layer 1 up
    duration: 600,
  });

  // Synergies badges pop in
  timeline.add({
    targets: synergyTargets,
    opacity: [0, 1],
    scale: [0.5, 1],
    delay: anime.stagger(100),
    easing: 'easeOutBack',
    duration: 500,
  }, '-=200');

  return timeline;
}

export function animateScoreCountUp(
  target: HTMLElement | null,
  endValue: number,
  duration: number = 1400,
  prefix: string = '',
  suffix: string = ''
) {
  if (!target) return;
  const obj = { val: 0 };
  anime({
    targets: obj,
    val: endValue,
    round: 1,
    duration: duration,
    easing: 'easeOutQuad',
    update: () => {
      target.textContent = `${prefix}${Math.round(obj.val).toLocaleString()}${suffix}`;
    },
  });
}

export function animateTuxLanding(selector: string) {
  anime({
    targets: selector,
    translateY: [-60, 0],
    rotate: [15, 0],
    scale: [0.7, 1.05, 1],
    easing: 'easeOutBounce',
    duration: 1000,
  });
}

export function animateComboFlash(selector: string) {
  anime({
    targets: selector,
    scale: [1, 1.4, 1],
    filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'],
    duration: 350,
    easing: 'easeOutBack',
  });
}
