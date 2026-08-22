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
    pecas.forEach((p, k) => p.classList.toggle('is-ativa', k === i));
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
    p.setAttribute('tabindex', '0');
  });

  /* ==========================================================
     5. REVELAÇÕES NO SCROLL
     ========================================================== */
  const alvos = $$('.rev, .rev-sm, .para, .material, .slogan, .logo-print');
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
  const camadas = {
    azul:   $$('.camada-azul'),
    cinza:  $$('.camada-cinza'),
    branca: $$('.camada-branca')
  };
  let animacoes = [];

  function animarTitulo() {
    if (semMovimento || !titulo || !gantryX || !gantryY || !bico) return;
    if (!bases.length || !camadas.azul.length) return;
    if (!('animate' in Element.prototype)) return;

    animacoes.forEach((a) => { try { a.cancel(); } catch (e) {} });
    animacoes = [];

    const W = titulo.getBoundingClientRect();

    /* mede a borda direita de cada caractere para saber onde o bico "deposita" */
    const linhas = bases.map((el, i) => {
      let no = null;
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let cand;
      while ((cand = tw.nextNode())) { if (cand.nodeValue && cand.nodeValue.trim()) { no = cand; break; } }
      const r = el.getBoundingClientRect();
      const bordas = [];
      if (no) {
        const rg = document.createRange();
        for (let c = 1; c <= no.length; c++) {
          rg.setStart(no, 0); rg.setEnd(no, c);
          const rr = rg.getBoundingClientRect();
          if (no.textContent[c - 1] !== ' ') bordas.push(rr.right - r.left);
        }
      }
      const umaLinha = r.height < parseFloat(getComputedStyle(el).fontSize) * 1.6;
      const ov = (camadas.azul[i] || el).getBoundingClientRect();
      return {
        i, el,
        w: r.width,
        ow: ov.width || r.width,
        y: r.top - W.top + r.height / 2,
        x0: r.left - W.left,
        bordas: umaLinha ? bordas : []
      };
    });

    const total = linhas.reduce((a, l) => a + l.bordas.length, 0);
    if (!total) return;

    const passo = 300, pausa = 1800;
    const passe = total * passo;
    const off = passe + pausa;
    const T = off * 3;

    /* ordem de visita: linhas ímpares imprimem da direita para a esquerda (bico em zigue-zague) */
    const visitas = [];
    let t = 0;
    linhas.forEach((l) => {
      const rtl = l.i % 2 === 1;
      const bs = rtl ? l.bordas.slice().reverse() : l.bordas;
      bs.forEach((b) => {
        visitas.push({ l, rtl, t, x: l.x0 + b, y: l.y });
        t += passo;
      });
    });

    const opt = { duration: T, iterations: Infinity, fill: 'both' };

    [['azul', 0], ['cinza', off], ['branca', off * 2]].forEach(([cor, atraso]) => {
      linhas.forEach((l) => {
        const vs = visitas.filter((v) => v.l === l);
        if (!vs.length) return;
        const rtl = l.i % 2 === 1;
        const vazio = rtl ? 'inset(0 0 0 ' + l.ow.toFixed(1) + 'px)'
                          : 'inset(0 ' + l.ow.toFixed(1) + 'px 0 0)';
        const inicio = Math.min(1, (atraso + vs[0].t) / T);
        const fim    = Math.min(1, (atraso + vs[vs.length - 1].t) / T);
        const kf = [{ clipPath: vazio, offset: 0 }];
        if (inicio > 0.0006) kf.push({ clipPath: vazio, offset: inicio - 0.0005 });

        let anterior = vazio;
        vs.forEach((v, vi) => {
          const avanco = rtl ? l.w - (v.x - l.x0) : (v.x - l.x0);
          const resto  = vi === vs.length - 1 ? 0 : Math.max(0, l.ow - avanco);
          anterior = rtl ? 'inset(0 0 0 ' + resto.toFixed(1) + 'px)'
                         : 'inset(0 ' + resto.toFixed(1) + 'px 0 0)';
          kf.push({ clipPath: anterior, offset: Math.min(1, (atraso + v.t) / T), easing: 'cubic-bezier(.45,0,.55,1)' });
        });
        if (fim < 0.9994) kf.push({ clipPath: anterior, offset: fim + 0.0005 });
        kf.push({ clipPath: anterior, offset: 1 });

        const alvo = camadas[cor][l.i];
        if (alvo) animacoes.push(alvo.animate(kf, opt));
      });
    });

    /* gantry: o eixo X chega um pouco antes do Y, como numa máquina de verdade */
    const kx = [], ky = [];
    [0, off, off * 2].forEach((atraso) => {
      visitas.forEach((v) => {
        const tt = v.t + atraso;
        kx.push({ left: v.x.toFixed(1) + 'px', offset: Math.max(0, Math.min(1, (tt - passo * 0.45) / T)), easing: 'cubic-bezier(.45,0,.55,1)' });
        ky.push({ top:  v.y.toFixed(1) + 'px', offset: Math.max(0, Math.min(1, tt / T)), easing: 'cubic-bezier(.45,0,.55,1)' });
      });
    });
    animacoes.push(gantryX.animate(kx, opt), gantryY.animate(ky, opt),
                   bico.animate(kx, opt), bico.animate(ky, opt));
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
  let agendado;
  function remedir() {
    clearTimeout(agendado);
    agendado = setTimeout(() => {
      desenharNumeros();
      medirDesenho();
      animarTitulo();
    }, 180);
  }

  function iniciar() {
    aplicarPpcm();
    ativarPeca(0);
    atualizarProgresso();
    animarTitulo();
    setTimeout(animarTitulo, 700);
    setTimeout(remedir, 1600);
  }

  window.addEventListener('scroll', atualizarProgresso, { passive: true });
  /* o bilhete da régua sai de cena assim que a pessoa começa a rolar */
  window.addEventListener('scroll', function esconderTip() {
    if (window.scrollY < 60) return;
    notaTip && notaTip.classList.remove('is-on');
    window.removeEventListener('scroll', esconderTip);
  }, { passive: true });
  window.addEventListener('resize', remedir);
  if (window.ResizeObserver) new ResizeObserver(remedir).observe(document.body);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remedir);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
