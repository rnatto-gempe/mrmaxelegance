/**
 * MR MAX ELEGANCE - 3D Printing Scrollytelling Engine & Interactive Landing Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initHeaderScroller();
  initVideoScrollytelling();
  initMaterialsExplorer();
  initAnalyticsTracking();
});

/**
 * 1. Global Scroll Progress Bar
 */
function initScrollProgress() {
  const progressBar = document.getElementById('scroll-progress-bar');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (totalScroll <= 0) return;
    const progress = (window.scrollY / totalScroll) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }, { passive: true });
}

/**
 * 2. Header blur on scroll
 */
function initHeaderScroller() {
  const header = document.querySelector('.lp-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

/**
 * 3. 🎬 3D VIDEO SCROLLYTELLING ENGINE
 * Smoothly scrubs assets/materialization.mp4 based on scroll progress!
 */
function initVideoScrollytelling() {
  const scrollySection = document.getElementById('scrolly-section');
  const video = document.getElementById('scrolly-video');
  const telemetryVal = document.getElementById('telemetry-val');
  const stepCards = document.querySelectorAll('.scrolly-step-card');

  if (!scrollySection || !video) return;

  let targetTime = 0;
  let currentTime = 0;
  let videoDuration = 0;
  let isVideoReady = false;

  // Wait for video metadata to get exact duration
  video.addEventListener('loadedmetadata', () => {
    videoDuration = video.duration || 5;
    isVideoReady = true;
    video.pause();
    video.currentTime = 0;
  });

  // Fallback if loadedmetadata already fired
  if (video.readyState >= 1) {
    videoDuration = video.duration || 5;
    isVideoReady = true;
    video.pause();
  }

  // Calculate scroll progress specifically through the scrolly-section
  function calculateScrollyProgress() {
    const rect = scrollySection.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionHeight = rect.height;

    // Scroll progress from top of section entering viewport to bottom leaving
    const startScroll = rect.top;
    const scrollableDistance = sectionHeight - windowHeight;

    if (scrollableDistance <= 0) return 0;

    // Progress goes from 0.0 when section top touches top of screen, to 1.0 when reached end
    let progress = -startScroll / scrollableDistance;
    return Math.min(1, Math.max(0, progress));
  }

  // Smooth Render Loop using requestAnimationFrame & Lerp (Linear Interpolation)
  function renderScrollyFrame() {
    if (isVideoReady && videoDuration > 0) {
      const progress = calculateScrollyProgress();
      targetTime = progress * videoDuration;

      // Smooth interpolation for fluid scrubbing
      currentTime += (targetTime - currentTime) * 0.15;

      if (Math.abs(currentTime - video.currentTime) > 0.02) {
        video.currentTime = currentTime;
      }

      // Update telemetry display
      if (telemetryVal) {
        const percent = Math.round(progress * 100);
        const layers = Math.round(progress * 850);
        telemetryVal.textContent = `${percent}% (Camada ${layers}/850)`;
      }

      // Step cards activation logic based on progress thresholds
      updateActiveStepCards(progress);
    }

    requestAnimationFrame(renderScrollyFrame);
  }

  function updateActiveStepCards(progress) {
    stepCards.forEach(card => {
      const minProgress = parseFloat(card.getAttribute('data-min-progress') || '0');
      const maxProgress = parseFloat(card.getAttribute('data-max-progress') || '1');

      if (progress >= minProgress && progress < maxProgress) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  // Start the RAF loop
  requestAnimationFrame(renderScrollyFrame);
}

/**
 * 4. Interactive Materials & Technology Explorer
 */
const MATERIAL_SPECS = {
  'pla': {
    title: 'PLA Silk & Premium (Ecológico & Estético)',
    desc: 'Termoplástico biodegradável de origem vegetal com acabamento brilhante metalizado espetacular. Ideal para peças de decoração, estátuas, troféus e produtos de exibição.',
    specs: [
      { label: 'Resistência Térmica', value: 'Até 60°C' },
      { label: 'Acabamento Visual', value: 'Brilho Sedoso / Metálico' },
      { label: 'Precisão Dimensional', value: '± 0.05 mm' },
      { label: 'Aplicações Ideais', value: 'Decoração, Geek, Brindes VIP' }
    ]
  },
  'petg': {
    title: 'PETG Industrial (Alta Resistência Mecânica)',
    desc: 'Combina a facilidade de acabamento com resistência superior a impactos, água e intempéries. Ideal para peças funcionais, suportes e protótipos de engenharia.',
    specs: [
      { label: 'Resistência Térmica', value: 'Até 80°C' },
      { label: 'Resistência ao Impacto', value: 'Muito Alta' },
      { label: 'Resistência Química', value: 'Resistente a óleos/solventes' },
      { label: 'Aplicações Ideais', value: 'Peças automotivas, Suportes, Indústria' }
    ]
  },
  'abs': {
    title: 'ABS Técnico & ASA (Proteção UV e Calor)',
    desc: 'Material de alta durabilidade com excelente rigidez térmica. Pode ser polido quimicamente para superfícies ultra-lisas espelhadas.',
    specs: [
      { label: 'Resistência Térmica', value: 'Até 100°C' },
      { label: 'Pós-Processamento', value: 'Permite vapor de acetona' },
      { label: 'Proteção Climática', value: 'Resistente a sol e chuva' },
      { label: 'Aplicações Ideais', value: 'Peças externas, gabinetes elétricos' }
    ]
  },
  'resin': {
    title: 'Resina Fotopolimerizável 8K (Microprecisão Extrema)',
    desc: 'Cura por luz ultravioleta com resolução de 22 microns. Cada detalhe minúsculo, textura de pele ou relevo de joia é reproduzido com perfeição microscópica.',
    specs: [
      { label: 'Resolução de Camada', value: '25 a 50 microns (0.025mm)' },
      { label: 'Linhas de Camada', value: 'Completamente Invisíveis' },
      { label: 'Detalhamento', value: 'Ultra Alta Definição 8K' },
      { label: 'Aplicações Ideais', value: 'Miniaturas, Joalheria, Odontologia' }
    ]
  }
};

function initMaterialsExplorer() {
  const tabs = document.querySelectorAll('.mat-tab-btn');
  const titleEl = document.getElementById('mat-active-title');
  const descEl = document.getElementById('mat-active-desc');
  const specsContainer = document.getElementById('mat-active-specs');

  if (!tabs.length || !titleEl || !descEl || !specsContainer) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const matKey = tab.getAttribute('data-mat');
      const data = MATERIAL_SPECS[matKey];
      if (!data) return;

      // Update Active Tab Class
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update Content with Smooth Fade
      titleEl.style.opacity = '0';
      descEl.style.opacity = '0';
      specsContainer.style.opacity = '0';

      setTimeout(() => {
        titleEl.textContent = data.title;
        descEl.textContent = data.desc;

        specsContainer.innerHTML = data.specs.map(s => `
          <div class="mat-spec-item">
            <span class="mat-spec-label">${s.label}</span>
            <div class="mat-spec-value">${s.value}</div>
          </div>
        `).join('');

        titleEl.style.opacity = '1';
        descEl.style.opacity = '1';
        specsContainer.style.opacity = '1';
      }, 150);
    });
  });
}

/**
 * 5. Analytics & Event Tracking for Landing Page
 */
function initAnalyticsTracking() {
  document.querySelectorAll('[data-track-cta]').forEach(el => {
    el.addEventListener('click', () => {
      const ctaName = el.getAttribute('data-track-cta') || 'cta_click';
      console.log(`[Analytics] CTA Clicked: ${ctaName}`);

      // PostHog Event
      if (window.posthog && typeof window.posthog.capture === 'function') {
        window.posthog.capture('lp_cta_clicked', {
          cta_name: ctaName,
          page: '3d_printing_landing_page'
        });
      }

      // GA4 Event
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'lp_conversion_click', {
          cta_name: ctaName
        });
      }
    });
  });
}
