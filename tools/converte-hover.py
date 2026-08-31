#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Transforma o vídeo de hover do acervo numa prévia leve para o catálogo.

O que vem do STLFLIX é um reels: VP9, 1080×1350, 30 quadros, 8 segundos,
**8 MB por peça**. Servir isso no mosaico seria entregar 8 MB por passada de
mouse. O que sai daqui tem 3 segundos, 400 pixels de altura, 20 quadros e
pesa ~56 KB — 150 vezes menos, no formato que todo navegador decodifica em
hardware.

Por que MP4 H.264 e não GIF, que foi o pedido original: o mesmo trecho dá
**2.177 KB em GIF** e **409 KB em WebP animado**, contra 56 KB em MP4. GIF
não comprime entre quadros e só tem 256 cores — ele é o formato mais pesado
e o mais feio dos três. `<video muted playsinline loop preload="none">` faz
o papel do GIF sem nenhuma das desvantagens dele.

O ffmpeg lê o WebM direto da origem e para no terceiro segundo, então baixa
uma fração do arquivo em vez dos 8 MB inteiros.

    python3 tools/converte-hover.py --faixa sensorial      # começa por aqui
    python3 tools/converte-hover.py --faixa articulados
    python3 tools/converte-hover.py --faixa brinquedos
    python3 tools/converte-hover.py --todas                # o acervo inteiro
    python3 tools/converte-hover.py --ids 4007,4008
    python3 tools/converte-hover.py --faixa sensorial --refazer

Ao terminar, grava em `assets/catalogo.json` a lista `hover` com os ids que
têm prévia — é assim que o catálogo sabe quais cards animam, sem pedir
arquivo nenhum a mais ao navegador.
"""

import argparse
import json
import os
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGO = os.path.join(RAIZ, 'assets', 'catalogo.json')
ACERVO = os.path.join(RAIZ, 'tools', 'dados', 'stlflix.json')
DESTINO = os.path.join(RAIZ, 'assets', 'hover')

SEGUNDOS = 3
ALTURA = 400
QUADROS = 20
CRF = 33
# Conexão que para de responder não pode prender um trabalhador para sempre.
# São duas cercas: o ffmpeg desiste depois de 25 s sem receber byte, e o
# Python mata o processo se ele passar de 4 minutos de qualquer jeito. Sem
# elas, uma execução longa vai perdendo trabalhadores até não sobrar nenhum.
# Conversão saudável leva de 3 a 30 segundos. Esperar minutos por uma
# conexão ruim não salva a peça — só tira um trabalhador da fila, e a peça
# pode ser refeita depois numa hora melhor. Medido em execução real: com o
# limite em 4 minutos, um terço dos trabalhadores vivia esperando.
ESPERA_REDE = 20          # segundos sem dados até o ffmpeg abortar
LIMITE_TOTAL = 150        # segundos de vida por conversão
TRABALHADORES = 10     # o gargalo é o download da origem, não o encoder
# Um MP4 de 3 segundos não sai com menos que isto. Arquivo abaixo desse
# tamanho é sobra de execução interrompida — o ffmpeg morre no meio e deixa
# um cabeçalho de 48 bytes, que passaria por pronto num teste de "existe".
MINIMO_PLAUSIVEL = 3000

trava = threading.Lock()


def converte(peca):
    """Baixa o começo do WebM e grava a prévia. Devolve (id, bytes) ou None."""
    saida = os.path.join(DESTINO, '%d.mp4' % peca['id'])

    cmd = [
        'ffmpeg', '-y', '-v', 'error',
        '-rw_timeout', str(ESPERA_REDE * 1000000),   # em microssegundos
        '-t', str(SEGUNDOS), '-i', peca['hover'],
        '-an',
        '-vf', 'fps=%d,scale=-2:%d' % (QUADROS, ALTURA),
        '-c:v', 'libx264', '-profile:v', 'main', '-crf', str(CRF),
        '-preset', 'veryslow', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        saida,
    ]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=LIMITE_TOTAL)
    except subprocess.TimeoutExpired:
        if os.path.exists(saida):
            os.remove(saida)
        with trava:
            print('  ⏱ %-42s passou de %ds' % (peca['nome'][:42], LIMITE_TOTAL))
        return None

    if (r.returncode != 0 or not os.path.exists(saida)
            or os.path.getsize(saida) < MINIMO_PLAUSIVEL):
        if os.path.exists(saida):
            os.remove(saida)
        with trava:
            print('  ✗ %-42s %s' % (peca['nome'][:42],
                                    (r.stderr or '').strip().split('\n')[-1][:60]))
        return None

    return peca['id'], os.path.getsize(saida)


def pasta_mb():
    if not os.path.isdir(DESTINO):
        return 0.0
    return sum(os.path.getsize(os.path.join(DESTINO, f))
               for f in os.listdir(DESTINO)) / 1048576.0


def prontas():
    """Quantas prévias válidas existem na pasta agora."""
    if not os.path.isdir(DESTINO):
        return 0
    return sum(1 for f in os.listdir(DESTINO)
               if f.endswith('.mp4')
               and os.path.getsize(os.path.join(DESTINO, f)) >= MINIMO_PLAUSIVEL)


def tempo(segundos):
    if segundos < 90:
        return '%ds' % segundos
    if segundos < 5400:
        return '%dmin' % round(segundos / 60.0)
    return '%dh%02d' % (segundos // 3600, (segundos % 3600) // 60)


def barra(feitas, alvo, mbytes, taxa):
    """
    Uma barra que mede o acervo inteiro, não a fila da vez.

    Converter em faixas é uma decisão de ordem — o destino é o acervo todo.
    Uma barra que só mostrasse a fila atual diria "100%" três vezes e nunca
    contaria a história inteira.
    """
    largura = 34
    fracao = min(feitas / float(alvo or 1), 1.0)
    cheio = int(round(fracao * largura))
    falta = alvo - feitas
    resto = ('faltam ' + tempo(falta / taxa * 60)) if taxa > 0 and falta > 0 else 'fim'
    return ('  [%s%s] %d/%d · %d%% · %.0f MB · %.0f/min · %s'
            % ('█' * cheio, '·' * (largura - cheio), feitas, alvo,
               round(fracao * 100), mbytes, taxa, resto))


def escolhe(args, acervo, catalogo):
    """Quais peças converter, na ordem em que aparecem no catálogo."""
    chaves = [c[0] for c in catalogo['categorias']]

    if args.ids:
        pedidos = {int(x) for x in args.ids.replace(' ', '').split(',') if x}
        alvo = [i for i in catalogo['itens'] if i[0] in pedidos]
    elif args.todas:
        alvo = catalogo['itens']
    else:
        if args.faixa not in chaves:
            sys.exit('faixa desconhecida: %s (tem %s)'
                     % (args.faixa, ', '.join(chaves)))
        k = chaves.index(args.faixa)
        alvo = [i for i in catalogo['itens'] if k in (i[2] or [])]

    fila = []
    sem_video = 0
    for item in alvo:
        peca = acervo.get(item[0])
        if not peca or not peca.get('hover'):
            sem_video += 1
            continue
        pronto = os.path.join(DESTINO, '%d.mp4' % item[0])
        if os.path.exists(pronto) and not args.refazer:
            if os.path.getsize(pronto) >= MINIMO_PLAUSIVEL:
                continue
            os.remove(pronto)     # sobra de execução interrompida
        fila.append(peca)

    return fila, len(alvo), sem_video


def atualiza_catalogo(catalogo):
    """Grava a lista de ids com prévia — a fonte de verdade é a pasta."""
    ids = sorted(int(f[:-4]) for f in os.listdir(DESTINO)
                 if f.endswith('.mp4')
                 and os.path.getsize(os.path.join(DESTINO, f)) >= MINIMO_PLAUSIVEL)
    catalogo['hover'] = ids
    with open(CATALOGO, 'w', encoding='utf-8') as f:
        json.dump(catalogo, f, ensure_ascii=False, separators=(',', ':'))
    return ids


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--faixa', default='sensorial')
    p.add_argument('--todas', action='store_true')
    p.add_argument('--ids')
    p.add_argument('--refazer', action='store_true')
    p.add_argument('--limite', type=int)
    p.add_argument('--paralelo', type=int, default=TRABALHADORES,
                   help='conversões ao mesmo tempo (padrão %d)' % TRABALHADORES)
    args = p.parse_args()

    if not os.path.exists(ACERVO):
        sys.exit('falta %s — rode antes: python3 tools/raspa-stlflix.py'
                 % os.path.relpath(ACERVO, RAIZ))

    with open(ACERVO, encoding='utf-8') as f:
        acervo = {x['id']: x for x in json.load(f)['pecas']}
    with open(CATALOGO, encoding='utf-8') as f:
        catalogo = json.load(f)

    os.makedirs(DESTINO, exist_ok=True)
    fila, no_recorte, sem_video = escolhe(args, acervo, catalogo)
    if args.limite:
        fila = fila[:args.limite]

    print('%d peças no recorte · %d sem vídeo na origem · %d para converter '
          '· %d em paralelo' % (no_recorte, sem_video, len(fila), args.paralelo))
    if not fila:
        ids = atualiza_catalogo(catalogo)
        print('nada a fazer · %d prévias no total' % len(ids))
        return

    # O denominador da barra é o acervo inteiro: toda peça que tem vídeo na
    # origem, esteja ela nesta fila ou não.
    alvo = sum(1 for i in catalogo['itens']
               if (acervo.get(i[0]) or {}).get('hover'))
    inicio_prontas = prontas()
    inicio_mb = pasta_mb()      # medido uma vez: varrer a pasta por prévia
    inicio = time.time()        # sairia mais caro que a conversão

    feitos, bytes_totais = 0, 0
    tty = sys.stdout.isatty()

    # `as_completed` e não `pool.map`: o map entrega na ordem da fila, e uma
    # peça lenta segura a contagem enquanto as outras onze já terminaram —
    # o relatório fica minutos atrás do que existe na pasta.
    with ThreadPoolExecutor(max_workers=args.paralelo) as pool:
        tarefas = [pool.submit(converte, p) for p in fila]
        for t in as_completed(tarefas):
            r = t.result()
            if not r:
                continue
            feitos += 1
            bytes_totais += r[1]

            decorrido = max(time.time() - inicio, 1)
            taxa = feitos / decorrido * 60
            linha = barra(inicio_prontas + feitos, alvo,
                          inicio_mb + bytes_totais / 1048576.0, taxa)
            with trava:
                if tty:
                    sys.stdout.write('\r' + linha)
                    sys.stdout.flush()
                elif feitos % 10 == 0 or feitos == len(fila):
                    print(linha, flush=True)
    if tty:
        print()

    ids = atualiza_catalogo(catalogo)
    print('\n%d prévias novas · média %.0f KB · %d prévias no catálogo'
          % (feitos, bytes_totais / 1024.0 / max(feitos, 1), len(ids)))
    print('assets/hover/ agora tem %.1f MB' % pasta_mb())


if __name__ == '__main__':
    main()
