import React, { useState } from 'react'
import { AuthService } from '../services/api'

export default function Cadastro({ onIrParaLogin }) {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' })
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!form.nome || !form.email || !form.senha)
      { setErro('Preencha todos os campos'); return }
    if (form.senha.length < 6)
      { setErro('A senha deve ter no mínimo 6 caracteres'); return }
    if (form.senha !== form.confirmar)
      { setErro('As senhas não coincidem'); return }
    try {
      setCarregando(true)
      await AuthService.registrar({ nome: form.nome, email: form.email, senha: form.senha })
      setSucesso(true)
      setTimeout(() => onIrParaLogin(), 2000)
    } catch (err) {
      setErro(err?.response?.data?.mensagem || 'Erro ao cadastrar')
    } finally {
      setCarregando(false)
    }
  }

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }))

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="text-accent">NotalQ</h1>
          <p className="text-muted text-sm">Criar nova conta</p>
        </div>

        {sucesso ? (
          <div className="alert-inline success">
            Conta criada com sucesso! Redirecionando para o login...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {[
              { label: 'Nome completo', campo: 'nome', type: 'text', placeholder: 'Seu nome' },
              { label: 'Email', campo: 'email', type: 'email', placeholder: 'seu@email.com' },
              { label: 'Senha', campo: 'senha', type: 'password', placeholder: 'Mínimo 6 caracteres' },
              { label: 'Confirmar senha', campo: 'confirmar', type: 'password', placeholder: 'Repita a senha' }
            ].map(({ label, campo, type, placeholder }) => (
              <div className="form-group" key={campo}>
                <label className="label">{label}</label>
                <input
                  className="input"
                  type={type}
                  placeholder={placeholder}
                  value={form[campo]}
                  onChange={set(campo)}
                  required
                />
              </div>
            ))}

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
              {carregando ? 'Cadastrando...' : 'Criar Conta'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span className="text-muted text-sm">Já tem conta? </span>
          <button
            onClick={onIrParaLogin}
            className="link-button"
          >
            Fazer login
          </button>
        </div>
      </div>
    </div>
  )
}
