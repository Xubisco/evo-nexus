import type { Dashboard, Dados, Manifest, Resumo } from './tipos'

// Cada resumo repete a conta do indicador correspondente da página (nome entre parênteses),
// com os filtros que a página usa ao abrir. Mudou a regra na página, muda aqui também.

const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const moeda2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const umaCasa = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

type Linha = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

const linhas = (dados: Dados, nome: string) => dados[nome] as Linha[]
const somar = (rows: Linha[], campo: (r: Linha) => number) => rows.reduce((s, r) => s + (campo(r) || 0), 0)
const mesCurto = (mes: string) => `${MES[+mes.slice(5, 7) - 1]}/${mes.slice(2, 4)}`
const percentual = (v: number) => `${v > 0 ? '+' : ''}${decimal.format(v * 100)}%`
const comSinal = (v: number) => (v < 0 ? '−' : '') + moeda.format(Math.abs(v))

function mesAnterior(mes: string) {
  return new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5) - 2, 1)).toISOString().slice(0, 7)
}

// Vendas e Metas (cmp, k-proj)
function resumoVendas(dados: Dados, manifest: Manifest): Resumo {
  const vendas = linhas(dados, 'vendas_dia')
  const ultimoDia = manifest.ultima_data_vendas
  const mes = ultimoDia.slice(0, 7)
  const corte = +ultimoDia.slice(8)
  const diasNoMes = new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5), 0)).getUTCDate()
  const doMes = (m: string) => somar(vendas.filter((v) => v.mes === m && +v.dia.slice(8) <= corte), (v) => v.fat)
  const atual = doMes(mes)
  const anterior = doMes(mesAnterior(mes))
  const emAndamento = corte < diasNoMes
  return {
    referencia: ultimoDia,
    destaques: [
      { rotulo: 'Faturamento do mês', valor: moeda.format(atual) },
      {
        rotulo: emAndamento ? 'Projeção do mês' : 'Mês fechado',
        valor: moeda.format(emAndamento ? (atual / corte) * diasNoMes : atual),
      },
    ],
    sinal: anterior > 0
      ? { texto: `${percentual(atual / anterior - 1)} vs mês anterior no mesmo período`, tom: atual < anterior ? 'ruim' : 'bom' }
      : { texto: 'Sem mês anterior para comparar', tom: 'neutro' },
  }
}

// Funil Online (k-roas, k-roas-d, k-cac), no último mês, como a página abre
function resumoFunil(dados: Dados): Resumo {
  const dias = linhas(dados, 'funil_dia')
  const meses = [...new Set(dias.map((r) => r.mes as string))].sort()
  const mes = meses[meses.length - 1]
  const anterior = meses[meses.length - 2]
  const doMes = (m: string) => {
    const rows = dias.filter((r) => r.mes === m)
    return { gasto: somar(rows, (r) => r.gasto), fat: somar(rows, (r) => r.fat_online), ped: somar(rows, (r) => r.pedidos_online) }
  }
  const a = doMes(mes)
  const roas = a.gasto ? a.fat / a.gasto : null
  const b = anterior ? doMes(anterior) : null
  const roasAnterior = b && b.gasto ? b.fat / b.gasto : null
  const variacao = roas !== null && roasAnterior ? roas / roasAnterior - 1 : null
  return {
    referencia: linhas(dados, 'funil_info')[0].periodo_fim,
    destaques: [
      { rotulo: `ROAS Global · ${mesCurto(mes)}`, valor: roas === null ? '—' : `${umaCasa.format(roas)}x` },
      { rotulo: 'CAC, gasto por pedido', valor: a.ped ? moeda.format(a.gasto / a.ped) : '—' },
    ],
    sinal: variacao === null
      ? { texto: 'Sem mês anterior para comparar', tom: 'neutro' }
      : { texto: `ROAS ${percentual(variacao)} vs ${mesCurto(anterior)}`, tom: variacao < 0 ? 'ruim' : 'bom' },
  }
}

// Estoque e Vendas (alertList)
function resumoEstoque(dados: Dados, manifest: Manifest): Resumo {
  const produtos = linhas(dados, 'produtos')
  const referencia = Date.parse(manifest.ultima_data_vendas)
  const parado = (p: Linha) => p.estoque > 0 && (!p.ultima || (referencia - Date.parse(p.ultima)) / 864e5 > 120)
  const ruptura = produtos.filter((p) => p.un90 > 0 && p.estoque <= 0).length
  const transito = produtos.filter((p) => p.a_receber > 0).length
  return {
    referencia: manifest.snapshot_estoque,
    destaques: [
      { rotulo: 'Em ruptura, com venda recente', valor: inteiro.format(ruptura), tom: ruptura > 0 ? 'atencao' : 'bom' },
      { rotulo: 'Parados em estoque', valor: inteiro.format(produtos.filter(parado).length) },
    ],
    sinal: { texto: `${inteiro.format(transito)} produtos com pedido de fábrica em trânsito`, tom: 'neutro' },
  }
}

// Compras e Reposição (itens, k-urg, k-zer, k-ped) com os filtros iniciais da página:
// ritmo de 90 dias, sazonalidade 1,0×, cobrir 60 dias após chegar, todas as fábricas, por produto
function resumoReposicao(dados: Dados): Resumo {
  const fabricas = new Map(linhas(dados, 'reposicao_fabrica').map((f) => [f.fabrica, f]))
  let ruptura30 = 0
  let zerados = 0
  let pedido = 0
  for (const p of linhas(dados, 'reposicao_produto')) {
    const fabrica = fabricas.get(p.fab) ?? { lead: 30, seguranca: 15 }
    const vendaDia = p.u90 / 90
    if (vendaDia <= 0) continue
    const cobertura = Math.ceil(Math.max(0, p.estoque) / vendaDia)
    if (p.estoque <= 0) zerados++
    else if (cobertura <= 30) ruptura30++
    const quantidade = Math.max(0, Math.ceil(vendaDia * (fabrica.lead + fabrica.seguranca + 60) - (p.estoque + p.a_receber)))
    pedido += quantidade * (p.custo || 0)
  }
  return {
    referencia: linhas(dados, 'reposicao_info')[0].snapshot_estoque,
    destaques: [
      { rotulo: 'Ruptura em até 30 dias', valor: inteiro.format(ruptura30), tom: ruptura30 > 0 ? 'atencao' : 'bom' },
      { rotulo: 'Zerados com venda', valor: inteiro.format(zerados), tom: zerados > 0 ? 'ruim' : 'bom' },
    ],
    sinal: { texto: `Pedido sugerido de ${moeda.format(pedido)} para cobrir 60 dias`, tom: 'neutro' },
  }
}

// Caixa e Contas (k-din, k-din-d, p-total, p-total-d)
function resumoCaixa(dados: Dados): Resumo {
  const caixas = linhas(dados, 'caixa_lojas')
  const resumo = linhas(dados, 'pagar_resumo')
  const valor = (bloco: string) => resumo.find((r) => r.grupo === 'todos' && r.bloco === bloco)?.valor ?? 0
  const abertos = caixas.filter((r) => r.status === 'Aberto').length
  const vencido = valor('vencido')
  return {
    referencia: caixas[0].dia,
    destaques: [
      { rotulo: 'Dinheiro nos caixas ao fechar', valor: moeda2.format(somar(caixas, (r) => r.saldo)) },
      { rotulo: 'Total a pagar, com bancos', valor: moeda.format(valor('total')) },
    ],
    sinal: vencido > 0
      ? { texto: `${moeda.format(vencido)} a pagar já vencido`, tom: 'ruim' }
      : { texto: abertos ? `${abertos} caixa ainda aberto` : 'Nada a pagar vencido', tom: 'bom' },
  }
}

// Boletos × Faturamento (porJanela, tot, k-saldo, k-fut), nas seis maiores fábricas, como a página abre
function resumoBoletos(dados: Dados): Resumo {
  const janelas = new Map<string, { fase: string; saldo: number; minima: number }>()
  for (const r of linhas(dados, 'boletos_janela')) {
    if (!r.top6) continue
    const j = janelas.get(r.janela) ?? { fase: r.fase, saldo: 0, minima: 0 }
    j.saldo += r.faturamento - r.boleto_mercadoria - r.frete
    j.minima += r.boleto_mercadoria + r.frete
    janelas.set(r.janela, j)
  }
  const lista = [...janelas.values()]
  const saldo = somar(lista.filter((j) => j.fase !== 'futura'), (j) => j.saldo)
  const aVencer = somar(lista.filter((j) => j.fase === 'futura'), (j) => j.minima)
  const negativas = lista.filter((j) => j.fase === 'passada' && j.saldo < 0).length
  return {
    referencia: linhas(dados, 'boletos_info')[0].hoje,
    destaques: [
      { rotulo: 'Saldo até a janela atual', valor: comSinal(saldo), tom: saldo < 0 ? 'ruim' : 'bom' },
      { rotulo: 'Boletos e frete a vencer', valor: moeda.format(aVencer) },
    ],
    sinal: {
      texto: `${negativas} ${negativas === 1 ? 'janela fechada' : 'janelas fechadas'} com saldo negativo`,
      tom: negativas > 0 ? 'atencao' : 'bom',
    },
  }
}

// Resultado (cxRes, ultimoFechadoCx, cx-k): último mês fechado de caixa
function resumoResultado(dados: Dados): Resumo {
  const caixa = linhas(dados, 'resultado_caixa')
  const fimDoMes = new Map<string, string>()
  caixa.forEach((r) => fimDoMes.set(r.mes, r.periodo_fim))
  const ultimoDia = (mes: string) => `${mes}-${String(new Date(+mes.slice(0, 4), +mes.slice(5, 7), 0).getDate()).padStart(2, '0')}`
  const meses = [...fimDoMes.keys()].sort()
  const fechados = meses.filter((m) => fimDoMes.get(m)! >= ultimoDia(m))
  const mes = fechados[fechados.length - 1]
  if (!mes) throw new Error('Nenhum mês fechado no resultado de caixa')
  const resultado = (m: string) => {
    const doMes = caixa.filter((r) => r.mes === m)
    const rec = somar(doMes.filter((r) => r.natureza === 'receita'), (r) => r.valor)
    const op = somar(doMes.filter((r) => r.tipo === 'despesa' && r.natureza !== 'nao_operacional'), (r) => r.valor)
    const no = somar(doMes.filter((r) => r.natureza === 'nao_operacional'), (r) => r.valor)
    return { resOp: rec - op, res: rec - op - no }
  }
  const a = resultado(mes)
  const anterior = meses[meses.indexOf(mes) - 1]
  const diferenca = anterior ? a.res - resultado(anterior).res : null
  return {
    referencia: fimDoMes.get(mes)!,
    destaques: [
      { rotulo: `Resultado operacional de caixa · ${mesCurto(mes)}`, valor: comSinal(a.resOp), tom: a.resOp < 0 ? 'ruim' : 'bom' },
      { rotulo: `Resultado de caixa · ${mesCurto(mes)}`, valor: comSinal(a.res), tom: a.res < 0 ? 'ruim' : 'bom' },
    ],
    sinal: diferenca === null
      ? { texto: 'Sem mês anterior para comparar', tom: 'neutro' }
      : { texto: `${diferenca >= 0 ? '+' : '−'}${moeda.format(Math.abs(diferenca))} em relação a ${mesCurto(anterior)}`, tom: diferenca < 0 ? 'ruim' : 'bom' },
  }
}

type Modulo = { montar: (dash: never) => void }

async function carregarPagina(html: Promise<{ default: string }>, css: Promise<{ default: string }>, logica: Promise<Modulo>) {
  const [h, c, l] = await Promise.all([html, css, logica])
  return { html: h.default, css: c.default, montar: l.montar }
}

export const DASHBOARDS: Dashboard[] = [
  {
    id: 'vendas-metas',
    titulo: 'Vendas e Metas',
    descricao: 'Resumo do mês, vendedores e metas, evolução',
    datasets: ['vendas_dia', 'vendedor_mes', 'metas'],
    resumo: { datasets: ['vendas_dia'], calcular: resumoVendas },
    pagina: () => carregarPagina(import('./vendas-metas/pagina.html?raw'), import('./vendas-metas/pagina.css?inline'), import('./vendas-metas/logica')),
  },
  {
    id: 'funil-online',
    titulo: 'Funil Online',
    descricao: 'Meta Ads, DataCrazy e vendas da loja Online',
    datasets: ['funil_dia', 'funil_campanha_mes', 'funil_etapa_semana', 'funil_info'],
    resumo: { datasets: ['funil_dia', 'funil_info'], calcular: resumoFunil },
    pagina: () => carregarPagina(import('./funil-online/pagina.html?raw'), import('./funil-online/pagina.css?inline'), import('./funil-online/logica')),
  },
  {
    id: 'estoque-vendas',
    titulo: 'Estoque e Vendas',
    descricao: 'Curva ABC, produto, alertas e histórico',
    datasets: ['produtos', 'mensal_produto', 'mensal_loja', 'estoque_local'],
    resumo: { datasets: ['produtos'], calcular: resumoEstoque, aba: 'alertas' },
    pagina: () => carregarPagina(import('./estoque-vendas/pagina.html?raw'), import('./estoque-vendas/pagina.css?inline'), import('./estoque-vendas/logica')),
  },
  {
    id: 'compras-reposicao',
    titulo: 'Compras e Reposição',
    descricao: 'Cobertura, ruptura e pedido sugerido por fábrica',
    datasets: ['reposicao_produto', 'reposicao_fabrica', 'reposicao_info'],
    resumo: { datasets: ['reposicao_produto', 'reposicao_fabrica', 'reposicao_info'], calcular: resumoReposicao },
    pagina: () => carregarPagina(import('./compras-reposicao/pagina.html?raw'), import('./compras-reposicao/pagina.css?inline'), import('./compras-reposicao/logica')),
  },
  {
    id: 'caixa-contas',
    titulo: 'Caixa e Contas',
    descricao: 'Caixa do dia, formas de pagamento, a pagar e a receber',
    datasets: [
      'caixa_lojas', 'caixa_formas', 'caixa_movimentos', 'pagamento_mes', 'lancamentos_mes', 'posicao_financeira',
      'pagar_resumo', 'pagar_semana', 'pagar_mes', 'pagar_categoria', 'pagar_bancos', 'pagar_bancos_titulos', 'pagar_qualidade',
    ],
    resumo: { datasets: ['caixa_lojas', 'pagar_resumo'], calcular: resumoCaixa },
    pagina: () => carregarPagina(import('./caixa-contas/pagina.html?raw'), import('./caixa-contas/pagina.css?inline'), import('./caixa-contas/logica')),
  },
  {
    id: 'boletos-fabricas',
    titulo: 'Boletos × Faturamento',
    descricao: 'Boletos e frete contra o faturamento de cada fábrica',
    datasets: ['boletos_janela', 'boletos_fabrica', 'boletos_info', 'boletos_pendencias'],
    resumo: { datasets: ['boletos_janela', 'boletos_info'], calcular: resumoBoletos },
    pagina: () => carregarPagina(import('./boletos-fabricas/pagina.html?raw'), import('./boletos-fabricas/pagina.css?inline'), import('./boletos-fabricas/logica')),
  },
  {
    id: 'resultado',
    titulo: 'Resultado: DRE e margem',
    descricao: 'Resultado de caixa e de competência, margem',
    datasets: ['resultado_caixa', 'resultado_comp', 'resultado_margem', 'resultado_conc', 'resultado_info'],
    resumo: { datasets: ['resultado_caixa'], calcular: resumoResultado },
    pagina: () => carregarPagina(import('./resultado/pagina.html?raw'), import('./resultado/pagina.css?inline'), import('./resultado/logica')),
  },
]
