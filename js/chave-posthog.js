/* ============================================================
   A chave do PostHog, num arquivo só

   Ela é pública por natureza — vai no JavaScript de qualquer site que
   meça alguma coisa, e o PostHog só aceita escrita com ela, nunca
   leitura. Mesmo assim mora aqui sozinha, e não copiada em cada página:
   duas cópias da mesma chave é uma que fica velha.

   `js/config.js` (bio links) e `js/metricas.js` (catálogo) leem daqui.
   Sem chave, nada é medido e nenhum byte sai do navegador.
   ============================================================ */

window.POSTHOG_CHAVE = '';                              // cole o phc_... aqui
window.POSTHOG_HOST = 'https://us.i.posthog.com';       // eu.i.posthog.com na Europa
