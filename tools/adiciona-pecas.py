#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Acrescenta ao catálogo as peças que o acervo de origem ganhou desde a última vez.

O README conta os quatro passos que geram a imagem de cada card, e o script
original desses passos ficou fora do repositório. Este aqui os refaz:

  1. O título sai: a foto da origem traz o nome impresso em cima. Corta-se
     na faixa de fundo livre entre o texto e a peça; sem faixa, não corta.
  2. A peça é separada do estúdio por conexão: só é fundo o preto que
     chega até a borda. O preto cercado pela peça é vão vazado (vira
     transparência) se for chapado, e é peça se tiver relevo.
  3. A peça é medida, e o retângulo dela decide o formato do card.
  4. A cor dominante, virada para o lado oposto do círculo, vira a matiz
     do fundo.

Lê tools/dados/stlflix.json (python3 tools/raspa-stlflix.py antes) e
compara com assets/catalogo.json. Toda peça nova entra **no fim** do
arquivo — a posição é o código da peça, e isso é contrato.

    python3 tools/adiciona-pecas.py              # relatório: o que entraria
    python3 tools/adiciona-pecas.py --gravar     # baixa, recorta e acrescenta
    python3 tools/adiciona-pecas.py --gravar --ids 4417,4418
    python3 tools/adiciona-pecas.py --gravar --limite 5

Depois: python3 tools/converte-hover.py --ids <novos>  (as prévias em vídeo)
        python3 tools/classifica-sensorial.py --gravar  (as três faixas)
        e trocar o ?v= de assets/catalogo.json nas páginas que o carregam.
"""

import argparse
import io
import json
import os
import sys
import urllib.request

import numpy as np
from PIL import Image, ImageFilter

# o console do Windows nasce em cp1252, e o relatório tem ✓ e ✗
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGO = os.path.join(RAIZ, 'assets', 'catalogo.json')
ACERVO = os.path.join(RAIZ, 'tools', 'dados', 'stlflix.json')
IMAGENS = os.path.join(RAIZ, 'assets', 'catalogo')
THUMBS = os.path.join(RAIZ, 'tools', 'dados', 'thumbs')

LADO = 460               # o maior lado da imagem gravada
ESCURO = 40              # abaixo disto é preto de estúdio
BORDA_SUAVE = 90         # até aqui a borda ganha transparência parcial
CABECALHO = {'user-agent': 'mrmaxelegance-catalogo/1.0 (assinante STLFLIX)'}

# ------------------------------------------------------------
# Taxonomia da origem -> faixas do catálogo
#
# Aprendida do próprio catálogo: para cada categoria e subcategoria da
# origem, a faixa daqui que aparece em (quase) toda peça que a tem.
# ------------------------------------------------------------
POR_CATEGORIA = {
    'Household': ['casa'],
    'Art': ['arte'],
    'Seasonal': ['datas'],
    'Gadgets': ['gadgets'],
    'Toys': ['brinquedos'],
    'Games': ['games', 'brinquedos'],
    'Miniatures': ['miniaturas'],
    'Costume & Accessories': ['fantasia'],
    'Customizables': ['personalizar'],
    'Hobby & DIY': ['hobby'],
    'Educational': ['educativo'],
    'Multiparts': ['grandes'],
    'Pets': ['pets'],
    'Health': ['saude'],
}
POR_SUBCATEGORIA = {
    'Fidgets': ['sensorial', 'brinquedos'],
    'Articulated Toys': ['articulados', 'brinquedos'],
    'Articulated Animals': ['articulados', 'brinquedos'],
    'Articulated Creatures': ['articulados', 'brinquedos'],
    'Mini Articulated Animals': ['articulados', 'brinquedos'],
    'Sculptures & Busts': ['arte'],
    'Figurines': ['arte'],
    'Decorations': ['casa'],
    'Lights': ['casa'],
    'Vases & Planters': ['casa'],
    'Organizers': ['casa'],
    'Photo Holders': ['casa'],
    'Keychains': ['brinquedos'],
    'Tabletop Games': ['games', 'brinquedos'],
    'Cosplay': ['fantasia'],
    'Gaming Accessories': ['gadgets'],
}


def faixas(peca, chaves):
    slugs = []
    for c in peca.get('categorias') or []:
        slugs += POR_CATEGORIA.get(c, [])
    for s in peca.get('subcategorias') or []:
        slugs += POR_SUBCATEGORIA.get(s, [])
    idx = sorted(set(chaves.index(s) for s in slugs if s in chaves))
    return idx


def material(peca):
    # miniatura é resina; o resto, filamento — é a regra que o catálogo segue
    return 1 if 'Miniatures' in (peca.get('categorias') or []) else 0


# ------------------------------------------------------------
# A imagem
# ------------------------------------------------------------

def baixa(url, destino):
    if os.path.exists(destino) and os.path.getsize(destino) > 1000:
        return
    req = urllib.request.Request(url, headers=CABECALHO)
    with urllib.request.urlopen(req, timeout=60) as r:
        dados = r.read()
    with open(destino, 'wb') as f:
        f.write(dados)


def corta_titulo(lum):
    """Devolve a linha onde a foto começa a valer (abaixo do título).

    O título tem duas ou três linhas ("Mecha / Moon / CONSOLE STAND") com
    vãos pequenos entre elas; o vão entre o texto e a peça é bem maior. Os
    vãos pequenos são engolidos, e o corte é no primeiro vão grande — desde
    que o bloco de texto termine ainda na parte de cima da foto.
    """
    alto = lum.shape[0]
    claro = (lum > ESCURO).any(axis=1)

    # as faixas de linhas claras, de cima para baixo: (início, fim)
    faixas_claras = []
    i = 0
    while i < alto:
        if claro[i]:
            j = i
            while j < alto and claro[j]:
                j += 1
            faixas_claras.append((i, j))
            i = j
        else:
            i += 1

    # O texto mora em cima (começa antes de 40%) e, mesmo em letra grande e
    # em duas linhas, não passa de 14% da foto. A peça é a primeira faixa
    # mais alta que isso, ou a que começa abaixo de 40%. O corte é no meio
    # do vão antes dela — se houver vão; sem vão, o texto encosta e nada
    # se corta.
    fim_texto = 0
    for (ini, fim) in faixas_claras:
        if fim - ini < alto * 0.14 and ini < alto * 0.40:
            fim_texto = fim
            continue
        if fim_texto == 0:
            return 0                   # nada de texto acima da peça
        if ini - fim_texto < 8:
            return 0                   # texto encosta na peça: não corta
        return fim_texto + (ini - fim_texto) // 2
    return 0


def espalha(semente, dentro):
    """Cresce a semente, passo a passo, sem sair de `dentro`."""
    atual = semente & dentro
    while True:
        cresce = atual.copy()
        cresce[1:, :] |= atual[:-1, :]
        cresce[:-1, :] |= atual[1:, :]
        cresce[:, 1:] |= atual[:, :-1]
        cresce[:, :-1] |= atual[:, 1:]
        cresce &= dentro
        if np.array_equal(cresce, atual):
            return atual
        atual = cresce


def fundo_por_conexao(escuro):
    """Só é fundo o escuro que chega à borda — propagação a partir dela.

    A propagação anda um pixel por passo, e uma foto de 1350 linhas pede
    centenas de passos. Ela roda na metade da resolução e o resultado é
    afinado na resolução cheia: dois passos de crescimento cobrem o que a
    redução arredondou nas beiradas.
    """
    meio = escuro[::2, ::2]
    semente = np.zeros_like(meio)
    semente[0, :] = semente[-1, :] = True
    semente[:, 0] = semente[:, -1] = True
    fundo_meio = espalha(semente, meio)

    fundo = np.zeros_like(escuro)
    fundo[::2, ::2] = fundo_meio
    fundo &= escuro
    for _ in range(3):
        v = fundo.copy()
        v[1:, :] |= fundo[:-1, :]; v[:-1, :] |= fundo[1:, :]
        v[:, 1:] |= fundo[:, :-1]; v[:, :-1] |= fundo[:, 1:]
        fundo = v & escuro
    return fundo


def so_a_peca(alfa):
    """Tira os cacos soltos: reflexo, sombra, resto de letra.

    A peça é o que está ligado ao pixel opaco mais central. O que sobra
    fora dela só é apagado se for pouco — um conjunto de chaveiros é
    várias peças soltas, e essas ficam.
    """
    opaco = alfa > 0.5
    ys, xs = np.where(opaco)
    if not len(ys):
        return alfa
    cy, cx = ys.mean(), xs.mean()
    k = np.argmin((ys - cy) ** 2 + (xs - cx) ** 2)
    semente = np.zeros_like(opaco)
    semente[ys[k], xs[k]] = True
    meio = opaco[::2, ::2]
    s2 = np.zeros_like(meio)
    s2[ys[k] // 2, xs[k] // 2] = True
    principal_meio = espalha(s2, meio)
    principal = np.zeros_like(opaco)
    principal[::2, ::2] = principal_meio
    for _ in range(3):
        v = principal.copy()
        v[1:, :] |= principal[:-1, :]; v[:-1, :] |= principal[1:, :]
        v[:, 1:] |= principal[:, :-1]; v[:, :-1] |= principal[:, 1:]
        principal = v & (alfa > 0.05)
    resto = (alfa > 0.05) & ~principal
    if resto.sum() < 0.04 * max(principal.sum(), 1):
        alfa = alfa.copy()
        alfa[resto] = 0.0
    return alfa


def desvio_local(lum, raio=3):
    """Desvio padrão numa janela: chapado tem desvio baixo, relevo tem alto."""
    from numpy.lib.stride_tricks import sliding_window_view
    k = 2 * raio + 1
    borda = np.pad(lum, raio, mode='edge')
    jan = sliding_window_view(borda, (k, k))
    return jan.std(axis=(-1, -2))


def recorta(caminho):
    """Foto da origem -> (imagem RGBA recortada, largura, altura)."""
    im = Image.open(caminho).convert('RGB')
    rgb = np.asarray(im).astype(np.float32)
    lum = rgb.max(axis=2)

    topo = corta_titulo(lum)
    rgb = rgb[topo:]
    lum = lum[topo:]

    escuro = lum < ESCURO
    fundo = fundo_por_conexao(escuro)

    # o preto cercado: vão vazado se chapado, peça se tiver relevo
    cercado = escuro & ~fundo
    if cercado.any():
        chapado = desvio_local(lum) < 4.0
        fundo |= cercado & chapado

    alfa = np.where(fundo, 0.0, 1.0)
    # a beirada: onde a peça encosta no fundo, a transparência acompanha o
    # brilho — some o serrilhado sem comer a peça
    perto = fundo.copy()
    for _ in range(2):
        v = perto.copy()
        v[1:, :] |= perto[:-1, :]; v[:-1, :] |= perto[1:, :]
        v[:, 1:] |= perto[:, :-1]; v[:, :-1] |= perto[:, 1:]
        perto = v
    beira = perto & ~fundo
    alfa[beira] = np.clip((lum[beira] - ESCURO * 0.5) / (BORDA_SUAVE - ESCURO * 0.5), 0.15, 1.0)

    alfa = so_a_peca(alfa)

    ys, xs = np.where(alfa > 0.05)
    if not len(ys):
        raise ValueError('nenhuma peça encontrada na foto')
    margem = 6
    y0, y1 = max(ys.min() - margem, 0), min(ys.max() + margem + 1, alfa.shape[0])
    x0, x1 = max(xs.min() - margem, 0), min(xs.max() + margem + 1, alfa.shape[1])

    saida = np.dstack([rgb[y0:y1, x0:x1], alfa[y0:y1, x0:x1, None] * 255.0]).astype(np.uint8)
    img = Image.fromarray(saida, 'RGBA')
    escala = LADO / float(max(img.size))
    if escala < 1:
        img = img.resize((max(1, round(img.width * escala)), max(1, round(img.height * escala))), Image.LANCZOS)
    return img


def matiz_da_peca(img):
    """A cor dominante, virada para o lado oposto do círculo de cores."""
    a = np.asarray(img).astype(np.float32) / 255.0
    rgb, alfa = a[..., :3], a[..., 3]
    sel = alfa > 0.5
    if sel.sum() < 50:
        return 209
    p = rgb[sel]
    mx, mn = p.max(axis=1), p.min(axis=1)
    delta = mx - mn
    sat = np.where(mx > 0, delta / np.maximum(mx, 1e-6), 0)
    vivas = (sat > 0.18) & (mx > 0.15)
    if vivas.sum() < 0.02 * len(p):
        return 209                     # peça branca ou cinza: o azul padrão
    q = p[vivas]; mxq = mx[vivas]; dq = delta[vivas]
    r, g, b = q[:, 0], q[:, 1], q[:, 2]
    h = np.zeros(len(q))
    m = mxq == r; h[m] = ((g[m] - b[m]) / dq[m]) % 6
    m = mxq == g; h[m] = (b[m] - r[m]) / dq[m] + 2
    m = mxq == b; h[m] = (r[m] - g[m]) / dq[m] + 4
    h *= 60
    peso = sat[vivas] * mxq
    ang = np.deg2rad(h)
    hue = np.rad2deg(np.arctan2((np.sin(ang) * peso).sum(), (np.cos(ang) * peso).sum())) % 360
    return int(round((hue + 180) % 360))


def formato_do_card(w, h, id_):
    razao = w / float(h)
    if razao < 0.62:
        return 3                       # retrato
    if razao > 1.55:
        return 2                       # panorâmico
    return 1 if id_ % 7 == 0 else 0    # uma parte dos quadrados vira destaque


def desenho_do_card(id_):
    return (id_ * 31 + 7) % 6


# ------------------------------------------------------------

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--gravar', action='store_true')
    p.add_argument('--ids')
    p.add_argument('--limite', type=int)
    args = p.parse_args()

    if not os.path.exists(ACERVO):
        sys.exit('falta %s — rode antes: python3 tools/raspa-stlflix.py' % os.path.relpath(ACERVO, RAIZ))
    with open(ACERVO, encoding='utf-8') as f:
        acervo = json.load(f)['pecas']
    with open(CATALOGO, encoding='utf-8') as f:
        catalogo = json.load(f)
    chaves = [c[0] for c in catalogo['categorias']]
    existentes = {i[0] for i in catalogo['itens']}

    novas = [x for x in acervo if x['id'] not in existentes and x.get('thumb')]
    if args.ids:
        pedidos = {int(v) for v in args.ids.replace(' ', '').split(',') if v}
        novas = [x for x in novas if x['id'] in pedidos]
    novas.sort(key=lambda x: x['id'])
    if args.limite:
        novas = novas[:args.limite]

    print('%d peças novas fora do catálogo' % len(novas))
    for x in novas:
        print('  %5d  %-44s %s' % (x['id'], x['nome'][:44], ', '.join(chaves[k] for k in faixas(x, chaves)) or '(sem faixa)'))
    if not args.gravar:
        print('\n(nada gravado — rode com --gravar)')
        return

    os.makedirs(THUMBS, exist_ok=True)
    os.makedirs(IMAGENS, exist_ok=True)
    entraram = []
    for x in novas:
        ext = os.path.splitext(x['thumb'].split('?')[0])[1] or '.png'
        origem = os.path.join(THUMBS, '%d%s' % (x['id'], ext))
        try:
            baixa(x['thumb'], origem)
            img = recorta(origem)
        except Exception as e:
            print('  ✗ %5d %-40s %s' % (x['id'], x['nome'][:40], e))
            continue
        img.save(os.path.join(IMAGENS, '%d.webp' % x['id']), 'WEBP', quality=82, method=6)
        w, h = img.size
        linha = [x['id'], x['nome'].strip(), faixas(x, chaves), material(x),
                 formato_do_card(w, h, x['id']), matiz_da_peca(img), desenho_do_card(x['id']), w, h]
        catalogo['itens'].append(linha)
        entraram.append(x['id'])
        print('  ✓ %5d %-40s %dx%d f%d h%d' % (x['id'], x['nome'][:40], w, h, linha[4], linha[5]), flush=True)

    with open(CATALOGO, 'w', encoding='utf-8') as f:
        json.dump(catalogo, f, ensure_ascii=False, separators=(',', ':'))
    print('\n%d peças acrescentadas · catálogo com %d' % (len(entraram), len(catalogo['itens'])))
    if entraram:
        print('agora: python3 tools/converte-hover.py --ids %s' % ','.join(str(i) for i in entraram))
        print('       python3 tools/classifica-sensorial.py --gravar')


if __name__ == '__main__':
    main()
