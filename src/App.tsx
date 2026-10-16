import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react"
import type { Edital } from "./types/api"
import { getEditais } from "./services/api"
import { processarMensagemBot } from "./services/chatbotService"

type Message = {
  id: number | string
  author: "bot" | "user"
  content: string
  time: string
  isApiResult?: boolean
  isError?: boolean
}

interface NoticeOption {
  value: string
  short: string
  label: string
  fullLabel: string
  pdfUrl: string
}

const fallbackNotices: NoticeOption[] = [
  {
    value: "edital-2026-001",
    short: "Edital 001/2026",
    label: "Edital 001/2026 — Cursos Técnicos Gratuitos",
    fullLabel: "Processo seletivo para cursos técnicos gratuitos",
    pdfUrl: "https://www.ifb.edu.br/processos-seletivos/editais",
  },
  {
    value: "edital-2026-002",
    short: "Edital 002/2026",
    label: "Edital 002/2026 — Qualificação Profissional",
    fullLabel: "Seleção para cursos de qualificação profissional",
    pdfUrl: "https://www.ifb.edu.br/processos-seletivos/editais",
  },
]

const quickQuestions = [
  {
    label: "Documentos necessários",
    question: "Quais são os documentos necessários para a matrícula?",
    icon: <DocumentIcon />,
  },
  {
    label: "Prazo de inscrição",
    question: "Até quando vão as inscrições e qual o cronograma?",
    icon: <CalendarIcon />,
  },
  {
    label: "Cursos e vagas",
    question: "Quais são os cursos oferecidos e a quantidade de vagas?",
    icon: <TicketIcon />,
  },
  {
    label: "Consultar inscrição",
    question: "Gostaria de consultar o status da minha inscrição. Telefone: (11) 90000-0001",
    icon: <PeopleIcon />,
  },
]

function getTime() {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date())
}

function IFBMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`ifb-mark ${compact ? "ifb-mark--compact" : ""}`}
      aria-label="IFB"
      role="img"
    >
      <span className="ifb-dot" />
      {Array.from({ length: 8 }).map((_, index) => (
        <span className="ifb-block" key={index} />
      ))}
    </div>
  )
}

function BotAvatar() {
  return (
    <div className="bot-avatar" aria-hidden="true">
      <IFBMark compact />
    </div>
  )
}

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n")

  return (
    <div className="message-copy">
      {lines.map((line, index) => {
        const isBullet = line.startsWith("• ")
        const cleanLine = isBullet ? line.slice(2) : line

        return (
          <p
            className={isBullet ? "message-bullet" : ""}
            key={`${line.slice(0, 15)}-${index}`}
          >
            {cleanLine ? renderFormattedText(cleanLine) : "\u00A0"}
          </p>
        )
      })}
    </div>
  )
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m21 3-7.2 18-4.1-7.4L3 9.8 21 3Z" />
      <path d="m9.7 13.6 4.2-3.8" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 10 5 5 5-5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 12 3 3 7-7" />
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 1.2 4.1a5.2 5.2 0 0 0 3.6 3.6L21 12l-4.2 1.2a5.2 5.2 0 0 0-3.6 3.6L12 21l-1.2-4.2a5.2 5.2 0 0 0-3.6-3.6L3 12l4.2-1.3a5.2 5.2 0 0 0 3.6-3.6L12 3Z" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7V3Z" />
      <path d="M14 3v5h4M10 12h5M10 16h5" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v15H4V6ZM8 3v6M16 3v6M4 11h16" />
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Z" />
      <path d="M12 8v2M12 14v2" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 21v-3a6 6 0 0 1 12 0v3M17 4a4 4 0 0 1 0 7M17 14a6 6 0 0 1 4 5.7V21" />
    </svg>
  )
}

function FilePdfIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10 12v5M10 12h2a1.5 1.5 0 0 1 0 3h-2" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

const initialBotMessage: Message = {
  id: 1,
  author: "bot",
  content:
    "Olá! Sou o Assistente Virtual de Editais do IFB integrado à API em tempo real. Estou pronto para ajudar você com dúvidas sobre cursos, vagas, inscrições, prazos e consulta de status de candidato.\n\nComo posso ajudar hoje?",
  time: getTime(),
}

export default function App() {
  const [editais, setEditais] = useState<Edital[]>([])
  const [noticesList, setNoticesList] = useState<NoticeOption[]>(fallbackNotices)
  const [selectedNotice, setSelectedNotice] = useState<string>(fallbackNotices[0].value)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([initialBotMessage])
  const [isTyping, setIsTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  // Carrega os editais reais da API ao inicializar
  useEffect(() => {
    let isMounted = true

    async function carregarDadosApi() {
      try {
        const dadosEditais = await getEditais()

        if (!isMounted) return

        if (dadosEditais && dadosEditais.length > 0) {
          setEditais(dadosEditais)
          const options: NoticeOption[] = dadosEditais.map((edital) => ({
            value: edital.id,
            short: `Edital ${edital.número}`,
            label: `Edital ${edital.número} — ${edital.título}`,
            fullLabel: edital.título,
            pdfUrl: "https://www.ifb.edu.br/processos-seletivos/editais",
          }))
          setNoticesList(options)
          setSelectedNotice(options[0].value)
        }
      } catch (error) {
        console.error("Falha ao inicializar dados da API:", error)
      }
    }

    carregarDadosApi()

    return () => {
      isMounted = false
    }
  }, [])

  const activeNotice =
    noticesList.find((notice) => notice.value === selectedNotice) ?? noticesList[0]

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isTyping])

  function handleClearChat() {
    if (isTyping) return
    setMessages([
      {
        ...initialBotMessage,
        id: Date.now(),
        time: getTime(),
      },
    ])
  }

  async function sendMessage(text: string) {
    const cleanText = text.trim()
    if (!cleanText || isTyping) return

    const userMessage: Message = {
      id: Date.now(),
      author: "user",
      content: cleanText,
      time: getTime(),
    }

    setMessages((current) => [...current, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      // Processa a mensagem consultando a API via axios
      const resposta = await processarMensagemBot(
        cleanText,
        selectedNotice,
        editais
      )

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          author: "bot",
          content: resposta.content,
          time: getTime(),
          isApiResult: resposta.isApiResult,
        },
      ])
    } catch (error) {
      console.error("Erro ao processar resposta do bot:", error)
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          author: "bot",
          content:
            "Desculpe, ocorreu um erro ao consultar os dados da API em tempo real. Por favor, tente novamente em instantes.",
          time: getTime(),
          isError: true,
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    sendMessage(input)
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="chat-app" aria-label="Assistente de Editais do IFB">
        <header className="app-header">
          <div className="header-main">
            <div className="brand-lockup">
              <div className="logo-panel">
                <IFBMark />
                <span className="logo-rule" />
                <span className="logo-name">
                  Instituto Federal
                  <small>Brasília</small>
                </span>
              </div>

              <div className="title-block">
                <span className="eyebrow">Processo seletivo 2026</span>
                <h1>Assistente de Editais</h1>
              </div>
            </div>
          </div>

          <div className="header-toolbar">
            <label className="notice-select">
              <span className="notice-label">Edital em consulta</span>
              <span className="select-wrap">
                <select
                  aria-label="Selecione o edital em consulta"
                  value={selectedNotice}
                  onChange={(event) => setSelectedNotice(event.target.value)}
                >
                  {noticesList.map((notice) => (
                    <option key={notice.value} value={notice.value}>
                      {notice.label}
                    </option>
                  ))}
                </select>
                <ChevronIcon />
              </span>
            </label>

            <div className="header-actions">
              <a
                aria-label={`Baixar PDF do ${activeNotice.short}`}
                className="header-btn header-btn--pdf"
                href={activeNotice.pdfUrl}
                rel="noreferrer"
                target="_blank"
                title="Abrir página oficial do edital"
              >
                <FilePdfIcon />
                <span>Página do Edital</span>
              </a>

              <button
                aria-label="Limpar histórico de conversa"
                className="header-btn header-btn--clear"
                disabled={isTyping || messages.length <= 1}
                onClick={handleClearChat}
                title="Limpar histórico da conversa"
                type="button"
              >
                <TrashIcon />
                <span>Limpar chat</span>
              </button>
            </div>
          </div>
        </header>

        <div className="context-bar">
          <div className="context-info">
            <span className="context-check">
              <CheckIcon />
            </span>
            <p>
              Você está consultando <strong>{activeNotice.short}</strong>
              <span>{activeNotice.fullLabel}</span>
            </p>
          </div>
          <a
            className="context-pdf-link"
            href={activeNotice.pdfUrl}
            rel="noreferrer"
            target="_blank"
          >
            <FilePdfIcon />
            <span>Portal IFB</span>
          </a>
        </div>

        <div className="chat-body">
          <div className="chat-background" aria-hidden="true" />
          <div className="date-divider">
            <span>Hoje</span>
          </div>

          <div className="messages" aria-live="polite">
            {messages.map((message) => (
              <div
                className={`message-row message-row--${message.author}`}
                key={message.id}
              >
                {message.author === "bot" && <BotAvatar />}
                <div
                  className={`message-bubble message-bubble--${message.author}`}
                >
                  {message.author === "bot" && (
                    <span className="message-author">
                      Assistente IFB
                      {message.isApiResult && (
                        <small style={{ marginLeft: "6px", opacity: 0.75, fontSize: "10px" }}>
                          (Dados da API)
                        </small>
                      )}
                    </span>
                  )}
                  <MessageContent content={message.content} />
                  <span className="message-meta">
                    {message.time}
                    {message.author === "user" && (
                      <svg viewBox="0 0 18 12" aria-label="Mensagem entregue">
                        <path d="m1 6 3 3 6-7M7 8l1 1 7-7" />
                      </svg>
                    )}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message-row message-row--bot">
                <BotAvatar />
                <div
                  className="typing-bubble"
                  aria-label="Assistente está consultando a API..."
                >
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-label">Consultando API do edital...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <footer className="composer-panel">
          <div className="quick-section">
            <div className="quick-title">
              <SparkIcon />
              <span>Perguntas frequentes e atalhos da API</span>
              <span className="quick-line" />
            </div>
            <div
              className="quick-list"
              aria-label="Atalhos de perguntas frequentes"
            >
              {quickQuestions.map((item) => (
                <button
                  className="quick-chip"
                  disabled={isTyping}
                  key={item.label}
                  onClick={() => sendMessage(item.question)}
                  type="button"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <form className="composer" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="chat-input">
              Digite sua dúvida ou telefone para consulta...
            </label>
            <input
              autoComplete="off"
              id="chat-input"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Digite sua dúvida ou telefone (ex: 11 90000-0001)..."
              type="text"
              value={input}
            />
            <button
              aria-label="Enviar mensagem"
              className="send-button"
              disabled={!input.trim() || isTyping}
              type="submit"
            >
              <span>Enviar</span>
              <SendIcon />
            </button>
          </form>

          <p className="disclaimer">
            Respostas obtidas em tempo real da API{" "}
            <strong>desafio-chatbot-api.onrender.com</strong>. Confirme sempre no edital oficial em{" "}
            <a href="https://www.ifb.edu.br/" rel="noreferrer" target="_blank">
              ifb.edu.br
            </a>
          </p>
        </footer>
      </section>
    </main>
  )
}
