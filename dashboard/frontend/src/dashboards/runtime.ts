// Versão enxuta do runtime `dash` dos Artifacts: mantém a lógica das páginas de referência
// igual à original e troca só a origem dos dados, que aqui vêm de /api/dashboards/dados.
import type { Dados, Manifest } from './tipos'

type Linhas = Record<string, unknown>[]

const CORES = ['#00FFA7', '#60A5FA', '#FBBF24', '#F472B6', '#A78BFA', '#34D399', '#FB923C', '#94A3B8']

export interface Dash {
  colors: string[]
  manifest: Manifest
  data: (id: string) => { status: 'ok' | 'missing'; data: Linhas }
  draw: (nome: string, fn?: (el: HTMLElement) => void) => void
  onData: (fn: () => void) => void
  setLink: (nome: string) => void
  iniciar: () => void
  destruir: () => void
}

export function criarDash(raiz: HTMLElement, dados: Dados, manifest: Manifest): Dash {
  const draws = new Map<string, (el: HTMLElement) => void>()
  const ouvintes: (() => void)[] = []
  let observador: ResizeObserver | null = null
  let espera: ReturnType<typeof setTimeout>

  const desenhar = (nome: string) => {
    const fn = draws.get(nome)
    if (!fn) return
    raiz.querySelectorAll<HTMLElement>(`[data-draw="${nome}"]`).forEach((el) => {
      try {
        fn(el)
      } catch (erro) {
        console.error(`dash.draw ${nome}`, erro)
      }
    })
  }

  const atualizarTudo = () => {
    ouvintes.forEach((fn) => fn())
    draws.forEach((_, nome) => desenhar(nome))
  }

  return {
    colors: CORES,
    manifest,
    data: (id) => (id in dados ? { status: 'ok', data: dados[id] as Linhas } : { status: 'missing', data: [] }),
    draw: (nome, fn) => {
      if (fn) draws.set(nome, fn)
      else desenhar(nome)
    },
    onData: (fn) => {
      ouvintes.push(fn)
      fn()
    },
    // Guarda a aba na URL, e a página lê o hash ao abrir: um link pode cair direto numa aba
    setLink: (nome) => window.history.replaceState(window.history.state, '', `#${nome}`),
    iniciar: () => {
      let largura = raiz.clientWidth
      atualizarTudo()
      observador = new ResizeObserver(() => {
        if (raiz.clientWidth === largura) return
        largura = raiz.clientWidth
        clearTimeout(espera)
        espera = setTimeout(atualizarTudo, 150)
      })
      observador.observe(raiz)
    },
    destruir: () => {
      observador?.disconnect()
      clearTimeout(espera)
    },
  }
}
