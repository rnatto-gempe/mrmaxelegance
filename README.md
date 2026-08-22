# MR MAX ELEGANCE — site oficial

Site institucional e página de links da marca **MR MAX ELEGANCE** (impressão 3D sob medida),
publicado no GitHub Pages. HTML, CSS e JavaScript puros — sem build, sem dependências.

## Páginas

| Arquivo | Endereço | O que é |
|---|---|---|
| `index.html` | `/` | **Home institucional.** Título impresso letra a letra, régua lateral que mede a página em centímetros reais, índice de peças, ficha técnica de materiais, processo em 4 passos, galeria e CTA de orçamento. |
| `links.html` | `/links.html` | **Bio links** para as redes sociais, com painel de analytics local (atalho `Ctrl/Cmd + Shift + A` ou três cliques na marca do rodapé) e exportação CSV. |
| `lp.html` | `/lp.html` | Landing page antiga de scrollytelling 3D (vídeo `assets/materialization.mp4`), mantida como histórico. |

## Estrutura

```
mrmaxelegance/
├── index.html          # home (design v2)
├── links.html          # bio links
├── lp.html             # landing 3D anterior
├── 404.html            # página de erro na identidade da marca
├── robots.txt          # libera a indexação e aponta o sitemap
├── sitemap.xml         # mapa das páginas para os buscadores
├── css/
│   ├── site.css        # estilos da home
│   ├── style.css       # estilos da bio links
│   └── lp.css          # estilos da landing 3D
├── js/
│   ├── site.js         # régua calibrável, título impresso, índice de peças
│   ├── app.js          # bio links + analytics
│   ├── config.js       # links, contatos e chaves de analytics
│   └── lp.js           # motor de scrollytelling da lp.html
└── assets/
    ├── logo-mrmax.jpeg # logotipo (500×500)
    ├── og.jpg          # imagem de compartilhamento (1200×630)
    ├── icone-32.png    # favicon
    ├── icone-180.png   # ícone de tela de início do iOS
    ├── avatar.webp     # avatar da bio links (9 KB)
    ├── avatar.png      # mesmo avatar, para navegadores sem WebP
    └── materialization.mp4
```

## Trocando para um domínio próprio

O endereço aparece em lugares que os buscadores leem, e todos precisam mudar juntos:

1. `CNAME` na raiz do repositório com o domínio (ex.: `www.mrmaxelegance.com.br`)
2. DNS do domínio apontando para o GitHub Pages (CNAME para `rnatto-gempe.github.io`)
3. `<link rel="canonical">`, `og:url` e `og:image` em `index.html` e `links.html`
4. Os três `<loc>` do `sitemap.xml` e a linha `Sitemap:` do `robots.txt`
5. `url`, `image` e `logo` no bloco JSON-LD de `index.html`
6. `homeUrl` e `share.url` em `js/config.js`

## Publicando fotos das peças

A home tem 15 espaços de imagem esperando foto. Cada um é uma `<figure class="slot">` com um
texto-guia. Para publicar uma foto, coloque o arquivo em `assets/` e insira a `<img>` **antes**
do `<span class="slot-txt">` — o texto-guia some sozinho quando existe imagem:

```html
<figure class="slot">
  <img src="assets/pecas/dragao.jpg" alt="Dragão articulado impresso em PLA">
  <span class="slot-txt">Dragão articulado</span>
</figure>
```

Os espaços estão no hero (vista frontal), na faixa larga, nos 6 itens do índice de peças
e nos 7 quadros da galeria.

## A régua lateral

A calha da esquerda é uma régua de verdade: usa a densidade de pixels da tela para desenhar
centímetros. Dá para arrastar (mouse ou toque) para medir qualquer elemento e calibrar no
botão **CAL** encostando um cartão de crédito na tela — a calibração fica salva no navegador.

## Rodando local

```bash
python3 -m http.server 4321
# http://localhost:4321/
```

## Contatos oficiais

- WhatsApp: (43) 99607-0804 — https://wa.me/5543996070804
- Instagram: [@rmmax.elegance](https://www.instagram.com/rmmax.elegance/)
- E-mail: contato@mrmaxelegance.com.br

---

**Nota:** a pasta `radar/` (ferramenta interna de pesquisa de mercado) fica fora do
versionamento por conter dados de sessão e chats — veja `.gitignore`.
