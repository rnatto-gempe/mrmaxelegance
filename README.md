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
├── tools/
│   ├── raspa-stlflix.py          # lê o acervo de origem (taxonomia + vídeos)
│   ├── classifica-sensorial.py   # marca as faixas Sensorial/Articulados/Brinquedos
│   └── converte-hover.py         # vídeo de 8 MB → prévia de 39 KB
├── css/
│   ├── site.css        # estilos da home
│   ├── catalogo.css    # estilos do catálogo
│   ├── style.css       # estilos da bio links
│   └── lp.css          # estilos da landing 3D
├── js/
│   ├── site.js         # régua calibrável, título impresso, índice de peças
│   ├── catalogo.js     # mosaico, filtro, busca e ficha de pedido
│   ├── app.js          # bio links + analytics
│   ├── metricas.js     # eventos do catálogo (PostHog, sem SDK)
│   ├── chave-posthog.js # a chave do PostHog, num arquivo só
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
    ├── hover/          # prévia por peça: MP4 de 3s, ou WebP da galeria
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
mesmo gesto em que serve de filtro. São duas fileiras porque Brinquedos tem
1.465 peças e Pets tem 37 — numa escala só, Pets viraria um fio de dois pixels sem
lugar para o nome. Cada fileira tem a sua própria escala, e a de baixo é mais
baixa de propósito: sem essa diferença de altura, ela pareceria ter categorias
maiores que a de cima.

O `flex-grow` é a **raiz quadrada** da quantidade, não a quantidade. Sem
comprimir a escala, Casa comeria a fileira inteira e todas as outras
encostariam no tamanho mínimo, que é o mesmo que não ter proporção nenhuma.

No telefone a régua vira um `<details>` recolhido: dezessete faixas empilhadas
empurram a primeira peça para fora da tela, e a tela é o que importa.

### Busca em português

Os nomes do acervo estão em inglês. `js/catalogo.js` traz um dicionário que traduz o que
o cliente digita antes de procurar: quem escreve `dragão` acha `Dragon`, quem escreve
`luminária` acha `Lamp`. Para cobrir uma palavra nova, basta acrescentar uma linha em
`TRADUCAO` — a chave sem acento e em minúsculas, o valor com os termos em inglês
separados por espaço.

### As faixas Sensorial, Articulados e Brinquedos

A faixa `Brinquedos` existia declarada no catálogo com **zero peça** — e
como a régua só mostra faixa com peça de verdade, ela nunca apareceu na
tela. Os fidgets estavam espalhados por `Arte`, `Peças grandes` e por
categoria nenhuma. A causa era o cruzamento com a origem: as peças vêm
rotuladas `Toys & Articulated` e esse rótulo não chegou até aqui.

A primeira versão disto adivinhava pelo nome da peça. Não precisa mais:
`tools/raspa-stlflix.py` traz a taxonomia do acervo, e nela existe
subcategoria `Fidgets`, quatro famílias de `Articulated` e a macro
`Toys & Articulated`. As três faixas saem de `tools/classifica-sensorial.py`:

| Faixa | Subcategorias da origem | Peças |
|---|---|---|
| **Sensorial** | Fidgets, Kinetic Sculptures, Massagers & Scratchers | 115 |
| **Articulados** | as cinco famílias `Articulated` | 678 |
| **Brinquedos** | a macro `Toys & Articulated` inteira, mais Mini Toys, Building Toys, Puzzles, Party Games, Vehicles, Blasters, Tricks & Pranks, Sports | 1.465 |

Sensorial é a faixa que menos pode errar — ela existe para quem procura peça
de autorregulação, foco, TDAH, autismo. Só entra subcategoria em que a peça
é feita para a mão. `Puzzles` ficou de fora dela: no acervo, puzzle é kit de
encaixe (o cavaleiro que monta sem cola), brincadeira de montar e não peça de
autorregulação — ele vive em Brinquedos.

Todo articulado entra também em Brinquedos: quem procura peça para as mãos
espera achar o dragão flexi nas duas faixas.

Depois disso, as peças sem categoria nenhuma caíram de **525 para 131**.

O script refaz as três faixas do zero a cada execução, então rodar de novo
depois de acrescentar peça é seguro:

```bash
python3 tools/classifica-sensorial.py             # só o relatório
python3 tools/classifica-sensorial.py --amostra   # lista peça por peça
python3 tools/classifica-sensorial.py --gravar    # aplica no catalogo.json
```

Duas consequências no resto da página:

- **A etiqueta do card mostra a faixa mais específica.** Um clicker ficava
  marcado "Brinquedos" só porque essa categoria é mais antiga na lista. Agora
  vale a categoria que o cliente está filtrando; sem filtro, vale a mais
  específica das três.
- **A busca fala a língua do cliente, não a do acervo.** Nenhuma peça se chama
  "sensorial" — elas se chamam Fidget, Clicker, Flexi. `TRADUCAO` liga
  `sensorial`, `tátil`, `autismo`, `TDAH`, `ansiedade`, `concentração`,
  `apertar`, `girar`, `pião` e `antiestresse` a esses nomes.

Cada faixa tem endereço próprio, que dá para mandar no WhatsApp:
`/catalogo.html?cat=sensorial`, `?cat=articulados`, `?cat=brinquedos`.

### A prévia animada no card e na ficha

Cada peça do acervo tem um vídeo de 8 segundos mostrando a mão girando ela.
O arquivo de origem é um reels: VP9, 1080×1350, 30 quadros, **8 MB por
peça** — servir aquilo no mosaico seria entregar 8 MB por passada de mouse.
`tools/converte-hover.py` corta 3 segundos, reduz para 400 pixels de altura
e grava H.264 em `assets/hover/<id>.mp4`: **39 KB de média**.

**Por que não é GIF.** O mesmo trecho, nos três formatos:

| Formato | Peso | Por quê |
|---|---|---|
| GIF | 2.177 KB | não comprime entre quadros e só tem 256 cores |
| WebP animado | 409 KB | comprime melhor, ainda sem previsão de movimento |
| **MP4 H.264** | **56 KB** | quadro-chave + diferença, decodificado em hardware |

O GIF é 39 vezes mais pesado que o vídeo — e mais feio. `<video muted
playsinline loop preload="none">` faz o papel dele sem nenhuma das
desvantagens.

Três regras seguram o custo no mosaico, e as três estão em `js/catalogo.js`:

1. **`preload="none"` e nada de `<video>` no HTML.** O elemento é criado no
   momento em que o mouse chega. Abrir o catálogo com 60 cards na tela baixa
   zero byte de vídeo.
2. **Um vídeo por vez.** Ao sair do card, o anterior é pausado, tem o `src`
   removido e sai do DOM — vídeo pausado que fica no documento continua
   segurando buffer. Rolar a página com o mouse parado também solta.
3. **Um respiro de 140 ms antes de carregar.** Atravessar o mosaico passa
   por vinte cards, e nenhum deles quer vídeo.

Medido no navegador: uma sessão que abriu o filtro Sensorial (115 peças, 59
cards com vídeo na tela), passou o mouse em três e abriu duas fichas baixou
**2 arquivos, 50 KB**.

Fica sem prévia, de propósito, quem pediu `prefers-reduced-motion: reduce` e
quem está em `saveData` ou rede 2G/3G — a animação é enfeite, não conteúdo.
No telefone o dedo não faz hover: lá a prévia vive na ficha, que carrega o
vídeo sozinha porque quem abriu a peça já demonstrou interesse.

O catálogo sabe quais peças animam pela lista `hover` dentro do próprio
`assets/catalogo.json` — nenhum pedido de rede a mais só para descobrir isso.

Um detalhe de layout que o vídeo trouxe à luz, e que a foto já sofria: na
ficha em uma coluna, a mídia passava por cima do nome da peça. Eram duas
coisas juntas — a altura estava no quadro e não na linha do grid (`minmax(0,
1fr)` deixava a linha do tamanho do conteúdo, e aí o `max-height: 100%` da
mídia não tinha medida a que se referir), e item de grid nasce com
`min-height: auto`, que vence o `max-height` quando a mídia é maior que a
área. Agora a linha manda (`grid-template-rows: 40vh auto`) e a mídia tem o
mínimo zerado. A foto de peça esguia deixou de transbordar junto.
Quem grava essa lista é o conversor, lendo a pasta `assets/hover/`.

```bash
python3 tools/converte-hover.py --faixa sensorial
python3 tools/converte-hover.py --faixa articulados
python3 tools/converte-hover.py --faixa brinquedos
python3 tools/converte-hover.py --todas               # o acervo inteiro
python3 tools/converte-hover.py --todas --paralelo 8  # mais gentil com a origem
```

O ffmpeg lê o WebM direto da origem e para no terceiro segundo, então baixa
uma fração dos 8 MB.

**O acervo convertido:** 4.052 das 4.084 peças que têm vídeo na origem
(99,2%), **149,8 MB**, média de 37,8 KB. As outras **140 peças do catálogo
nunca receberam vídeo no STLFLIX** — para elas a prévia é uma foto da
galeria (veja abaixo). Restaram 32 que a rede não deixou converter; rodar o
comando de novo pega só essas.

### O que a conversão em massa ensinou

Duas coisas quase mataram a rodada, e as duas viraram código:

**Trabalhador preso é pior que trabalhador lento.** Sem timeout, nove dos
doze processos ficaram pendurados em conexões que nunca responderam — 1h18
cada, sem erro nenhum, e a conversão simplesmente parou de andar. Hoje o
ffmpeg desiste depois de 20 s sem receber byte (`-rw_timeout`) e o Python
mata a conversão que passa de 150 s. Com todos vivos, o ritmo triplicou.

**Média não é ritmo.** O relatório dividia o total pelo tempo desde o
início, então mostrava "14/min" enquanto nada acontecia havia uma hora. Um
número que mente por construção é pior que número nenhum.

E uma que não tem como resolver no código: **paralelismo não vence banda.**
Subir de 12 para 24 conversões simultâneas derrubou a taxa de 20/min para
3,6/min — a CPU estava 54% ociosa, os encoders somavam ~0% de uso, e todos
esperavam rede. Depois de ~2.500 downloads a origem passou a limitar o IP
(um arquivo isolado não completava 2 MB em 2min30), e a única saída foi
pausar e retomar mais tarde, com 8 em paralelo.

### As 140 peças que a origem nunca filmou

Nem toda peça tem vídeo no STLFLIX: 140 do catálogo nunca receberam um. O
card delas ficaria parado enquanto o vizinho anima — e não precisa, porque
todas têm galeria, de cinco a sete fotos. A primeira foto da galeria mostra a
peça em cena real, de outro ângulo, que é exatamente o papel que o vídeo
cumpre nas outras.

`tools/foto-hover.py` busca essa foto e grava `assets/hover/<id>.webp`:
**125 peças, 7 KB de média** (as outras 15 não têm nada além da miniatura, que
o card já mostra — repetir ela no hover não contaria nada de novo). Fundo de
estúdio chapado comprime muito, e é por isso que a foto sai mais leve que o
vídeo.

A galeria não vem na busca do acervo, só na página da peça, então o script lê
cada uma pela rota de dados do Next — e descobre o número da versão publicada
da plataforma na home, porque ele muda a cada deploy deles.

O catálogo lê **duas listas**: `hover` (vídeo) e `hover_foto` (imagem). Vídeo
tem preferência quando existem os dois. No card, a foto entra pela mesma
mecânica do vídeo, com a mesma transição — só o selo de play fica de fora,
que aquilo ali não toca. Total: **4.177 das 4.224 peças com prévia (98,9%)**.

```bash
python3 tools/foto-hover.py --gravar
python3 tools/foto-hover.py --gravar --refazer   # troca as fotos já baixadas
```

Um detalhe de CSS que custou uma medição: a mídia da ficha fica em **tamanho
natural** (`width: auto`), não em `width: 100%`. Esticada para a largura do
quadro, a foto de 400 px nativos virava 691 px e **inflava a linha do grid**
além da caixa — o botão de pedir saía da tela. O `max-height: 100%` não
segura isso: numa linha dimensionada pelo conteúdo, o cálculo é circular.

### Medição: o que o catálogo conta ao PostHog

`js/app.js` já carregava o SDK do PostHog na página de links, e faltava
apenas a chave. No catálogo o caminho é outro: **não há SDK**. O SDK oficial
pesa cerca de 55 KB comprimido — quase o peso do catálogo inteiro (73 KB) —
e traz autocapture e session replay que ninguém pediu. `js/metricas.js`
manda os eventos direto para o endpoint público de captura em 2 KB, e eles
chegam nos mesmos painéis.

A chave mora sozinha em `js/chave-posthog.js`, lida pelas duas páginas:
duas cópias da mesma chave é uma que fica velha. Ela é pública por natureza
(vai no JavaScript de qualquer site que meça algo, e só permite escrita).

**Sem chave, nada sai do navegador** — nenhuma requisição, nenhum byte. O
mesmo vale para quem tem `doNotTrack` ligado. O visitante é um número
aleatório guardado no navegador; não há login, nome nem e-mail em lugar
nenhum.

Cinco perguntas, e nada além delas:

| Evento | Responde |
|---|---|
| `$pageview` | quantas visitas, e com qual faixa/termo na URL |
| `busca` | o que procuram — e `sem_resultado: true` é **demanda que o acervo não atende** |
| `faixa_filtrada` | qual seção o cliente realmente usa |
| `peca_aberta` | quais peças despertam interesse |
| `previa_vista` | em quais o mouse parou até o vídeo tocar (uma vez por peça, por visita) |
| `pedido_whatsapp` | a única conversão que este site tem, peça por peça |

Três detalhes que o código carrega de propósito:

- **`text/plain` no envio.** Com `application/json` o navegador manda uma
  requisição de permissão antes (preflight) e dobra a viagem.
- **`sendBeacon` antes de `fetch`.** O evento de pedido acontece no clique
  que leva a pessoa para o WhatsApp; `sendBeacon` entrega mesmo com a página
  saindo, e não atrasa o clique em nada.
- **A busca espera 900 ms de silêncio.** Sem isso, "dragão" viraria seis
  eventos — e "d", "dr", "dra" não são perguntas que alguém fez.

Se `js/metricas.js` não estiver na página, o catálogo funciona igual: as
chamadas passam por um atalho que não faz nada.

### O acervo de origem, e como ele é lido

`tools/raspa-stlflix.py` lê a plataforma do STLFLIX pela mesma busca que a
página "Todos os modelos" usa (`POST /api/elasticsearch`) e guarda em
`tools/dados/stlflix.json` o que o catálogo daqui precisa: id, slug,
miniatura, a taxonomia real (macro, categoria, subcategoria, tags) e a URL
do vídeo de hover. São 49 páginas de 100 peças, com respiro entre elas.

É desse arquivo que saem as três faixas novas e as prévias animadas. Ele
fica em `tools/dados/` e não em `assets/`: é matéria-prima de geração, não
algo que o navegador do cliente baixe. E fica **fora do versionamento** —
este repositório é público e o dump é o acervo do fornecedor. Regerar leva
cerca de um minuto.

Na última leitura o acervo tinha **4.231 peças, 4.089 delas com vídeo** — e
7 peças novas que ainda não estão no catálogo daqui (falta gerar a imagem de
fundo transparente por elas).

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
