import { FormEvent, useState } from "react"
import { atualizarEdital, cadastrarEdital } from "./services/api"
import type { CriarEditalInput, Edital, NoDecisao, OpcaoDecisao } from "./types/api"

type TextFieldKey = Exclude<keyof CriarEditalInput, "mensagem_inicial" | "arvore_decisao">

const editalFields: { key: TextFieldKey; label: string; multiline?: boolean }[] = [
  { key: "número", label: "Número do edital" },
  { key: "ano", label: "Ano" },
  { key: "setor", label: "Setor responsável" },
  { key: "título", label: "Título" },
]

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `menu-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createOption(titulo = "") : OpcaoDecisao {
  return {
    id: makeId(),
    titulo,
    entradas: [],
    resposta: "",
    submenu: null,
    voltarAoMenuPrincipal: false,
  }
}

function createMenu(mensagem = "") : NoDecisao {
  return { id: makeId(), mensagem, opcoes: [] }
}

function createInitialDraft(): CriarEditalInput {
  const cursosMenu = createMenu("O que quer saber sobre Cursos e editais? Responda:")
  cursosMenu.opcoes = [
    createOption("Quais cursos vão abrir em 2027"),
    createOption("Quais horários"),
    createOption("Vagas"),
    { ...createOption("Falar sobre outro assunto"), entradas: ["4", "voltar"], voltarAoMenuPrincipal: true },
  ]

  const menuInicial = createMenu("Sobre o que quer perguntar? Responda:")
  menuInicial.opcoes = [
    { ...createOption("Cursos e vagas"), entradas: ["1", "cursos", "cursos e vagas"], submenu: cursosMenu },
    { ...createOption("Prazos"), entradas: ["2", "prazos"] },
    { ...createOption("Requisitos"), entradas: ["3", "requisitos"] },
    { ...createOption("Reserva de vagas (cotas)"), entradas: ["4", "cotas", "reserva de vagas"] },
    {
      ...createOption("Não achei o que procurava"),
      entradas: ["5", "não achei", "outro assunto"],
      resposta: "Encaminhar para o Gemini ou informar o telefone do setor responsável.",
    },
  ]

  return {
    número: "",
    ano: "",
    setor: "",
    título: "",
    dados_gerais: "",
    cronograma: "",
    cursos: "",
    requisitos: "",
    vagas: "",
    disposicoes_iniciais: "",
    inscricoes: "",
    seleção: "",
    comprovacao_reserva_vagas: "",
    matricula: "",
    disposicoes_finais: "",
    mensagem_inicial: "Olá! Sou o assistente virtual. Como posso ajudar você?",
    arvore_decisao: menuInicial,
  }
}

function createDraftFromEdital(edital: Edital): CriarEditalInput {
  const { id, ...dadosEdital } = edital
  const draftInicial = createInitialDraft()

  return {
    ...draftInicial,
    ...dadosEdital,
    mensagem_inicial: edital.mensagem_inicial ?? draftInicial.mensagem_inicial,
    arvore_decisao: edital.arvore_decisao ?? draftInicial.arvore_decisao,
  }
}

function AddIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
}

function RemoveIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>
}

function getEntryValidationError(text: string): string {
  if (!text.trim()) return ""
  return /^\s*,|,\s*$|,\s*,/.test(text)
    ? "Use palavras separadas por vírgula, sem vírgula no início ou no final e sem palavras vazias."
    : ""
}

function getDecisionEntryErrors(node: NoDecisao, entryTexts: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const option of node.opcoes) {
    const text = entryTexts[option.id] ?? option.entradas.join(", ")
    const error = getEntryValidationError(text)
    if (error) errors[option.id] = error
    if (option.submenu) {
      Object.assign(errors, getDecisionEntryErrors(option.submenu, entryTexts))
    }
  }

  return errors
}

function DecisionEditor({
  node,
  level,
  onChange,
  entryTexts,
  entryErrors,
  onEntryTextChange,
  onEntryBlur,
}: {
  node: NoDecisao
  level: number
  onChange: (node: NoDecisao) => void
  entryTexts: Record<string, string>
  entryErrors: Record<string, string>
  onEntryTextChange: (id: string, text: string) => void
  onEntryBlur: (id: string, text: string) => void
}) {
  function updateOption(id: string, update: (option: OpcaoDecisao) => OpcaoDecisao) {
    onChange({
      ...node,
      opcoes: node.opcoes.map((option) => option.id === id ? update(option) : option),
    })
  }

  function updateMenuMessage(mensagem: string) {
    onChange({ ...node, mensagem })
  }

  return (
    <fieldset className="decision-node" style={{ "--menu-level": level } as React.CSSProperties}>
      <legend>{level === 0 ? "Menu principal" : `Submenu ${level + 1}`}</legend>
      <label className="registration-field">
        <span>Mensagem exibida neste menu</span>
        <textarea
          onChange={(event) => updateMenuMessage(event.target.value)}
          placeholder="Ex.: Sobre o que quer perguntar? Responda:"
          required
          rows={4}
          value={node.mensagem}
        />
      </label>

      <div className="decision-options-heading">
        <span>Opções de resposta</span>
        <button
          className="text-action"
          onClick={() => onChange({ ...node, opcoes: [...node.opcoes, createOption(`Nova opção ${node.opcoes.length + 1}`)] })}
          type="button"
        >
          <AddIcon /> Adicionar opção
        </button>
      </div>

      {node.opcoes.length === 0 && (
        <p className="decision-empty">Adicione ao menos uma opção para este menu.</p>
      )}

      <div className="decision-options">
        {node.opcoes.map((option, index) => (
          <article className="decision-option" key={option.id}>
            <div className="decision-option-heading">
              <span className="decision-index">{String(index + 1).padStart(2, "0")}</span>
              <button
                aria-label={`Remover opção ${option.titulo || index + 1}`}
                className="icon-action"
                onClick={() => onChange({ ...node, opcoes: node.opcoes.filter((item) => item.id !== option.id) })}
                title="Remover opção"
                type="button"
              >
                <RemoveIcon />
              </button>
            </div>

            <label className="registration-field">
              <span>Texto da opção</span>
              <input
                onChange={(event) => updateOption(option.id, (current) => ({ ...current, titulo: event.target.value }))}
                placeholder="Ex.: Cursos e vagas"
                required
                value={option.titulo}
              />
            </label>
            <label className={`registration-field ${entryErrors[option.id] ? "registration-field--invalid" : ""}`}>
              <span>Respostas aceitas, separadas por vírgula</span>
              <input
                aria-describedby={entryErrors[option.id] ? `entry-error-${option.id}` : undefined}
                aria-invalid={Boolean(entryErrors[option.id])}
                onBlur={(event) => onEntryBlur(option.id, event.target.value)}
                onChange={(event) => {
                  const text = event.target.value
                  onEntryTextChange(option.id, text)
                  updateOption(option.id, (current) => ({
                    ...current,
                    entradas: text.split(",").map((entry) => entry.trim()).filter(Boolean),
                  }))
                }}
                placeholder="Ex.: 1, cursos, cursos e vagas"
                value={entryTexts[option.id] ?? option.entradas.join(", ")}
              />
              {entryErrors[option.id] && (
                <span className="registration-field-error" id={`entry-error-${option.id}`} role="alert">
                  {entryErrors[option.id]}
                </span>
              )}
            </label>
            <label className="registration-field">
              <span>Resposta automática (opcional se houver submenu)</span>
              <textarea
                onChange={(event) => updateOption(option.id, (current) => ({ ...current, resposta: event.target.value }))}
                placeholder="Mensagem enviada ao selecionar esta opção"
                rows={4}
                value={option.resposta}
              />
            </label>

            <label className="decision-return">
              <input
                checked={option.voltarAoMenuPrincipal}
                onChange={(event) => updateOption(option.id, (current) => ({
                  ...current,
                  voltarAoMenuPrincipal: event.target.checked,
                  submenu: event.target.checked ? null : current.submenu,
                }))}
                type="checkbox"
              />
              <span>Esta opção volta ao menu principal</span>
            </label>

            {!option.voltarAoMenuPrincipal && (
              <div className="submenu-controls">
                {option.submenu ? (
                  <>
                    <DecisionEditor
                      entryErrors={entryErrors}
                      entryTexts={entryTexts}
                      level={level + 1}
                      node={option.submenu}
                      onChange={(submenu) => updateOption(option.id, (current) => ({ ...current, submenu }))}
                      onEntryBlur={onEntryBlur}
                      onEntryTextChange={onEntryTextChange}
                    />
                    <button
                      className="text-action text-action--muted"
                      onClick={() => updateOption(option.id, (current) => ({ ...current, submenu: null }))}
                      type="button"
                    >
                      <RemoveIcon /> Remover submenu
                    </button>
                  </>
                ) : (
                  <button
                    className="text-action"
                    onClick={() => updateOption(option.id, (current) => ({ ...current, submenu: createMenu() }))}
                    type="button"
                  >
                    <AddIcon /> Criar submenu
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </fieldset>
  )
}

function menuIsIncomplete(node: NoDecisao): boolean {
  return !node.mensagem.trim() || node.opcoes.length === 0 || node.opcoes.some((option) =>
    !option.titulo.trim() ||
    (!option.resposta.trim() && !option.submenu && !option.voltarAoMenuPrincipal) ||
    (option.submenu !== null && menuIsIncomplete(option.submenu))
  )
}

export default function EditalRegistration({
  onBack,
  onCreated,
  edital,
}: {
  onBack: () => void
  onCreated: (edital: Edital) => void
  edital?: Edital | null
}) {
  const [draft, setDraft] = useState<CriarEditalInput>(() => edital ? createDraftFromEdital(edital) : createInitialDraft())
  const [entryTexts, setEntryTexts] = useState<Record<string, string>>({})
  const [entryErrors, setEntryErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const hasInvalidEntries = Object.keys(getDecisionEntryErrors(draft.arvore_decisao, entryTexts)).length > 0

  function handleEntryTextChange(id: string, text: string) {
    setEntryTexts((current) => ({ ...current, [id]: text }))
    if (!getEntryValidationError(text)) {
      setEntryErrors((current) => {
        if (!current[id]) return current
        const next = { ...current }
        delete next[id]
        return next
      })
    }
  }

  function handleEntryBlur(id: string, text: string) {
    const error = getEntryValidationError(text)
    setEntryErrors((current) => {
      const next = { ...current }
      if (error) next[id] = error
      else delete next[id]
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    const invalidEntries = getDecisionEntryErrors(draft.arvore_decisao, entryTexts)
    if (Object.keys(invalidEntries).length > 0) {
      setEntryErrors((current) => ({ ...current, ...invalidEntries }))
      return
    }

    if (menuIsIncomplete(draft.arvore_decisao)) {
      setFeedback({
        type: "error",
        message: "Complete cada menu: informe a mensagem, as opções e uma resposta, submenu ou retorno para cada opção.",
      })
      return
    }

    setIsSaving(true)
    try {
      const editalSalvo = edital
        ? await atualizarEdital(edital.id, draft)
        : await cadastrarEdital(draft)
      onCreated(editalSalvo)
      setFeedback({
        type: "success",
        message: edital ? "Edital e fluxo de mensagens atualizados na API." : "Edital e fluxo de mensagens enviados para a API.",
      })
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível cadastrar o edital.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="app-shell registration-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section aria-label={edital ? "Edição de edital" : "Cadastro de edital"} className="chat-app registration-app">
        <header className="registration-header">
          <div className="registration-brand">
            <IFBMark />
            <div>
              <span className="eyebrow">Administração</span>
              <h1>{edital ? "Editar edital" : "Cadastrar edital"}</h1>
            </div>
          </div>
          <button className="header-btn" onClick={onBack} type="button">
            Voltar à conversa
          </button>
        </header>

        <div className="registration-content">
          <form onSubmit={handleSubmit}>
            <section className="registration-section">
              <div className="registration-section-heading">
                <span>01</span>
                <div>
                  <h2>Dados do edital</h2>
                  <p>Preencha os campos que serão disponibilizados ao assistente.</p>
                </div>
              </div>
              <div className="editais-fields">
                {editalFields.map(({ key, label, multiline }) => (
                  <label className={`registration-field ${multiline ? "registration-field--wide" : ""}`} key={key}>
                    <span>{label}</span>
                    {multiline ? (
                      <textarea
                        onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                        required
                        rows={3}
                        value={draft[key]}
                      />
                    ) : (
                      <input
                        onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                        required
                        value={draft[key]}
                      />
                    )}
                  </label>
                ))}
              </div>
            </section>

            <section className="registration-section">
              <div className="registration-section-heading">
                <span>02</span>
                <div>
                  <h2>Mensagens e decisões</h2>
                  <p>Defina a saudação automática e organize as opções em menus e submenus.</p>
                </div>
              </div>
              <label className="registration-field registration-field--wide">
                <span>Mensagem inicial do assistente</span>
                <textarea
                  onChange={(event) => setDraft((current) => ({ ...current, mensagem_inicial: event.target.value }))}
                  required
                  rows={4}
                  value={draft.mensagem_inicial}
                />
              </label>
              <DecisionEditor
                entryErrors={entryErrors}
                entryTexts={entryTexts}
                level={0}
                node={draft.arvore_decisao}
                onChange={(arvore_decisao) => setDraft((current) => ({ ...current, arvore_decisao }))}
                onEntryBlur={handleEntryBlur}
                onEntryTextChange={handleEntryTextChange}
              />
            </section>

            {feedback && (
              <p className={`registration-feedback registration-feedback--${feedback.type}`} role="status">
                {feedback.message}
              </p>
            )}

            <div className="registration-actions">
              {feedback?.type === "success" ? (
                <button className="registration-submit" onClick={onBack} type="button">
                  Voltar à conversa
                </button>
              ) : (
                <button className="registration-submit" disabled={isSaving || hasInvalidEntries} type="submit">
                  {isSaving ? "Salvando na API..." : edital ? "Salvar alterações" : "Salvar edital e mensagens"}
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

function IFBMark() {
  return (
    <img alt="IFB" className="ifb-mark" src="/logo.png" />
  )
}