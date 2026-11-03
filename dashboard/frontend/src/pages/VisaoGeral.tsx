import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { DASHBOARDS } from '../dashboards/registro'
import { useDados } from '../dashboards/useDados'
import type { Dados, Dashboard, Manifest, Resumo, Tom } from '../dashboards/tipos'

const DIAS_DESATUALIZADO = 8

const COR_TOM: Record<Tom, string> = {
  neutro: 'text-[#8b949e]',
  bom: 'text-[#3fb950]',
  atencao: 'text-[#fbbf24]',
  ruim: 'text-[#f85149]',
}

function dataBR(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

function diasDesde(iso: string) {
  return Math.floor((Date.now() - new Date(`${iso.slice(0, 10)}T00:00:00`).getTime()) / 864e5)
}

// Vale o mais antigo: reexportar sem CSV novo renova gerado_em, mas não os dados
function diasDeAtraso(manifest: Manifest) {
  return Math.max(diasDesde(manifest.gerado_em), diasDesde(manifest.ultima_data_vendas))
}

function calcularResumo(dashboard: Dashboard, dados: Dados, manifest: Manifest): Resumo | null {
  if (dashboard.resumo.datasets.some((nome) => !(nome in dados))) return null
  try {
    return dashboard.resumo.calcular(dados, manifest)
  } catch (erro) {
    console.error(`resumo ${dashboard.id}`, erro)
    return null
  }
}

function BlocoDashboard({ dashboard, resumo }: { dashboard: Dashboard; resumo: Resumo | null }) {
  const destino = `/dashboards/${dashboard.id}${dashboard.resumo.aba ? `#${dashboard.resumo.aba}` : ''}`
  return (
    <Link
      to={destino}
      className="group flex flex-col gap-4 bg-[#161b22] border border-[#21262d] rounded-2xl p-6 transition-all hover:border-[#00FFA7]/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#e6edf3]">{dashboard.titulo}</h2>
          <p className="text-xs text-[#667085] mt-0.5">{dashboard.descricao}</p>
        </div>
        <ArrowRight size={16} className="shrink-0 text-[#667085] group-hover:text-[#00FFA7] transition-colors" />
      </div>
      {resumo ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            {resumo.destaques.map((d) => (
              <div key={d.rotulo} className="min-w-0">
                <p className={`text-2xl font-semibold tabular-nums ${d.tom ? COR_TOM[d.tom] : 'text-[#e6edf3]'}`}>{d.valor}</p>
                <p className="text-xs text-[#667085] mt-1">{d.rotulo}</p>
              </div>
            ))}
          </div>
          <p className={`text-sm ${COR_TOM[resumo.sinal.tom]}`}>{resumo.sinal.texto}</p>
          <p className={`mt-auto text-xs ${diasDesde(resumo.referencia) > DIAS_DESATUALIZADO ? 'text-[#fbbf24]' : 'text-[#667085]'}`}>
            Dados de {dataBR(resumo.referencia)}
            {diasDesde(resumo.referencia) > DIAS_DESATUALIZADO && ' · desatualizado'}
          </p>
        </>
      ) : (
        <p className="text-sm text-[#f85149]">Não foi possível ler os dados deste dashboard.</p>
      )}
    </Link>
  )
}

export default function VisaoGeral() {
  const datasets = useMemo(() => [...new Set(DASHBOARDS.flatMap((d) => d.resumo.datasets))], [])
  const { manifest, dados, erro, carregando } = useDados(datasets)

  if (carregando) return <p className="text-[#667085] text-sm">Carregando...</p>

  if (erro || !manifest) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div>
          <p className="text-[#e6edf3] mb-2">Os dados dos dashboards ainda não estão disponíveis.</p>
          <p className="text-[#667085] text-sm">{erro}</p>
        </div>
      </div>
    )
  }

  const atraso = diasDeAtraso(manifest)

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#e6edf3] tracking-tight">Visão geral</h1>
        <p className="text-[#667085] text-sm mt-1">
          Base de vendas e estoque: vendas até {dataBR(manifest.ultima_data_vendas)} · estoque de {dataBR(manifest.snapshot_estoque)} · gerada em{' '}
          {dataBR(manifest.gerado_em)}
        </p>
      </div>

      {atraso > DIAS_DESATUALIZADO && (
        <div
          role="alert"
          className="flex items-center gap-3 mb-6 rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/10 px-4 py-3 text-sm text-[#fbbf24]"
        >
          <AlertTriangle size={16} className="shrink-0" />
          Dados desatualizados: a última carga tem {atraso} dias. Confira se os arquivos da semana foram enviados e se a rotina rodou.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {DASHBOARDS.map((d) => (
          <BlocoDashboard key={d.id} dashboard={d} resumo={calcularResumo(d, dados, manifest)} />
        ))}
      </div>
    </div>
  )
}
