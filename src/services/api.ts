import axios, { AxiosError, AxiosInstance } from "axios"
import type {
  Admin,
  AtualizarContatoInput,
  BuscarContatosParams,
  BuscarEditaisParams,
  Contato,
  CriarContatoInput,
  Edital,
} from "../types/api"

/**
 * Obtém a URL base da API a partir das variáveis de ambiente do Vite
 * ou utiliza a URL oficial de fallback hospedada no Render.
 */
const BASE_URL = (
  import.meta.env.VITE_API_URL || "https://desafio-chatbot-api.onrender.com"
).replace(/\/+$/, "")

/**
 * Instância configurada do Axios para comunicação com o backend
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 segundos para comportar eventuais cold-starts do Render
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

/**
 * Normaliza mensagens de erro do Axios para feedback legível ao usuário
 */
export function formatarErroApi(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>
    if (axiosError.code === "ECONNABORTED") {
      return "O servidor da API demorou muito para responder (tempo esgotado). Tente novamente."
    }
    if (!axiosError.response) {
      return "Não foi possível conectar ao servidor da API. Verifique sua conexão com a internet ou tente novamente em instantes."
    }
    const status = axiosError.response.status
    if (status === 404) {
      return "O recurso solicitado não foi encontrado na base de dados da API."
    }
    if (status >= 500) {
      return "O servidor da API encontrou um erro interno. Tente novamente mais tarde."
    }
    if (axiosError.response.data?.message) {
      return axiosError.response.data.message
    }
  }
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado ao se comunicar com a API."
}

// ============================================================================
// Serviços de Editais
// ============================================================================

/**
 * Busca a lista de editais cadastrados, suportando filtros e busca textual
 */
export async function getEditais(params?: BuscarEditaisParams): Promise<Edital[]> {
  try {
    const response = await apiClient.get<Edital[]>("/editais", { params })
    return response.data
  } catch (error) {
    console.error("[API] Erro ao buscar editais:", error)
    throw new Error(formatarErroApi(error))
  }
}

/**
 * Busca um edital específico pelo identificador
 */
export async function getEditalById(id: string): Promise<Edital> {
  try {
    const response = await apiClient.get<Edital>(`/editais/${encodeURIComponent(id)}`)
    return response.data
  } catch (error) {
    console.error(`[API] Erro ao buscar edital ${id}:`, error)
    throw new Error(formatarErroApi(error))
  }
}

/**
 * Realiza busca textual ampla nos editais através do operador ?q=
 */
export async function searchEditais(termo: string): Promise<Edital[]> {
  try {
    const response = await apiClient.get<Edital[]>("/editais", {
      params: { q: termo },
    })
    return response.data
  } catch (error) {
    console.error(`[API] Erro na busca por "${termo}":`, error)
    throw new Error(formatarErroApi(error))
  }
}

// ============================================================================
// Serviços de Contatos e Inscrições
// ============================================================================

/**
 * Busca contatos/candidatos cadastrados na API
 */
export async function getContatos(params?: BuscarContatosParams): Promise<Contato[]> {
  try {
    const response = await apiClient.get<Contato[]>("/contatos", { params })
    return response.data
  } catch (error) {
    console.error("[API] Erro ao buscar contatos:", error)
    throw new Error(formatarErroApi(error))
  }
}

/**
 * Busca o status de inscrição de um candidato pelo número de telefone
 */
export async function getContatoByTelefone(telefone: string): Promise<Contato | null> {
  try {
    // Normaliza telefone para busca (busca exata ou busca com query q)
    const limpo = telefone.trim()
    const response = await apiClient.get<Contato[]>("/contatos", {
      params: { telefone: limpo },
    })

    if (response.data && response.data.length > 0) {
      return response.data[0]
    }

    // Se busca exata falhar, tenta com ?q= para tolerar formatações diferentes
    const buscaFallback = await apiClient.get<Contato[]>("/contatos", {
      params: { q: limpo },
    })

    return buscaFallback.data?.[0] ?? null
  } catch (error) {
    console.error(`[API] Erro ao buscar contato pelo telefone ${telefone}:`, error)
    throw new Error(formatarErroApi(error))
  }
}

/**
 * Cadastra um novo candidato/contato no sistema
 */
export async function cadastrarContato(dados: CriarContatoInput): Promise<Contato> {
  try {
    const response = await apiClient.post<Contato>("/contatos", dados)
    return response.data
  } catch (error) {
    console.error("[API] Erro ao cadastrar contato:", error)
    throw new Error(formatarErroApi(error))
  }
}

/**
 * Atualiza os dados de um candidato/contato existente
 */
export async function atualizarContato(
  id: string,
  dados: AtualizarContatoInput
): Promise<Contato> {
  try {
    const response = await apiClient.patch<Contato>(
      `/contatos/${encodeURIComponent(id)}`,
      dados
    )
    return response.data
  } catch (error) {
    console.error(`[API] Erro ao atualizar contato ${id}:`, error)
    throw new Error(formatarErroApi(error))
  }
}

// ============================================================================
// Serviços de Administração e Health Check
// ============================================================================

/**
 * Verifica a saúde/conectividade da API
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get("/editais", { params: { _limit: 1 } })
    return response.status === 200
  } catch {
    return false
  }
}

/**
 * Export padrão agrupando os serviços
 */
export const api = {
  getEditais,
  getEditalById,
  searchEditais,
  getContatos,
  getContatoByTelefone,
  cadastrarContato,
  atualizarContato,
  checkApiHealth,
}

export default api
