import { FormEvent, useState } from "react"
import { autenticarAdmin } from "./services/api"

export default function Login({
  onAuthenticated,
}: {
  onAuthenticated: (adminName: string) => void
}) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)

    try {
      const adminName = await autenticarAdmin(email, senha)
      if (!adminName) {
        setErrorMessage("E-mail ou senha inválidos.")
        return
      }

      onAuthenticated(adminName)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível validar o acesso. Tente novamente."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell login-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section aria-labelledby="login-title" className="login-card">
        <header className="login-header">
          <img alt="IFB" className="ifb-mark" src="/logo.png" />
          <div>
            <span className="eyebrow">Área administrativa</span>
            <h1 id="login-title">Assistente de Editais</h1>
          </div>
        </header>

        <div className="login-content">
          <p className="login-intro">Entre com suas credenciais de administrador para continuar.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field" htmlFor="login-email">
              <span>E-mail</span>
              <input
                autoComplete="username"
                autoFocus
                id="login-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="login-field" htmlFor="login-password">
              <span>Senha</span>
              <input
                autoComplete="current-password"
                id="login-password"
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Digite sua senha"
                required
                type="password"
                value={senha}
              />
            </label>

            {errorMessage && (
              <p className="login-feedback" role="alert">
                {errorMessage}
              </p>
            )}

            <button className="login-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Validando acesso..." : "Entrar"}
            </button>
          </form>

          <p className="login-footnote">Acesso restrito a administradores cadastrados.</p>
        </div>
      </section>
    </main>
  )
}
