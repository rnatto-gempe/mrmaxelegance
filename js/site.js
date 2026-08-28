/**
 * MR MAX ELEGANCE — comportamento da home
 * Sem dependências: régua calibrável, título impresso letra a letra,
 * índice de peças e revelações no scroll.
 */
(() => {
  'use strict';

  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const PADRAO_PPCM = 96 / 2.54;               // 37.8 px/cm — densidade nominal do CSS
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================
     1. RÉGUA LATERAL
     ========================================================== */
  const ruler      = $('#ruler');
  const rulerReset = $('#rulerReset');
  const rulerBadge = $('#rulerBadge');
  const calBtn     = $('#calBtn');
  const calPanel   = $('#calPanel');
  const calRange   = $('#calRange');
  const calLabel   = $('#calLabel');
  const calPadrao  = $('#calPadrao');
  const notaHover  = $('#notaHover');
  const notaTip    = $('#notaTip');
  const eggPpcm    = $('#eggPpcm');

  const ler = (chave, alt) => { try { return localStorage.getItem(chave) ?? alt; } catch (e) { return alt; } };
  const gravar = (chave, valor) => { try { localStorage.setItem(chave, valor); } catch (e) {} };

  let ppcm = parseFloat(ler('mmax-ruler-ppcm', '')) || PADRAO_PPCM;
  let dx = 0, dy = 0, arrastando = false;

  function aplicarPpcm() {
    document.documentElement.style.setProperty('--cm', ppcm.toFixed(2) + 'px');
    if (calRange) calRange.value = ppcm.toFixed(1);
    if (calLabel) calLabel.textContent = ppcm.toFixed(1) + ' px = 1 cm';
    if (eggPpcm)  eggPpcm.textContent  = ppcm.toFixed(1);
    desenharNumeros();
    medirDesenho();
  }

  /* números de centímetro ao longo da calha (os traços são gradiente, custo zero) */
  function desenharNumeros() {
    if (!ruler) return;
    const altura = document.body.scrollHeight;
    const total = Math.min(Math.ceil(altura / ppcm) + 1, 600);
    let html = '';
    for (let k = 0; k <= total; k++) {
      html += '<span class="ruler-num' + (k % 5 === 0 ? ' is-5' : '') +
              '" style="top:' + (k * ppcm - 6).toFixed(2) + 'px">' + k + '</span>';
    }
    ruler.innerHTML = html;
  }

  if (ruler) {
    ruler.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const x0 = e.clientX, y0 = e.clientY, dx0 = dx, dy0 = dy;
      notaTip && notaTip.classList.remove('is-on');
      gravar('mmax-ruler-tip', '1');

      const mover = (ev) => {
        dx = dx0 + (ev.clientX - x0);
        dy = dy0 + (ev.clientY - y0);
        arrastando = true;
        ruler.classList.add('is-dragging', 'is-moved');
        ruler.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        rulerBadge.classList.add('is-on');
        rulerBadge.textContent = 'OFFSET ' + (dx / ppcm).toFixed(1).replace('.', ',') +
                                 ' × ' + (dy / ppcm).toFixed(1).replace('.', ',') + ' cm';
        rulerReset.classList.add('is-on');
      };
      const soltar = () => {
        window.removeEventListener('pointermove', mover);
        window.removeEventListener('pointerup', soltar);
        arrastando = false;
        ruler.classList.remove('is-dragging');
        rulerBadge.classList.remove('is-on');
      };
      window.addEventListener('pointermove', mover);
      window.addEventListener('pointerup', soltar);
      e.preventDefault();
    });

    ruler.addEventListener('dblclick', zerarRegua);
    ruler.addEventListener('mouseenter', () => { if (!arrastando) notaHover && notaHover.classList.add('is-on'); });
    ruler.addEventListener('mouseleave', () => notaHover && notaHover.classList.remove('is-on'));
  }

  function zerarRegua() {
    dx = dy = 0;
    ruler.style.transform = '';
    ruler.classList.remove('is-moved');
    rulerReset.classList.remove('is-on');
    rulerBadge.classList.remove('is-on');
  }
  rulerReset && rulerReset.addEventListener('click', zerarRegua);

  calBtn && calBtn.addEventListener('click', () => { calPanel.hidden = !calPanel.hidden; });
  calRange && calRange.addEventListener('input', (e) => {
    ppcm = parseFloat(e.target.value);
    gravar('mmax-ruler-ppcm', String(ppcm));
    aplicarPpcm();
  });
  calPadrao && calPadrao.addEventListener('click', () => {
    ppcm = PADRAO_PPCM;
    gravar('mmax-ruler-ppcm', String(ppcm));
    aplicarPpcm();
  });

  /* bilhete de primeira visita */
  if (notaTip) {
    if (ler('mmax-ruler-tip', '') !== '1') setTimeout(() => notaTip.classList.add('is-on'), 1200);
    const fechar = $('#notaTipFechar');
    fechar && fechar.addEventListener('click', () => {
      notaTip.classList.remove('is-on');
      gravar('mmax-ruler-tip', '1');
    });
  }

  /* ==========================================================
     2. COTAS DO DESENHO — largura e altura da moldura em cm
     ========================================================== */
  const desenho     = $('#desenho');
  const cotaLargura = $('#cotaLargura');
  const cotaAltura  = $('#cotaAltura');

  function medirDesenho() {
    if (!desenho || !cotaLargura || !cotaAltura) return;
    const r = desenho.getBoundingClientRect();
    cotaLargura.textContent = (r.width / ppcm).toFixed(1).replace('.', ',') + ' cm';
    cotaAltura.textContent  = (r.height / ppcm).toFixed(1).replace('.', ',');
  }

  /* ==========================================================
     3. BARRA DE PROGRESSO DO SCROLL
     ========================================================== */
  const progresso = $('#progresso');
  function atualizarProgresso() {
    if (!progresso) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    progresso.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }

  /* ==========================================================
     4. ÍNDICE DE PEÇAS
     ========================================================== */
  const pecas     = $$('.peca');
  const quadros   = $$('.preview-caixa .quadro');
  const contador  = $('#pecaContador');
  const nomeAtiva = $('#pecaAtiva');
  const totalPecas = String(pecas.length).padStart(3, '0');

  function ativarPeca(i) {
    pecas.forEach((p, k) => {
      p.classList.toggle('is-ativa', k === i);
      p.setAttribute('aria-pressed', k === i ? 'true' : 'false');
    });
    quadros.forEach((q, k) => q.classList.toggle('is-ativa', k === i));
    const alvo = pecas[i];
    if (!alvo) return;
    if (contador)  contador.textContent  = alvo.querySelector('.peca-num').textContent + ' / ' + totalPecas;
    if (nomeAtiva) nomeAtiva.textContent = alvo.querySelector('.peca-nome').textContent;
  }
  pecas.forEach((p, i) => {
    p.addEventListener('mouseenter', () => ativarPeca(i));
    p.addEventListener('click', () => ativarPeca(i));
    p.addEventListener('focus', () => ativarPeca(i));
  });

  /* ==========================================================
     5. REVELAÇÕES NO SCROLL
     ========================================================== */
  const alvos = $$('.rev, .rev-sm, .para, .slogan, .logo-print');
  if ('IntersectionObserver' in window && !semMovimento) {
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visivel');
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    alvos.forEach((el) => obs.observe(el));
  } else {
    alvos.forEach((el) => el.classList.add('visivel'));
  }

  /* ==========================================================
     6. TÍTULO IMPRESSO — o cabeçote percorre letra a letra
     Três passadas: azul, cinza e branco, como as camadas de uma peça.
     ========================================================== */
  const titulo  = $('#titulo');
  const gantryX = $('#gantryX');
  const gantryY = $('#gantryY');
  const bico    = $('#bicoTitulo');
  const bases   = $$('.titulo-linha .base');
  const camadas = { azul: [], cinza: [], branca: [] };

  /* As três demãos de cor são cópias do texto empilhadas sobre ele. Ficam
     fora do HTML de propósito: assim a página entregue tem o título uma vez
     só — o que buscadores leem — e as cópias, que são enfeite, nascem aqui. */
  function montarCamadas() {
    const cores = [['azul', 'camada-azul'], ['cinza', 'camada-cinza'], ['branca', 'camada-branca']];
    bases.forEach((base) => {
      const linha = base.parentNode;
      cores.forEach((par) => {
        const el = document.createElement('span');
        el.className = 'camada ' + par[1];
        el.setAttribute('aria-hidden', 'true');
        el.textContent = base.textContent;
        linha.appendChild(el);
        camadas[par[0]].push(el);
      });
    });
    const eixos = document.createElement('span');
    eixos.className = 'eixos';
    eixos.setAttribute('aria-hidden', 'true');
    eixos.textContent = 'X / Y';
    titulo && titulo.appendChild(eixos);
  }
  let animacoes = [];
  let geometria = '';   /* impressão digital do layout do título */

  /* Só vale recriar a animação quando a geometria muda de verdade (fonte que
     acabou de carregar, largura da janela). Sem isso, cada chamada recomeçava
     a impressão do zero e o título ficava reiniciando sozinho. */
  function assinatura() {
    if (!titulo) return '';
    const r = titulo.getBoundingClientRect();
    const corpo = bases[0] ? getComputedStyle(bases[0]).fontSize : '';
    return r.width.toFixed(1) + 'x' + r.height.toFixed(1) + '/' + corpo + '/' +
      camadas.azul.map((el) => el.getBoundingClientRect().width.toFixed(1)).join(',');
  }

  /* velocidades do cabeçote, em pixels por segundo */
  const V_TINTA = 200;    /* sobre as letras — constante, é o que se enxerga imprimindo */
  const V_VAZIO = 1700;   /* nos espaços e na volta de linha — deslocamento sem depositar */
  const PAUSA   = 1500;   /* ms de descanso entre uma passada e outra */

  function animarTitulo() {
    if (semMovimento || !titulo || !gantryX || !gantryY || !bico) return;
    if (!bases.length || !camadas.azul.length) return;
    if (!('animate' in Element.prototype)) return;

    const agora = assinatura();
    if (agora === geometria && animacoes.length) return;   /* nada mudou: deixa imprimindo */
    geometria = agora;

    /* onde a impressão estava, para retomar dali em vez de voltar ao começo */
    let fase = null;
    if (animacoes.length) {
      try { fase = animacoes[0].currentTime; } catch (e) {}
    }
    animacoes.forEach((a) => { try { a.cancel(); } catch (e) {} });
    animacoes = [];

    const W = titulo.getBoundingClientRect();
    const nolimite = (v) => Math.max(0, Math.min(1, v));

    /* Quanto a tinta de cada letra passa da caixa de avanço.
       Com letter-spacing negativo o desenho do glifo sobra para fora do
       avanço; cortar na borda do avanço deixaria essa beirada por pintar.
       O canvas sabe dizer a extensão real da tinta (actualBoundingBoxRight). */
    const medidor = (function () {
      try {
        const ctx = document.createElement('canvas').getContext('2d');
        if (!ctx || !('letterSpacing' in ctx)) return null;
        return ctx;
      } catch (e) { return null; }
    })();

    function sobrasDaLinha(el, texto, larguraReal) {
      const est = getComputedStyle(el);
      const aperto = Math.abs(parseFloat(est.letterSpacing) || 0);
      const reserva = aperto + 0.75;   /* usado quando não dá para medir */

      if (!medidor) return { fixa: reserva, lista: null };
      try {
        medidor.font = est.fontWeight + ' ' + est.fontSize + ' ' + est.fontFamily;
        medidor.letterSpacing = est.letterSpacing;
        const total = medidor.measureText(texto).width;
        /* o canvas não aplica font-variation-settings; a escala de largura
           corrige a diferença entre a medida dele e a da página */
        const escala = total > 0 ? larguraReal / total : 1;
        const lista = [];
        for (let c = 1; c <= texto.length; c++) {
          const m = medidor.measureText(texto.slice(0, c));
          lista.push(Math.max(0, (m.actualBoundingBoxRight - m.width) * escala) + 0.6);
        }
        return { fixa: reserva, lista };
      } catch (e) { return { fixa: reserva, lista: null }; }
    }

    /* ----------------------------------------------------------
       1. Mede cada linha NA PRÓPRIA CAMADA que vai ser pintada.
       Medir na camada (e não no texto de baixo) é o que garante que
       o recorte caia exatamente na borda do glifo — sem sobra.
       ---------------------------------------------------------- */
    const linhas = camadas.azul.map((el, i) => {
      const r = el.getBoundingClientRect();
      const linha = {
        i,
        x0: r.left - W.left,
        y: r.top - W.top + r.height / 2,
        w: r.width,
        rtl: i % 2 === 1,   /* linha ímpar imprime no sentido contrário, como um cabeçote de verdade */
        letras: []
      };

      let no = null;
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let cand;
      while ((cand = tw.nextNode())) { if (cand.nodeValue && cand.nodeValue.trim()) { no = cand; break; } }

      const corpo = parseFloat(getComputedStyle(el).fontSize) || 40;
      /* pernas de q/p/g e acentos passam da caixa da linha; o recorte precisa
         abrir para fora dela, senão a ponta da letra fica sem pintar */
      linha.alto = Math.max(20, corpo * 0.5);
      const umaLinha = r.height < corpo * 1.6;
      if (no && umaLinha) {
        const sobras = sobrasDaLinha(el, no.textContent, r.width);
        const rg = document.createRange();
        let esq = 0;
        for (let c = 1; c <= no.length; c++) {
          rg.setStart(no, 0); rg.setEnd(no, c);
          const dir = rg.getBoundingClientRect().right - r.left;
          const sangra = sobras.lista ? sobras.lista[c - 1] : sobras.fixa;
          linha.letras.push({
            esq, dir,
            vazio: no.textContent[c - 1] === ' ',
            folga: Math.min(6, sangra)
          });
          esq = dir;
        }
      }
      /* se a linha quebrou em duas (telas estreitas), pinta de uma vez só */
      if (!linha.letras.length) linha.letras.push({ esq: 0, dir: linha.w, vazio: false, folga: 0 });
      return linha;
    });

    /* ----------------------------------------------------------
       2. Trajetória de uma passada.
       O tempo de cada trecho vem da LARGURA dele dividida pela
       velocidade — por isso o bico anda sempre no mesmo ritmo sobre
       as letras e dispara nos vazios, em vez de gastar o mesmo
       tempo em cada caractere.
       ---------------------------------------------------------- */
    const eventos = [];
    let t = 0, ultX = null, ultY = null;

    linhas.forEach((linha) => {
      const seq = linha.rtl ? linha.letras.slice().reverse() : linha.letras;
      const partida = linha.rtl ? linha.w : 0;
      const xPartida = linha.x0 + partida;

      /* volta de linha: distância percorrida em vazio */
      if (ultX !== null) {
        const dist = Math.hypot(xPartida - ultX, linha.y - ultY);
        t += Math.max(90, (dist / V_VAZIO) * 1000);
      }
      eventos.push({ t, x: xPartida, y: linha.y, linha, p: partida, folga: 0, tinta: false });

      seq.forEach((letra) => {
        const chegada = linha.rtl ? letra.esq : letra.dir;
        const largura = Math.abs(letra.dir - letra.esq);
        const v = letra.vazio ? V_VAZIO : V_TINTA;
        t += Math.max(12, (largura / v) * 1000);
        eventos.push({ t, x: linha.x0 + chegada, y: linha.y, linha, p: chegada, folga: letra.folga || 0, tinta: !letra.vazio });
      });

      ultX = eventos[eventos.length - 1].x;
      ultY = linha.y;
    });

    const passe = t;
    if (!passe) return;
    const off = passe + PAUSA;
    const T = off * 3;
    const opt = { duration: T, iterations: Infinity, fill: 'both' };

    /* ----------------------------------------------------------
       3. A tinta: cada letra é preenchida INTEIRA no instante em que
       o bico entra nela (steps), nunca pela metade.
       ---------------------------------------------------------- */
    [['azul', 0], ['cinza', off], ['branca', off * 2]].forEach((par) => {
      const cor = par[0], atraso = par[1];
      linhas.forEach((linha) => {
        const alvo = camadas[cor][linha.i];
        const evs = eventos.filter((e) => e.linha === linha);
        if (!alvo || !evs.length) return;

        const fora = (-linha.alto).toFixed(1) + 'px';
        const recorte = (p, f) => linha.rtl
          ? 'inset(' + fora + ' ' + fora + ' ' + fora + ' ' + Math.max(0, p - (f || 0)).toFixed(1) + 'px)'
          : 'inset(' + fora + ' ' + Math.max(0, linha.w - p - (f || 0)).toFixed(1) + 'px ' + fora + ' ' + fora + ')';

        const seca  = recorte(linha.rtl ? linha.w : 0, 0);
        const cheia = recorte(linha.rtl ? 0 : linha.w, 0);

        const kf = [{ clipPath: seca, offset: 0, easing: 'steps(1, end)' }];
        const oIni = nolimite((atraso + evs[0].t) / T);
        if (oIni > 0.0012) kf.push({ clipPath: seca, offset: oIni - 0.001, easing: 'steps(1, end)' });

        /* o keyframe entra no instante em que o bico ALCANÇA a letra e já
           leva o recorte até o fim dela; com steps(1,end) esse valor vale
           por todo o trecho, então a letra nasce completa e nunca pela metade */
        let anterior = oIni;
        for (let k = 0; k < evs.length; k++) {
          const e = evs[k];
          const o = Math.max(anterior, nolimite((atraso + (k === 0 ? e.t : evs[k - 1].t)) / T));
          kf.push({ clipPath: recorte(e.p, k > 0 ? e.folga : 0), offset: o, easing: 'steps(1, end)' });
          anterior = o;
        }
        kf.push({ clipPath: cheia, offset: Math.max(anterior, nolimite((atraso + evs[evs.length - 1].t) / T)), easing: 'steps(1, end)' });
        kf.push({ clipPath: cheia, offset: 1 });

        animacoes.push(alvo.animate(kf, opt));
      });
    });

    /* ----------------------------------------------------------
       4. O cabeçote: movimento linear, sem acelerar e frear a cada
       caractere, e em cima da letra que acabou de sair.
       ---------------------------------------------------------- */
    const kx = [], ky = [];
    [0, off, off * 2].forEach((atraso) => {
      eventos.forEach((e) => {
        const tt = e.t + atraso;
        kx.push({ left: e.x.toFixed(1) + 'px', offset: nolimite(tt / T), easing: 'linear' });
        ky.push({ top:  e.y.toFixed(1) + 'px', offset: nolimite(tt / T), easing: 'linear' });
      });
    });
    kx.sort((a, b) => a.offset - b.offset);
    ky.sort((a, b) => a.offset - b.offset);

    animacoes.push(gantryX.animate(kx, opt), gantryY.animate(ky, opt),
                   bico.animate(kx, opt), bico.animate(ky, opt));

    if (fase != null) {
      const retoma = fase % T;
      animacoes.forEach((a) => { try { a.currentTime = retoma; } catch (e) {} });
    }
  }

  /* ==========================================================
     7. RECADINHO DO RODAPÉ
     ========================================================== */
  const eggBtn = $('#eggBtn');
  const egg    = $('#egg');
  eggBtn && eggBtn.addEventListener('click', () => { egg.hidden = !egg.hidden; });

  /* ==========================================================
     8. CICLO DE VIDA
     ========================================================== */
  let alturaDoc = 0;

  /* barato e sem efeito na animação: só a régua e as cotas */
  function remedirRegua() {
    const h = Math.ceil(document.body.scrollHeight);
    if (Math.abs(h - alturaDoc) > 4) { alturaDoc = h; desenharNumeros(); }
    medirDesenho();
  }

  let agendado;
  function remedir() {
    clearTimeout(agendado);
    agendado = setTimeout(() => {
      remedirRegua();
      animarTitulo();   /* a assinatura decide se há motivo para recriar */
    }, 200);
  }

  function iniciar() {
    montarCamadas();
    aplicarPpcm();
    ativarPeca(0);
    atualizarProgresso();
    animarTitulo();
  }

  window.addEventListener('scroll', atualizarProgresso, { passive: true });
  /* o bilhete da régua sai de cena assim que a pessoa começa a rolar */
  window.addEventListener('scroll', function esconderTip() {
    if (window.scrollY < 60) return;
    notaTip && notaTip.classList.remove('is-on');
    window.removeEventListener('scroll', esconderTip);
  }, { passive: true });
  window.addEventListener('resize', remedir);
  /* a altura do documento muda a toda hora (imagens, seções que revelam):
     isso mexe na régua, nunca na impressão do título */
  if (window.ResizeObserver) {
    let pendente;
    new ResizeObserver(() => {
      clearTimeout(pendente);
      pendente = setTimeout(remedirRegua, 200);
    }).observe(document.body);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remedir);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
