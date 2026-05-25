import React, { useState } from 'react'
import { AuthService } from '../services/api'

export default function Login({ onLogin, onIrParaCadastro }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!email || !senha) { setErro('Preencha email e senha'); return }
    try {
      setCarregando(true)
      const res = await AuthService.login({ email, senha })
      onLogin(res.usuario)
    } catch (err) {
      setErro(err?.response?.data?.mensagem || 'Erro ao fazer login')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="text-accent">PlanQ</h1>
          <p className="text-muted text-sm">Sistema de Gestão Empresarial</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Senha</label>
            <input
              className="input"
              type="password"
              placeholder="••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && (
            <div className="alert-inline error">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span className="text-muted text-sm">Não tem conta? </span>
          <button
            onClick={onIrParaCadastro}
            className="link-button"
          >
            Cadastre-se
          </button>
        </div>

        <div className="credentials-hint">
          <p className="text-muted text-xs" style={{ margin: 0 }}>
            Acesso padrão: <strong>admin@pdv.com</strong> / <strong>admin123</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
