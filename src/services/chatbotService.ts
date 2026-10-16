import type { Contato, Edital } from "../types/api"
import { getContatoByTelefone, searchEditais } from "./api"

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

/**
 * Extrai número de telefone brasileiro da mensagem digitada pelo usuário
 */
export function extrairTelefone(texto: string): string | null {
  // Padrões como (11) 90000-0001, 11900000001, 90000-0001, etc.
  const regex = /(?:\(?\d{2}\)?\s*)?(?:9\s*\d{4}|\d{4,5})[-.\s]?\d{4}/g
  const matches = texto.match(regex)
  if (matches && matches.length > 0) {
    return matches[0].trim()
  }
  return null
}

export interface RespostaChatbot {
  content: string
  isApiResult: boolean
}

/**
 * Processa a mensagem do usuário consultando dados reais da API
 */
export async function processarMensagemBot(
  textoUsuario: string,
  editalAtivoId: string,
  editais: Edital[]
): Promise<RespostaChatbot> {
  const normalizado = normalize(textoUsuario)
  const editalAtual =
    editais.find((e) => e.id === editalAtivoId) || editais[0]

  // 1. Identificar se o usuário enviou ou perguntou sobre telefone/status de inscrição
  const telefoneDetectado = extrairTelefone(textoUsuario)
  const perguntouStatus =
    normalizado.includes("status") ||
    normalizado.includes("inscricao") && (normalizado.includes("minha") || normalizado.includes("consulta"))

  if (telefoneDetectado || (perguntouStatus && /\d{4}/.test(normalizado))) {
    const telefoneParaBuscar = telefoneDetectado || textoUsuario.replace(/\D/g, "")
    try {
      const contato: Contato | null = await getContatoByTelefone(telefoneParaBuscar)

      if (contato) {
        return {
          content: `Dados encontrados na API para o telefone **${contato.telefone}**:\n\n• **Candidato(a):** ${contato.nome}\n• **Curso pretendido:** ${contato.curso_pretendido}\n• **Status atual:** ${contato.status}\n\nSe precisar atualizar alguma informação ou tiver dúvidas sobre as próximas etapas, estou à disposição!`,
          isApiResult: true,
        }
      } else {
        return {
          content: `Não encontrei nenhuma inscrição vinculada ao telefone "${telefoneParaBuscar}" na base de dados da API.\n\nVerifique se digitou o número com DDD (ex: (11) 90000-0001) ou informe seu nome completo para que eu possa verificar.`,
          isApiResult: true,
        }
      }
    } catch (error) {
      console.warn("Falha ao consultar contato na API:", error)
      return {
        content: `Ocorreu uma instabilidade momentânea ao consultar a base de contatos da API. Por favor, tente novamente em alguns instantes.`,
        isApiResult: true,
      }
    }
  }

  // 2. Se não temos editais carregados ainda
  if (!editalAtual) {
    return {
      content:
        "Os editais ainda estão sendo sincronizados com o servidor da API. Aguarde alguns instantes e tente novamente.",
      isApiResult: false,
    }
  }

  const tituloEdital = `Edital ${editalAtual.número} (${editalAtual.setor})`

  // 3. Perguntas sobre Cursos e Vagas
  if (
    normalizado.includes("curso") ||
    normalizado.includes("qual curso") ||
    normalizado.includes("quais cursos") ||
    normalizado.includes("opcao") ||
    normalizado.includes("opcoes")
  ) {
    return {
      content: `Informações de cursos para o **${tituloEdital}**:\n\n• **Cursos oferecidos:** ${editalAtual.cursos}\n• **Distribuição de vagas:** ${editalAtual.vagas}\n• **Requisitos básicos:** ${editalAtual.requisitos}`,
      isApiResult: true,
    }
  }

  // 4. Perguntas sobre Vagas
  if (normalizado.includes("vaga") || normalizado.includes("quantas vagas")) {
    return {
      content: `Quadro de vagas do **${tituloEdital}**:\n\n• ${editalAtual.vagas}\n\n*Nota sobre reserva de vagas:* ${editalAtual.comprovacao_reserva_vagas}`,
      isApiResult: true,
    }
  }

  // 5. Perguntas sobre Documentos e Requisitos
  if (
    normalizado.includes("documento") ||
    normalizado.includes("requisito") ||
    normalizado.includes("o que precisa") ||
    normalizado.includes("quem pode")
  ) {
    return {
      content: `Requisitos e documentos exigidos pelo **${tituloEdital}**:\n\n• **Requisitos:** ${editalAtual.requisitos}\n• **Documentação de Matrícula:** ${editalAtual.matricula}\n• **Reserva de Vagas:** ${editalAtual.comprovacao_reserva_vagas}`,
      isApiResult: true,
    }
  }

  // 6. Perguntas sobre Datas, Cronograma ou Prazos
  if (
    normalizado.includes("prazo") ||
    normalizado.includes("cronograma") ||
    normalizado.includes("data") ||
    normalizado.includes("quando") ||
    normalizado.includes("resultado") ||
    normalizado.includes("periodo")
  ) {
    return {
      content: `Cronograma oficial do **${tituloEdital}**:\n\n• ${editalAtual.cronograma}\n\nFique atento aos prazos informados e evite realizar procedimentos no último dia.`,
      isApiResult: true,
    }
  }

  // 7. Perguntas sobre Inscrição e Procedimentos
  if (
    normalizado.includes("como se inscrever") ||
    normalizado.includes("inscricao") ||
    normalizado.includes("formulario")
  ) {
    return {
      content: `Instruções de inscrição para o **${tituloEdital}**:\n\n• **Como se inscrever:** ${editalAtual.inscricoes}\n• **Disposições:** ${editalAtual.disposicoes_iniciais}`,
      isApiResult: true,
    }
  }

  // 8. Perguntas sobre Isenção de Taxa ou Valores
  if (
    normalizado.includes("isencao") ||
    normalizado.includes("taxa") ||
    normalizado.includes("valor") ||
    normalizado.includes("pagar") ||
    normalizado.includes("gratuito") ||
    normalizado.includes("gratis")
  ) {
    return {
      content: `Informações sobre custos e gratuidade no **${tituloEdital}**:\n\n• ${editalAtual.disposicoes_iniciais}\n• ${editalAtual.dados_gerais}\n\nTodos os cursos deste edital são 100% gratuitos!`,
      isApiResult: true,
    }
  }

  // 9. Perguntas sobre Cotas / Ações Afirmativas
  if (
    normalizado.includes("cota") ||
    normalizado.includes("acao afirmativa") ||
    normalizado.includes("reserva")
  ) {
    return {
      content: `Regras de reserva de vagas no **${tituloEdital}**:\n\n• **Reserva de vagas:** ${editalAtual.comprovacao_reserva_vagas}\n• **Distribuição das vagas:** ${editalAtual.vagas}`,
      isApiResult: true,
    }
  }

  // 10. Perguntas sobre Seleção ou Sorteio
  if (
    normalizado.includes("selecao") ||
    normalizado.includes("sorteio") ||
    normalizado.includes("prova") ||
    normalizado.includes("criterio")
  ) {
    return {
      content: `Critérios de seleção do **${tituloEdital}**:\n\n• ${editalAtual.seleção}`,
      isApiResult: true,
    }
  }

  // 11. Perguntas sobre Matrícula
  if (normalizado.includes("matricula") || normalizado.includes("matricular")) {
    return {
      content: `Orientações para matrícula do **${tituloEdital}**:\n\n• ${editalAtual.matricula}`,
      isApiResult: true,
    }
  }

  // 12. Busca textual na API caso o usuário tenha digitado um termo específico
  try {
    const resultados = await searchEditais(textoUsuario.trim())
    if (resultados && resultados.length > 0) {
      const primeiro = resultados[0]
      return {
        content: `Localizei informações correspondentes na API para o **Edital ${primeiro.número}**:\n\n• **Título:** ${primeiro.título}\n• **Cursos:** ${primeiro.cursos}\n• **Resumo:** ${primeiro.dados_gerais}\n• **Cronograma:** ${primeiro.cronograma}`,
        isApiResult: true,
      }
    }
  } catch {
    // Se a busca falhar, cai no fallback amigável
  }

  // 13. Fallback amigável
  return {
    content: `Para obter informações precisas do **${tituloEdital}**, você pode me perguntar sobre:\n\n• **Cursos disponíveis** e vagas\n• **Prazos e cronograma** das inscrições\n• **Documentos e requisitos** exigidos\n• **Critérios de seleção** e matrícula\n• **Status da sua inscrição** (basta digitar seu telefone com DDD, ex: *(11) 90000-0001*)\n\nComo posso ajudar você agora?`,
    isApiResult: false,
  }
}
