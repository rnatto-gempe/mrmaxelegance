/* ============================================================
   MR MAX ELEGANCE — publicar no site, direto do celular

   O site não tem servidor: é um repositório no GitHub servido pelo
   Pages. Então "publicar" é gravar um arquivo no repositório, e a API
   de conteúdo do GitHub faz isso com um pedido só. Esta folha é a ponte:
   guarda a chave, lê e grava `assets/vitrine.json`.

   A chave é um token de acesso pessoal **granular**, restrito a este
   repositório, com permissão só de conteúdo. Ela mora no localStorage
   do aparelho que publica — nunca no código, que é público.
   ============================================================ */

(function () {
  'use strict';

  var REPO = {
    dono: 'rnatto-gempe',
    nome: 'mrmaxelegance',
    ramo: 'main',
    arquivo: 'assets/vitrine.json'
  };

  var CHAVE = 'mrmax.github.chave';
  var API = 'https://api.github.com';

  function chave() {
    try { return localStorage.getItem(CHAVE) || ''; } catch (e) { return ''; }
  }

  function guardaChave(t) {
    try {
      if (t) localStorage.setItem(CHAVE, t.trim());
      else localStorage.removeItem(CHAVE);
    } catch (e) { /* modo privado: a chave vive só nesta aba */ }
  }

  function repo() {
    return '/repos/' + REPO.dono + '/' + REPO.nome;
  }

  // Um pedido à API, já com os cabeçalhos. Erro HTTP vira exceção com a
  // mensagem que o GitHub mandou — "Bad credentials", "Not Found" —,
  // que é o que a pessoa precisa ler.
  function pede(caminho, opcoes) {
    opcoes = opcoes || {};
    var cab = {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + chave(),
      'X-GitHub-Api-Version': '2022-11-28'
    };
    for (var k in (opcoes.headers || {})) cab[k] = opcoes.headers[k];
    opcoes.headers = cab;
    return fetch(API + caminho, opcoes).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          var e = new Error(j.message || ('erro ' + r.status));
          e.status = r.status;
          throw e;
        }
        return j;
      });
    });
  }

  // `btoa` só aceita Latin-1, e os títulos têm acento. O texto vira bytes
  // UTF-8 primeiro; cada byte vira um caractere; aí sim base64.
  function utf8ParaBase64(txt) {
    var bytes = new TextEncoder().encode(txt);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function base64ParaUtf8(b64) {
    var bin = atob(b64.replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* ------------------------------------------------------------
     O que a vitrine chama
     ------------------------------------------------------------ */

  // Quem é a chave, e se ela pode escrever neste repositório. Os dois
  // pedidos juntos: é o que a tela de conta mostra ao conectar.
  function confere() {
    return Promise.all([pede('/user'), pede(repo())]).then(function (r) {
      return {
        usuario: r[0].login,
        escreve: !!(r[1].permissions && r[1].permissions.push)
      };
    });
  }

  function leArquivo() {
    return pede(repo() + '/contents/' + REPO.arquivo + '?ref=' + encodeURIComponent(REPO.ramo)
                + '&t=' + Date.now())
      .then(function (j) {
        return { sha: j.sha, texto: base64ParaUtf8(j.content) };
      });
  }

  function gravaArquivo(texto, sha, mensagem) {
    return pede(repo() + '/contents/' + REPO.arquivo, {
      method: 'PUT',
      body: JSON.stringify({
        message: mensagem,
        content: utf8ParaBase64(texto),
        sha: sha,
        branch: REPO.ramo
      })
    });
  }

  window.publica = {
    REPO: REPO,
    temChave: function () { return !!chave(); },
    guardaChave: guardaChave,
    confere: confere,
    leArquivo: leArquivo,
    gravaArquivo: gravaArquivo
  };
})();
