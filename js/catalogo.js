/* ============================================================
   MR MAX ELEGANCE — catálogo de modelos

   São milhares de peças numa página só. Três decisões seguram isso
   em pé sem servidor nenhum:

   1. Os dados chegam em um arquivo só, em formato de lista enxuta
      (nada de objeto com nome de campo repetido 4 mil vezes).
   2. A tela desenha por partes: um lote entra quando o fim do
      mosaico se aproxima, e não antes.
   3. A busca roda sobre um índice preparado uma vez, na chegada
      dos dados — não a cada tecla.
   ============================================================ */

(function () {
  'use strict';

  var ZAP = '5543996070804';
  var LOTE = 60;               // peças por rodada de desenho

  var ARQUIVO = 'assets/catalogo.json';   // só usado se o <head> não adiantou

  /* ------------------------------------------------------------
     O catálogo veio em inglês. Este dicionário deixa o cliente
     procurar do jeito que ele fala: quem digita "dragão" acha
     "Dragon", quem digita "luminária" acha "Lamp".
     ------------------------------------------------------------ */
  var TRADUCAO = {
    'dragao': 'dragon', 'dragoes': 'dragon',
    'gato': 'cat', 'gata': 'cat', 'gatinho': 'cat kitten',
    'cachorro': 'dog', 'cao': 'dog', 'cadela': 'dog', 'filhote': 'puppy',
    'coelho': 'bunny rabbit', 'urso': 'bear', 'leao': 'lion', 'lobo': 'wolf',
    'raposa': 'fox', 'passaro': 'bird', 'coruja': 'owl', 'peixe': 'fish',
    'tubarao': 'shark', 'polvo': 'octopus', 'cobra': 'snake', 'sapo': 'frog',
    'tartaruga': 'turtle', 'borboleta': 'butterfly', 'elefante': 'elephant',
    'dinossauro': 'dinosaur rex', 'dino': 'dinosaur', 'unicornio': 'unicorn',
    'cavalo': 'horse', 'galinha': 'chicken', 'porco': 'pig', 'aranha': 'spider',
    'abelha': 'bee', 'baleia': 'whale', 'pinguim': 'penguin', 'panda': 'panda',

    'luminaria': 'lamp light', 'abajur': 'lamp', 'luz': 'light lamp',
    'vaso': 'vase planter pot', 'vasinho': 'vase pot',
    'planta': 'plant planter', 'flor': 'flower', 'flores': 'flower',
    'caixa': 'box container case', 'pote': 'container jar pot',
    'porta': 'holder stand door', 'suporte': 'holder stand mount support',
    'organizador': 'organizer holder tray', 'bandeja': 'tray',
    'cabide': 'hanger', 'gancho': 'hook', 'prateleira': 'shelf',
    'copo': 'cup mug', 'caneca': 'mug cup', 'garrafa': 'bottle',
    'tigela': 'bowl', 'prato': 'plate dish', 'talher': 'cutlery',
    'quadro': 'frame art wall', 'moldura': 'frame', 'espelho': 'mirror',
    'relogio': 'clock watch', 'estatua': 'statue figure sculpture',
    'escultura': 'sculpture statue', 'enfeite': 'ornament decor',
    'decoracao': 'decor ornament', 'parede': 'wall',
    'movel': 'furniture', 'mesa': 'table desk', 'cadeira': 'chair',
    'cozinha': 'kitchen', 'banheiro': 'bathroom', 'quarto': 'bedroom',
    'jardim': 'garden', 'escritorio': 'office desk',
    'papel': 'paper toilet', 'higienico': 'toilet paper',
    'sabonete': 'soap', 'escova': 'brush toothbrush',
    'lixo': 'trash bin', 'cesto': 'basket bin',
    'chaveiro': 'keychain key', 'chave': 'key keychain',
    'carteira': 'wallet', 'bolsa': 'bag purse',
    'oculos': 'glasses', 'anel': 'ring', 'brinco': 'earring',
    'colar': 'necklace', 'pulseira': 'bracelet', 'joia': 'jewelry',
    'mascara': 'mask', 'capacete': 'helmet', 'coroa': 'crown',
    'chapeu': 'hat', 'fantasia': 'costume cosplay',
    'espada': 'sword blade', 'escudo': 'shield', 'arma': 'weapon gun',
    'machado': 'axe', 'arco': 'bow', 'punhal': 'dagger',
    'armadura': 'armor', 'cavaleiro': 'knight', 'guerreiro': 'warrior',
    'mago': 'wizard mage', 'bruxa': 'witch', 'esqueleto': 'skeleton',
    'caveira': 'skull', 'cranio': 'skull', 'zumbi': 'zombie',
    'fantasma': 'ghost', 'monstro': 'monster creature', 'demonio': 'demon',
    'heroi': 'hero', 'vilao': 'villain', 'robo': 'robot',
    'nave': 'ship spaceship', 'carro': 'car vehicle', 'moto': 'motorcycle bike',
    'aviao': 'plane airplane', 'trem': 'train', 'barco': 'boat ship',
    'foguete': 'rocket', 'castelo': 'castle', 'torre': 'tower',
    'casa': 'house home', 'cidade': 'city town', 'arvore': 'tree',
    'brinquedo': 'toy', 'boneco': 'figure toy', 'boneca': 'doll',
    'articulado': 'articulated flexi', 'flexivel': 'flexi flexible',
    'quebracabeca': 'puzzle', 'puzzle': 'puzzle', 'jogo': 'game',
    'empilhavel': 'stack blocks', 'planador': 'glider plane',
    'bumerangue': 'boomerang', 'apito': 'whistle', 'pelucia': 'plush crochet',
    'ursinho': 'teddy bear', 'carrinho': 'car truck racer',
    'dado': 'dice', 'dados': 'dice', 'tabuleiro': 'board game',
    'carta': 'card', 'cartas': 'card deck', 'ficha': 'token',
    'miniatura': 'miniature mini', 'boardgame': 'board game',
    'controle': 'controller', 'fone': 'headphone headset',
    'celular': 'phone smartphone', 'telefone': 'phone',
    'cabo': 'cable cord', 'carregador': 'charger dock',
    'teclado': 'keyboard', 'mouse': 'mouse', 'monitor': 'monitor',
    'video': 'game video', 'console': 'console',
    'natal': 'christmas xmas', 'natalino': 'christmas',
    'pascoa': 'easter egg', 'ovo': 'egg', 'halloween': 'halloween',
    'aniversario': 'birthday', 'casamento': 'wedding',
    'namorados': 'valentine love heart', 'amor': 'love heart',
    'coracao': 'heart', 'presente': 'gift', 'festa': 'party',
    'bebe': 'baby', 'crianca': 'kid child baby', 'infantil': 'kid child',
    'mae': 'mother mom', 'pai': 'father dad',
    'personalizado': 'custom customizable personalized',
    'personalizavel': 'customizable custom',
    'nome': 'name custom', 'letra': 'letter', 'numero': 'number',
    /* O acervo sensorial não se chama "sensorial" em lugar nenhum: ele se
       chama Fidget, Clicker, Slider, Flexi. Estas entradas são a ponte
       entre a palavra do cliente e o nome da peça. */
    'antiestresse': 'fidget', 'fidget': 'fidget',
    'sensorial': 'fidget sensorial clicker flexi',
    'sensoriais': 'fidget sensorial clicker flexi',
    'estimulo': 'fidget sensorial', 'tatil': 'fidget sensorial tactile',
    'autismo': 'fidget sensorial', 'autista': 'fidget sensorial',
    'tdah': 'fidget sensorial', 'ansiedade': 'fidget sensorial',
    'concentracao': 'fidget sensorial', 'foco': 'fidget sensorial',
    'terapia': 'fidget sensorial', 'terapeutico': 'fidget sensorial',
    'apertar': 'press squish clicker', 'clicar': 'clicker click',
    'girar': 'spinner gyro spinning', 'piao': 'spinning top',
    'labirinto': 'maze', 'deslizar': 'slider',
    'ferramenta': 'tool', 'peca': 'part piece',
    'reposicao': 'replacement part', 'encaixe': 'fit mount',
    'medida': 'custom size', 'kit': 'kit set',
    'pet': 'pet dog cat', 'comedouro': 'bowl feeder pet',
    'planeta': 'planet space', 'lua': 'moon', 'sol': 'sun',
    'estrela': 'star', 'espaco': 'space', 'astronauta': 'astronaut'
  };

  /* ------------------------------------------------------------
     Estado
     ------------------------------------------------------------ */
  var dados = null;            // { categorias, itens }
  var indice = [];             // itens preparados para busca
  var visiveis = [];           // resultado do filtro atual
  var desenhados = 0;          // quantos do resultado já estão na tela
  var categoriaAtiva = '';     // '' = todas
  var termo = '';
  var fichaAberta = -1;        // posição em `visiveis`

  var temPrevia = {};          // { id: 'video' | 'foto' } — o que há em assets/hover
  var previaAtiva = null;      // só um vídeo toca por vez, no card sob o mouse
  var esperaPrevia = 0;

  var elMosaico, elContagem, elFiltros, elBusca, elCaixaBusca, elFicha, sentinela, observador;
  var elCaixaRegua;
  var estreito = window.matchMedia('(max-width: 860px)');

  /* ------------------------------------------------------------
     Ajudantes
     ------------------------------------------------------------ */

  // "Dragão Articulado" -> "dragao articulado": acento e caixa saem do caminho
  function simples(txt) {
    return txt.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function numero(n) {
    return n.toLocaleString('pt-BR');
  }

  // O catálogo funciona sem medição nenhuma: se `js/metricas.js` não estiver
  // na página, ou se a chave estiver vazia, isto vira uma função que não faz
  // nada — e nenhuma chamada abaixo precisa saber disso.
  function mede(qual, a, b) {
    var m = window.medidas;
    if (m && typeof m[qual] === 'function') m[qual](a, b);
  }

  function escapa(txt) {
    return String(txt).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Ligações não dizem nada sobre a peça, e exigi-las zera a busca:
  // "miniatura de guerreiro" não acharia nada, porque nenhum nome tem "de".
  var LIGACOES = { de: 1, da: 1, do: 1, das: 1, dos: 1, para: 1, com: 1,
                   em: 1, no: 1, na: 1, um: 1, uma: 1, e: 1, a: 1, o: 1 };

  // A busca do cliente vira uma lista de palavras já traduzidas para o
  // inglês do catálogo. "vaso de flor" procura por vase, planter, pot, flower.
  function palavrasDaBusca(texto) {
    var cruas = simples(texto).split(' ').filter(function (p) {
      return p && !LIGACOES[p];
    });
    return cruas.map(function (p) {
      var extra = TRADUCAO[p];
      // singular ingênuo: "dragoes" já está no dicionário, "gatos" vira "gato"
      if (!extra && p.length > 3 && p.slice(-1) === 's') extra = TRADUCAO[p.slice(0, -1)];
      return extra ? (p + ' ' + extra).split(' ') : [p];
    });
  }

  function linkZap(item) {
    var texto = 'Olá! Vi o catálogo no site e quero fazer um pedido desta peça:\n\n'
      + '▸ ' + item.nome + '\n'
      + '▸ Código: MM-' + item.id + '\n\n'
      + 'Pode me passar prazo e valor?';
    return 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent(texto);
  }

  function nomeCategoria(i) {
    return dados.categorias[i] ? dados.categorias[i][1] : '';
  }

  // A etiqueta do card mostra uma categoria só, e a primeira da lista é a
  // menos informativa: um clicker fica marcado "Brinquedos" porque essa
  // faixa é mais antiga no catálogo. Vale a que o cliente está olhando —
  // e, sem recorte, a mais específica das três faixas novas.
  var ESPECIFICAS = ['sensorial', 'articulados', 'brinquedos'];

  function etiqueta(it) {
    if (!it.cats.length) return 'Modelo 3D';

    for (var c = 0; c < it.cats.length; c++) {
      if (dados.categorias[it.cats[c]][0] === categoriaAtiva) {
        return nomeCategoria(it.cats[c]);
      }
    }
    for (var e = 0; e < ESPECIFICAS.length; e++) {
      for (var k = 0; k < it.cats.length; k++) {
        if (dados.categorias[it.cats[k]][0] === ESPECIFICAS[e]) {
          return nomeCategoria(it.cats[k]);
        }
      }
    }
    return nomeCategoria(it.cats[0]);
  }

  /* ------------------------------------------------------------
     Chegada dos dados
     ------------------------------------------------------------ */

  function prepara() {
    // Duas listas dizem o que cada peça tem: `hover` é vídeo, `hover_foto` é
    // a foto de galeria das 140 peças que a origem nunca filmou. Ambas viajam
    // no mesmo arquivo do acervo — saber quais cards animam não custa nem uma
    // requisição a mais.
    temPrevia = {};
    (dados.hover || []).forEach(function (id) { temPrevia[id] = 'video'; });
    (dados.hover_foto || []).forEach(function (id) {
      if (!temPrevia[id]) temPrevia[id] = 'foto';    // vídeo tem preferência
    });

    indice = dados.itens.map(function (linha, pos) {
      var cats = linha[2] || [];
      // Os espaços nas pontas não são enfeite: a comparação procura
      // " palavra", e é isso que impede "coração" de casar com o miolo de
      // "de-coração" — e de devolver o catálogo inteiro.
      var alvo = ' ' + simples(linha[1]) + ' ' + cats.map(function (c) {
        return simples(dados.categorias[c] ? dados.categorias[c][1] : '');
      }).join(' ') + ' ';
      return {
        id: linha[0],
        nome: linha[1],
        cats: cats,
        material: linha[3],
        formato: linha[4] || 0,
        matiz: linha[5] || 209,
        desenho: linha[6] || 0,
        larg: linha[7] || 460,
        alt: linha[8] || 460,
        busca: alvo,
        pos: pos
      };
    });
  }

  function montaFiltros() {
    // Só entra na régua a categoria que tem peça de verdade.
    var conta = {};
    indice.forEach(function (it) {
      it.cats.forEach(function (c) { conta[c] = (conta[c] || 0) + 1; });
    });

    var ordenadas = Object.keys(conta).map(Number)
      .sort(function (a, b) { return conta[b] - conta[a]; });

    // Duas fileiras. A largura é proporcional dentro da própria fileira, e
    // não no acervo inteiro: Casa tem quarenta vezes o tamanho de Pets, e
    // numa escala só a menor não teria onde escrever o nome. Separadas por
    // porte, cada fileira tem uma escala que cabe nela.
    var corte = Math.ceil(ordenadas.length / 2);
    var fileiras = [ordenadas.slice(0, corte), ordenadas.slice(corte)];

    var html = '<div class="regua-fila fila-1">'
             + '<button type="button" class="faixa tudo" data-cat="" aria-pressed="true">'
             + '<span class="faixa-nome">Todas</span>'
             + '<span class="faixa-n mono">' + numero(indice.length) + '</span>'
             + '</button>'
             + fileiras[0].map(function (c) {
                 return faixa(dados.categorias[c][0], dados.categorias[c][1], conta[c]);
               }).join('')
             + '</div><div class="regua-fila fila-2">'
             + fileiras[1].map(function (c) {
                 return faixa(dados.categorias[c][0], dados.categorias[c][1], conta[c]);
               }).join('')
             + '</div>';

    elFiltros.innerHTML = html;
  }

  function marcaFaixaAtiva() {
    var faixas = elFiltros.querySelectorAll('.faixa');
    var nomeAtual = 'todas';
    Array.prototype.forEach.call(faixas, function (o) {
      var acesa = o.dataset.cat === categoriaAtiva;
      o.setAttribute('aria-pressed', acesa ? 'true' : 'false');
      if (acesa) nomeAtual = o.querySelector('.faixa-nome').textContent.toLowerCase();
    });
    // a régua inteira sabe se há recorte, para esmaecer o que não foi escolhido
    elFiltros.classList.toggle('tem-recorte', !!categoriaAtiva);

    var atual = document.getElementById('reguaAtual');
    if (atual) atual.textContent = nomeAtual;

    // no telefone a régua se fecha depois da escolha: quinze faixas empilhadas
    // empurram a primeira peça para fora da tela, e a tela é o que importa
    if (estreito.matches && elCaixaRegua && categoriaAtiva) elCaixaRegua.open = false;
  }

  function faixa(slug, nome, quantos) {
    // O peso vira o flex-grow. A raiz quadrada comprime a escala: sem ela, a
    // maior categoria comeria a fileira e todas as outras encostariam no
    // mínimo, que é o mesmo que não ter proporção nenhuma.
    var peso = Math.max(Math.sqrt(quantos), 1).toFixed(2);
    return '<button type="button" class="faixa" data-cat="' + escapa(slug) + '" '
         + 'data-n="' + quantos + '" style="--peso:' + peso + '" aria-pressed="false">'
         + '<span class="faixa-nome">' + escapa(nome) + '</span>'
         + '<span class="faixa-n mono">' + numero(quantos) + '</span>'
         + '</button>';
  }

  /* ------------------------------------------------------------
     Filtro
     ------------------------------------------------------------ */

  function filtra() {
    var iCat = -1;
    if (categoriaAtiva) {
      for (var k = 0; k < dados.categorias.length; k++) {
        if (dados.categorias[k][0] === categoriaAtiva) { iCat = k; break; }
      }
    }

    var grupos = termo ? palavrasDaBusca(termo) : null;
    if (grupos && !grupos.length) grupos = null;

    visiveis = indice.filter(function (it) {
      if (iCat >= 0 && it.cats.indexOf(iCat) === -1) return false;
      if (!grupos) return true;
      // toda palavra digitada precisa bater — por ela mesma ou por um sinônimo
      for (var g = 0; g < grupos.length; g++) {
        var achou = false;
        for (var s = 0; s < grupos[g].length; s++) {
          if (it.busca.indexOf(' ' + grupos[g][s]) !== -1) { achou = true; break; }
        }
        if (!achou) return false;
      }
      return true;
    });

    desenhados = 0;
    elMosaico.innerHTML = '';
    atualizaContagem();
    desenhaLote();
    gravaEndereco();

    // aqui já se sabe quantas peças o recorte devolveu — é o número que
    // transforma "buscou por X" em "buscou por X e não achou nada"
    if (termo) mede('buscou', termo, visiveis.length);
  }

  function atualizaContagem() {
    var n = visiveis.length;
    var rotulo = n === 1 ? 'peça pronta para pedir' : 'peças prontas para pedir';
    var recorte = '';
    if (categoriaAtiva) {
      for (var k = 0; k < dados.categorias.length; k++) {
        if (dados.categorias[k][0] === categoriaAtiva) { recorte = ' · ' + dados.categorias[k][1]; break; }
      }
    }
    if (termo) recorte += ' · “' + termo + '”';
    elContagem.innerHTML = '<b>' + numero(n) + '</b> ' + escapa(rotulo + recorte);
    elContagem.classList.toggle('vazia', n === 0);
  }

  /* ------------------------------------------------------------
     Desenho por partes
     ------------------------------------------------------------ */

  function cartao(it, pos) {
    var cat = etiqueta(it);
    // a matiz e o desenho do fundo viajam no próprio card; o CSS faz o resto
    var previa = temPrevia[it.id] || '';
    var marca = previa ? ' tem-previa tem-' + previa : '';
    return '<button type="button" class="peca f' + it.formato + ' p' + it.desenho + marca + '" '
         + 'style="--h:' + it.matiz + '" data-pos="' + pos + '" '
         + 'aria-label="' + escapa(it.nome) + ' — abrir para pedir">'
         + '<img src="assets/catalogo/' + it.id + '.webp" alt="' + escapa(it.nome) + '" '
         + 'width="' + it.larg + '" height="' + it.alt + '" loading="lazy" decoding="async">'
         + '<span class="peca-selo">' + svgZap() + 'Pedir</span>'
         + (previa === 'video' ? '<span class="peca-play">' + svgPlay() + '</span>' : '')
         + '<span class="peca-tarja">'
         + '<span class="peca-nome">' + escapa(it.nome) + '</span>'
         + '<span class="peca-cat">' + escapa(cat) + '</span>'
         + '</span></button>';
  }

  function desenhaLote() {
    if (desenhados >= visiveis.length) {
      if (!visiveis.length) mostraVazio();
      soltaSentinela();
      return;
    }

    var fim = Math.min(desenhados + LOTE, visiveis.length);
    var html = '';
    for (var i = desenhados; i < fim; i++) html += cartao(visiveis[i], i);

    if (sentinela && sentinela.parentNode === elMosaico) elMosaico.removeChild(sentinela);
    elMosaico.insertAdjacentHTML('beforeend', html);
    desenhados = fim;

    // a imagem só aparece depois de decodificada: nada de meio-quadro cinza
    var novas = elMosaico.querySelectorAll('img:not([data-visto])');
    Array.prototype.forEach.call(novas, function (img) {
      img.setAttribute('data-visto', '1');
      if (img.complete) img.classList.add('carregada');
      else img.addEventListener('load', function () { img.classList.add('carregada'); }, { once: true });
      img.addEventListener('error', function () { img.classList.add('carregada'); }, { once: true });
    });

    if (desenhados < visiveis.length) prendeSentinela();
    else soltaSentinela();
  }

  function prendeSentinela() {
    elMosaico.appendChild(sentinela);
    observador.observe(sentinela);
  }

  function soltaSentinela() {
    observador.unobserve(sentinela);
    if (sentinela.parentNode === elMosaico) elMosaico.removeChild(sentinela);
  }

  function mostraVazio() {
    var procurado = termo ? '“' + escapa(termo) + '”' : 'esse recorte';
    elMosaico.innerHTML =
      '<div class="vazio">'
      + '<h2 class="vazio-t">Nada com esse nome</h2>'
      + '<p>Não achamos nenhuma peça para ' + procurado + '. '
      + 'Tente outra palavra, ou mande a ideia direto no WhatsApp — '
      + 'muita coisa a gente modela sob medida, mesmo fora do catálogo.</p>'
      + '<a class="botao-zap" href="https://wa.me/' + ZAP
      + '?text=' + encodeURIComponent('Olá! Procurei no catálogo do site e não achei o que preciso. Queria uma peça sob medida: ')
      + '" target="_blank" rel="noopener">' + svgZap() + 'Descrever a peça no WhatsApp</a>'
      + '</div>';
  }

  /* ------------------------------------------------------------
     A prévia animada

     Cada peça tem 3 segundos de vídeo mostrando a mão girando ela —
     ~30 KB de MP4. O barato só continua barato se três regras valerem:

     1. `preload="none"`: nada de vídeo enquanto o mouse não chega. Sem
        isso, abrir o catálogo baixaria sessenta vídeos de uma vez.
     2. Um vídeo por vez. O anterior é pausado, esvaziado e descartado —
        vídeo pausado que continua no DOM segue com buffer na memória.
     3. Um respiro de 140 ms antes de carregar. Atravessar o mosaico com o
        mouse passa por vinte cards, e nenhum deles precisa de vídeo.
     ------------------------------------------------------------ */

  // Quem pediu menos movimento, ou está pagando por megabyte, fica só com
  // a foto: a prévia é enfeite, não é o conteúdo.
  function podeAnimar() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    var rede = navigator.connection;
    if (rede && (rede.saveData || /^([23]g|slow-2g)$/.test(rede.effectiveType || ''))) {
      return false;
    }
    return true;
  }

  function soltaPrevia() {
    clearTimeout(esperaPrevia);
    if (!previaAtiva) return;
    var v = previaAtiva.querySelector('video');
    if (v) {
      v.pause();
      v.removeAttribute('src');   // sem isso o buffer fica de pé
      v.load();
      v.remove();
    }
    var f = previaAtiva.querySelector('img.previa');
    if (f) f.remove();
    previaAtiva.classList.remove('animando');
    previaAtiva = null;
  }

  function abrePrevia(card) {
    if (previaAtiva === card) return;
    soltaPrevia();
    if (!card.classList.contains('tem-previa') || !podeAnimar()) return;

    var it = visiveis[Number(card.dataset.pos)];
    if (!it) return;

    // Cento e quarenta peças nunca foram filmadas pela origem. Para elas a
    // prévia é a primeira foto da galeria — a peça em cena, de outro ângulo,
    // que é o mesmo papel que o vídeo cumpre nas outras. Sete quilobytes.
    if (temPrevia[it.id] === 'foto') {
      esperaPrevia = setTimeout(function () {
        if (!card.matches(':hover')) return;
        var f = document.createElement('img');
        f.className = 'previa';
        f.alt = '';
        f.setAttribute('aria-hidden', 'true');
        f.addEventListener('load', function () {
          card.classList.add('animando');
        }, { once: true });
        f.src = 'assets/hover/' + it.id + '.webp';
        card.appendChild(f);
        previaAtiva = card;
        mede('viuPrevia', it);
      }, 140);
      return;
    }

    esperaPrevia = setTimeout(function () {
      // o mouse pode ter saído durante a espera
      if (!card.matches(':hover')) return;

      var v = document.createElement('video');
      v.muted = true;              // sem isso o navegador barra o autoplay
      v.defaultMuted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = 'none';
      v.setAttribute('aria-hidden', 'true');
      v.src = 'assets/hover/' + it.id + '.mp4';
      v.addEventListener('canplay', function () {
        card.classList.add('animando');
        mede('viuPrevia', it);      // vídeo que tocou, não mouse que passou
      }, { once: true });

      card.appendChild(v);
      previaAtiva = card;
      var p = v.play();
      if (p && p.catch) p.catch(function () { soltaPrevia(); });
    }, 140);
  }

  /* ------------------------------------------------------------
     Ficha da peça
     ------------------------------------------------------------ */

  function abreFicha(pos) {
    if (pos < 0 || pos >= visiveis.length) return;
    fichaAberta = pos;
    var it = visiveis[pos];

    var quadro = elFicha.querySelector('.ficha-img');
    quadro.className = 'ficha-img p' + it.desenho;
    quadro.style.setProperty('--h', it.matiz);
    var foto = quadro.querySelector('img');
    // as medidas vão junto do src: sem elas o navegador reserva zero e o
    // conteúdo ao lado pula quando a imagem chega
    foto.width = it.larg;
    foto.height = it.alt;
    foto.src = 'assets/catalogo/' + it.id + '.webp';
    foto.alt = it.nome;
    elFicha.querySelector('.ficha-cod').textContent = 'Código MM-' + it.id
      + ' · ' + numero(pos + 1) + ' de ' + numero(visiveis.length);
    elFicha.querySelector('.ficha-nome').textContent = it.nome;

    var cats = it.cats.map(function (c) { return '<span>' + escapa(nomeCategoria(c)) + '</span>'; });
    cats.push('<span>' + (it.material === 1 ? 'Resina' : it.material === 2 ? 'Filamento ou resina' : 'Filamento') + '</span>');
    elFicha.querySelector('.ficha-cats').innerHTML = cats.join('');

    elFicha.querySelector('.ficha-acao a').href = linkZap(it);

    // adianta o vizinho: quem navega de seta não espera imagem
    [pos - 1, pos + 1].forEach(function (p) {
      if (p >= 0 && p < visiveis.length) new Image().src = 'assets/catalogo/' + visiveis[p].id + '.webp';
    });

    // Na ficha o vídeo entra sozinho: quem abriu a peça já demonstrou
    // interesse, e 30 KB é menos que a foto que está ao lado. A foto fica
    // como poster, então não há quadro vazio enquanto o vídeo chega.
    var antigo = quadro.querySelector('video');
    if (antigo) { antigo.pause(); antigo.removeAttribute('src'); antigo.load(); antigo.remove(); }
    var fotoAntiga = quadro.querySelector('img.previa');
    if (fotoAntiga) fotoAntiga.remove();

    quadro.classList.toggle('tem-video', temPrevia[it.id] === 'video');

    // Sem vídeo, a ficha mostra a foto da galeria embaixo do nome: é a
    // peça em cena real, coisa que a imagem recortada do card não conta.
    if (temPrevia[it.id] === 'foto') {
      var fg = document.createElement('img');
      fg.className = 'previa';
      fg.alt = it.nome + ' — foto da peça';
      fg.src = 'assets/hover/' + it.id + '.webp';
      quadro.appendChild(fg);
    }

    if (temPrevia[it.id] === 'video' && podeAnimar()) {
      var v = document.createElement('video');
      v.muted = true;
      v.defaultMuted = true;
      v.loop = true;
      v.playsInline = true;
      v.autoplay = true;
      v.preload = 'metadata';
      v.poster = 'assets/catalogo/' + it.id + '.webp';
      v.setAttribute('aria-label', 'Vídeo da peça ' + it.nome + ' em movimento');
      v.src = 'assets/hover/' + it.id + '.mp4';
      quadro.appendChild(v);
      var pp = v.play();
      if (pp && pp.catch) pp.catch(function () {});
    }

    mede('abriuPeca', it);

    elFicha.setAttribute('data-aberta', 'sim');
    document.body.style.overflow = 'hidden';
    elFicha.querySelector('.ficha-fechar').focus();
  }

  function fechaFicha() {
    var v = elFicha.querySelector('.ficha-img video');
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); }
    var f = elFicha.querySelector('.ficha-img img.previa');
    if (f) f.remove();
    fichaAberta = -1;
    elFicha.setAttribute('data-aberta', 'nao');
    document.body.style.overflow = '';
  }

  function passa(delta) {
    var alvo = fichaAberta + delta;
    if (alvo < 0 || alvo >= visiveis.length) return;
    // se andou além do que está desenhado, desenha mais antes de mostrar
    while (alvo >= desenhados && desenhados < visiveis.length) desenhaLote();
    abreFicha(alvo);
  }

  /* ------------------------------------------------------------
     Endereço da página — o filtro cabe no link
     ------------------------------------------------------------ */

  function gravaEndereco() {
    var partes = [];
    if (categoriaAtiva) partes.push('cat=' + encodeURIComponent(categoriaAtiva));
    if (termo) partes.push('q=' + encodeURIComponent(termo));
    var novo = location.pathname + (partes.length ? '?' + partes.join('&') : '');
    history.replaceState(null, '', novo);
  }

  function leEndereco() {
    var p = new URLSearchParams(location.search);
    categoriaAtiva = p.get('cat') || '';
    termo = p.get('q') || '';
    if (termo) {
      elBusca.value = termo;
      elCaixaBusca.classList.add('tem-texto');
    }
  }

  /* ------------------------------------------------------------
     Ícones
     ------------------------------------------------------------ */

  function svgPlay() {
    return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
      + '<path d="M8 5.5v13l11-6.5z"/></svg>';
  }

  function svgZap() {
    return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
      + '<path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.56-.35z"/>'
      + '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.92 6.45 17.5 2 12.04 2zm0 18.02h-.01c-1.49 0-2.95-.4-4.22-1.16l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 01-1.26-4.39c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.82c0 4.54-3.7 8.24-8.24 8.24z"/></svg>';
  }

  /* ------------------------------------------------------------
     Ligações
     ------------------------------------------------------------ */

  function liga() {
    // categoria
    elFiltros.addEventListener('click', function (e) {
      var b = e.target.closest('.faixa');
      if (!b) return;
      // clicar de novo na faixa acesa volta para o acervo inteiro
      categoriaAtiva = (b.dataset.cat === categoriaAtiva) ? '' : b.dataset.cat;
      mede('filtrou', categoriaAtiva, Number(b.dataset.n || 0));
      marcaFaixaAtiva();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      filtra();
    });

    // busca — espera a digitação parar antes de refazer a tela
    var espera;
    elBusca.addEventListener('input', function () {
      elCaixaBusca.classList.toggle('tem-texto', elBusca.value.length > 0);
      clearTimeout(espera);
      espera = setTimeout(function () {
        termo = elBusca.value.trim();
        filtra();
      }, 140);
    });

    elCaixaBusca.querySelector('.busca-limpa').addEventListener('click', function () {
      elBusca.value = '';
      termo = '';
      elCaixaBusca.classList.remove('tem-texto');
      elBusca.focus();
      filtra();
    });

    // abrir a ficha
    elMosaico.addEventListener('click', function (e) {
      var c = e.target.closest('.peca');
      if (c) abreFicha(Number(c.dataset.pos));
    });

    // A prévia entra por delegação: são 4 mil cards trocando de lugar a
    // cada filtro, e pendurar dois ouvintes em cada um seria pagar caro
    // por um efeito de enfeite. `pointerover` cobre mouse e caneta; o dedo
    // não dispara hover, e no telefone a prévia vive na ficha.
    elMosaico.addEventListener('pointerover', function (e) {
      if (e.pointerType === 'touch') return;
      var c = e.target.closest('.peca');
      if (c) abrePrevia(c);
    });
    elMosaico.addEventListener('pointerout', function (e) {
      var c = e.target.closest('.peca');
      if (c && c === previaAtiva && !c.contains(e.relatedTarget)) soltaPrevia();
    });
    // rolar com o mouse parado deixaria o vídeo tocando num card que já
    // saiu de baixo do cursor
    window.addEventListener('scroll', function () {
      if (previaAtiva && !previaAtiva.matches(':hover')) soltaPrevia();
    }, { passive: true });

    // fechar / navegar
    elFicha.addEventListener('click', function (e) {
      if (e.target === elFicha) fechaFicha();
    });
    // O pedido é a única conversão que este site tem. O evento vai por
    // `sendBeacon`, que entrega mesmo com a página já saindo para o
    // WhatsApp — e o clique segue seu caminho sem esperar por nada.
    elFicha.querySelector('.ficha-acao a').addEventListener('click', function () {
      if (fichaAberta >= 0) mede('pediu', visiveis[fichaAberta], 'ficha');
    });

    elFicha.querySelector('.ficha-fechar').addEventListener('click', fechaFicha);
    elFicha.querySelector('.ficha-passo.ant').addEventListener('click', function () { passa(-1); });
    elFicha.querySelector('.ficha-passo.pro').addEventListener('click', function () { passa(1); });

    document.addEventListener('keydown', function (e) {
      if (fichaAberta >= 0) {
        if (e.key === 'Escape') fechaFicha();
        if (e.key === 'ArrowLeft') passa(-1);
        if (e.key === 'ArrowRight') passa(1);
        return;
      }
      // barra ou "/" leva direto para a busca, como num app de verdade
      if ((e.key === '/' || e.key === 's') && document.activeElement !== elBusca
          && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        elBusca.focus();
        elBusca.select();
      }
      if (e.key === 'Escape' && document.activeElement === elBusca) elBusca.blur();
    });

    // desenha mais quando o fim se aproxima
    observador = new IntersectionObserver(function (entradas) {
      if (entradas[0].isIntersecting) desenhaLote();
    }, { rootMargin: '900px 0px' });

    // A altura da linha do mosaico é a largura de uma coluna. Sem isso, o
    // card que ocupa duas linhas fica um fio mais alto que dois cards
    // empilhados, e o encaixe dos formatos se perde.
    medeLinha();
    if (window.ResizeObserver) new ResizeObserver(medeLinha).observe(elMosaico);
    else window.addEventListener('resize', medeLinha);
  }

  var linhaAtual = 0;

  function medeLinha() {
    var colunas = getComputedStyle(elMosaico).gridTemplateColumns.split(' ');
    var largura = parseFloat(colunas[0]);
    // só escreve quando a coluna realmente mudou de largura: escrever o
    // mesmo valor faria o observador se acordar sozinho, sem parar
    if (largura > 0 && Math.abs(largura - linhaAtual) > 0.5) {
      linhaAtual = largura;
      elMosaico.style.setProperty('--linha', largura + 'px');
    }
  }

  /* ------------------------------------------------------------
     Partida
     ------------------------------------------------------------ */

  function comeca() {
    elMosaico   = document.getElementById('mosaico');
    elContagem  = document.getElementById('contagem');
    elFiltros   = document.getElementById('filtros');
    elBusca     = document.getElementById('busca');
    elCaixaBusca = document.getElementById('caixaBusca');
    elFicha     = document.getElementById('ficha');
    elCaixaRegua = document.getElementById('reguaCaixa');

    // A régua nasce aberta na marcação, para quem chega sem JavaScript ver
    // as categorias. No telefone ela começa fechada, senão ocupa metade da
    // primeira tela antes de aparecer uma peça sequer.
    function ajustaCaixaRegua() {
      if (!elCaixaRegua) return;
      elCaixaRegua.open = !estreito.matches;
    }
    ajustaCaixaRegua();
    if (estreito.addEventListener) estreito.addEventListener('change', ajustaCaixaRegua);

    sentinela = document.createElement('div');
    sentinela.className = 'mais';

    liga();

    elContagem.innerHTML = '<b>·</b> abrindo o catálogo';

    // o <head> já pediu o catálogo; aqui é só esperar a resposta chegar
    var chegando = window.catalogoAdiantado || fetch(ARQUIVO).then(function (r) {
      if (!r.ok) throw new Error('catálogo indisponível (' + r.status + ')');
      return r.json();
    });

    chegando
      .then(function (json) {
        dados = json;
        prepara();
        leEndereco();
        montaFiltros();
        marcaFaixaAtiva();
        filtra();
        mede('abriu', categoriaAtiva, termo);
      })
      .catch(function (erro) {
        elContagem.innerHTML = '<b>—</b> catálogo fora do ar';
        elMosaico.innerHTML =
          '<div class="vazio">'
          + '<h2 class="vazio-t">O catálogo não carregou</h2>'
          + '<p>Tente atualizar a página. Se continuar assim, chame no WhatsApp que '
          + 'a gente manda as fotos direto pra você.</p>'
          + '<a class="botao-zap" href="https://wa.me/' + ZAP + '" target="_blank" rel="noopener">'
          + svgZap() + 'Falar no WhatsApp</a></div>';
        console.error(erro);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', comeca);
  else comeca();
})();
