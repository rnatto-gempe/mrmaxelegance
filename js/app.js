/**
 * Mr. Max Elegance - Bio Link Interactive Application & Analytics Engine
 * Rock-solid rendering, PostHog, Local Storage Engine & Analytics
 */

// Lucide/Brand SVG Icon Dictionary for Crisp Zero-Latency Rendering
const ICONS = {
  instagram: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`,
  shopee: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
  youtube: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>`,
  globe: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`
};

const STORAGE_KEY = 'mrmax_bio_analytics';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  initAnalyticsEngine();
});

function initApp() {
  attachLinkListeners();
  setupEventListeners();
  initExternalAnalytics();
}

/**
 * Attach click tracking to all links on page
 */
function attachLinkListeners() {
  // Main Link Cards
  document.querySelectorAll('.link-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id') || 'unknown';
      const titleEl = card.querySelector('.link-title');
      const title = titleEl ? titleEl.textContent : id;
      const url = card.getAttribute('href') || '';
      const isFeatured = card.classList.contains('featured');
      trackClick(id, title, url, isFeatured);
    });
  });

  // Footer Social Icon Buttons
  document.querySelectorAll('.social-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('title') || 'Social';
      const url = btn.getAttribute('href') || '';
      trackSocialClick(name, url);
    });
  });
}

/**
 * Setup UI Interactions & Modals
 */
function setupEventListeners() {
  // Share Button Top Right
  const btnShare = document.getElementById('btn-share-top');
  if (btnShare) {
    btnShare.addEventListener('click', handleShare);
  }

  // QR Code Button Top Right
  const btnQr = document.getElementById('btn-qr-top');
  if (btnQr) {
    btnQr.addEventListener('click', openQrModal);
  }

  // Analytics Button Top Left
  const btnAnalyticsTop = document.getElementById('btn-analytics-top');
  if (btnAnalyticsTop) {
    btnAnalyticsTop.addEventListener('click', checkAndOpenAnalytics);
  }

  // Save Contact Button (vCard)
  const btnVcard = document.getElementById('btn-save-contact');
  if (btnVcard) {
    btnVcard.addEventListener('click', (e) => {
      trackClick('vcard', 'Salvar Contato VIP', '', false);
      if (window.posthog) {
        window.posthog.capture('vcard_downloaded', {
          brand: 'MR MAX ELEGANCE',
          source: 'bio_cta'
        });
      }
      downloadVCard(e);
    });
  }

  // Secret Triple Click on Footer Brand for Analytics
  let clickCount = 0;
  let clickTimer = null;
  const footerBrand = document.getElementById('footer-brand');
  if (footerBrand) {
    footerBrand.addEventListener('click', () => {
      clickCount++;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        if (clickCount >= 3) {
          checkAndOpenAnalytics();
        }
        clickCount = 0;
      }, 500);
    });
  }

  // Keyboard shortcut (Ctrl + Shift + A or Cmd + Shift + A)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      checkAndOpenAnalytics();
    }
  });

  // Modal Closers
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(modal => modal.classList.remove('active'));
    });
  });

  // Close modals on clicking backdrop
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('active');
      }
    });
  });

  // Modal copy buttons
  const copyBtn = document.getElementById('btn-modal-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const url = window.BRAND_CONFIG?.share?.url || window.location.href;
      copyToClipboard(url);
    });
  }

  // Analytics Export CSV Button
  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', exportAnalyticsCsv);
  }

  // Analytics Clear Data Button
  const btnClearStats = document.getElementById('btn-clear-stats');
  if (btnClearStats) {
    btnClearStats.addEventListener('click', clearAnalyticsData);
  }
}

/**
 * Handle Native Share or Fallback Modal
 */
async function handleShare() {
  trackClick('share_button', 'Compartilhar Perfil', '', false);
  if (window.posthog) {
    window.posthog.capture('profile_shared', {
      method: navigator.share ? 'native_share' : 'modal_open'
    });
  }

  const shareData = {
    title: window.BRAND_CONFIG?.share?.title || 'MR MAX ELEGANCE',
    text: window.BRAND_CONFIG?.share?.text || 'Conecte-se aos canais oficiais de MR MAX ELEGANCE:',
    url: window.BRAND_CONFIG?.share?.url || window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      if (err.name !== 'AbortError') {
        openShareModal();
      }
    }
  } else {
    openShareModal();
  }
}

function openShareModal() {
  const modal = document.getElementById('share-modal');
  const input = document.getElementById('share-url-input');
  if (input) {
    input.value = window.BRAND_CONFIG?.share?.url || window.location.href;
  }
  if (modal) {
    modal.classList.add('active');
  }
}

/**
 * QR Code Modal with Dynamic Generation
 */
function openQrModal() {
  trackClick('qr_code_modal', 'Abrir QR Code', '', false);
  if (window.posthog) {
    window.posthog.capture('qr_code_opened');
  }

  const modal = document.getElementById('qr-modal');
  const targetUrl = window.BRAND_CONFIG?.share?.url || window.location.href;
  
  const qrContainer = document.getElementById('qr-canvas-container');
  if (qrContainer) {
    qrContainer.innerHTML = `
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(targetUrl)}&color=07090d&bgcolor=ffffff" 
           alt="QR Code ${targetUrl}" 
           width="220" 
           height="220" 
           style="display: block; border-radius: 8px;" />
    `;
  }

  if (modal) {
    modal.classList.add('active');
  }
}

/**
 * Download vCard (.vcf) directly into phone contacts
 */
function downloadVCard(e) {
  e.preventDefault();
  const v = window.BRAND_CONFIG?.vCard;
  if (!v) return;

  const vcardContent = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${v.fullName}`,
    `ORG:${v.organization}`,
    `TITLE:${v.title}`,
    `TEL;TYPE=CELL,VOICE:${v.phone}`,
    `EMAIL;TYPE=WORK,INTERNET:${v.email}`,
    `URL:${v.url}`,
    `NOTE:${v.note}`,
    'END:VCARD'
  ].join('\r\n');

  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${v.fullName.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('✓ Contato preparado para salvar!');
}

/**
 * Copy to Clipboard Utility with Toast
 */
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('✓ Link copiado para a área de transferência!');
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('✓ Link copiado com sucesso!');
  } catch (err) {
    showToast('Erro ao copiar link.');
  }
  document.body.removeChild(textArea);
}

/**
 * Toast Notification Banner
 */
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toast-notification');
  const toastText = document.getElementById('toast-text');
  if (!toast) return;

  if (toastText) toastText.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// =========================================================================
// 📊 ANALYTICS ENGINE & POSTHOG TRACKING
// =========================================================================

/**
 * Initialize Local Storage Analytics Engine
 */
function initAnalyticsEngine() {
  let data = getAnalyticsData();
  
  // Register Pageview
  data.views = (data.views || 0) + 1;

  // Unique Visitor Check (Session based)
  if (!sessionStorage.getItem('mrmax_session_visited')) {
    data.uniqueVisitors = (data.uniqueVisitors || 0) + 1;
    sessionStorage.setItem('mrmax_session_visited', 'true');
  }

  saveAnalyticsData(data);
}

function getAnalyticsData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading analytics data', e);
  }
  return {
    views: 0,
    uniqueVisitors: 0,
    clicks: {},
    history: [],
    firstSeen: new Date().toISOString()
  };
}

function saveAnalyticsData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving analytics data', e);
  }
}

/**
 * Track Every Main Link Click
 */
function trackClick(id, label, url = '', featured = false) {
  const data = getAnalyticsData();
  data.clicks = data.clicks || {};
  data.clicks[id] = (data.clicks[id] || 0) + 1;

  // Detect device
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const device = isMobile ? 'Mobile' : 'Desktop';

  // Add to recent history (keep last 60 records)
  data.history = data.history || [];
  data.history.unshift({
    id,
    label,
    timestamp: Date.now(),
    device
  });
  if (data.history.length > 60) {
    data.history.pop();
  }

  saveAnalyticsData(data);

  // 1. Send Event to PostHog 🦔
  if (window.posthog && typeof window.posthog.capture === 'function') {
    window.posthog.capture('bio_link_clicked', {
      link_id: id,
      link_name: label,
      link_url: url,
      is_featured: featured,
      device_type: device,
      screen_width: window.innerWidth
    });
  }

  // 2. Send to Google Analytics 4 if configured
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'click_bio_link', {
      link_id: id,
      link_name: label,
      link_url: url || window.location.href
    });
  }

  // 3. Send to Meta Pixel if configured
  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', 'BioLinkClick', {
      link_id: id,
      link_name: label
    });
  }

  // 4. Send to Webhook / Google Sheets if configured
  const webhookUrl = window.BRAND_CONFIG?.analytics?.webhookUrl;
  if (webhookUrl && webhookUrl.trim() !== '') {
    const payload = JSON.stringify({
      event: 'click_bio_link',
      linkId: id,
      linkLabel: label,
      linkUrl: url,
      device: device,
      referrer: document.referrer || 'Direct',
      timestamp: new Date().toISOString()
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(webhookUrl, payload);
    } else {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        mode: 'no-cors'
      }).catch(() => {});
    }
  }

  console.log(`[Analytics] Tracked: ${label} (${id})`);
}

/**
 * Track Footer Social Icon Click
 */
function trackSocialClick(name, url) {
  trackClick(`social_${name.toLowerCase()}`, `Ícone ${name}`, url, false);
  if (window.posthog && typeof window.posthog.capture === 'function') {
    window.posthog.capture('social_icon_clicked', {
      social_name: name,
      url: url
    });
  }
}

/**
 * Check password and Open Analytics Dashboard
 */
function checkAndOpenAnalytics() {
  const config = window.BRAND_CONFIG?.analytics;
  if (config && config.dashboardPassword && config.dashboardPassword.trim() !== '') {
    const pass = prompt('🔒 Digite a senha do painel de analytics:');
    if (pass !== config.dashboardPassword) {
      alert('Senha incorreta.');
      return;
    }
  }
  openAnalyticsModal();
}

/**
 * Render and Open Analytics Modal
 */
function openAnalyticsModal() {
  const modal = document.getElementById('analytics-modal');
  if (!modal) return;

  const data = getAnalyticsData();
  const totalViews = data.views || 0;

  // Calculate Total Clicks
  const clicksMap = data.clicks || {};
  let totalClicks = 0;
  let topLink = { id: '-', name: 'Nenhum', count: 0 };

  const linkNamesMap = {
    'instagram': 'Instagram Oficial',
    'shopee': 'Loja Oficial na Shopee',
    'whatsapp': 'Atendimento & Orçamentos no WhatsApp',
    'youtube': 'Canal no YouTube',
    'tiktok': 'TikTok Oficial',
    'website': 'Site & Catálogo Oficial',
    'vcard': 'Salvar Contato VIP',
    'share_button': 'Compartilhar Perfil',
    'qr_code_modal': 'Abrir QR Code'
  };

  Object.entries(clicksMap).forEach(([id, count]) => {
    totalClicks += count;
    if (count > topLink.count) {
      topLink = { id, name: linkNamesMap[id] || id, count };
    }
  });

  // Calculate CTR
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';

  // Render KPI values
  document.getElementById('stat-total-views').textContent = totalViews;
  document.getElementById('stat-total-clicks').textContent = totalClicks;
  document.getElementById('stat-ctr').textContent = `${ctr}%`;
  document.getElementById('stat-top-link').textContent = topLink.count > 0 ? topLink.name : 'Nenhum';

  // Render Links Breakdown
  const linksListContainer = document.getElementById('analytics-links-breakdown');
  if (linksListContainer) {
    const sortedLinks = Object.entries(clicksMap).sort((a, b) => b[1] - a[1]);

    if (sortedLinks.length === 0) {
      linksListContainer.innerHTML = `<p style="color: var(--chrome-steel); font-size: 0.85rem;">Nenhum clique registrado ainda.</p>`;
    } else {
      linksListContainer.innerHTML = sortedLinks.map(([id, count]) => {
        const title = linkNamesMap[id] || id;
        const percent = totalClicks > 0 ? ((count / totalClicks) * 100).toFixed(0) : 0;

        return `
          <div class="analytics-link-item">
            <div class="analytics-link-row">
              <span class="analytics-link-name">${title}</span>
              <span class="analytics-link-stats">${count} cliques (${percent}%)</span>
            </div>
            <div class="analytics-progress-bg">
              <div class="analytics-progress-fill" style="width: ${percent}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Render Activity Feed
  const activityContainer = document.getElementById('analytics-activity-feed');
  if (activityContainer) {
    const history = data.history || [];
    if (history.length === 0) {
      activityContainer.innerHTML = `<p style="color: var(--chrome-steel); font-size: 0.8rem; text-align: center; padding: 12px 0;">Nenhuma atividade recente.</p>`;
    } else {
      activityContainer.innerHTML = history.slice(0, 15).map(item => {
        return `
          <div class="activity-item">
            <span class="activity-title">${item.label || item.id} <span style="font-size: 0.7rem; color: var(--blue-glow-light);">(${item.device})</span></span>
            <span class="activity-time">${formatRelativeTime(item.timestamp)}</span>
          </div>
        `;
      }).join('');
    }
  }

  modal.classList.add('active');
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp) {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Agora há pouco';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Há ${diffDays}d`;
}

/**
 * Export Analytics to CSV
 */
function exportAnalyticsCsv() {
  const data = getAnalyticsData();
  const clicks = data.clicks || {};
  
  let csv = 'ID do Link,Nome do Link,Total de Cliques\r\n';
  const linkNamesMap = {
    'instagram': 'Instagram Oficial',
    'shopee': 'Loja Oficial na Shopee',
    'whatsapp': 'Atendimento & Orçamentos no WhatsApp',
    'youtube': 'Canal no YouTube',
    'tiktok': 'TikTok Oficial',
    'website': 'Site & Catálogo Oficial',
    'vcard': 'Salvar Contato VIP',
    'share_button': 'Compartilhar Perfil',
    'qr_code_modal': 'Abrir QR Code'
  };

  Object.entries(clicks).forEach(([id, count]) => {
    const title = (linkNamesMap[id] || id).replace(/,/g, '');
    csv += `"${id}","${title}",${count}\r\n`;
  });

  csv += `\r\nVisitas Totais,${data.views || 0}\r\n`;
  csv += `Visitantes Unicos,${data.uniqueVisitors || 0}\r\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_cliques_mrmaxelegance_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('✓ Relatório CSV exportado!');
}

/**
 * Clear/Reset Analytics Data
 */
function clearAnalyticsData() {
  if (confirm('Tem certeza que deseja zerar todas as métricas de cliques e visualizações?')) {
    localStorage.removeItem(STORAGE_KEY);
    showToast('✓ Métricas zeradas com sucesso!');
    openAnalyticsModal();
  }
}

/**
 * Dynamically initialize PostHog, Google Analytics & Meta Pixel
 */
function initExternalAnalytics() {
  const cfg = window.BRAND_CONFIG?.analytics;
  if (!cfg) return;

  // 1. PostHog Initialization 🦔
  if (cfg.posthog && cfg.posthog.apiKey && cfg.posthog.apiKey.trim() !== '') {
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1.0)}(document,window.posthog||[]);
    
    posthog.init(cfg.posthog.apiKey, {
      api_host: cfg.posthog.apiHost || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      autocapture: true,
      capture_pageview: true,
      session_recording: {
        recordCrossOriginIframes: false
      }
    });
  }

  // 2. Google Analytics 4
  if (cfg.googleAnalyticsId && cfg.googleAnalyticsId.trim() !== '') {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.googleAnalyticsId}`;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', cfg.googleAnalyticsId);
  }

  // 3. Meta Pixel
  if (cfg.metaPixelId && cfg.metaPixelId.trim() !== '') {
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', cfg.metaPixelId);
    fbq('track', 'PageView');
  }
}
