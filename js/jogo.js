/**
 * MR MAX ELEGANCE — Turno de impressão
 *
 * Você é o cabeçote. As setas movem os eixos X e Y; o bico extruda sozinho
 * por onde passa. Percorra as paredes da peça sem vagar fora do desenho:
 * cada centímetro rodado gasta filamento, e fora da peça gasta o triplo e
 * ainda deixa fio solto. Filamento no fim, turno encerrado.
 */
(() => {
  'use strict';

  const COLS = 20, ROWS = 12;

  /* silhuetas: '#' é parede a imprimir */
  const PECAS = [
    { nome: 'Chaveiro (treino)', treino: true, arte: [
      '....................',
      '....................',
      '....................',
      '.......######.......',
      '.......#....#.......',
      '.......#....#.......',
      '.......#....#.......',
      '.......######.......',
      '....................',
      '....................',
      '....................',
      '....................'] },
    { nome: 'Luminária lua', arte: [
      '....................',
      '........#####.......',
      '......##.....##.....',
      '.....#..........#...',
      '....#............#..',
      '....#............#..',
      '....#............#..',
      '.....#..........#...',
      '......##.....##.....',
      '........#####.......',
      '....................',
      '....................'] },
    { nome: 'Vaso espiral', arte: [
      '....................',
      '......##########....',
      '......#........#....',
      '.......#......#.....',
      '.....##........##...',
      '.....#..........#...',
      '.....#..........#...',
      '......#........#....',
      '......#........#....',
      '.......#......#.....',
      '.......########.....',
      '....................'] },
    { nome: 'Dragão articulado', arte: [
      '....................',
      '.............####...',
      '............#....#..',
      '...........#..#...#.',
      '....########......#.',
      '...#..............#.',
      '..#....############.',
      '..#...#.............',
      '..#..#..............',
      '...##...............',
      '....................',
      '....................'] },
    { nome: 'Engrenagem', arte: [
      '....................',
      '......##....##......',
      '....###......###....',
      '....#..........#....',
      '..###..........###..',
      '..#................#',
      '..#................#',
      '..###..........###..',
      '....#..........#....',
      '....###......###....',
      '......##....##......',
      '....................'] },
    { nome: 'Quebra-cabeça 3D', arte: [
      '....................',
      '...###########......',
      '...#.........#......',
      '...#.........###....',
      '...#............#...',
      '...#............#...',
      '...#.........###....',
      '...#.........#......',
      '...###.......#......',
      '.....#.......#......',
      '...###########......',
      '....................'] },
    { nome: 'Organizador de gaveta', arte: [
      '....................',
      '..################..',
      '..#.....#.....#...#.',
      '..#.....#.....#...#.',
      '..#.....#.....#...#.',
      '..#.....#.....#...#.',
      '..################..',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................'] }
  ];

  /* ---------- economia do turno ---------- */
  const GASTO_UTIL     = 0.35;   /* filamento por célula da peça */
  const GASTO_PERDIDO  = 1.1;    /* por célula fora da peça */
  const AQUECIMENTO    = 0.3;    /* por segundo, parado ou não */
  const RECARGA        = 45;     /* ao concluir uma peça */
  const VEL_INICIAL    = 4.5;    /* células por segundo — dá tempo de pensar */
  const VEL_PASSO      = 0.45;
  const VEL_MAXIMA     = 9;

  const CORES = {
    fundo:    '#05070A',
    grade:    'rgba(79,163,247,.07)',
    parede:   'rgba(79,163,247,.34)',
    quente:   [191, 224, 255],
    fria:     [30, 123, 232],
    borrao:   'rgba(232,97,58,.75)',
    bico:     '#BFE0FF',
    eixo:     'rgba(79,163,247,.5)'
  };

  const $ = (s) => document.querySelector(s);
  const canvas = $('#mesa');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const veu       = $('#jogoVeu');
  const veuTitulo = $('#veuTitulo');
  const veuTexto  = $('#veuTexto');
  const botao     = $('#jogoBotao');
  const elBarra   = $('#barraFilamento');
  const elPeca    = $('#jogoPeca');
  const elParedes = $('#jogoProgresso');
  const elPontos  = $('#jogoPontos');
  const elRecorde = $('#jogoRecorde');
  const elCombo   = $('#jogoCombo');
  const cta       = $('#veuCta');
  const elEtapa   = $('#jogoEtapa');

  let estado = 'parado';           /* parado · jogando · pausado · fim */
  let alvo = new Set(), feito = new Set(), borrao = new Set();
  const calor = new Map();         /* célula → 1 recém-extrudada, esfria até 0 */
  let indicePeca = 0;
  let bico = { x: 1, y: 6 };
  let dir = { x: 0, y: 0 };
  let proxima = null;
  let filamento = 100, pontos = 0, sequencia = 0, velocidade = VEL_INICIAL;
  let fiosSoltos = 0, gastoTotal = 0;
  let acumulado = 0, ultimoQuadro = 0, quadro = null;
  let celula = 24, margemX = 0, margemY = 0;

  const idx = (x, y) => y * COLS + x;
  const dentro = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS;

  const lerRecorde = () => {
    try { return parseInt(localStorage.getItem('mmax-jogo-recorde'), 10) || 0; } catch (e) { return 0; }
  };
  const gravarRecorde = (v) => {
    try { localStorage.setItem('mmax-jogo-recorde', String(v)); } catch (e) {}
  };
  let recorde = lerRecorde();

  /* ==========================================================
     MESA
     ========================================================== */
  function dimensionar() {
    const caixa = canvas.getBoundingClientRect();
    if (!caixa.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(caixa.width * dpr);
    canvas.height = Math.round(caixa.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    celula = Math.floor(Math.min(caixa.width / COLS, caixa.height / ROWS));
    margemX = Math.round((caixa.width - celula * COLS) / 2);
    margemY = Math.round((caixa.height - celula * ROWS) / 2);
    desenhar();
  }

  function carregarPeca(i) {
    const p = PECAS[i % PECAS.length];
    alvo = new Set();
    feito = new Set();
    borrao = new Set();
    calor.clear();
    p.arte.forEach((linha, y) => {
      for (let x = 0; x < COLS; x++) if (linha[x] === '#') alvo.add(idx(x, y));
    });
    /* o bico começa na primeira parede, para nunca nascer perdido */
    const primeira = Math.min.apply(null, Array.from(alvo));
    bico = { x: primeira % COLS, y: Math.floor(primeira / COLS) };
    dir = { x: 0, y: 0 };
    proxima = null;
    marcar(bico.x, bico.y);
    if (elPeca) elPeca.textContent = p.nome;
  }

  /* ==========================================================
     REGRAS
     ========================================================== */
  function marcar(x, y) {
    const i = idx(x, y);
    if (alvo.has(i)) {
      if (!feito.has(i)) {
        feito.add(i);
        sequencia++;
        pontos += 10 * combo();
        calor.set(i, 1);
      }
      filamento -= GASTO_UTIL;
    } else {
      if (!borrao.has(i)) {
        borrao.add(i);
        avisar('FIO SOLTO', x, y, '#E8613A');
      }
      sequencia = 0;
      filamento -= GASTO_PERDIDO;
    }
  }

  const combo = () => Math.min(5, 1 + Math.floor(sequencia / 6));

  function passo() {
    if (dir.x === 0 && dir.y === 0) return;
    const nx = bico.x + dir.x, ny = bico.y + dir.y;
    if (!dentro(nx, ny)) { dir = { x: 0, y: 0 }; return; }   /* encosta no fim do curso */
    bico = { x: nx, y: ny };
    marcar(nx, ny);
    if (feito.size === alvo.size) concluirPeca();
  }

  function concluirPeca() {
    const limpeza = Math.max(0, 220 - borrao.size * 14);
    pontos += limpeza + Math.round(filamento * 2);
    fiosSoltos += borrao.size;
    piscar();
    indicePeca++;
    if (indicePeca >= PECAS.length) { vencer(); return; }
    filamento = Math.min(100, filamento + RECARGA);
    velocidade = Math.min(VEL_MAXIMA, velocidade + VEL_PASSO);
    carregarPeca(indicePeca);
  }

  function vencer() {
    estado = 'fim';
    dir = { x: 0, y: 0 };
    pontos += Math.round(filamento * 4);   /* sobrou filamento: pedido rendeu */
    if (pontos > recorde) { recorde = pontos; gravarRecorde(recorde); }
    const nota = fiosSoltos === 0 ? 'Nenhum fio solto: acabamento de vitrine.'
      : fiosSoltos < 12 ? 'Só ' + fiosSoltos + ' fios soltos — dá para lixar e entregar.'
      : fiosSoltos + ' fios soltos pela mesa. Sai, mas a lixa vai trabalhar.';
    veuTitulo.textContent = 'Pedido concluído';
    veuTexto.textContent = 'As seis peças saíram da mesa com ' + pontos + ' pontos. ' + nota;
    botao.textContent = 'Imprimir tudo de novo';
    if (cta) cta.hidden = false;
    mostrarVeu(true);
    atualizarPainel();
  }

  const avisos = [];
  function avisar(texto, x, y, cor) {
    avisos.push({ texto: texto, x: x, y: y, cor: cor || CORES.bico, vida: 1 });
    if (avisos.length > 6) avisos.shift();
  }

  let brilho = 0;
  function piscar() { brilho = 1; }

  function encerrar() {
    estado = 'fim';
    dir = { x: 0, y: 0 };
    if (pontos > recorde) { recorde = pontos; gravarRecorde(recorde); }
    fiosSoltos += borrao.size;
    veuTitulo.textContent = 'Acabou o filamento';
    veuTexto.textContent = indicePeca > 0
      ? 'Você fechou ' + indicePeca + (indicePeca === 1 ? ' peça' : ' peças') + ' de seis e somou ' + pontos + ' pontos.'
      : 'Ficou pelo caminho na primeira peça — o segredo é não sair do desenho.';
    botao.textContent = 'Novo turno';
    mostrarVeu(true);
    atualizarPainel();
  }

  /* ==========================================================
     DESENHO
     ========================================================== */
  function desenhar() {
    const caixa = canvas.getBoundingClientRect();
    const L = caixa.width, A = caixa.height;
    ctx.clearRect(0, 0, L, A);
    ctx.fillStyle = CORES.fundo;
    ctx.fillRect(0, 0, L, A);

    /* grade da mesa */
    ctx.strokeStyle = CORES.grade;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= COLS; x++) {
      const px = Math.round(margemX + x * celula) + .5;
      ctx.moveTo(px, margemY); ctx.lineTo(px, margemY + ROWS * celula);
    }
    for (let y = 0; y <= ROWS; y++) {
      const py = Math.round(margemY + y * celula) + .5;
      ctx.moveTo(margemX, py); ctx.lineTo(margemX + COLS * celula, py);
    }
    ctx.stroke();

    /* a parede mais perto do bico pulsa, para o olho achar o caminho */
    let alvoPerto = -1, menor = 1e9;
    if (estado === 'jogando') {
      alvo.forEach((i) => {
        if (feito.has(i)) return;
        const x = i % COLS, y = Math.floor(i / COLS);
        const d = Math.abs(x - bico.x) + Math.abs(y - bico.y);
        if (d < menor) { menor = d; alvoPerto = i; }
      });
    }
    const pulso = (Math.sin(Date.now() / 260) + 1) / 2;

    /* paredes ainda por imprimir */
    ctx.strokeStyle = CORES.parede;
    ctx.lineWidth = 1;
    alvo.forEach((i) => {
      if (feito.has(i)) return;
      const x = i % COLS, y = Math.floor(i / COLS);
      const px = margemX + x * celula, py = margemY + y * celula;
      if (i === alvoPerto) {
        ctx.save();
        ctx.strokeStyle = 'rgba(191,224,255,' + (0.45 + pulso * 0.55).toFixed(2) + ')';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2.5, py + 2.5, celula - 5, celula - 5);
        ctx.restore();
      } else {
        ctx.strokeRect(px + 3.5, py + 3.5, celula - 7, celula - 7);
      }
    });

    /* fio solto */
    ctx.fillStyle = CORES.borrao;
    borrao.forEach((i) => {
      const x = i % COLS, y = Math.floor(i / COLS);
      ctx.fillRect(margemX + x * celula + celula * .34, margemY + y * celula + celula * .44,
                   celula * .32, celula * .12);
    });

    /* material depositado — nasce quente e esfria */
    feito.forEach((i) => {
      const x = i % COLS, y = Math.floor(i / COLS);
      const t = calor.get(i) || 0;
      const c = CORES.quente.map((q, k) => Math.round(CORES.fria[k] + (q - CORES.fria[k]) * t));
      ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
      ctx.fillRect(margemX + x * celula + 2, margemY + y * celula + 2, celula - 4, celula - 4);
    });

    if (estado === 'jogando' || estado === 'pausado') {
      const bx = margemX + bico.x * celula + celula / 2;
      const by = margemY + bico.y * celula + celula / 2;

      /* os eixos do pórtico, como na abertura da página */
      ctx.strokeStyle = CORES.eixo;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(Math.round(bx) + .5, margemY);
      ctx.lineTo(Math.round(bx) + .5, margemY + ROWS * celula);
      ctx.moveTo(margemX, Math.round(by) + .5);
      ctx.lineTo(margemX + COLS * celula, Math.round(by) + .5);
      ctx.stroke();
      ctx.setLineDash([]);

      /* o bico */
      ctx.shadowColor = 'rgba(79,163,247,.9)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = CORES.bico;
      const lado = celula * .58;
      ctx.fillRect(bx - lado / 2, by - lado / 2, lado, lado);
      ctx.shadowBlur = 0;
    }

    /* avisos curtos, onde a coisa aconteceu */
    ctx.textAlign = 'center';
    ctx.font = '600 ' + Math.max(9, Math.round(celula * .42)) + "px 'Space Mono', monospace";
    avisos.forEach((a) => {
      ctx.globalAlpha = Math.max(0, a.vida);
      ctx.fillStyle = a.cor;
      ctx.fillText(a.texto, margemX + a.x * celula + celula / 2,
                   margemY + a.y * celula - 4 - (1 - a.vida) * 16);
      ctx.globalAlpha = 1;
    });

    /* enquanto ninguém apontou nada, a mesa avisa o que fazer */
    if (estado === 'jogando' && dir.x === 0 && dir.y === 0) {
      const bx = margemX + bico.x * celula + celula / 2;
      const by = margemY + bico.y * celula;
      ctx.textAlign = 'center';
      ctx.font = "600 " + Math.max(11, Math.round(celula * .5)) + "px 'Space Mono', monospace";
      ctx.fillStyle = 'rgba(191,224,255,' + (0.5 + pulso * 0.5).toFixed(2) + ')';
      ctx.fillText('← ↑ ↓ →', bx, by - celula * .5);
    }

    /* na peça de treino, a regra fica escrita na própria mesa */
    if (estado === 'jogando' && PECAS[indicePeca % PECAS.length].treino) {
      ctx.textAlign = 'center';
      ctx.font = "400 12px 'Space Mono', monospace";
      ctx.fillStyle = 'rgba(169,183,196,.75)';
      ctx.fillText('O BICO ANDA SOZINHO E IMPRIME POR ONDE PASSA',
                   margemX + COLS * celula / 2, margemY + ROWS * celula - 10);
    }

    /* clarão de peça concluída */
    if (brilho > 0) {
      ctx.fillStyle = 'rgba(191,224,255,' + (brilho * .35).toFixed(3) + ')';
      ctx.fillRect(margemX, margemY, COLS * celula, ROWS * celula);
    }
  }

  function atualizarPainel() {
    if (elBarra) elBarra.style.width = Math.max(0, Math.min(100, filamento)).toFixed(1) + '%';
    if (elBarra) elBarra.classList.toggle('is-baixo', filamento < 25);
    if (elParedes) elParedes.textContent = feito.size + '/' + alvo.size;
    if (elPontos) elPontos.textContent = pontos;
    if (elRecorde) elRecorde.textContent = recorde;
    if (elCombo) elCombo.textContent = combo() + '×';
    if (elEtapa) elEtapa.textContent = Math.min(indicePeca + 1, PECAS.length) + '/' + PECAS.length;
  }

  /* ==========================================================
     RELÓGIO
     ========================================================== */
  function girar(agora) {
    quadro = requestAnimationFrame(girar);
    if (!ultimoQuadro) ultimoQuadro = agora;
    const dt = Math.min((agora - ultimoQuadro) / 1000, .2);
    ultimoQuadro = agora;

    if (estado === 'jogando') {
      filamento -= AQUECIMENTO * dt;
      acumulado += dt;
      const intervalo = 1 / velocidade;
      while (acumulado >= intervalo) {
        acumulado -= intervalo;
        if (proxima) { dir = proxima; proxima = null; }
        passo();
      }
      calor.forEach((v, k) => {
        const novo = v - dt * 1.1;
        if (novo <= 0) calor.delete(k); else calor.set(k, novo);
      });
      for (let i = avisos.length - 1; i >= 0; i--) {
        avisos[i].vida -= dt * 1.1;
        if (avisos[i].vida <= 0) avisos.splice(i, 1);
      }
      if (brilho > 0) brilho = Math.max(0, brilho - dt * 2);
      if (filamento <= 0) { filamento = 0; encerrar(); }
      atualizarPainel();
    }
    desenhar();
  }

  function ligarRelogio() {
    if (!quadro) { ultimoQuadro = 0; quadro = requestAnimationFrame(girar); }
  }
  function desligarRelogio() {
    if (quadro) { cancelAnimationFrame(quadro); quadro = null; }
  }

  /* ==========================================================
     COMANDOS
     ========================================================== */
  function comecar() {
    indicePeca = 0;
    filamento = 100; pontos = 0; sequencia = 0; fiosSoltos = 0;
    if (cta) cta.hidden = true;
    velocidade = VEL_INICIAL; acumulado = 0; brilho = 0;
    carregarPeca(0);
    estado = 'jogando';
    mostrarVeu(false);
    atualizarPainel();
    ligarRelogio();
    canvas.focus({ preventScroll: true });
  }

  function pausar() {
    if (estado !== 'jogando') return;
    estado = 'pausado';
    veuTitulo.textContent = 'Impressão em pausa';
    veuTexto.textContent = 'O bico esfria enquanto você pensa. Nada se perde.';
    botao.textContent = 'Retomar';
    mostrarVeu(true);
  }

  function retomar() {
    estado = 'jogando';
    mostrarVeu(false);
    ultimoQuadro = 0;
    canvas.focus({ preventScroll: true });
  }

  function mostrarVeu(visivel) {
    veu.classList.toggle('is-on', visivel);
    veu.setAttribute('aria-hidden', visivel ? 'false' : 'true');
    if (visivel) {
      const marca = recorde ? 'Recorde da casa: ' + recorde + ' pontos' : '';
      const alvoRecorde = document.querySelector('#veuRecorde');
      if (alvoRecorde) alvoRecorde.textContent = marca;
    }
  }

  function virar(x, y) {
    if (estado !== 'jogando') return;
    if (dir.x === -x && dir.y === -y && (dir.x !== 0 || dir.y !== 0)) { proxima = { x: x, y: y }; return; }
    proxima = { x: x, y: y };
  }

  const TECLAS = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0]
  };

  window.addEventListener('keydown', (e) => {
    if (estado === 'jogando' && (e.key === 'Escape' || e.key === 'p' || e.key === 'P')) {
      pausar(); botao.focus(); return;
    }
    const t = TECLAS[e.key];
    if (!t || estado !== 'jogando') return;
    e.preventDefault();   /* só enquanto o turno roda; fora dele a página rola normal */
    virar(t[0], t[1]);
  });

  botao.addEventListener('click', () => {
    if (estado === 'pausado') retomar();
    else comecar();
  });

  /* toque: arrastar sobre a mesa */
  let toque = null;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    toque = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  canvas.addEventListener('touchend', (e) => {
    if (!toque) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - toque.x, dy = t.clientY - toque.y;
    toque = null;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) virar(dx > 0 ? 1 : -1, 0);
    else virar(0, dy > 0 ? 1 : -1);
  }, { passive: true });

  document.querySelectorAll('[data-eixo]').forEach((b) => {
    const par = b.getAttribute('data-eixo').split(',').map(Number);
    const acionar = (e) => { e.preventDefault(); virar(par[0], par[1]); };
    b.addEventListener('click', acionar);
    b.addEventListener('touchstart', acionar, { passive: false });
  });

  canvas.addEventListener('blur', pausar);

  /* fora da tela, o turno espera */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (!en.isIntersecting && estado === 'jogando') pausar();
        if (en.isIntersecting) ligarRelogio(); else desligarRelogio();
      });
    }, { threshold: .25 }).observe(canvas);
  } else {
    ligarRelogio();
  }

  let remedida;
  window.addEventListener('resize', () => {
    clearTimeout(remedida);
    remedida = setTimeout(dimensionar, 150);
  });

  /* estado inicial */
  carregarPeca(0);
  feito.clear();
  dimensionar();
  atualizarPainel();
  mostrarVeu(true);
  if (elPeca) elPeca.textContent = '—';
})();
