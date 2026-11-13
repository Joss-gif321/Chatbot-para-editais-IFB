import type { Edital, NoDecisao } from "../types/api"

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

const defaultGreeting = "Olá! Selecione uma opção do menu para continuar."

function renderDecisionMenu(node: NoDecisao, canGoBack: boolean): string {
  const options = node.opcoes.map((option, index) => `${index + 1}. ${option.titulo}`)
  if (canGoBack) options.push(`${node.opcoes.length + 1}. Voltar ao menu anterior`)
  return [node.mensagem, options.join("\n")].filter(Boolean).join("\n\n")
}

export function getMensagemInicialEdital(edital?: Edital | null): string {
  if (!edital) return defaultGreeting
  const greeting = edital.mensagem_inicial?.trim() || defaultGreeting
  const menu = edital.arvore_decisao ? renderDecisionMenu(edital.arvore_decisao, false) : ""
  return [greeting, menu].filter(Boolean).join("\n\n")
}

function findDecisionOption(node: NoDecisao, message: string) {
  return node.opcoes.find((option) => option.entradas.some((entry) => {
    const normalizedEntry = normalize(entry.trim())
    if (!normalizedEntry) return false
    if (/^\d+$/.test(normalizedEntry)) return message === normalizedEntry
    return message === normalizedEntry || message.includes(normalizedEntry)
  }))
}

export interface RespostaChatbot {
  content: string
  isApiResult: boolean
  nextDecisionPath?: NoDecisao[]
}

export async function processarMensagemBot(
  textoUsuario: string,
  editalAtivoId: string,
  editais: Edital[],
  currentDecisionPath: NoDecisao[] = []
): Promise<RespostaChatbot> {
  const normalizado = normalize(textoUsuario.trim())
  const editalAtual =
    editais.find((e) => String(e.id) === editalAtivoId) || editais[0]

  if (!editalAtual) {
    return {
      content: "Não foi possível carregar o edital selecionado. Selecione um edital cadastrado para continuar.",
      isApiResult: false,
    }
  }

  const rootDecisionNode = editalAtual.arvore_decisao
  if (!rootDecisionNode) {
    return {
      content: "Este edital ainda não possui um menu configurado.",
      isApiResult: false,
    }
  }

  const decisionPath = currentDecisionPath.length > 0 ? currentDecisionPath : [rootDecisionNode]
  const activeDecisionNode = decisionPath[decisionPath.length - 1]
  const backOptionIndex = String(activeDecisionNode.opcoes.length + 1)
  const wantsToGoBack = decisionPath.length > 1 && (
    normalizado === backOptionIndex ||
    normalizado === "voltar ao menu anterior" ||
    normalizado === "menu anterior"
  )
  const wantsToShowRoot = normalizado === "reexibir menu principal" || normalizado === "menu principal"

  if (wantsToGoBack || wantsToShowRoot) {
    const nextDecisionPath = wantsToShowRoot || decisionPath.length === 1
      ? [rootDecisionNode]
      : decisionPath.slice(0, -1)
    const parentMenu = nextDecisionPath[nextDecisionPath.length - 1]
    return {
      content: renderDecisionMenu(parentMenu, nextDecisionPath.length > 1),
      isApiResult: true,
      nextDecisionPath,
    }
  }

  const selectedOption = findDecisionOption(activeDecisionNode, normalizado)
  if (selectedOption) {
    const nextDecisionPath = selectedOption.voltarAoMenuPrincipal
      ? [rootDecisionNode]
      : selectedOption.submenu
        ? [...decisionPath, selectedOption.submenu]
        : [rootDecisionNode]
    const nextMenu = nextDecisionPath[nextDecisionPath.length - 1]

    return {
      content: [selectedOption.resposta.trim(), renderDecisionMenu(nextMenu, nextDecisionPath.length > 1)]
        .filter(Boolean)
        .join("\n\n"),
      isApiResult: true,
      nextDecisionPath,
    }
  }

  return {
    content: ["Não entendi. Selecione uma das opções do menu.", renderDecisionMenu(activeDecisionNode, decisionPath.length > 1)]
      .join("\n\n"),
    isApiResult: true,
    nextDecisionPath: decisionPath,
  }
}
