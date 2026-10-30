import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Dados, Manifest } from './tipos'

export interface EstadoDados {
  manifest: Manifest | null
  dados: Dados
  erro: string | null
  carregando: boolean
}

// Lê os JSONs a cada carga de página. Dataset que falha fica ausente de `dados`,
// para um arquivo com problema não derrubar os outros blocos.
export function useDados(datasets: string[]): EstadoDados {
  const [estado, setEstado] = useState<EstadoDados>({ manifest: null, dados: {}, erro: null, carregando: true })
  const chave = datasets.join(',')

  useEffect(() => {
    let cancelado = false
    const nomes = chave ? chave.split(',') : []
    const ler = (nome: string) => api.get(`/dashboards/dados/${nome}`)

    Promise.all([ler('manifest'), ...nomes.map((nome) => ler(nome).catch(() => undefined))])
      .then(([manifest, ...lidos]) => {
        if (cancelado) return
        const dados: Dados = {}
        nomes.forEach((nome, i) => {
          if (lidos[i] !== undefined) dados[nome] = lidos[i]
        })
        setEstado({ manifest, dados, erro: null, carregando: false })
      })
      .catch((e) => {
        if (!cancelado) setEstado({ manifest: null, dados: {}, erro: e.message, carregando: false })
      })

    return () => {
      cancelado = true
    }
  }, [chave])

  return estado
}
