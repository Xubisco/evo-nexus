import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DASHBOARDS } from '../dashboards/registro'
import { useDados } from '../dashboards/useDados'
import { criarDash } from '../dashboards/runtime'
import '../dashboards/tema.css'

const SEM_DATASETS: string[] = []

export default function DashboardDetalhe() {
  const { id } = useParams()
  const dashboard = DASHBOARDS.find((d) => d.id === id)
  const { manifest, dados, erro, carregando } = useDados(dashboard?.datasets ?? SEM_DATASETS)
  const raiz = useRef<HTMLDivElement>(null)
  const [erroPagina, setErroPagina] = useState<string | null>(null)

  useEffect(() => {
    const el = raiz.current
    if (!el || !dashboard || !manifest) return
    let cancelado = false
    let desmontar = () => {}

    dashboard.pagina().then((pagina) => {
      if (cancelado) return
      const estilo = document.createElement('style')
      estilo.textContent = pagina.css
      document.head.append(estilo)
      // O HTML é da própria aplicação; os valores dos dados entram por textContent
      el.innerHTML = pagina.html
      const dash = criarDash(el, dados, manifest)
      desmontar = () => {
        dash.destruir()
        el.replaceChildren()
        estilo.remove()
      }
      try {
        pagina.montar(dash as never)
        dash.iniciar()
      } catch (e) {
        console.error(`dashboard ${dashboard.id}`, e)
        setErroPagina('Não foi possível montar este dashboard.')
      }
    }).catch((e) => setErroPagina(e.message))

    return () => {
      cancelado = true
      desmontar()
    }
  }, [dashboard, manifest, dados])

  const faltando = dashboard?.datasets.filter((nome) => !carregando && !(nome in dados)) ?? []

  return (
    <div className="max-w-[1320px] mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 mb-4 text-sm text-[#667085] hover:text-[#00FFA7] transition-colors">
        <ArrowLeft size={14} /> Visão geral
      </Link>
      {!dashboard && <p className="text-[#e6edf3]">Dashboard não encontrado.</p>}
      {(erro || erroPagina) && <p className="text-[#f85149] text-sm mb-4">{erro ?? erroPagina}</p>}
      {faltando.length > 0 && (
        <p className="text-[#fbbf24] text-sm mb-4">Dados indisponíveis: {faltando.join(', ')}.</p>
      )}
      <div ref={raiz} id="dash-root" className="dash-raiz" />
    </div>
  )
}
