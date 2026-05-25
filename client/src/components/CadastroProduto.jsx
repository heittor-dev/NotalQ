import React, { useState, useEffect } from 'react'
import { ProdutoService } from '../services/api'

const FORM_VAZIO = { nome: '', descricao: '', preco: '', estoque: '', categoria: '', estoque_minimo: '5', sku: '' }

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }
const cardHeader = { padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }

const Lbl = ({ children }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
    {children}
  </label>
)

const getStatus = (estoque, minimo) => {
  if (estoque === 0) return { cor: '#ef4444', rgb: '239,68,68', label: 'Sem estoque' }
  if (estoque <= (minimo || 5)) return { cor: '#f59e0b', rgb: '245,158,11', label: 'Estoque baixo' }
  return { cor: '#10b981', rgb: '16,185,129', label: 'Em estoque' }
}

const CAT_CORES = {
  'Eletrônicos': '#6366f1', 'Vestuário': '#ec4899', 'Alimentos': '#10b981',
  'Escritório':  '#f59e0b', 'Cozinha':   '#f97316', 'Higiene':   '#3b82f6',
  'Games':       '#8b5cf6', 'Acessórios':'#06b6d4',
}
const corCat = (cat) => CAT_CORES[cat] || '#71717a'

export default function CadastroProduto({ addToast, filtrosIniciais = {} }) {
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostraForm, setMostraForm] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState(filtrosIniciais.busca || '')
  const [filtroCat, setFiltroCat] = useState(filtrosIniciais.categoria || '')

  useEffect(() => { buscarProdutos() }, [])

  const buscarProdutos = async () => {
    try {
      setLoading(true)
      const dados = await ProdutoService.buscarTodos()
      setProdutos(dados || [])
    } catch {
      addToast('Erro ao carregar produtos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const abrirNovo = () => {
    setForm(FORM_VAZIO)
    setModoEdicao(false)
    setEditandoId(null)
    setMostraForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEditar = (p) => {
    setForm({
      nome: p.nome || '', descricao: p.descricao || '',
      preco: String(p.preco), estoque: String(p.estoque),
      categoria: p.categoria || '', estoque_minimo: String(p.estoque_minimo || 5),
      sku: p.sku || ''
    })
    setModoEdicao(true)
    setEditandoId(p.id)
    setMostraForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelar = () => {
    setMostraForm(false)
    setModoEdicao(false)
    setEditandoId(null)
    setForm(FORM_VAZIO)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nome || !form.preco || !form.estoque) {
      addToast('Preencha Nome, Preço e Estoque', 'warning')
      return
    }
    try {
      setSalvando(true)
      const payload = {
        nome: form.nome, descricao: form.descricao,
        preco: parseFloat(form.preco), estoque: parseInt(form.estoque),
        categoria: form.categoria || null,
        estoque_minimo: parseInt(form.estoque_minimo) || 5,
        sku: form.sku || null,
      }
      if (modoEdicao) {
        await ProdutoService.atualizar(editandoId, payload)
        addToast('Produto atualizado!', 'success')
      } else {
        await ProdutoService.criar(payload)
        addToast('Produto cadastrado!', 'success')
      }
      handleCancelar()
      await buscarProdutos()
    } catch {
      addToast(modoEdicao ? 'Erro ao atualizar' : 'Erro ao cadastrar', 'error')
    } finally {
      setSalvando(false)
    }
  }

  const handleDeletar = async (id) => {
    if (!confirm('Deletar este produto?')) return
    try {
      setLoading(true)
      await ProdutoService.deletar(id)
      addToast('Produto deletado!', 'success')
      await buscarProdutos()
    } catch {
      addToast('Erro ao deletar produto', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const total    = produtos.length
  const emEstoque    = produtos.filter(p => p.estoque > (p.estoque_minimo || 5)).length
  const baixoEstoque = produtos.filter(p => p.estoque > 0 && p.estoque <= (p.estoque_minimo || 5)).length
  const semEstoque   = produtos.filter(p => p.estoque === 0).length
  const categorias   = [...new Set(produtos.map(p => p.categoria).filter(Boolean))]

  // ── Filtros ───────────────────────────────────────────────────────────────
  const lista = produtos.filter(p => {
    const q = busca.toLowerCase()
    const matchBusca = !busca || p.nome.toLowerCase().includes(q) || (p.categoria || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
    const matchCat = !filtroCat || p.categoria === filtroCat
    return matchBusca && matchCat
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total de produtos',  valor: total,        cor: '#6366f1', rgb: '99,102,241',  icon: '◧', sub: `${categorias.length} categorias` },
          { label: 'Em estoque',         valor: emEstoque,    cor: '#10b981', rgb: '16,185,129',  icon: '↑', sub: 'acima do mínimo' },
          { label: 'Estoque baixo',      valor: baixoEstoque, cor: '#f59e0b', rgb: '245,158,11',  icon: '⚠', sub: 'abaixo do mínimo' },
          { label: 'Sem estoque',        valor: semEstoque,   cor: '#ef4444', rgb: '239,68,68',   icon: '✕', sub: 'reposição urgente' },
        ].map(({ label, valor, cor, rgb, icon, sub }) => (
          <div key={label} style={{ background: `linear-gradient(135deg, rgba(${rgb},0.12) 0%, rgba(${rgb},0.04) 100%)`, border: `1px solid rgba(${rgb},0.3)`, borderRadius: '12px', padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              <span style={{ fontSize: '16px', color: cor, opacity: 0.8, fontWeight: '700' }}>{icon}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: cor, lineHeight: 1, marginBottom: '6px' }}>{valor}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Formulário ── */}
      {mostraForm && (
        <div style={card}>
          <div style={cardHeader}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                {modoEdicao ? 'Editar produto' : 'Novo produto'}
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
                {modoEdicao ? form.nome : 'Cadastrar produto'}
              </h3>
            </div>
            <button onClick={handleCancelar} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            {/* Linha 1: Nome + SKU + Categoria */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <Lbl>Nome do produto *</Lbl>
                <input className="input" type="text" placeholder="Ex: Teclado Mecânico RGB" value={form.nome} onChange={set('nome')} required />
              </div>
              <div>
                <Lbl>SKU</Lbl>
                <input className="input" type="text" placeholder="EL-001" value={form.sku} onChange={set('sku')} />
              </div>
              <div>
                <Lbl>Categoria</Lbl>
                <input className="input" type="text" placeholder="Ex: Eletrônicos" value={form.categoria} onChange={set('categoria')} />
              </div>
            </div>

            {/* Linha 2: Preço + Estoque + Estoque mínimo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <Lbl>Preço (R$) *</Lbl>
                <input className="input" type="number" placeholder="0,00" step="0.01" min="0" value={form.preco} onChange={set('preco')} required />
              </div>
              <div>
                <Lbl>Estoque *</Lbl>
                <input className="input" type="number" placeholder="0" min="0" value={form.estoque} onChange={set('estoque')} required />
              </div>
              <div>
                <Lbl>Estoque mínimo</Lbl>
                <input className="input" type="number" placeholder="5" min="0" value={form.estoque_minimo} onChange={set('estoque_minimo')} />
              </div>
            </div>

            {/* Descrição */}
            <div style={{ marginBottom: '20px' }}>
              <Lbl>Descrição</Lbl>
              <textarea
                className="input"
                placeholder="Descrição opcional do produto..."
                value={form.descricao}
                onChange={set('descricao')}
                style={{ resize: 'vertical', minHeight: '72px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={handleCancelar}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : modoEdicao ? 'Salvar alterações' : 'Cadastrar produto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tabela ── */}
      <div style={card}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {lista.length} <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>produto{lista.length !== 1 ? 's' : ''}</span>
            </span>
            {categorias.length > 0 && (
              <select
                className="input"
                style={{ padding: '5px 8px', fontSize: '12px', width: 'auto' }}
                value={filtroCat}
                onChange={e => setFiltroCat(e.target.value)}
              >
                <option value="">Todas as categorias</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              className="input"
              placeholder="Buscar por nome, SKU ou categoria..."
              style={{ width: '280px' }}
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {!mostraForm && (
              <button className="btn btn-primary" onClick={abrirNovo}>+ Novo produto</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div>Carregando...</div>
        ) : lista.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              {busca || filtroCat ? 'Nenhum produto encontrado para esse filtro' : 'Nenhum produto cadastrado ainda'}
            </p>
            {!busca && !filtroCat && !mostraForm && (
              <button className="btn btn-primary" onClick={abrirNovo}>+ Cadastrar primeiro produto</button>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                {['SKU', 'Produto', 'Categoria', 'Preço', 'Estoque', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map(p => {
                const st = getStatus(p.estoque, p.estoque_minimo)
                const cor = corCat(p.categoria)
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', fontFamily: 'monospace' }}>
                      {p.sku || <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13px' }}>
                      {p.nome}
                      {p.descricao && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400', marginTop: '2px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.descricao}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {p.categoria ? (
                        <span style={{ background: `${cor}18`, color: cor, border: `1px solid ${cor}40`, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
                          {p.categoria}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '14px' }}>
                      R$ {parseFloat(p.preco).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: st.cor }}>{p.estoque}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>/ mín {p.estoque_minimo || 5}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: `rgba(${st.rgb},0.12)`, color: st.cor }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 12px', fontSize: '12px' }}
                          onClick={() => handleEditar(p)}
                          disabled={loading}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeletar(p.id)}
                          disabled={loading}
                          title="Deletar"
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: '4px 6px', borderRadius: '4px', transition: 'color 150ms, background 150ms' }}
                          onMouseEnter={e => { e.target.style.color = 'var(--danger)'; e.target.style.background = 'rgba(239,68,68,0.1)' }}
                          onMouseLeave={e => { e.target.style.color = 'var(--text-muted)'; e.target.style.background = 'none' }}
                        >
                          ✕
                        </button>
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
