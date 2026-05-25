import React, { useState, useEffect } from 'react'
import { ConfiguracaoService } from '../services/api'

const Badge = ({ children, cor = 'var(--accent)', bg = 'rgba(99,102,241,0.1)' }) => (
  <span style={{ display: 'inline-block', background: bg, color: cor, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
    {children}
  </span>
)

export default function Configuracoes({ addToast }) {
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    try {
      setLoading(true)
      const dados = await ConfiguracaoService.buscarTodas()
      setForm(dados)
    } finally {
      setLoading(false)
    }
  }

  const set = (chave) => (e) => setForm(f => ({ ...f, [chave]: e.target.value }))

  const salvar = async (e) => {
    e.preventDefault()
    try {
      setSalvando(true)
      const configs = Object.entries(form).map(([chave, valor]) => ({ chave, valor }))
      await ConfiguracaoService.atualizar(configs)
      addToast('Configurações salvas!', 'success')
    } catch {
      addToast('Erro ao salvar configurações', 'error')
    } finally {
      setSalvando(false)
    }
  }

  const inicial = (form.nome_empresa || 'E').charAt(0).toUpperCase()

  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
      Carregando configurações...
    </div>
  )

  return (
    <div className="page-layout">

      {/* Identidade da empresa */}
      <div className="dash-card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%)', borderColor: 'rgba(99,102,241,0.2)' }}>
        <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '16px', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-1px',
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)'
          }}>
            {inicial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {form.nome_empresa || 'Nome da Empresa'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'monospace' }}>
              {form.cnpj || 'CNPJ não configurado'}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {form.telefone && <Badge>{form.telefone}</Badge>}
              {form.moeda && <Badge cor="var(--success)" bg="rgba(16,185,129,0.1)">{form.moeda}</Badge>}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
                Sistema ativo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="dash-card">
        <div className="dash-card__header">
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Informações da Empresa</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Exibidas no cupom fiscal e relatórios</p>
          </div>
        </div>
        <form onSubmit={salvar} style={{ padding: '24px' }}>

          <div style={{ marginBottom: '16px' }}>
            <label className="field-label">Nome da Empresa</label>
            <input className="input" placeholder="Ex: Minha Loja Ltda." value={form.nome_empresa || ''} onChange={set('nome_empresa')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="field-label">CNPJ</label>
              <input className="input" placeholder="00.000.000/0000-00" value={form.cnpj || ''} onChange={set('cnpj')} />
            </div>
            <div>
              <label className="field-label">Telefone</label>
              <input className="input" placeholder="(11) 3000-0000" value={form.telefone || ''} onChange={set('telefone')} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="field-label">E-mail</label>
            <input className="input" type="email" placeholder="contato@empresa.com.br" value={form.email || ''} onChange={set('email')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label className="field-label">Moeda</label>
              <input className="input" placeholder="BRL" value={form.moeda || ''} onChange={set('moeda')} />
            </div>
            <div>
              <label className="field-label">Endereço</label>
              <input className="input" placeholder="Rua, número, cidade - UF" value={form.endereco || ''} onChange={set('endereco')} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </form>
      </div>

      {/* Stack técnico */}
      <div className="dash-card">
        <div className="dash-card__header">
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Sobre o Sistema</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>v2.0.0</span>
        </div>
        <div style={{ padding: '0 24px' }}>
          {[
            {
              titulo: 'Backend',
              sub: 'Servidor e banco de dados',
              badges: [
                { label: 'Node.js', cor: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
                { label: 'Express', cor: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
                { label: 'SQLite', cor: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
              ]
            },
            {
              titulo: 'Frontend',
              sub: 'Interface do usuário',
              badges: [
                { label: 'React 18', cor: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
                { label: 'Vite', cor: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
                { label: 'CSS Puro', cor: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
              ]
            },
            {
              titulo: 'Autenticação',
              sub: 'Controle de acesso',
              badges: [
                { label: 'JWT', cor: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
                { label: 'bcrypt', cor: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
              ]
            },
          ].map(({ titulo, sub, badges }, i, arr) => (
            <div key={titulo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{titulo}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {badges.map(b => (
                  <Badge key={b.label} cor={b.cor} bg={b.bg}>{b.label}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
