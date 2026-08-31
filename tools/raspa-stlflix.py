#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lê o acervo do STLFLIX e guarda o que o catálogo daqui precisa.

A plataforma tem uma busca própria em `POST /api/elasticsearch`, e é ela que
alimenta a página "Todos os modelos". Cada resultado já vem com tudo o que
interessa: o id (o mesmo `MM-` do catálogo daqui), o slug, a miniatura, a
taxonomia de verdade — macro, categoria e subcategoria — e o campo `hover`,
que é um WebM curto da peça girando. É esse WebM que vira a prévia animada.

    python3 tools/raspa-stlflix.py               # grava tools/dados/stlflix.json
    python3 tools/raspa-stlflix.py --resumo      # só relata o que já foi lido

O arquivo cru fica fora de `assets/`: ele é matéria-prima de duas etapas
seguintes (as faixas do catálogo e a conversão dos vídeos), não algo que o
navegador do cliente baixe.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'tools', 'dados', 'stlflix.json')

BUSCA = 'https://platform.stlflix.com/api/elasticsearch'
POR_PAGINA = 100
PAUSA = 0.4          # respiro entre páginas: são 50 chamadas, não é corrida
CABECALHO = {
    'content-type': 'application/json',
    'user-agent': 'mrmaxelegance-catalogo/1.0 (assinante STLFLIX)',
    'origin': 'https://platform.stlflix.com',
    'referer': 'https://platform.stlflix.com/pt-BR/explore',
}


def pagina(n, tamanho=POR_PAGINA):
    corpo = json.dumps({
        'text': '',
        'filters': {
            'tags': [], 'category': '', 'subCategory': '',
            # data no futuro: sem ela a busca corta os lançamentos do dia
            'releaseDate': '2030-01-01T00:00:00.000Z',
            'hasPaintTutorial': False, 'macroCategory': '',
            'excludeMacroCategory': '', 'hasMultiparts': False,
        },
        'page': n, 'size': tamanho, 'sort': 'release_date:DESC',
    }).encode()

    req = urllib.request.Request(BUSCA, data=corpo, headers=CABECALHO, method='POST')
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def url(campo):
    """O Strapi embrulha cada arquivo em attributes.url — ou manda nada."""
    if not campo:
        return None
    return (campo.get('attributes') or {}).get('url')


def nomes(lista):
    return [((c.get('attributes') or {}).get('name') or '').strip()
            for c in (lista or [])]


def enxuga(r):
    return {
        'id': r.get('id'),
        'nome': (r.get('name') or '').strip(),
        'slug': r.get('slug'),
        'hover': url(r.get('hover')),
        'thumb': url(r.get('thumbnail')),
        'macro': nomes(r.get('macro_categories')),
        'categorias': nomes(r.get('parent_categories')),
        'subcategorias': nomes(r.get('sub_categories')),
        'tags': nomes(r.get('tags')),
        'multipartes': bool(r.get('multiparts')),
        'lancamento': r.get('release_date'),
        'downloads': r.get('downloads'),
    }


def resumo(pecas):
    com = [p for p in pecas if p['hover']]
    print('%d peças · %d com vídeo de hover (%.0f%%)'
          % (len(pecas), len(com), 100.0 * len(com) / max(len(pecas), 1)))

    from collections import Counter
    for campo in ('macro', 'subcategorias'):
        c = Counter()
        for p in pecas:
            for v in p[campo]:
                c[v] += 1
        print('\n%s:' % campo)
        for k, v in c.most_common(30):
            print('  %-42s %4d' % (k, v))


def main():
    if '--resumo' in sys.argv:
        with open(SAIDA, encoding='utf-8') as f:
            resumo(json.load(f)['pecas'])
        return

    primeira = pagina(1)
    total = primeira.get('total') or 0
    pecas = [enxuga(r) for r in primeira.get('results', [])]
    paginas = (total + POR_PAGINA - 1) // POR_PAGINA
    print('acervo: %d peças em %d páginas' % (total, paginas))

    for n in range(2, paginas + 1):
        for tentativa in (1, 2, 3):
            try:
                dados = pagina(n)
                break
            except (urllib.error.URLError, TimeoutError) as e:
                if tentativa == 3:
                    raise
                print('  página %d falhou (%s), tentando de novo' % (n, e))
                time.sleep(2 * tentativa)
        novas = [enxuga(r) for r in dados.get('results', [])]
        pecas.extend(novas)
        print('  página %d/%d · %d peças' % (n, paginas, len(pecas)), flush=True)
        time.sleep(PAUSA)

    # id repetido acontece quando um lançamento entra no meio da paginação
    vistas, unicas = set(), []
    for p in pecas:
        if p['id'] in vistas:
            continue
        vistas.add(p['id'])
        unicas.append(p)

    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, 'w', encoding='utf-8') as f:
        json.dump({'lido_em': time.strftime('%Y-%m-%d'), 'total': total,
                   'pecas': unicas}, f, ensure_ascii=False, indent=1)

    print('\ngravado: %s' % os.path.relpath(SAIDA, RAIZ))
    resumo(unicas)


if __name__ == '__main__':
    main()
