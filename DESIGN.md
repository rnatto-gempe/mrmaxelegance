# DESIGN.md — MR MAX ELEGANCE

## Theme

**Escuro, sempre.** Não por reflexo de "site técnico é preto": a peça impressa
é o assunto, e ela é fotografada em estúdio com fundo preto. Fundo escuro faz
a peça acender; fundo claro a recorta contra o branco e mata o brilho do
filamento. O preto tem azul dentro (`#05070A`), nunca `#000`.

## Color

Estratégia: **restrained** no cromo do site, **full palette** dentro dos cards.

O site anda em preto e cinzas com um azul de impressão como único acento. Mas
cada peça do catálogo traz a sua própria cor de fundo, tirada dela mesma: a cor
dominante da peça é virada para o lado oposto do círculo de cores e vira uma
matiz escura. É por isso que o mosaico tem centenas de cores sem ter paleta
definida em lugar nenhum.

| Papel | Valor | Onde |
|---|---|---|
| Fundo | `#05070A` | corpo de tudo |
| Fundo 2 / 3 | `#0B1017` · `#10161F` | blocos, campos, faixas |
| Texto | `#F2F6FA` | corpo |
| Azul de impressão | `#1E7BE8` | acento, foco, cotas |
| Azul claro | `#4FA3F7` | links, rótulos técnicos |
| Linha | `#1C242F` | bordas e fios |
| Verde do zap | `#25D366` | só o botão de pedido |
| Cinzas | `#A9B7C4` → `#556270` | seis passos, todos medidos para AA |

Fundo de peça, em CSS, derivado de uma matiz `--h` por peça:
`--fundo: hsl(var(--h) 40% 8%)` · `--topo: hsl(calc(var(--h) + 16) 34% 17%)` ·
`--traco: hsl(var(--h) 45% 58% / .22)`.

## Typography

Três famílias, servidas pelo próprio site, com fontes de espera calçadas para
não haver salto no carregamento (`css/fontes.css`).

- **Archivo** (variable, 600–800, largura 108–118%) — títulos. Condensada e
  pesada, caixa alta, `letter-spacing: -.03em`. É a voz que grita.
- **Sora** (variable, 300–600) — corpo. Neutra e legível, sem personalidade
  competindo com o título.
- **Space Mono** — cotas, contadores, rótulos técnicos, códigos de peça. É o
  que faz a página parecer medida.

Escala fluida com `clamp()`, razão ≥1.25 entre passos. Corpo em 65–75ch.

## Layout

- Régua lateral fixa (`--calha`) mede a página em centímetros reais e é
  calibrável pelo visitante. É o elemento mais característico do site.
- `--cm: 37.8px` — px por centímetro, recalibrável no painel CAL.
- Mosaico do catálogo: grid de 6 colunas na tela de um MacBook, com altura de
  linha medida em JavaScript (a largura da coluna) para os quatro formatos de
  card encaixarem sem sobra.
- Espaçamento com `clamp()`, variado por seção. Nada de padding uniforme.

## Components

### A régua de categorias (`.regua`)
O filtro do catálogo. Cada categoria ocupa largura proporcional ao tamanho
dela (`flex-grow` = raiz quadrada da quantidade), em duas fileiras: a de baixo
é mais baixa, porque tem outra escala e a altura precisa dizer isso. No
telefone vira `<details>` recolhido.

### O card de peça (`.peca`)
Imagem com fundo transparente em `contain`, sobre fundo desenhado em CSS.
Quatro formatos, escolhidos medindo a silhueta da peça na geração da imagem:
quadrado, destaque (2×2), panorâmico (2×1), retrato (1×2).

### Os seis preenchimentos (`.p0`–`.p5`)
Linhas, grade, grade diagonal, triangular, concêntrico, cúbico. Todos em
`repeating-linear-gradient` / `repeating-radial-gradient`, montados numa
variável `--desenho`. São os mesmos padrões que a impressora usa por dentro
das peças. Escalam sem borrar e não custam download.

### Botões
`.btn-solido` (branco, ação principal) · `.btn-vazado` (contorno) ·
`.botao-zap` (verde, só pedido). Altura 50px, `transform: translateY(-2px)`
no hover.

## Motion

Saídas exponenciais (`cubic-bezier(.2,.8,.3,1)`), 160–320ms. Sem bounce.
Imagem entra por opacidade após decodificar, nunca com meio-quadro cinza.
`prefers-reduced-motion` para tudo, inclusive a fita da home.
