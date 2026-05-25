import React, { useState, useEffect } from 'react'
import { FornecedorService } from '../services/api'

const FORM_VAZIO = { nome: '', cnpj: '', email: '', telefone: '', endereco: '', categoria: '' }

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }
const cardHeader = { padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }

const Lbl = ({ children }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
    {children}
  </label>
)

const CAT_CORES = {
  'tecnologia': '#6366f1', 'eletrônicos': '#8b5cf6', 'alimentos': '#10b981',
  'escritório':  '#f59e0b', 'vestuário': '#ec4899', 'logística': '#f97316',
  'saúde': '#3b82f6', 'marketing': '#06b6d4',
}
const corCat = (cat) => CAT_CORES[(cat || '').toLowerCase()] || '#71717a'

export default function Fornecedores({ addToast }) {
  const [fornecedores, setFornecedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    try {
      setLoading(true)
      const dados = await FornecedorService.buscarTodos()
      setFornecedores(dados)
    } finally {
      setLoading(false)
    }
  }

  const abrirNovo = () => {
    setEditandoId(null)
    setForm(FORM_VAZIO)
    setMostrarForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const editar = (f) => {
    setEditandoId(f.id)
    setForm({ nome: f.nome, cnpj: f.cnpj || '', email: f.email || '', telefone: f.telefone || '', endereco: f.endereco || '', categoria: f.categoria || '' })
    setMostrarForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = () => {
    setMostrarForm(false)
    setEditandoId(null)
    setForm(FORM_VAZIO)
  }

  const salvar = async (e) => {
    e.preventDefault()
    if (!form.nome) { addToast('Nome é obrigatório', 'error'); return }
    try {
      setSalvando(true)
      if (editandoId) {
        await FornecedorService.atualizar(editandoId, form)
        addToast('Fornecedor atualizado!', 'success')
      } else {
        await FornecedorService.criar(form)
        addToast('Fornecedor cadastrado!', 'success')
      }
      cancelar()
      await carregar()
    } catch {
      addToast('Erro ao salvar fornecedor', 'error')
    } finally {
      setSalvando(false)
    }
  }

  const desativar = async (id) => {
    if (!confirm('Desativar este fornecedor?')) return
    try {
      await FornecedorService.deletar(id)
      addToast('Fornecedor desativado', 'success')
      await carregar()
    } catch {
      addToast('Erro ao desativar', 'error')
    }
  }

  const f = (key) => ({ value: form[key], onChange: e => setForm(prev => ({ ...prev, [key]: e.target.value })) })

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const total   = fornecedores.length
  const ativos  = fornecedores.filter(fo => fo.ativo).length
  const inativos = fornecedores.filter(fo => !fo.ativo).length
  const categorias = [...new Set(fornecedores.map(fo => fo.categoria).filter(Boolean))]

  // ── Filtros ───────────────────────────────────────────────────────────────
  const lista = fornecedores.filter(fo => {
    const q = busca.toLowerCase()
    const matchBusca = !busca || fo.nome.toLowerCase().includes(q) || (fo.categoria || '').toLowerCase().includes(q) || (fo.cnpj || '').includes(q)
    const matchStatus = !filtroStatus || (filtroStatus === 'ativo' ? fo.ativo : !fo.ativo)
    return matchBusca && matchStatus
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total de fornecedores', valor: total,           cor: '#6366f1', rgb: '99,102,241',  icon: '◫', sub: `${categorias.length} categorias` },
          { label: 'Fornecedores ativos',   valor: ativos,          cor: '#10b981', rgb: '16,185,129',  icon: '✓', sub: 'em operação' },
          { label: 'Fornecedores inativos', valor: inativos,        cor: '#ef4444', rgb: '239,68,68',   icon: '✕', sub: 'desativados' },
          { label: 'Categorias',            valor: categorias.length, cor: '#f59e0b', rgb: '245,158,11', icon: '◈', sub: categorias.slice(0, 2).join(', ') || 'nenhuma' },
        ].map(({ label, valor, cor, rgb, icon, sub }) => (
          <div key={label} style={{ background: `linear-gradient(135deg, rgba(${rgb},0.12) 0%, rgba(${rgb},0.04) 100%)`, border: `1px solid rgba(${rgb},0.3)`, borderRadius: '12px', padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              <span style={{ fontSize: '16px', color: cor, opacity: 0.8, fontWeight: '700' }}>{icon}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: cor, lineHeight: 1, marginBottom: '6px' }}>{valor}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Formulário ── */}
      {mostrarForm && (
        <div style={card}>
          <div style={cardHeader}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                {editandoId ? 'Editar fornecedor' : 'Novo fornecedor'}
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
                {editandoId ? form.nome : 'Cadastrar fornecedor'}
              </h3>
            </div>
            <button onClick={cancelar} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>
          <form onSubmit={salvar} style={{ padding: '24px' }}>
            {/* Nome — linha inteira */}
            <div style={{ marginBottom: '16px' }}>
              <Lbl>Nome / Razão Social *</Lbl>
              <input className="input" placeholder="Razão social ou nome fantasia" required {...f('nome')} />
            </div>

            {/* CNPJ + Telefone + Categoria */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <Lbl>CNPJ</Lbl>
                <input className="input" placeholder="00.000.000/0000-00" {...f('cnpj')} />
              </div>
              <div>
                <Lbl>Telefone</Lbl>
                <input className="input" placeholder="(11) 99999-9999" {...f('telefone')} />
              </div>
              <div>
                <Lbl>Categoria</Lbl>
                <input className="input" placeholder="Ex: tecnologia, alimentos..." {...f('categoria')} />
              </div>
            </div>

            {/* Email + Endereço */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <Lbl>Email</Lbl>
                <input className="input" type="email" placeholder="contato@empresa.com" {...f('email')} />
              </div>
              <div>
                <Lbl>Endereço</Lbl>
                <input className="input" placeholder="Rua, número, cidade" {...f('endereco')} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={cancelar}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Cadastrar fornecedor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tabela ── */}
      <div style={card}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {lista.length} <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>fornecedor{lista.length !== 1 ? 'es' : ''}</span>
            </span>
            <select
              className="input"
              style={{ padding: '5px 8px', fontSize: '12px', width: 'auto' }}
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              className="input"
              placeholder="Buscar por nome, CNPJ ou categoria..."
              style={{ width: '280px' }}
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {!mostrarForm && (
              <button className="btn btn-primary" onClick={abrirNovo}>+ Novo fornecedor</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div>Carregando...</div>
        ) : lista.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              {busca || filtroStatus ? 'Nenhum fornecedor encontrado para esse filtro' : 'Nenhum fornecedor cadastrado ainda'}
            </p>
            {!busca && !filtroStatus && !mostrarForm && (
              <button className="btn btn-primary" onClick={abrirNovo}>+ Cadastrar primeiro fornecedor</button>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                {['Fornecedor', 'CNPJ', 'Contato', 'Endereço', 'Categoria', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map(fo => {
                const cor = corCat(fo.categoria)
                return (
                  <tr key={fo.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 16px', fontWeight: '700', fontSize: '13px' }}>
                      {fo.nome}
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400', marginTop: '2px' }}>
                        #{fo.id}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {fo.cnpj || <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '12px' }}>
                      {fo.email && <div style={{ color: 'var(--text-primary)' }}>{fo.email}</div>}
                      {fo.telefone && <div style={{ color: 'var(--text-muted)', marginTop: fo.email ? '2px' : 0 }}>{fo.telefone}</div>}
                      {!fo.email && !fo.telefone && <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fo.endereco || <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      {fo.categoria ? (
                        <span style={{ background: `${cor}18`, color: cor, border: `1px solid ${cor}40`, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
                          {fo.categoria}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                        background: fo.ativo ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: fo.ativo ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {fo.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 12px', fontSize: '12px' }}
                          onClick={() => editar(fo)}
                        >
                          Editar
                        </button>
                        {fo.ativo && (
                          <button
                            onClick={() => desativar(fo.id)}
                            title="Desativar"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: '4px 6px', borderRadius: '4px', transition: 'color 150ms, background 150ms' }}
                            onMouseEnter={e => { e.target.style.color = 'var(--danger)'; e.target.style.background = 'rgba(239,68,68,0.1)' }}
                            onMouseLeave={e => { e.target.style.color = 'var(--text-muted)'; e.target.style.background = 'none' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
