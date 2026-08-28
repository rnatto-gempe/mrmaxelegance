# MR MAX ELEGANCE — site oficial

Site institucional e página de links da marca **MR MAX ELEGANCE** (impressão 3D sob medida),
publicado no GitHub Pages. HTML, CSS e JavaScript puros — sem build, sem dependências.

## Páginas

| Arquivo | Endereço | O que é |
|---|---|---|
| `index.html` | `/` | **Home institucional.** Título impresso letra a letra, régua lateral que mede a página em centímetros reais, índice de peças, ficha técnica de materiais, processo em 4 passos, galeria e CTA de orçamento. |
| `links.html` | `/links.html` | **Bio links** para as redes sociais, com painel de analytics local (atalho `Ctrl/Cmd + Shift + A` ou três cliques na marca do rodapé) e exportação CSV. |
| `lp.html` | `/lp.html` | Landing page antiga de scrollytelling 3D (vídeo `assets/materialization.mp4`), mantida como histórico. |
| `catalogo.html` | `/catalogo.html` | **Catálogo de modelos para pedido.** Mosaico com 4.224 peças, régua de categorias, busca por nome (que entende português) e pedido direto no WhatsApp. Página `noindex, nofollow`. |

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
│   ├── catalogo.css    # estilos do catálogo
│   ├── style.css       # estilos da bio links
│   └── lp.css          # estilos da landing 3D
├── js/
│   ├── site.js         # régua calibrável, título impresso, índice de peças
│   ├── catalogo.js     # mosaico, filtro, busca e ficha de pedido
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
    ├── materialization.mp4
    ├── catalogo.json   # o catálogo inteiro (110 KB, 34 KB na rede)
    ├── catalogo/       # uma imagem WebP por peça
    └── peca-*.webp     # as seis fotos do índice da home
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

## Fontes

As cinco fontes ficam em `assets/fontes` (só o subconjunto latino) e são declaradas em
`css/fontes.css`. Vindas do Google, elas chegavam depois da primeira pintura e o texto
aparecia na fonte do sistema antes de trocar — com aquele salto de tamanho. As três usadas
acima da dobra entram com `<link rel="preload">` e ficam prontas em torno de 260 ms.

Cada família tem uma **fonte de espera** com `size-adjust` e `ascent-override` medidos, para
que o texto provisório ocupe exatamente o mesmo espaço caso o arquivo demore.

## Publicando uma alteração

O site está atrás do Cloudflare, que guarda CSS e JS por até 4 horas. Por isso as
folhas e os scripts são chamados com um número de versão:

```html
<link rel="stylesheet" href="css/site.css?v=20260822b">
```

**Ao mexer em qualquer arquivo de `css/` ou `js/`, troque esse número** (a data serve bem)
em todas as páginas que o usam. Sem isso, quem já visitou o site continua vendo a versão
antiga até o cache expirar. Para publicar na hora, dá para limpar o cache no painel do
Cloudflare (Caching → Purge Everything).

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

## O catálogo de modelos

`catalogo.html` mostra o acervo inteiro num mosaico e transforma qualquer peça em pedido
no WhatsApp. A página é `noindex, nofollow`: ela existe para o cliente escolher, não para
o Google listar.

> **Não bloqueie `/catalogo.html` no `robots.txt`.** Parece contraditório, mas é o
> contrário: bloqueado, o robô nunca lê a etiqueta `noindex` — e uma página que ele já
> conhece por um link continua aparecendo na busca. A etiqueta na página é o que tira
> ela do índice, e para isso o robô precisa poder abri-la. Pelo mesmo motivo o catálogo
> fica fora do `sitemap.xml`.

### Como a página aguenta 4 mil peças sem servidor

| Peça do quebra-cabeça | O que faz |
|---|---|
| `assets/catalogo.json` | Todo o acervo num arquivo só, em listas em vez de objetos: 215 KB, que viram 73 KB comprimidos na rede. |
| Pedido adiantado no `<head>` | O `fetch` do catálogo sai antes do CSS e do JS, e o `js/catalogo.js` consome a promessa. **Não use `<link rel="preload" as="fetch">` aqui:** ele obriga o link e o fetch a combinarem modo e credenciais, e quando não combinam o navegador descarta o adiantamento e baixa o arquivo duas vezes — sem avisar nada além do console. |
| Desenho em lotes | Entram 60 cards por vez, quando o fim do mosaico se aproxima. A tela nunca segura 4 mil elementos. |
| `loading="lazy"` + medidas na `<img>` | O navegador só baixa a imagem que vai aparecer, e já sabe o tamanho dela — nada pula de lugar enquanto carrega. |
| Índice de busca pronto | O texto de cada peça é normalizado uma vez, na chegada dos dados, não a cada tecla digitada. |

### As imagens, e por que o fundo não está nelas

Cada peça tem um WebP em `assets/catalogo/<id>.webp` que contém **só a peça, com
fundo transparente**. O fundo texturizado é desenhado pelo CSS, na área do card.

Essa separação é o que faz a peça nunca aparecer cortada. Fundo assado na imagem
significa imagem de proporção fixa; e como o card muda de proporção conforme o
formato e a largura da tela, o navegador precisaria cortar a imagem para preencher —
e o que ele corta é a peça. Com o fundo no CSS, a peça fica em `contain` (aparece
inteira, centrada, com respiro) e a textura preenche o que sobrar, seja qual for o
tamanho do card.

Os quatro passos até o arquivo:

1. **O título sai.** As fotos da origem trazem o nome impresso em cima. O gerador acha
   a faixa de fundo livre entre o texto e a peça e corta ali. Quando essa faixa não
   existe — a peça encosta no texto —, ele não corta: melhor sobrar título do que
   decepar a peça.
2. **A peça é separada do estúdio.** O brilho quase resolve, mas peça preta e vidro
   escuro cairiam junto com o fundo. Então o que é fundo é decidido por conexão: só é
   fundo o preto que chega até a borda da foto. O preto cercado pela peça passa por uma
   segunda pergunta — chapado e no tom do fundo é vão vazado (vira transparência); com
   relevo é peça (fica opaco). Sem isso, o vão de uma escultura vira mancha preta.
3. **A peça é medida.** O retângulo que ela ocupa decide o formato do card: peça
   deitada vai para o panorâmico, peça esguia para o retrato, o resto fica quadrado, e
   uma parte dos quadrados vira destaque grande. O formato é da peça, não da posição na
   tela — por isso o mosaico continua certo quando o filtro muda a ordem.
4. **A cor do fundo sai da peça.** A cor dominante é virada para o lado oposto do
   círculo de cores e vira uma matiz escura; ela e o número do desenho de preenchimento
   vão para o catálogo. São dois números por peça — as três cores do fundo o CSS deriva
   sozinho, com `hsl()` em cima da matiz.

Gravado em WebP com transparência, ~20 KB por imagem.

### O fundo dos cards

`css/catalogo.css` desenha seis preenchimentos, os mesmos que a impressora usa por
dentro das peças: linhas, grade, grade diagonal, triangular, concêntrico e cúbico.
Cada um é só `repeating-linear-gradient` (ou `repeating-radial-gradient`), montado numa
variável `--desenho` que a regra do card consome. Consequências práticas: escala em
qualquer resolução sem borrar, não custa download nenhum, e o passo do desenho abre nos
cards grandes (`--passo`) para não virar ruído.

O JavaScript só põe no card a classe do desenho (`p0`…`p5`) e a matiz (`--h`). Todo o
resto — as duas cores do degradê e o tom do traço — sai daí por `hsl()`.

### A régua de categorias

O filtro do catálogo não é uma trilha de pílulas: cada categoria ocupa largura
proporcional ao tamanho dela, então a barra mostra a composição do acervo no
mesmo gesto em que serve de filtro. São duas fileiras porque Casa tem 1.405
peças e Pets tem 37 — numa escala só, Pets viraria um fio de dois pixels sem
lugar para o nome. Cada fileira tem a sua própria escala, e a de baixo é mais
baixa de propósito: sem essa diferença de altura, ela pareceria ter categorias
maiores que a de cima.

O `flex-grow` é a **raiz quadrada** da quantidade, não a quantidade. Sem
comprimir a escala, Casa comeria a fileira inteira e todas as outras
encostariam no tamanho mínimo, que é o mesmo que não ter proporção nenhuma.

No telefone a régua vira um `<details>` recolhido: quinze faixas empilhadas
empurram a primeira peça para fora da tela, e a tela é o que importa.

### Busca em português

Os nomes do acervo estão em inglês. `js/catalogo.js` traz um dicionário que traduz o que
o cliente digita antes de procurar: quem escreve `dragão` acha `Dragon`, quem escreve
`luminária` acha `Lamp`. Para cobrir uma palavra nova, basta acrescentar uma linha em
`TRADUCAO` — a chave sem acento e em minúsculas, o valor com os termos em inglês
separados por espaço.

### Quando o acervo crescer

Os scripts que montaram o catálogo ficaram fora do repositório (eles carregam credencial
de acesso ao acervo). O que precisa acontecer para atualizar:

1. Buscar a lista de peças e guardar as novas.
2. Rodar as imagens novas pelos quatro passos acima, para `assets/catalogo/`.
3. Regerar `assets/catalogo.json` com id, nome, categorias, material, formato do card,
   matiz do fundo, desenho do preenchimento e as medidas da imagem.
4. Subir a versão nos links de `catalogo.html` (`?v=…`), para o Cloudflare soltar o
   arquivo novo na hora.

## Os dois caminhos para o catálogo, na home

1. **Botão no topo** (`.cta-catalogo`), vazado ao lado do ORÇAMENTO sólido:
   dois destinos diferentes não podem ter o mesmo peso. Quem já sabe o que
   quer aperta o cheio; quem veio olhar aperta o vazado. O número do acervo
   vai junto do rótulo e some no telefone, onde não cabe.
2. **Faixa no meio da rolagem** (`.catalogo-faixa`), logo depois de "Como a
   peça nasce": o cliente acabou de entender o processo, é a hora de mostrar o
   que dá para pedir. A fita de peças rolando não é enfeite — ela é o
   argumento, e diz "tem muita coisa" melhor do que qualquer frase escrita ali.

A fita aparece duas vezes na marcação de propósito: a volta precisa emendar
sem salto, então quando a primeira cópia termina de passar, a segunda já está
no lugar exato onde a primeira começou. As duas metades têm de ter a mesma
largura, ou o laço dá um pulo visível a cada volta.

## Os espaços de foto da home

São 15 `<figure class="slot">`. Onze já têm imagem; **quatro continuam
esperando foto real do ateliê** e não devem ser preenchidos com modelo do
catálogo:

- `Foto larga — bancada, impressora em ação ou coleção de peças` (hero)
- `Detalhe da impressão` (galeria)
- `Peça na casa` (galeria)
- `Bancada` (galeria)

Esses quatro prometem o trabalho acontecendo. Um render ali seria apresentar
imagem de catálogo como registro do que a marca faz — é a única razão pela
qual eles seguem vazios.

Para publicar, coloque o arquivo em `assets/` e insira a `<img>` **antes** do
`<span class="slot-txt">`; o texto-guia some sozinho quando existe imagem.
