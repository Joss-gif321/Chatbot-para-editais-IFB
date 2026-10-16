/**
 * Tipos e interfaces TypeScript para a API do Chatbot de Editais IFB
 * Baseado no schema da API hospedada em desafio-chatbot-api.onrender.com
 */

export interface Edital {
  id: string
  número: string
  ano: string
  setor: string
  título: string
  dados_gerais: string
  cronograma: string
  cursos: string
  requisitos: string
  vagas: string
  disposicoes_iniciais: string
  inscricoes: string
  seleção: string
  comprovacao_reserva_vagas: string
  matricula: string
  disposicoes_finais: string
}

export interface Contato {
  id: string
  telefone: string
  nome: string
  curso_pretendido: string
  status: string
}

export interface Admin {
  id: string
  nome: string
  email: string
  senha?: string
}

export type CriarContatoInput = Omit<Contato, "id">
export type AtualizarContatoInput = Partial<CriarContatoInput>

export interface BuscarEditaisParams {
  q?: string
  ano?: string
  número?: string
  setor?: string
  _limit?: number
  _page?: number
  _sort?: string
  _order?: "asc" | "desc"
}

export interface BuscarContatosParams {
  q?: string
  telefone?: string
  nome?: string
  curso_pretendido?: string
  status?: string
}

export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface ChatMessage {
  id: number | string
  author: "bot" | "user"
  content: string
  time: string
  isApiResult?: boolean
  error?: boolean
}
