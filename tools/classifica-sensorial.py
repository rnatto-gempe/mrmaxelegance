#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cria as faixas Sensorial, Articulados e Brinquedos no catálogo.

A primeira versão disto adivinhava pelo nome da peça, porque era o único dado
que havia aqui. Não é mais: `tools/raspa-stlflix.py` traz a taxonomia real do
acervo, e nela existe subcategoria `Fidgets`, quatro famílias de
`Articulated` e a macro `Toys & Articulated`. Adivinhação fora — faixa
nenhuma precisa de heurística quando o fornecedor já classificou.

    python3 tools/classifica-sensorial.py             # relatório, não grava
    python3 tools/classifica-sensorial.py --amostra   # lista peça por peça
    python3 tools/classifica-sensorial.py --gravar    # aplica no catalogo.json

Refaz as três faixas do zero a cada execução: rodar de novo depois de
acrescentar peça é seguro.
"""

import json
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGO = os.path.join(RAIZ, 'assets', 'catalogo.json')
ACERVO = os.path.join(RAIZ, 'tools', 'dados', 'stlflix.json')

# As três faixas, e as subcategorias do acervo que caem em cada uma.
#
# Sensorial é a faixa que menos pode errar — ela existe para quem procura
# peça de autorregulação, foco, TDAH, autismo. Só entra subcategoria em que
# a peça é feita para a mão: o fidget, a escultura cinética, o massageador.
FAIXAS = [
    ('sensorial', 'Sensorial', {
        'Fidgets',
        'Kinetic Sculptures',
        'Massagers & Scratchers',
    }),
    ('articulados', 'Articulados', {
        'Articulated Toys',
        'Articulated Animals',
        'Articulated Creatures',
        'Mini Articulated Animals',
        'Mini Articulated Creatures',
    }),
    ('brinquedos', 'Brinquedos', {
        'Mini Toys',
        'Building Toys',
        # Puzzles no acervo é kit de encaixe — o cavaleiro que monta sem
        # cola. Brincadeira de montar, não peça de autorregulação.
        'Puzzles',
        'Party Games',
        'Vehicles',
        'Blasters',
        'Tricks & Pranks',
        'Sports',
    }),
]

# Brinquedos também herda a macro inteira: no acervo, "Toys & Articulated"
# é o guarda-chuva de tudo que é de brincar, e as subcategorias acima são
# recortes dentro dela.
MACRO_BRINQUEDOS = 'Toys & Articulated'


def faixas_da_peca(peca):
    subs = set(peca.get('subcategorias') or [])
    macros = set(peca.get('macro') or [])
    fora = set()

    for chave, _, gatilhos in FAIXAS:
        if subs & gatilhos:
            fora.add(chave)

    if MACRO_BRINQUEDOS in macros:
        fora.add('brinquedos')

    # Um articulado é brinquedo sensorial: quem procura peça para as mãos
    # espera achar o dragão flexi nas três faixas, não só na sua.
    if 'articulados' in fora:
        fora.add('brinquedos')

    return fora


def main():
    gravar = '--gravar' in sys.argv
    amostra = '--amostra' in sys.argv

    if not os.path.exists(ACERVO):
        sys.exit('falta %s — rode antes: python3 tools/raspa-stlflix.py'
                 % os.path.relpath(ACERVO, RAIZ))

    with open(ACERVO, encoding='utf-8') as f:
        acervo = {p['id']: p for p in json.load(f)['pecas']}
    with open(CATALOGO, encoding='utf-8') as f:
        dados = json.load(f)

    # As faixas entram no fim da lista de categorias: os itens guardam a
    # categoria pelo índice, e mexer na ordem trocaria a categoria de 4 mil
    # peças de uma vez.
    chaves = [c[0] for c in dados['categorias']]
    indice = {}
    for chave, rotulo, _ in FAIXAS:
        if chave in chaves:
            i = chaves.index(chave)
            dados['categorias'][i][1] = rotulo
        else:
            dados['categorias'].append([chave, rotulo])
            i = len(dados['categorias']) - 1
        indice[chave] = i

    nossas = set(indice.values())
    achados = {chave: [] for chave, _, _ in FAIXAS}
    sem_dado = []

    for item in dados['itens']:
        peca = acervo.get(item[0])
        cats = [c for c in (item[2] or []) if c not in nossas]   # refaz do zero
        if peca is None:
            sem_dado.append(item[1])
        else:
            for chave in faixas_da_peca(peca):
                cats.append(indice[chave])
                achados[chave].append(item[1])
        item[2] = sorted(set(cats))

    for chave, rotulo, _ in FAIXAS:
        print('%-14s %4d' % (rotulo, len(achados[chave])))
    print('%-14s %4d peças distintas'
          % ('—', len({n for l in achados.values() for n in l})))
    if sem_dado:
        print('\n%d peças sem correspondência no acervo lido '
              '(rode tools/raspa-stlflix.py de novo)' % len(sem_dado))

    if amostra:
        for chave, rotulo, _ in FAIXAS:
            print('\n== %s (%d)' % (rotulo.upper(), len(achados[chave])))
            for nome in achados[chave]:
                print('   ', nome)

    if gravar:
        with open(CATALOGO, 'w', encoding='utf-8') as f:
            json.dump(dados, f, ensure_ascii=False, separators=(',', ':'))
        print('\ngravado: %s' % os.path.relpath(CATALOGO, RAIZ))
    else:
        print('\n(nada gravado — rode com --gravar)')


if __name__ == '__main__':
    main()
