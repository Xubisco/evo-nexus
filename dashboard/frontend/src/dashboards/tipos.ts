import type { Dash } from './runtime'

export interface Manifest {
  gerado_em: string
  carga: string
  ultima_data_vendas: string
  snapshot_estoque: string
  mes_em_andamento: string
}

export type Dados = Record<string, unknown>

export type Tom = 'neutro' | 'bom' | 'atencao' | 'ruim'

export interface Destaque {
  rotulo: string
  valor: string
  tom?: Tom
}

export interface Resumo {
  // Data dos dados deste dashboard (AAAA-MM-DD); cada um tem a sua fonte e o seu ritmo de atualização
  referencia: string
  destaques: Destaque[]
  sinal: { texto: string; tom: Tom }
}

export interface PaginaDashboard {
  html: string
  css: string
  montar: (dash: Dash) => void
}

// Um registro por dashboard: para adicionar outro, gere o dataset no exportador,
// crie a pasta da página e acrescente uma entrada em registro.ts.
export interface Dashboard {
  id: string
  titulo: string
  descricao: string
  datasets: string[]
  resumo: {
    datasets: string[]
    calcular: (dados: Dados, manifest: Manifest) => Resumo
    aba?: string
  }
  pagina: () => Promise<PaginaDashboard>
}
