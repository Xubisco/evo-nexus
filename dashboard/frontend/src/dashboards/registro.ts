import type { Dashboard, Dados, Manifest, Resumo } from './tipos'

const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

const DIAS_PARADO = 120

interface VendaDia {
  dia: string
  mes: string
  fat: number
}

interface Produto {
  estoque: number
  a_receber: number
  un90: number
  ultima: string | null
}

function somarMes(vendas: VendaDia[], mes: string, ateDia: number) {
  return vendas.reduce((soma, v) => (v.mes === mes && +v.dia.slice(8) <= ateDia ? soma + v.fat : soma), 0)
}

function mesAnterior(mes: string) {
  const data = new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5) - 2, 1))
  return data.toISOString().slice(0, 7)
}

// Mesmas regras dos indicadores da página Vendas e Metas (cmp, k-proj)
function resumoVendas(dados: Dados, manifest: Manifest): Resumo {
  const vendas = dados.vendas_dia as VendaDia[]
  const ultimoDia = manifest.ultima_data_vendas
  const mes = ultimoDia.slice(0, 7)
  const corte = +ultimoDia.slice(8)
  const diasNoMes = new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5), 0)).getUTCDate()
  const atual = somarMes(vendas, mes, corte)
  const anterior = somarMes(vendas, mesAnterior(mes), corte)
  const variacao = anterior > 0 ? atual / anterior - 1 : null
  const emAndamento = corte < diasNoMes
  return {
    destaques: [
      { rotulo: 'Faturamento do mês', valor: moeda.format(atual) },
      {
        rotulo: emAndamento ? 'Projeção do mês' : 'Mês fechado',
        valor: moeda.format(emAndamento ? (atual / corte) * diasNoMes : atual),
      },
    ],
    sinal: variacao === null
      ? { texto: 'Sem mês anterior para comparar', tom: 'neutro' }
      : {
          texto: `${variacao > 0 ? '+' : ''}${decimal.format(variacao * 100)}% vs mês anterior no mesmo período`,
          tom: variacao < 0 ? 'ruim' : 'bom',
        },
  }
}

// Mesmas regras dos alertas da página Estoque e Vendas (alertList)
function resumoEstoque(dados: Dados, manifest: Manifest): Resumo {
  const produtos = dados.produtos as Produto[]
  const referencia = Date.parse(manifest.ultima_data_vendas)
  const parado = (p: Produto) =>
    p.estoque > 0 && (!p.ultima || (referencia - Date.parse(p.ultima)) / 864e5 > DIAS_PARADO)
  const ruptura = produtos.filter((p) => p.un90 > 0 && p.estoque <= 0).length
  const transito = produtos.filter((p) => p.a_receber > 0).length
  return {
    destaques: [
      { rotulo: 'Em ruptura, com venda recente', valor: inteiro.format(ruptura), tom: ruptura > 0 ? 'atencao' : 'bom' },
      { rotulo: 'Parados em estoque', valor: inteiro.format(produtos.filter(parado).length) },
    ],
    sinal: { texto: `${inteiro.format(transito)} produtos com pedido de fábrica em trânsito`, tom: 'neutro' },
  }
}

async function carregarPagina(
  html: Promise<{ default: string }>,
  css: Promise<{ default: string }>,
  logica: Promise<{ montar: (dash: never) => void }>,
) {
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
    pagina: () =>
      carregarPagina(
        import('./vendas-metas/pagina.html?raw'),
        import('./vendas-metas/pagina.css?inline'),
        import('./vendas-metas/logica'),
      ),
  },
  {
    id: 'estoque-vendas',
    titulo: 'Estoque e Vendas',
    descricao: 'Curva ABC, produto, alertas e histórico',
    datasets: ['produtos', 'mensal_produto', 'mensal_loja', 'estoque_local'],
    resumo: { datasets: ['produtos'], calcular: resumoEstoque, aba: 'alertas' },
    pagina: () =>
      carregarPagina(
        import('./estoque-vendas/pagina.html?raw'),
        import('./estoque-vendas/pagina.css?inline'),
        import('./estoque-vendas/logica'),
      ),
  },
]
