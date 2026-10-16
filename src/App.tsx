import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react"

type Message = {
  id: number
  author: "bot" | "user"
  content: string
  time: string
}

const notices = [
  {
    value: "tecnicos",
    short: "Edital IFB 01/2026",
    label: "Edital IFB 01/2026 — Cursos Técnicos",
    fullLabel: "Cursos Técnicos Subsequentes e Integrados",
    pdfUrl:
      "https://www.ifb.edu.br/processos-seletivos/editais/tecnicos-2026.pdf",
  },
  {
    value: "graduacao",
    short: "Edital IFB 02/2026",
    label: "Edital IFB 02/2026 — Graduação",
    fullLabel: "Cursos de Graduação e Licenciatura",
    pdfUrl:
      "https://www.ifb.edu.br/processos-seletivos/editais/graduacao-2026.pdf",
  },
]

const quickQuestions = [
  {
    label: "Documentos necessários",
    question: "Quais são os documentos necessários?",
    icon: <DocumentIcon />,
  },
  {
    label: "Prazo de inscrição",
    question: "Até quando vão as inscrições do IFB?",
    icon: <CalendarIcon />,
  },
  {
    label: "Isenção de taxa",
    question: "Como solicitar isenção de taxa?",
    icon: <TicketIcon />,
  },
  {
    label: "Cotas e ações afirmativas",
    question: "Como funcionam as cotas e ações afirmativas no IFB?",
    icon: <PeopleIcon />,
  },
]

function getTime() {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date())
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
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

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n")

  return (
    <div className="message-copy">
      {lines.map((line, index) => {
        const isBullet = line.startsWith("• ")
        return (
          <p
            className={isBullet ? "message-bullet" : ""}
            key={`${line}-${index}`}
          >
            {isBullet ? line.slice(2) : line || "\u00A0"}
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

function createBotReply(text: string, noticeValue: string) {
  const value = normalize(text)
  const notice =
    notices.find((item) => item.value === noticeValue) ?? notices[0]
  const context = `${notice.short} — ${notice.fullLabel}`

  if (value.includes("documento")) {
    return `Para o ${context}, separe os seguintes documentos:\n\n• Documento oficial de identificação com foto\n• CPF do candidato\n• Comprovante de escolaridade exigido para o curso\n• Comprovante de residência atualizado\n• Documentação específica para cotas, quando aplicável\n\nOs arquivos devem estar legíveis e ser enviados em formato PDF no ato da inscrição.`
  }

  if (
    value.includes("inscricao") ||
    value.includes("data") ||
    value.includes("prazo")
  ) {
    return `Confira o cronograma simulado do ${notice.short}:\n\n• Inscrições on-line: 12/01 a 06/02/2026\n• Solicitação de isenção: 12/01 a 23/01/2026\n• Resultado preliminar: 20/02/2026\n• Resultado final e convocação: 27/02/2026\n\nRecomendamos não deixar a inscrição para o último dia.`
  }

  if (value.includes("isencao")) {
    return `A isenção da taxa poderá ser solicitada de 12/01 a 23/01/2026, durante a inscrição.\n\nÉ necessário informar o NIS válido e estar inscrito no CadÚnico, conforme os critérios do edital. O pedido passa por análise e o resultado será publicado na página do processo seletivo. Se o pedido for indeferido, será possível pagar a taxa dentro do prazo indicado.`
  }

  if (value.includes("cota") || value.includes("acao afirmativa")) {
    return `O IFB reserva vagas conforme a Lei de Cotas para candidatos que cursaram integralmente o ensino médio em escola pública, com recortes de renda, pertencimento étnico-racial, quilombola e pessoa com deficiência.\n\nNa inscrição, escolha a modalidade correta e confira a documentação comprobatória exigida. A ausência de comprovação pode levar à mudança para ampla concorrência, conforme as regras do edital.`
  }

  return "Para essa dúvida específica, recomendamos consultar o documento completo no portal oficial (ifb.edu.br). Quer tentar um dos atalhos rápidos?"
}

const initialBotMessage: Message = {
  id: 1,
  author: "bot",
  content:
    "Olá! Sou o Assistente Virtual de Editais do IFB. Estou aqui para ajudar você com informações sobre inscrições, documentos, prazos, isenção de taxa e cotas.\n\nComo posso ajudar hoje?",
  time: getTime(),
}

export default function App() {
  const [selectedNotice, setSelectedNotice] = useState(notices[0].value)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([initialBotMessage])
  const [isTyping, setIsTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const activeNotice =
    notices.find((notice) => notice.value === selectedNotice) ?? notices[0]

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

  function sendMessage(text: string) {
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

    const botResponseText = createBotReply(cleanText, selectedNotice)
    // Simula um delay natural de leitura, digitação e carregamento (entre 900ms e 1600ms)
    const simulatedDelay = Math.min(
      Math.max(botResponseText.length * 6, 900),
      1600,
    )

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          author: "bot",
          content: botResponseText,
          time: getTime(),
        },
      ])
      setIsTyping(false)
    }, simulatedDelay)
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

            <div
              className="online-status"
              aria-label="Bot IFB online, resposta instantânea"
            >
              <span className="status-pulse">
                <span />
              </span>
              <span className="online-status-info">
                <strong>Bot IFB Online</strong>
                <small>Resposta instantânea</small>
              </span>
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
                  {notices.map((notice) => (
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
                title="Abrir PDF oficial do edital"
              >
                <FilePdfIcon />
                <span>Ver PDF do Edital</span>
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
            <span>PDF Oficial</span>
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
                    <span className="message-author">Assistente IFB</span>
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
                  aria-label="Assistente está digitando..."
                >
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-label">Consultando edital...</span>
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
              <span>Perguntas frequentes</span>
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
              Digite sua dúvida sobre o edital do IFB
            </label>
            <input
              autoComplete="off"
              id="chat-input"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Digite sua dúvida sobre o edital do IFB..."
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
            As respostas são informativas. Confirme os dados no edital oficial
            em{" "}
            <a href="https://www.ifb.edu.br/" rel="noreferrer" target="_blank">
              ifb.edu.br
            </a>
          </p>
        </footer>
      </section>
    </main>
  )
}
