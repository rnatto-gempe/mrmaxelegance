/* ============================================================
   MR MAX ELEGANCE — medição do catálogo

   O SDK oficial do PostHog pesa cerca de 55 KB comprimido: quase o peso
   do catálogo inteiro (73 KB), para uma página cujo trabalho é abrir
   4 mil peças rápido. Então aqui não há SDK. Os eventos vão direto para o
   endpoint público de captura, em 2 KB de código, e chegam nos mesmos
   painéis do PostHog.

   O que fica de fora do envio direto é o autocapture e o session replay —
   nenhum dos dois foi pedido, e ambos exigem a biblioteca. A página de
   links (`js/app.js`) usa o SDK completo, onde o peso não atrapalha.

   Nada é enviado quando:
   - a chave está vazia (`js/chave-posthog.js`);
   - o navegador pede para não ser rastreado (`doNotTrack`).
   ============================================================ */

(function (janela) {
  'use strict';

  var CHAVE = janela.POSTHOG_CHAVE || '';
  var HOST = (janela.POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/+$/, '');
  var ALVO = HOST + '/i/v0/e';

  var naoRastrear = janela.doNotTrack === '1'
    || (janela.navigator && (navigator.doNotTrack === '1' || navigator.msDoNotTrack === '1'));

  var ligado = !!CHAVE && !naoRastrear;

  /* ------------------------------------------------------------
     Quem é quem, sem saber quem é

     Um número aleatório guardado no navegador. Não sai daqui, não vem de
     login, não diz nome nem e-mail — serve só para o PostHog não contar a
     mesma pessoa dez vezes. Em aba privada o armazenamento falha, e aí o
     número vive só enquanto a aba estiver aberta.
     ------------------------------------------------------------ */
  var EU = (function () {
    var novo = 'a-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    try {
      var salvo = localStorage.getItem('mm_visitante');
      if (salvo) return salvo;
      localStorage.setItem('mm_visitante', novo);
    } catch (e) { /* aba privada, ou armazenamento bloqueado */ }
    return novo;
  }());

  function manda(evento, props) {
    if (!ligado) return;

    var corpo = {
      api_key: CHAVE,
      event: evento,
      distinct_id: EU,
      timestamp: new Date().toISOString(),
      properties: {}
    };

    // as propriedades com $ são as que o PostHog entende sozinho e usa
    // nos painéis prontos
    corpo.properties.$current_url = location.href;
    corpo.properties.$pathname = location.pathname;
    corpo.properties.$host = location.host;
    corpo.properties.$referrer = document.referrer || '$direct';
    corpo.properties.$lib = 'mrmax-leve';
    corpo.properties.$screen_width = janela.innerWidth;

    for (var k in (props || {})) {
      if (Object.prototype.hasOwnProperty.call(props, k)) corpo.properties[k] = props[k];
    }

    var texto = JSON.stringify(corpo);

    // `text/plain` de propósito: com `application/json` o navegador manda
    // uma requisição de permissão antes (preflight) e dobra a viagem.
    // `sendBeacon` ainda entrega o evento se a página estiver saindo —
    // é o caso do clique que abre o WhatsApp em outra aba.
    try {
      if (janela.navigator && navigator.sendBeacon) {
        var pacote = new Blob([texto], { type: 'text/plain;charset=UTF-8' });
        if (navigator.sendBeacon(ALVO, pacote)) return;
      }
    } catch (e) { /* cai no fetch */ }

    try {
      fetch(ALVO, {
        method: 'POST',
        body: texto,
        keepalive: true,
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
      });
    } catch (e) { /* medir nunca pode quebrar a página */ }
  }

  /* ------------------------------------------------------------
     O que o catálogo mede

     Cinco perguntas, e nada além delas:
     · o que as pessoas procuram — e o que procuram e não existe
     · qual seção do acervo realmente usam
     · quais peças abrem
     · em quais param o mouse para ver o vídeo
     · quais viram pedido no WhatsApp
     ------------------------------------------------------------ */
  var esperaBusca = 0;
  var previasVistas = {};

  // Todo evento de peça carrega a peça inteira: código, id e nome. Um
  // relatório que só tem id vira uma tabela de números; um que só tem nome
  // não agrupa nem ordena. Os três juntos servem tanto ao ranking quanto a
  // quem vai ler uma linha dele — e é o mesmo conjunto em todos os eventos,
  // porque ranking de eventos diferentes só cruza se a chave for a mesma.
  function daPeca(it, extra) {
    var props = {
      codigo: it.codigo || ('MM-' + it.id),
      peca_id: it.id,
      peca: it.nome
    };
    for (var k in (extra || {})) {
      if (Object.prototype.hasOwnProperty.call(extra, k)) props[k] = extra[k];
    }
    return props;
  }

  janela.medidas = {
    ligado: ligado,

    abriu: function (filtro, termo) {
      manda('$pageview', { faixa: filtro || '(todas)', termo: termo || '' });
    },

    // A busca só é registrada quando a digitação para de verdade. Sem esta
    // espera, "dragão" viraria seis eventos — e "d", "dr", "dra" não são
    // perguntas que ninguém fez.
    buscou: function (termo, resultados) {
      clearTimeout(esperaBusca);
      if (!termo) return;
      esperaBusca = setTimeout(function () {
        manda('busca', {
          termo: termo,
          resultados: resultados,
          sem_resultado: resultados === 0
        });
      }, 900);
    },

    // recebe { faixa, rotulo, pecas } — o slug ordena, o rótulo se lê
    filtrou: function (o) {
      manda('faixa_filtrada', o || {});
    },

    abriuPeca: function (it) {
      manda('peca_aberta', daPeca(it));
    },

    // uma vez por peça por visita: o mouse volta ao mesmo card sem querer
    viuPrevia: function (it) {
      if (previasVistas[it.id]) return;
      previasVistas[it.id] = 1;
      manda('previa_vista', daPeca(it));
    },

    pediu: function (it, de) {
      manda('pedido_whatsapp', daPeca(it, { origem: de }));
    }
  };
}(window));
