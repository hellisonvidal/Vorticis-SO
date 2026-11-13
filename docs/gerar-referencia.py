#!/usr/bin/env python3
"""Gera docs/REFERENCIA.md a partir da ajuda embutida em cada ferramenta (tools/vorticis-*).

A fonte é a docstring de cada programa Python (lida com `ast`, sem executar o código) ou o
cabeçalho de comentários dos scripts shell. Assim a referência nunca fica desatualizada.
Uso: python3 docs/gerar-referencia.py [--verificar]   (--verificar: falha se o arquivo estiver desatualizado)
"""
import ast
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "docs/REFERENCIA.md"
PASTAS = [RAIZ / "tools", RAIZ / "shell"]

GRUPOS = [
    ("Aplicativos e atualizações", ["vorticis-apps", "vorticis-atualizar", "vorticis-compat", "vorticis-instalar-arquivo", "vorticis-jogos", "vorticis-navegadores"]),
    ("Hardware", ["vorticis-dispositivos", "vorticis-drivers", "vorticis-tela"]),
    ("Sistema e manutenção", ["vorticis-diagnostico", "vorticis-sistema", "vorticis-recursos", "vorticis-backup", "vorticis-midia"]),
    ("Usuários, rede e segurança", ["vorticis-usuarios", "vorticis-rede"]),
    ("Área de trabalho", ["vorticis-shell", "vorticis-app", "vorticis-sessao"]),
    ("Instalação", ["vorticis-instalar-sistema"]),
]


def ajuda(arq: Path) -> str:
    texto = arq.read_text(encoding="utf-8")
    if texto.startswith("#!") and "python" in texto.splitlines()[0]:
        doc = ast.get_docstring(ast.parse(texto)) or ""
        return doc.strip()
    linhas = []
    for linha in texto.splitlines()[1:]:
        if linha.startswith("#"):
            linhas.append(linha[1:].removeprefix(" "))
        elif linha.strip() == "" and not linhas:
            continue
        else:
            break
    return "\n".join(linhas).strip()


def gerar() -> str:
    arquivos = {p.name: p for pasta in PASTAS for p in pasta.glob("vorticis-*") if p.is_file()}
    usados = set()
    partes = [
        "# Referência de comandos",
        "",
        "> Gerado automaticamente por `docs/gerar-referencia.py` a partir da ajuda de cada ferramenta.",
        "> Não edite à mão: altere a docstring/cabeçalho da ferramenta e rode o gerador.",
        "",
        "Todas as ferramentas aceitam `--help`. As que alteram o sistema aceitam `--simular`, que mostra",
        "o que seria feito sem mudar nada. Quando precisam de administrador, pedem a senha (pkexec/sudo).",
        "",
    ]
    for titulo, nomes in GRUPOS:
        partes += [f"## {titulo}", ""]
        for nome in nomes:
            if nome not in arquivos:
                continue
            usados.add(nome)
            texto = ajuda(arquivos[nome])
            resumo, _, resto = texto.partition("\n")
            frase = resumo.split("—", 1)[-1].strip() if "—" in resumo else resumo
            partes += [f"### {nome}", "", frase[:1].upper() + frase[1:], ""]
            if resto.strip():
                partes += ["```", resto.strip("\n"), "```", ""]
    faltando = sorted(set(arquivos) - usados)
    if faltando:
        partes += ["## Outras ferramentas", ""]
        for nome in faltando:
            partes += [f"### {nome}", "", "```", ajuda(arquivos[nome]), "```", ""]
    return "\n".join(partes).rstrip() + "\n"


if __name__ == "__main__":
    novo = gerar()
    if "--verificar" in sys.argv:
        if not SAIDA.exists() or SAIDA.read_text(encoding="utf-8") != novo:
            sys.exit("docs/REFERENCIA.md está desatualizado: rode python3 docs/gerar-referencia.py")
        print("docs/REFERENCIA.md em dia")
    else:
        SAIDA.write_text(novo, encoding="utf-8")
        print(f"gerado {SAIDA.relative_to(RAIZ)}")
