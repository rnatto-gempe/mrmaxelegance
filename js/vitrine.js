/* ============================================================
   MR MAX ELEGANCE — vitrine presencial

   O catálogo tem 4 mil peças e serve para o cliente procurar sozinho.
   A vitrine é o contrário: vinte peças escolhidas, uma por tela, para
   mostrar na mão de alguém. Não há busca nem categoria — há a coleção
   aberta, o dedo deslizando, e um coração para anotar o que agradou.

   Três entradas para a mesma página:

     vitrine.html               escolhe a coleção (assets/vitrine.json)
     vitrine.html?c=casa        abre a coleção pelo slug
     vitrine.html?p=4324,4048   abre uma seleção avulsa, por id — é o
                                que o catálogo gera no modo "montar"

   A lista do cliente (as peças marcadas) fica no navegador e vira uma
   mensagem de WhatsApp: para a produção, com nome e código de cada
   peça; ou para o cliente, com o link que reabre a seleção dele.
   ============================================================ */

(function () {
  'use strict';

  var ZAP = '5543996070804';
  var CHAVE_LISTA   = 'mrmax.vitrine.lista';     // { nome, ids }
  var CHAVE_SELECAO = 'mrmax.vitrine.selecao';   // ids que o catálogo marcou no modo montar

  var ARQ_ACERVO  = 'assets/catalogo.json';
  var ARQ_VITRINE = 'assets/vitrine.json';

  /* ------------------------------------------------------------
     Estado
     ------------------------------------------------------------ */
  var acervo = null;        // catalogo.json
  var porId = {};           // id -> peça preparada (nome, cats, código…)
  var temPrevia = {};       // id -> 'video' | 'foto'
  var colecoes = [];        // vitrine.json
  var colecao = null;       // a coleção aberta { slug, titulo, sub, pecas }
  var pecas = [];           // as peças da coleção aberta, na ordem
  var atual = 0;            // posição no palco
  var lista = [];           // ids marcados para o cliente, na ordem do toque
  var nomeCliente = '';

  /* Cada peça tem duas mídias: a imagem recortada (todas têm) e a prévia —
     vídeo de 3 s para quase todas, foto de cena para as 125 que a origem
     nunca filmou. `previa` mostra a prévia; `recorte`, a imagem. A escolha
     vale para a coleção inteira e fica guardada: quem prefere ver a peça
     parada não quer repetir o toque a cada slide. */
  var CHAVE_MIDIA = 'mrmax.vitrine.midia';
  var midiaPreferida = 'previa';

  /* Publicar: a seleção deste aparelho vira coleção no site, gravada em
     assets/vitrine.json pela API do GitHub (js/publica.js). `editando`
     lembra qual coleção foi mandada ao catálogo para ajuste, para que a
     publicação seguinte a substitua em vez de criar outra. */
  var CHAVE_EDITANDO = 'mrmax.vitrine.editando';
  var pecasParaPublicar = [];

  var el = {};
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
  var observador = null;
  var avisoTimer = 0;

  /* ------------------------------------------------------------
     Ajudantes
     ------------------------------------------------------------ */

  function escapa(txt) {
    return String(txt).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function numero(n) { return n.toLocaleString('pt-BR'); }

  function semAcento(txt) {
    return String(txt).normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // "Feira de Outubro" -> "feira-de-outubro": o slug que vai na URL
  function slugDe(txt) {
    return semAcento(txt).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  }

  function podePublicar() {
    return !!(window.publica && window.publica.temChave());
  }

  function nomeCategoria(i) {
    return acervo.categorias[i] ? acervo.categorias[i][1] : '';
  }

  function materialTexto(m) {
    return m === 1 ? 'Resina' : m === 2 ? 'Filamento ou resina' : 'Filamento';
  }

  function guarda(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* modo privado */ }
  }

  function le(chave) {
    try { return JSON.parse(localStorage.getItem(chave)); } catch (e) { return null; }
  }

  function avisa(txt) {
    el.aviso.textContent = txt;
    el.aviso.classList.add('aparece');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { el.aviso.classList.remove('aparece'); }, 1800);
  }

  /* ------------------------------------------------------------
     O código da peça — a mesma regra do catálogo

     Copiado de js/catalogo.js, e precisa continuar igual: o código que
     a vitrine escreve na mensagem é o que a produção usa para achar a
     peça, e é o mesmo que aparece nos relatórios. Se a regra mudar lá,
     muda aqui.
     ------------------------------------------------------------ */

  var ESPECIFICAS = ['sensorial', 'articulados', 'brinquedos'];
  var PREFIXO = {
    casa: 'CAS', arte: 'ART', articulados: 'ARC', brinquedos: 'BRI',
    sensorial: 'SEN', datas: 'DAT', miniaturas: 'MIN', grandes: 'GRA',
    fantasia: 'COS', gadgets: 'GAD', games: 'GAM', personalizar: 'PER',
    hobby: 'HOB', saude: 'SAU', educativo: 'EDU', pets: 'PET'
  };

  function catDoCodigo(it) {
    if (!it.cats.length) return 'GER';
    var escolhida = it.cats[0];
    for (var e = 0; e < ESPECIFICAS.length; e++) {
      for (var k = 0; k < it.cats.length; k++) {
        if (acervo.categorias[it.cats[k]][0] === ESPECIFICAS[e]) {
          escolhida = it.cats[k];
          e = ESPECIFICAS.length;
          break;
        }
      }
    }
    var slug = acervo.categorias[escolhida][0];
    return PREFIXO[slug] || semAcento(slug).slice(0, 3).toUpperCase();
  }

  function iniciais(nome) {
    var palavras = semAcento(nome).split(/[^A-Za-z0-9]+/);
    var letras = '';
    for (var i = 0; i < palavras.length; i++) {
      if (palavras[i]) letras += palavras[i].charAt(0).toUpperCase();
    }
    return letras || 'X';
  }

  function codigoPeca(it) {
    var n = String(it.pos + 1);
    while (n.length < 4) n = '0' + n;
    return catDoCodigo(it) + '-' + iniciais(it.nome) + '-' + n;
  }

  /* ------------------------------------------------------------
     Chegada dos dados
     ------------------------------------------------------------ */

  function preparaAcervo() {
    (acervo.hover || []).forEach(function (id) { temPrevia[id] = 'video'; });
    (acervo.hover_foto || []).forEach(function (id) {
      if (!temPrevia[id]) temPrevia[id] = 'foto';
    });

    acervo.itens.forEach(function (linha, pos) {
      var it = {
        id: linha[0],
        nome: linha[1],
        cats: linha[2] || [],
        material: linha[3],
        matiz: linha[5] || 209,
        desenho: linha[6] || 0,
        larg: linha[7] || 460,
        alt: linha[8] || 460,
        pos: pos
      };
      it.codigo = codigoPeca(it);
      porId[it.id] = it;
    });
  }

  // Uma lista de ids vira uma lista de peças. O que não existe mais no
  // acervo sai em silêncio: a vitrine não pode quebrar porque uma peça
  // foi tirada do catálogo.
  function resolve(ids) {
    var vistas = {};
    return ids.map(Number).filter(function (id) {
      if (!porId[id] || vistas[id]) return false;
      vistas[id] = 1;
      return true;
    }).map(function (id) { return porId[id]; });
  }

  /* ------------------------------------------------------------
     Início — a escolha da coleção
     ------------------------------------------------------------ */

  function montaInicio() {
    var html = '';

    // A seleção que o catálogo montou, se houver, aparece primeiro:
    // é a mais recente e a mais provável de ser a que se quer mostrar.
    var propria = resolve(le(CHAVE_SELECAO) || []);
    if (propria.length) {
      html += cartaoColecao({
        slug: '', titulo: 'Minha seleção', propria: true,
        sub: 'Montada no catálogo, neste aparelho.',
        pecas: propria.map(function (p) { return p.id; })
      }, propria);
    }

    colecoes.forEach(function (c) {
      var itens = resolve(c.pecas);
      if (itens.length) html += cartaoColecao(c, itens);
    });

    el.colecoes.innerHTML = html || '<p class="inicio-nota">Nenhuma coleção encontrada em assets/vitrine.json.</p>';
  }

  function cartaoColecao(c, itens) {
    var fotos = itens.slice(0, 4).map(function (p) {
      return '<span class="p' + p.desenho + '" style="--h:' + p.matiz + '">'
           + '<img src="assets/catalogo/' + p.id + '.webp" alt="" loading="lazy" decoding="async"></span>';
    }).join('');
    var n = itens.length;

    // as ações só existem no aparelho que tem a chave de publicação
    var acoes = '';
    if (podePublicar()) {
      acoes = c.propria
        ? '<button type="button" class="colecao-acao destaque" data-acao="publicar">Publicar no site</button>'
          + '<button type="button" class="colecao-acao apaga" data-acao="descartar">Descartar</button>'
        : '<button type="button" class="colecao-acao" data-acao="editar">Editar no catálogo</button>'
          + '<button type="button" class="colecao-acao apaga" data-acao="excluir">Excluir</button>';
    }

    return '<div class="colecao' + (c.propria ? ' propria' : '') + '" '
         + 'data-slug="' + escapa(c.slug) + '" data-ids="' + (c.propria ? escapa(c.pecas.join(',')) : '') + '">'
         + '<button type="button" class="colecao-abrir">'
         + '<span class="colecao-fotos">' + fotos + '</span>'
         + '<span><span class="colecao-tit">' + escapa(c.titulo) + '</span>'
         + '<p class="colecao-sub">' + escapa(c.sub || '') + '</p>'
         + '<span class="colecao-n">' + numero(n) + (n === 1 ? ' PEÇA' : ' PEÇAS') + '</span></span>'
         + '</button>'
         + (acoes ? '<div class="colecao-acoes">' + acoes + '</div>' : '')
         + '</div>';
  }

  /* ------------------------------------------------------------
     Publicar — a seleção vira coleção no site

     O caminho inteiro é: ler o vitrine.json que está no repositório,
     trocar ou acrescentar a coleção, gravar de volta. Ler antes de gravar
     é o que evita apagar uma coleção que outro aparelho publicou.
     ------------------------------------------------------------ */

  function acaoColecao(acao, slug, ids) {
    if (acao === 'publicar') {
      abrePublicar(ids ? ids.split(',') : []);
    } else if (acao === 'descartar') {
      if (!window.confirm('Descartar a seleção montada neste aparelho?')) return;
      guarda(CHAVE_SELECAO, []);
      guarda(CHAVE_EDITANDO, null);
      montaInicio();
    } else if (acao === 'editar') {
      var c = colecaoPorSlug(slug);
      if (!c) return;
      // a coleção vira a seleção do catálogo; ao publicar, ela é substituída
      guarda(CHAVE_SELECAO, c.pecas);
      guarda(CHAVE_EDITANDO, { slug: c.slug, titulo: c.titulo, sub: c.sub || '' });
      location.href = 'catalogo.html?montar=1';
    } else if (acao === 'excluir') {
      var e = colecaoPorSlug(slug);
      if (!e || !window.confirm('Excluir a coleção "' + e.titulo + '" do site?')) return;
      excluiColecao(slug);
    }
  }

  function colecaoPorSlug(slug) {
    for (var i = 0; i < colecoes.length; i++) if (colecoes[i].slug === slug) return colecoes[i];
    return null;
  }

  function abrePublicar(ids) {
    pecasParaPublicar = resolve(ids);
    if (!pecasParaPublicar.length) { avisa('Não há peça para publicar'); return; }

    var n = pecasParaPublicar.length;
    el.pubN.textContent = numero(n) + (n === 1 ? ' peça' : ' peças');

    var ed = le(CHAVE_EDITANDO);
    el.pubTitulo.value = ed ? ed.titulo : '';
    el.pubSub.value = ed ? ed.sub : '';
    el.pubSlug.value = ed ? ed.slug : '';
    el.pubSlug.dataset.manual = ed ? '1' : '';
    estadoPub('');
    el.pubEnviar.disabled = false;

    fechaPainel('lista'); fechaPainel('grade');
    abrePainel('publicar');
    el.pubTitulo.focus();
  }

  function estadoPub(txt, tipo) {
    el.pubEstado.textContent = txt;
    el.pubEstado.className = 'dialogo-estado' + (tipo ? ' ' + tipo : '');
  }

  function avisaSubstituicao() {
    var slug = el.pubSlug.value.trim();
    var existe = colecaoPorSlug(slug);
    if (existe) estadoPub('Vai substituir a coleção "' + existe.titulo + '", que já está no site.');
    else estadoPub('');
  }

  function publicaColecao(ev) {
    ev.preventDefault();
    var titulo = el.pubTitulo.value.trim();
    if (!titulo) { estadoPub('Dê um nome à coleção.', 'erro'); el.pubTitulo.focus(); return; }
    var slug = slugDe(el.pubSlug.value.trim() || titulo);
    if (!slug) { estadoPub('O endereço precisa ter letras ou números.', 'erro'); return; }
    var sub = el.pubSub.value.trim();
    var ids = pecasParaPublicar.map(function (p) { return p.id; });

    el.pubEnviar.disabled = true;
    estadoPub('Gravando no site…');

    window.publica.leArquivo()
      .then(function (arq) {
        var json;
        try { json = JSON.parse(arq.texto); } catch (e) { throw new Error('o vitrine.json do site está ilegível'); }
        json.versao = json.versao || 1;
        json.colecoes = json.colecoes || [];
        var nova = { slug: slug, titulo: titulo, sub: sub, pecas: ids };
        var i = -1;
        json.colecoes.forEach(function (c, k) { if (c.slug === slug) i = k; });
        if (i >= 0) json.colecoes[i] = nova; else json.colecoes.push(nova);
        var msg = 'Vitrine: ' + (i >= 0 ? 'atualiza' : 'nova coleção') + ' "' + titulo + '" ('
                + ids.length + (ids.length === 1 ? ' peça' : ' peças') + '), publicada pela vitrine';
        return window.publica.gravaArquivo(serializaVitrine(json), arq.sha, msg).then(function () { return json; });
      })
      .then(function (json) {
        colecoes = json.colecoes;
        guarda(CHAVE_SELECAO, []);
        guarda(CHAVE_EDITANDO, null);
        fechaPainel('publicar');
        montaInicio();
        abreInicio();
        avisa('Publicada! Entra no site em um ou dois minutos');
      })
      .catch(function (e) {
        el.pubEnviar.disabled = false;
        estadoPub('Não deu para publicar: ' + explicaErro(e), 'erro');
      });
  }

  function excluiColecao(slug) {
    avisa('Excluindo…');
    window.publica.leArquivo()
      .then(function (arq) {
        var json = JSON.parse(arq.texto);
        var titulo = slug;
        json.colecoes = (json.colecoes || []).filter(function (c) {
          if (c.slug === slug) { titulo = c.titulo; return false; }
          return true;
        });
        return window.publica.gravaArquivo(serializaVitrine(json), arq.sha,
          'Vitrine: exclui a coleção "' + titulo + '", pela vitrine').then(function () { return json; });
      })
      .then(function (json) {
        colecoes = json.colecoes;
        montaInicio();
        avisa('Coleção excluída');
      })
      .catch(function (e) { avisa('Não deu para excluir: ' + explicaErro(e)); });
  }

  function explicaErro(e) {
    if (e && e.status === 401) return 'a chave está errada ou venceu. Conecte de novo.';
    if (e && e.status === 403) return 'a chave não tem permissão de escrita neste repositório.';
    if (e && e.status === 404) return 'o arquivo ou o repositório não foi encontrado.';
    if (e && e.status === 409) return 'o arquivo mudou enquanto você editava. Tente de novo.';
    return (e && e.message) || 'erro desconhecido';
  }

  // O arquivo é lido por gente, no GitHub. Sai no mesmo formato em que foi
  // escrito à mão: uma coleção por bloco, a lista de peças numa linha só.
  function serializaVitrine(json) {
    var blocos = (json.colecoes || []).map(function (c) {
      return '    {\n'
           + '      "slug": ' + JSON.stringify(c.slug) + ',\n'
           + '      "titulo": ' + JSON.stringify(c.titulo) + ',\n'
           + '      "sub": ' + JSON.stringify(c.sub || '') + ',\n'
           + '      "pecas": [' + (c.pecas || []).join(', ') + ']\n'
           + '    }';
    });
    return '{\n  "versao": ' + (json.versao || 1) + ',\n  "colecoes": [\n'
         + blocos.join(',\n') + '\n  ]\n}\n';
  }

  /* ------------------------------------------------------------
     A conta — a chave que permite publicar
     ------------------------------------------------------------ */

  function atualizaConta() {
    var tem = podePublicar();
    el.contaEstado.textContent = tem
      ? 'Este aparelho publica no site'
      : 'Este aparelho ainda não publica no site';
    el.btnConta.textContent = tem ? 'Conta' : 'Conectar';
    el.contaEstado.closest('.publicacao').classList.toggle('ligada', tem);
    el.btnDesconectar.hidden = !tem;
    el.btnPublicar.hidden = !(tem && colecao && (colecao.avulsa || colecao.propria));
  }

  function abreConta() {
    el.contaChave.value = '';
    el.contaEstadoIn.textContent = podePublicar() ? 'Há uma chave guardada neste aparelho.' : '';
    el.contaEstadoIn.className = 'dialogo-estado';
    el.contaEnviar.disabled = false;
    abrePainel('conta');
    if (!podePublicar()) el.contaChave.focus();
  }

  function conectaConta(ev) {
    ev.preventDefault();
    var t = el.contaChave.value.trim();
    if (!t) { el.contaEstadoIn.textContent = 'Cole a chave primeiro.'; el.contaEstadoIn.className = 'dialogo-estado erro'; return; }
    el.contaEnviar.disabled = true;
    el.contaEstadoIn.textContent = 'Conferindo…';
    el.contaEstadoIn.className = 'dialogo-estado';

    var anterior = window.publica.temChave();
    window.publica.guardaChave(t);
    window.publica.confere()
      .then(function (r) {
        if (!r.escreve) throw new Error('a chave de ' + r.usuario + ' não pode escrever neste repositório. Falta a permissão Contents: Read and write.');
        el.contaEstadoIn.textContent = 'Conectado como ' + r.usuario + '. Este aparelho já publica.';
        el.contaEstadoIn.className = 'dialogo-estado ok';
        el.contaChave.value = '';
        atualizaConta();
        montaInicio();
        setTimeout(function () { fechaPainel('conta'); }, 900);
      })
      .catch(function (e) {
        if (!anterior) window.publica.guardaChave('');
        el.contaEnviar.disabled = false;
        el.contaEstadoIn.textContent = 'Não deu: ' + explicaErro(e);
        el.contaEstadoIn.className = 'dialogo-estado erro';
        atualizaConta();
      });
  }

  function desconectaConta() {
    if (!window.confirm('Tirar a chave deste aparelho? Ele deixa de publicar.')) return;
    window.publica.guardaChave('');
    atualizaConta();
    montaInicio();
    fechaPainel('conta');
    avisa('Chave removida');
  }

  function abreInicio() {
    paraVideos();
    el.inicio.setAttribute('data-aberto', 'sim');
    document.body.setAttribute('data-tela', 'inicio');
  }

  /* ------------------------------------------------------------
     Abrir uma coleção
     ------------------------------------------------------------ */

  function abreColecao(c, ids) {
    // a posição vem do endereço, e precisa ser lida antes de o endereço
    // ser reescrito mais abaixo — senão o link "#7" abre sempre na primeira
    var posInicial = lePosicao();

    colecao = c;
    pecas = resolve(ids || c.pecas);

    el.topoNome.textContent = c.titulo;
    el.topoSub.textContent = 'VITRINE';
    el.gradeTit.textContent = c.titulo + ' · ' + numero(pecas.length) + (pecas.length === 1 ? ' peça' : ' peças');
    document.title = c.titulo + ' | Vitrine MR MAX ELEGANCE';

    montaPalco();
    montaTrilho();
    montaGrade();

    el.inicio.setAttribute('data-aberto', 'nao');
    fechaPainel('grade');
    document.body.setAttribute('data-tela', 'palco');
    atualizaConta();

    // sem animar: é uma coleção nova, não um passo. `chegouEm` grava o
    // endereço; se a coleção veio vazia, grava-se aqui.
    atual = -1;
    if (pecas.length) vaiPara(posInicial, 'auto');
    else gravaEndereco();
  }

  function abrePorSlug(slug) {
    for (var i = 0; i < colecoes.length; i++) {
      if (colecoes[i].slug === slug) { abreColecao(colecoes[i]); return true; }
    }
    return false;
  }

  function abreAvulsa(ids) {
    var itens = resolve(ids);
    if (!itens.length) return false;
    abreColecao({
      slug: '', avulsa: true,
      titulo: 'Seleção',
      sub: '',
      pecas: itens.map(function (p) { return p.id; })
    });
    return true;
  }

  /* ------------------------------------------------------------
     O palco
     ------------------------------------------------------------ */

  function montaPalco() {
    paraVideos();
    var html = '';
    if (!pecas.length) {
      html = '<div class="vazio"><h2>Esta coleção está vazia</h2>'
           + '<p>Nenhuma das peças listadas existe no acervo. Confira os ids em assets/vitrine.json.</p></div>';
    }
    pecas.forEach(function (it, i) { html += slide(it, i); });
    el.palco.innerHTML = html;

    if (observador) observador.disconnect();
    // A peça "atual" é a que ocupa a tela — não a que o dedo largou. O
    // observador decide isso pelo que está visível, e é ele que liga o
    // vídeo e acende a miniatura, seja qual for o jeito de chegar lá.
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting && en.intersectionRatio >= .6) chegouEm(Number(en.target.dataset.i));
      });
    }, { root: el.palco, threshold: [.6] });
    Array.prototype.forEach.call(el.palco.querySelectorAll('.slide'), function (s) { observador.observe(s); });
  }

  function slide(it, i) {
    var previa = temPrevia[it.id] || '';
    var cats = it.cats.map(function (c) { return '<span>' + escapa(nomeCategoria(c)) + '</span>'; });
    cats.push('<span>' + materialTexto(it.material) + '</span>');
    var na = lista.indexOf(it.id) !== -1;
    var midia = previa ? midiaPreferida : 'recorte';

    return '<article class="slide" data-i="' + i + '" data-id="' + it.id + '" aria-label="' + escapa(it.nome) + '">'
         + '<div class="slide-quadro p' + it.desenho + (previa ? ' tem-' + previa : '') + '" '
         + 'style="--h:' + it.matiz + '" data-midia="' + midia + '">'
         + '<img class="recorte" src="assets/catalogo/' + it.id + '.webp" alt="' + escapa(it.nome) + '" '
         + 'width="' + it.larg + '" height="' + it.alt + '" loading="lazy" decoding="async">'
         + (previa === 'foto'
             ? '<img class="previa" src="assets/hover/' + it.id + '.webp" alt="' + escapa(it.nome) + ' — foto da peça" loading="lazy" decoding="async">'
             : '')
         + (previa ? trocaMidiaHtml(previa, midia) : '')
         + '</div>'
         + '<div class="slide-info">'
         + '<span class="slide-cod mono">' + escapa(it.codigo) + ' · ' + (i + 1) + ' de ' + pecas.length + '</span>'
         + '<h2 class="slide-nome">' + escapa(it.nome) + '</h2>'
         + '<div class="slide-cats">' + cats.join('') + '</div>'
         + '<p class="slide-txt">Impressa sob encomenda, na cor que a pessoa escolher. Tamanho sob medida; prazo e valor combinados antes de imprimir.</p>'
         + '<div class="slide-acoes">'
         + '<button type="button" class="btn-lista" data-id="' + it.id + '" aria-pressed="' + (na ? 'true' : 'false') + '">'
         + svgCoracao() + '<span>' + (na ? 'Anotada' : 'Anotar para o cliente') + '</span></button>'
         + '</div></div></article>';
  }

  /* ------------------------------------------------------------
     A troca de mídia — vídeo (ou foto) de um lado, imagem do outro
     ------------------------------------------------------------ */

  function trocaMidiaHtml(previa, midia) {
    return '<div class="midia-troca" role="group" aria-label="O que mostrar da peça">'
         + '<button type="button" data-midia="previa" aria-pressed="' + (midia === 'previa') + '">'
         + (previa === 'video' ? 'Vídeo' : 'Foto') + '</button>'
         + '<button type="button" data-midia="recorte" aria-pressed="' + (midia === 'recorte') + '">Imagem</button>'
         + '</div>';
  }

  // Vale para todos os slides de uma vez: a escolha é da pessoa, não da peça.
  function trocaMidia(tipo) {
    midiaPreferida = tipo === 'recorte' ? 'recorte' : 'previa';
    guarda(CHAVE_MIDIA, midiaPreferida);

    Array.prototype.forEach.call(el.palco.querySelectorAll('.slide-quadro.tem-video, .slide-quadro.tem-foto'), function (q) {
      q.setAttribute('data-midia', midiaPreferida);
      Array.prototype.forEach.call(q.querySelectorAll('.midia-troca button'), function (b) {
        b.setAttribute('aria-pressed', b.dataset.midia === midiaPreferida ? 'true' : 'false');
      });
    });

    // o vídeo do slide atual para ou volta junto com a troca
    var v = el.palco.querySelector('video');
    if (midiaPreferida === 'recorte') { if (v) v.pause(); }
    else if (v) tocaVideo(v);
    else ligaVideo(atual);

    avisa(midiaPreferida === 'recorte' ? 'Mostrando a imagem' : 'Mostrando a prévia');
  }

  function chegouEm(i) {
    if (i === atual) return;
    atual = i;
    marcaTrilho();
    ligaVideo(i);
    if (el.setaAnt) el.setaAnt.disabled = i === 0;
    if (el.setaPro) el.setaPro.disabled = i >= pecas.length - 1;
    gravaEndereco();

    // adianta os vizinhos: quem desliza não espera imagem
    [i - 1, i + 1].forEach(function (p) {
      if (p >= 0 && p < pecas.length) new Image().src = 'assets/catalogo/' + pecas[p].id + '.webp';
    });
  }

  function vaiPara(i, modo) {
    if (!pecas.length) return;
    i = Math.max(0, Math.min(i, pecas.length - 1));
    var s = el.palco.querySelector('.slide[data-i="' + i + '"]');
    if (!s) return;
    el.palco.scrollTo({ left: s.offsetLeft, behavior: modo || (reduz.matches ? 'auto' : 'smooth') });
    // O destino é conhecido, então o estado muda já — a imagem alcança.
    // Esperar o observador falharia no salto sem animação (ele pode nem
    // disparar) e na aba em segundo plano (nada é desenhado até voltar).
    // O observador continua mandando quando é o dedo que desliza.
    chegouEm(i);
  }

  /* ------------------------------------------------------------
     Vídeo — só no slide que está na tela

     Cada prévia tem 3 segundos e 30 KB; tocar todas de uma vez seria
     um punhado de decodificadores rodando fora da vista. Entra um, sai
     o anterior.
     ------------------------------------------------------------ */

  function paraVideos() {
    Array.prototype.forEach.call(el.palco.querySelectorAll('video'), function (v) {
      v.pause(); v.removeAttribute('src'); v.load(); v.remove();
    });
  }

  function ligaVideo(i) {
    paraVideos();
    var it = pecas[i];
    if (!it || temPrevia[it.id] !== 'video' || reduz.matches) return;
    var quadro = el.palco.querySelector('.slide[data-i="' + i + '"] .slide-quadro');
    if (!quadro || quadro.getAttribute('data-midia') !== 'previa') return;

    var v = document.createElement('video');
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.playsInline = true;
    v.autoplay = true;
    v.preload = 'auto';
    v.poster = 'assets/catalogo/' + it.id + '.webp';
    v.setAttribute('aria-label', 'Vídeo da peça ' + it.nome + ' em movimento');
    v.src = 'assets/hover/' + it.id + '.mp4';
    // a foto recortada só sai da frente quando o vídeo está de fato rodando:
    // um vídeo parado no primeiro quadro é pior que a foto
    v.addEventListener('playing', function () { v.classList.add('pronto'); }, { once: true });
    quadro.insertBefore(v, quadro.firstChild);
    tocaVideo(v);
  }

  // O navegador pode recusar o autoplay quando a página abriu por link, sem
  // toque nenhum — mesmo mudo. Aí o vídeo fica esperando o primeiro gesto
  // (o deslizar, um toque, uma tecla) e toca a partir dele.
  function tocaVideo(v) {
    var p = v.play();
    if (!p || !p.catch) return;
    p.catch(function () {
      function tenta() {
        document.removeEventListener('pointerdown', tenta);
        document.removeEventListener('keydown', tenta);
        document.removeEventListener('touchstart', tenta);
        if (v.isConnected) { var q = v.play(); if (q && q.catch) q.catch(function () {}); }
      }
      document.addEventListener('pointerdown', tenta, { once: true });
      document.addEventListener('keydown', tenta, { once: true });
      document.addEventListener('touchstart', tenta, { once: true, passive: true });
    });
  }

  /* ------------------------------------------------------------
     Trilho e grade
     ------------------------------------------------------------ */

  function montaTrilho() {
    el.trilho.innerHTML = pecas.map(function (it, i) {
      return '<button type="button" class="trilho-peca p' + it.desenho
           + (lista.indexOf(it.id) !== -1 ? ' na-lista' : '') + '" '
           + 'style="--h:' + it.matiz + '" data-i="' + i + '" aria-label="' + escapa(it.nome) + '">'
           + '<img src="assets/catalogo/' + it.id + '.webp" alt="" loading="lazy" decoding="async"></button>';
    }).join('');
  }

  function marcaTrilho() {
    Array.prototype.forEach.call(el.trilho.children, function (b, i) {
      var acesa = i === atual;
      if (acesa) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
      if (acesa && b.scrollIntoView) {
        b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduz.matches ? 'auto' : 'smooth' });
      }
    });
    Array.prototype.forEach.call(el.gradeIn.children, function (b, i) {
      if (i === atual) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }

  function montaGrade() {
    el.gradeIn.innerHTML = pecas.map(function (it, i) {
      return '<button type="button" class="grade-peca p' + it.desenho
           + (lista.indexOf(it.id) !== -1 ? ' na-lista' : '') + '" '
           + 'style="--h:' + it.matiz + '" data-i="' + i + '">'
           + '<img src="assets/catalogo/' + it.id + '.webp" alt="" loading="lazy" decoding="async">'
           + '<span class="grade-nome">' + escapa(it.nome) + '</span></button>';
    }).join('');
  }

  /* ------------------------------------------------------------
     A lista do cliente
     ------------------------------------------------------------ */

  function carregaLista() {
    var g = le(CHAVE_LISTA);
    if (g && g.ids) {
      lista = g.ids.map(Number);
      nomeCliente = g.nome || '';
    }
    el.nomeCliente.value = nomeCliente;
  }

  function guardaLista() {
    guarda(CHAVE_LISTA, { nome: nomeCliente, ids: lista });
  }

  function alterna(id) {
    var i = lista.indexOf(id);
    if (i === -1) { lista.push(id); avisa('Anotada na lista'); }
    else { lista.splice(i, 1); avisa('Tirada da lista'); }
    guardaLista();
    refleteLista();
  }

  // Tudo o que mostra "está na lista" lê daqui: o coração do slide, o
  // ponto no trilho, o coração na grade, o número no cabeçalho.
  function refleteLista() {
    var n = lista.length;
    el.listaN.textContent = n;
    el.listaN.hidden = n === 0;
    el.btnLista.setAttribute('data-cheia', n ? 'sim' : 'nao');

    Array.prototype.forEach.call(el.palco.querySelectorAll('.btn-lista'), function (b) {
      var na = lista.indexOf(Number(b.dataset.id)) !== -1;
      b.setAttribute('aria-pressed', na ? 'true' : 'false');
      b.querySelector('span').textContent = na ? 'Anotada' : 'Anotar para o cliente';
    });
    ['trilho', 'gradeIn'].forEach(function (k) {
      Array.prototype.forEach.call(el[k].children, function (b) {
        var it = pecas[Number(b.dataset.i)];
        b.classList.toggle('na-lista', !!it && lista.indexOf(it.id) !== -1);
      });
    });

    montaListaItens();
  }

  function montaListaItens() {
    var itens = resolve(lista);
    el.listaItens.innerHTML = itens.map(function (it) {
      return '<li class="lista-item">'
           + '<button type="button" class="lista-foto p' + it.desenho + '" style="--h:' + it.matiz + '" '
           + 'data-id="' + it.id + '" aria-label="Ver ' + escapa(it.nome) + '">'
           + '<img src="assets/catalogo/' + it.id + '.webp" alt="" loading="lazy"></button>'
           + '<span><span class="lista-nome">' + escapa(it.nome) + '</span>'
           + '<span class="lista-cod">' + escapa(it.codigo) + ' · MM-' + it.id + '</span></span>'
           + '<button type="button" class="lista-tira" data-id="' + it.id + '" aria-label="Tirar ' + escapa(it.nome) + ' da lista">&times;</button>'
           + '</li>';
    }).join('');
    el.listaVazia.hidden = itens.length > 0;

    var vazia = !itens.length;
    el.btnPedido.setAttribute('aria-disabled', vazia ? 'true' : 'false');
    el.btnCliente.setAttribute('aria-disabled', vazia ? 'true' : 'false');
    el.btnLimpar.setAttribute('aria-disabled', vazia ? 'true' : 'false');
    el.btnPedido.href = vazia ? '#' : linkPedido(itens);
    el.btnCliente.href = vazia ? '#' : linkCliente(itens);
  }

  // Para a produção: nome de quem escolheu e o código de cada peça — o
  // mesmo código que o catálogo manda, para o pedido presencial e o do
  // site serem achados do mesmo jeito.
  function linkPedido(itens) {
    var linhas = ['Pedido presencial — vitrine' + (colecao && colecao.titulo ? ' "' + colecao.titulo + '"' : ''), ''];
    if (nomeCliente) linhas.push('Cliente: ' + nomeCliente, '');
    itens.forEach(function (it) {
      linhas.push('▸ ' + it.nome + ' — ' + it.codigo + ' (MM-' + it.id + ')');
    });
    linhas.push('', itens.length + (itens.length === 1 ? ' peça' : ' peças') + '. Cor, tamanho, prazo e valor a combinar.');
    return 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent(linhas.join('\n'));
  }

  // Para o cliente: sem número fixo, o WhatsApp pergunta para quem. Vai
  // o link que reabre exatamente estas peças, no telefone dele.
  function linkCliente(itens) {
    var ids = itens.map(function (it) { return it.id; }).join(',');
    var endereco = location.origin + location.pathname + '?p=' + ids;
    var linhas = ['Oi' + (nomeCliente ? ', ' + nomeCliente : '') + '! Aqui estão as peças que você gostou no MR MAX ELEGANCE:', ''];
    itens.forEach(function (it) { linhas.push('▸ ' + it.nome); });
    linhas.push('', 'Veja de novo quando quiser: ' + endereco, '', 'Para pedir, é só chamar: https://wa.me/' + ZAP);
    return 'https://wa.me/?text=' + encodeURIComponent(linhas.join('\n'));
  }

  function limpaLista() {
    if (!lista.length) return;
    lista = [];
    guardaLista();
    refleteLista();
    avisa('Lista limpa');
  }

  /* ------------------------------------------------------------
     Painéis
     ------------------------------------------------------------ */

  function abrePainel(qual) {
    el[qual].setAttribute('data-aberto', 'sim');
    var f = el[qual].querySelector('.fechar');
    if (f) f.focus();
  }

  function fechaPainel(qual) {
    el[qual].setAttribute('data-aberto', 'nao');
  }

  function painelAberto() {
    var nomes = ['publicar', 'conta', 'grade', 'lista'];
    for (var i = 0; i < nomes.length; i++) {
      if (el[nomes[i]].getAttribute('data-aberto') === 'sim') return nomes[i];
    }
    return '';
  }

  function alternaTelaCheia() {
    var d = document;
    var raiz = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    } else if (raiz.requestFullscreen || raiz.webkitRequestFullscreen) {
      (raiz.requestFullscreen || raiz.webkitRequestFullscreen).call(raiz);
    } else {
      avisa('Este navegador não tem tela cheia');
    }
  }

  /* ------------------------------------------------------------
     Endereço — a coleção e a posição cabem no link
     ------------------------------------------------------------ */

  function gravaEndereco() {
    if (!colecao) return;
    var busca = '';
    if (colecao.avulsa || !colecao.slug) busca = '?p=' + pecas.map(function (p) { return p.id; }).join(',');
    else busca = '?c=' + encodeURIComponent(colecao.slug);
    var novo = location.pathname + busca + (atual > 0 ? '#' + (atual + 1) : '');
    if (novo !== location.pathname + location.search + location.hash) history.replaceState(null, '', novo);
  }

  function lePosicao() {
    var n = parseInt(location.hash.replace('#', ''), 10);
    return n > 0 ? n - 1 : 0;
  }

  function leEndereco() {
    var p = new URLSearchParams(location.search);
    var ids = (p.get('p') || '').split(',').filter(Boolean);
    if (ids.length && abreAvulsa(ids)) return;
    var slug = p.get('c');
    if (slug && abrePorSlug(slug)) return;
    abreInicio();
  }

  /* ------------------------------------------------------------
     Ícones
     ------------------------------------------------------------ */

  function svgCoracao() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">'
         + '<path d="M12 20.5s-7.5-4.6-7.5-10A4 4 0 0 1 12 8a4 4 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/></svg>';
  }

  /* ------------------------------------------------------------
     Ligações
     ------------------------------------------------------------ */

  function liga() {
    // início: escolher coleção, ou publicar / editar / excluir
    el.colecoes.addEventListener('click', function (e) {
      var a = e.target.closest('.colecao-acao');
      if (a) {
        var card = a.closest('.colecao');
        acaoColecao(a.dataset.acao, card.dataset.slug, card.dataset.ids);
        return;
      }
      var b = e.target.closest('.colecao-abrir');
      if (!b) return;
      var c = b.closest('.colecao');
      if (c.dataset.ids) abreAvulsa(c.dataset.ids.split(','));
      else abrePorSlug(c.dataset.slug);
    });

    // publicar a seleção aberta no palco (a que veio do catálogo por ?p=)
    el.btnPublicar.addEventListener('click', function () {
      abrePublicar(pecas.map(function (p) { return p.id; }));
    });
    el.pubForm.addEventListener('submit', publicaColecao);
    el.pubTitulo.addEventListener('input', function () {
      if (!el.pubSlug.dataset.manual) el.pubSlug.value = slugDe(el.pubTitulo.value);
      avisaSubstituicao();
    });
    el.pubSlug.addEventListener('input', function () {
      el.pubSlug.dataset.manual = el.pubSlug.value ? '1' : '';
      avisaSubstituicao();
    });

    // a conta
    el.btnConta.addEventListener('click', abreConta);
    el.contaForm.addEventListener('submit', conectaConta);
    el.btnDesconectar.addEventListener('click', desconectaConta);

    el.btnInicio.addEventListener('click', function () {
      fechaPainel('grade'); fechaPainel('lista');
      montaInicio();
      abreInicio();
    });

    // palco: coração e a troca de mídia (pelo seletor ou tocando no quadro)
    el.palco.addEventListener('click', function (e) {
      var b = e.target.closest('.btn-lista');
      if (b) { alterna(Number(b.dataset.id)); return; }
      var t = e.target.closest('.midia-troca button');
      if (t) { trocaMidia(t.dataset.midia); return; }
      var q = e.target.closest('.slide-quadro.tem-video, .slide-quadro.tem-foto');
      if (q) trocaMidia(q.getAttribute('data-midia') === 'previa' ? 'recorte' : 'previa');
    });

    // trilho e grade: pular para a peça
    el.trilho.addEventListener('click', function (e) {
      var b = e.target.closest('.trilho-peca');
      if (b) vaiPara(Number(b.dataset.i));
    });
    el.gradeIn.addEventListener('click', function (e) {
      var b = e.target.closest('.grade-peca');
      if (!b) return;
      fechaPainel('grade');
      vaiPara(Number(b.dataset.i), 'auto');
    });

    // lista: ver a peça, tirar da lista, nome, limpar
    el.listaItens.addEventListener('click', function (e) {
      var tira = e.target.closest('.lista-tira');
      if (tira) { alterna(Number(tira.dataset.id)); return; }
      var foto = e.target.closest('.lista-foto');
      if (foto) {
        var id = Number(foto.dataset.id);
        var i = -1;
        pecas.forEach(function (p, k) { if (p.id === id) i = k; });
        if (i === -1) {
          // a peça não está na coleção aberta: abre uma seleção só com a lista
          abreAvulsa(lista);
          pecas.forEach(function (p, k) { if (p.id === id) i = k; });
        }
        fechaPainel('lista');
        vaiPara(i, 'auto');
      }
    });
    el.nomeCliente.addEventListener('input', function () {
      nomeCliente = el.nomeCliente.value.trim();
      guardaLista();
      montaListaItens();
    });
    el.btnLimpar.addEventListener('click', limpaLista);

    // botões do topo
    el.btnGrade.addEventListener('click', function () {
      if (painelAberto() === 'grade') fechaPainel('grade');
      else { fechaPainel('lista'); abrePainel('grade'); marcaTrilho(); }
    });
    el.btnLista.addEventListener('click', function () {
      if (painelAberto() === 'lista') fechaPainel('lista');
      else { fechaPainel('grade'); abrePainel('lista'); }
    });
    el.btnTela.addEventListener('click', alternaTelaCheia);
    el.setaAnt.addEventListener('click', function () { vaiPara(atual - 1); });
    el.setaPro.addEventListener('click', function () { vaiPara(atual + 1); });

    document.addEventListener('click', function (e) {
      var f = e.target.closest('[data-fecha]');
      if (f) fechaPainel(f.dataset.fecha);
    });

    // teclado: setas andam, Esc fecha, F tela cheia, G grade, L lista
    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT') { if (e.key === 'Escape') e.target.blur(); return; }
      var aberto = painelAberto();
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': if (!aberto) { vaiPara(atual + 1); e.preventDefault(); } break;
        case 'ArrowLeft':  case 'ArrowUp':   if (!aberto) { vaiPara(atual - 1); e.preventDefault(); } break;
        case 'Escape': if (aberto) fechaPainel(aberto); break;
        case 'f': case 'F': alternaTelaCheia(); break;
        case 'g': case 'G': el.btnGrade.click(); break;
        case 'l': case 'L': el.btnLista.click(); break;
        case ' ': if (!aberto && document.body.dataset.tela === 'palco' && pecas[atual]) { alterna(pecas[atual].id); e.preventDefault(); } break;
      }
    });

    // a tela girou: o slide mudou de largura, e o palco precisa reencaixar
    window.addEventListener('resize', function () {
      if (document.body.dataset.tela === 'palco') vaiPara(atual, 'auto');
    });

    // a página voltou do fundo (outro app, tela apagada): o vídeo volta
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && document.body.dataset.tela === 'palco') ligaVideo(atual);
    });
  }

  /* ------------------------------------------------------------
     Partida
     ------------------------------------------------------------ */

  function comeca() {
    ['palco', 'trilho', 'inicio', 'colecoes', 'grade', 'gradeIn', 'gradeTit', 'lista', 'listaItens',
     'listaVazia', 'listaN', 'nomeCliente', 'btnInicio', 'btnGrade', 'btnTela', 'btnLista', 'btnPedido',
     'btnCliente', 'btnLimpar', 'setaAnt', 'setaPro', 'topoNome', 'topoSub', 'topoN', 'aviso',
     'btnPublicar', 'btnConta', 'contaEstado', 'publicar', 'pubForm', 'pubTitulo', 'pubSub', 'pubSlug',
     'pubN', 'pubEstado', 'pubEnviar', 'conta', 'contaForm', 'contaChave', 'contaEstadoIn', 'contaEnviar',
     'btnDesconectar']
      .forEach(function (id) { el[id] = document.getElementById(id); });

    carregaLista();
    midiaPreferida = le(CHAVE_MIDIA) === 'recorte' ? 'recorte' : 'previa';
    liga();
    atualizaConta();

    var acervoChegando = window.acervoAdiantado || fetch(ARQ_ACERVO).then(function (r) { return r.json(); });
    var vitrineChegando = window.vitrineAdiantada || fetch(ARQ_VITRINE).then(function (r) { return r.json(); });

    Promise.all([acervoChegando, vitrineChegando])
      .then(function (r) {
        acervo = r[0];
        colecoes = (r[1] && r[1].colecoes) || [];
        preparaAcervo();
        montaInicio();
        leEndereco();
        refleteLista();
      })
      .catch(function (erro) {
        el.colecoes.innerHTML = '<div class="vazio"><h2>A vitrine não carregou</h2>'
          + '<p>Tente atualizar a página. Se continuar assim, o catálogo completo está em '
          + '<a href="catalogo.html">catalogo.html</a>.</p></div>';
        console.error(erro);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', comeca);
  else comeca();
})();
