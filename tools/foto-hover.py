#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prévia de hover para as peças que não têm vídeo na origem.

Cento e quarenta peças do catálogo nunca receberam vídeo no STLFLIX. O card
delas ficaria parado enquanto o vizinho anima — e não precisa: todas têm
galeria, de cinco a sete fotos. A primeira foto da galeria mostra a peça de
outro ângulo, em cena real, que é exatamente o papel que o vídeo cumpre nas
outras. É ela que vira a prévia.

A foto da galeria não está no arquivo da raspagem (a busca do acervo não
devolve galeria), então cada peça é lida na sua própria página, pela rota de
dados do Next — a mesma que a plataforma usa para navegar.

    python3 tools/foto-hover.py            # relatório, não grava
    python3 tools/foto-hover.py --gravar
    python3 tools/foto-hover.py --gravar --refazer

Grava `assets/hover/<id>.webp` e a lista `hover_foto` no catálogo. O catálogo
lê as duas listas: `hover` (vídeo) e `hover_foto` (imagem).
"""

import argparse
import json
import os
import re
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGO = os.path.join(RAIZ, 'assets', 'catalogo.json')
ACERVO = os.path.join(RAIZ, 'tools', 'dados', 'stlflix.json')
DESTINO = os.path.join(RAIZ, 'assets', 'hover')

PLATAFORMA = 'https://platform.stlflix.com'
CABECALHO = {'user-agent': 'mrmaxelegance-catalogo/1.0 (assinante STLFLIX)'}

ALTURA = 400
QUALIDADE = 74
MINIMO_PLAUSIVEL = 2000
TRABALHADORES = 6

trava = threading.Lock()


def build_id():
    """
    O caminho da rota de dados carrega o número da versão publicada da
    plataforma, e ele muda a cada deploy deles. Ler da home é o que mantém
    este script funcionando na semana que vem.
    """
    req = urllib.request.Request(PLATAFORMA + '/pt-BR', headers=CABECALHO)
    with urllib.request.urlopen(req, timeout=40) as r:
        html = r.read().decode('utf-8', 'ignore')
    m = re.search(r'"buildId":"([^"]+)"', html)
    if not m:
        sys.exit('não achei o buildId na home da plataforma')
    return m.group(1)


def urls_da_galeria(build, slug):
    rota = '%s/_next/data/%s/pt-BR/product/%s.json?slug=%s' % (PLATAFORMA, build, slug, slug)
    req = urllib.request.Request(rota, headers=CABECALHO)
    with urllib.request.urlopen(req, timeout=40) as r:
        pp = json.load(r)['pageProps']

    # gallery.data[].attributes.url — o Strapi embrulha cada arquivo em duas
    # camadas, e a lista fica dentro de `data`, não na chave de cima
    galeria = (pp.get('gallery') or {}).get('data') or []
    fotos = [(g.get('attributes') or {}).get('url') for g in galeria]
    fotos = [f for f in fotos if f]

    thumb = (((pp.get('thumbnail') or {}).get('data') or {}).get('attributes') or {}).get('url')
    # a miniatura já é o que o card mostra: repetir ela no hover não mostraria
    # nada de novo
    return [f for f in fotos if f != thumb]


def converte(tarefa):
    build, peca = tarefa
    saida = os.path.join(DESTINO, '%d.webp' % peca['id'])

    try:
        fotos = urls_da_galeria(build, peca['slug'])
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError) as e:
        with trava:
            print('  ✗ %-40s %s' % (peca['nome'][:40], type(e).__name__))
        return None

    if not fotos:
        with trava:
            print('  – %-40s sem foto além da miniatura' % peca['nome'][:40])
        return None

    cmd = ['ffmpeg', '-y', '-v', 'error', '-i', fotos[0],
           '-vf', 'scale=-2:%d' % ALTURA,
           '-c:v', 'libwebp', '-quality', str(QUALIDADE), '-preset', 'photo',
           saida]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    except subprocess.TimeoutExpired:
        if os.path.exists(saida):
            os.remove(saida)
        return None

    if r.returncode != 0 or not os.path.exists(saida) \
            or os.path.getsize(saida) < MINIMO_PLAUSIVEL:
        if os.path.exists(saida):
            os.remove(saida)
        with trava:
            print('  ✗ %-40s %s' % (peca['nome'][:40],
                                    (r.stderr or '').strip().split('\n')[-1][:40]))
        return None

    return peca['id'], os.path.getsize(saida)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--gravar', action='store_true')
    p.add_argument('--refazer', action='store_true')
    p.add_argument('--limite', type=int)
    p.add_argument('--paralelo', type=int, default=TRABALHADORES)
    args = p.parse_args()

    if not os.path.exists(ACERVO):
        sys.exit('falta %s — rode antes: python3 tools/raspa-stlflix.py'
                 % os.path.relpath(ACERVO, RAIZ))

    with open(ACERVO, encoding='utf-8') as f:
        acervo = {x['id']: x for x in json.load(f)['pecas']}
    with open(CATALOGO, encoding='utf-8') as f:
        catalogo = json.load(f)

    os.makedirs(DESTINO, exist_ok=True)

    fila = []
    for item in catalogo['itens']:
        peca = acervo.get(item[0])
        if not peca or peca.get('hover'):      # tem vídeo: o vídeo manda
            continue
        pronto = os.path.join(DESTINO, '%d.webp' % item[0])
        if os.path.exists(pronto) and not args.refazer:
            if os.path.getsize(pronto) >= MINIMO_PLAUSIVEL:
                continue
            os.remove(pronto)
        fila.append(peca)

    if args.limite:
        fila = fila[:args.limite]

    print('%d peças sem vídeo · %d para buscar foto · %d em paralelo'
          % (len(fila), len(fila), args.paralelo))
    if not args.gravar:
        print('\n(nada gravado — rode com --gravar)')
        return
    if not fila:
        return

    build = build_id()
    print('versão da plataforma: %s\n' % build)

    feitos, bytes_totais = 0, 0
    inicio = time.time()
    with ThreadPoolExecutor(max_workers=args.paralelo) as pool:
        tarefas = [pool.submit(converte, (build, x)) for x in fila]
        for t in as_completed(tarefas):
            r = t.result()
            if not r:
                continue
            feitos += 1
            bytes_totais += r[1]
            if feitos % 10 == 0 or feitos == len(fila):
                with trava:
                    print('  %d/%d · %.1f MB · %.0f/min'
                          % (feitos, len(fila), bytes_totais / 1048576.0,
                             feitos / max(time.time() - inicio, 1) * 60), flush=True)

    ids = sorted(int(f[:-5]) for f in os.listdir(DESTINO)
                 if f.endswith('.webp')
                 and os.path.getsize(os.path.join(DESTINO, f)) >= MINIMO_PLAUSIVEL)
    catalogo['hover_foto'] = ids
    with open(CATALOGO, 'w', encoding='utf-8') as f:
        json.dump(catalogo, f, ensure_ascii=False, separators=(',', ':'))

    print('\n%d fotos novas · média %.0f KB · %d peças com prévia por foto'
          % (feitos, bytes_totais / 1024.0 / max(feitos, 1), len(ids)))


if __name__ == '__main__':
    main()
