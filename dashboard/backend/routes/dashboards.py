"""Dados dos dashboards da Visão Geral.

Os arquivos são gerados por workspace/finance/base_estoque/exportar_datasets.py a partir
da base SQLite (contrato em dashboards/CONTRATO_DADOS.md). A rota só entrega o que está
no disco, então reconstruir a base e reexportar basta para o X-Brain mostrar dados novos.
"""

import re
from pathlib import Path

from flask import Blueprint, abort, send_file
from flask_login import login_required

bp = Blueprint("dashboards", __name__)

REPO_ROOT = Path(__file__).resolve().parents[3]
DADOS_DIR = REPO_ROOT / "workspace" / "finance" / "base_estoque" / "dashboards" / "dados"

NOME_RE = re.compile(r"^[a-z0-9_]{1,64}$")


@bp.route("/api/dashboards/dados/<nome>")
@login_required
def dados(nome):
    arquivo = DADOS_DIR / f"{nome}.json"
    if not NOME_RE.match(nome) or not arquivo.is_file():
        abort(404)
    # max_age=0 + conditional: o navegador sempre revalida, e só baixa de novo se o arquivo mudou
    return send_file(arquivo, mimetype="application/json", max_age=0, conditional=True)
