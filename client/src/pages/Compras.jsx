import React, { useState, useEffect, useMemo } from 'react'
import { CompraService, FornecedorService, ProdutoService } from '../services/api'
import KpiCard from '../components/ui/KpiCard'

const Lbl = ({ children }) => <label className="field-label">{children}</label>

const STATUS_COR = {
  pendente:  { cor: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  borda: 'rgba(245,158,11,0.3)'  },
  recebida:  { cor: '#10b981', bg: 'rgba(16,185,129,0.12)',  borda: 'rgba(16,185,129,0.3)'  },
  cancelada: { cor: '#ef4444', bg: 'rgba(239,68,68,0.12)',   borda: 'rgba(239,68,68,0.3)'   },
}
const STATUS_LABEL = { pendente: 'Pendente', recebida: 'Recebida', cancelada: 'Cancelada' }


function StockBar({ estoque, minimo }) {
  const max = Math.max(estoque, minimo * 3, 1)
  const pct = Math.min(Math.round((estoque / max) * 100), 100)
  const cor = estoque === 0 ? '#ef4444' : estoque <= minimo ? '#f59e0b' : '#10b981'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: '3px', transition: 'width 400ms ease' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: '700', color: cor, width: '36px', textAlign: 'right', flexShrink: 0 }}>{estoque}</span>
    </div>
  )
}

// ── Tab Estoque ────────────────────────────────────────────────────────────────
function TabEstoque({ produtos, onNovaCompra }) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const categorias = useMemo(() => [...new Set(produtos.map(p => p.categoria).filter(Boolean))].sort(), [produtos])
  const valorInventario = produtos.reduce((s, p) => s + p.estoque * p.preco, 0)

  const semEstoque    = produtos.filter(p => p.estoque === 0)
  const baixoEstoque  = produtos.filter(p => p.estoque > 0 && p.estoque <= (p.estoque_minimo || 5))
  const normalEstoque = produtos.filter(p => p.estoque > (p.estoque_minimo || 5))

  const filtrados = useMemo(() => {
    let lista = produtos
    if (filtro === 'zero')  lista = semEstoque
    if (filtro === 'baixo') lista = baixoEstoque
    if (filtro === 'ok')    lista = normalEstoque
    if (filtro !== 'todos' && filtro !== 'zero' && filtro !== 'baixo' && filtro !== 'ok')
      lista = produtos.filter(p => p.categoria === filtro)
    if (busca) {
      const q = busca.toLowerCase()
      lista = lista.filter(p => p.nome.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
    }
    return lista.sort((a, b) => a.estoque - b.estoque)
  }, [produtos, filtro, busca])

  return (
    <div className="page-layout">
      {/* KPIs */}
      <div className="kpi-grid-4">
        <KpiCard label="Total de Produtos"   valor={produtos.length}                          cor="#6366f1" rgb="99,102,241"   icon="◧" />
        <KpiCard label="Sem Estoque"         valor={semEstoque.length}                        cor="#ef4444" rgb="239,68,68"    icon="▽" />
        <KpiCard label="Estoque Baixo"       valor={baixoEstoque.length}                      cor="#f59e0b" rgb="245,158,11"   icon="△" />
        <KpiCard label="Valor do Inventário" valor={`R$ ${valorInventario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} cor="#10b981" rgb="16,185,129" icon="◈" />
      </div>

      {/* Alertas */}
      {(semEstoque.length > 0 || baixoEstoque.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: semEstoque.length > 0 && baixoEstoque.length > 0 ? '1fr 1fr' : '1fr', gap: '16px' }}>

          {semEstoque.length > 0 && (
            <div className="dash-card dash-card--danger">
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontSize: '14px' }}>▽</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444' }}>Sem Estoque — {semEstoque.length} produto{semEstoque.length > 1 ? 's' : ''}</span>
                </div>
                <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={onNovaCompra}>+ Repor</button>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {semEstoque.map(p => (
                  <div key={p.id} style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.nome}</div>
                      {p.categoria && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{p.categoria}</div>}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', padding: '2px 8px' }}>ZERADO</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {baixoEstoque.length > 0 && (
            <div className="dash-card dash-card--warning">
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#f59e0b', fontSize: '14px' }}>△</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#f59e0b' }}>Estoque Baixo — {baixoEstoque.length} produto{baixoEstoque.length > 1 ? 's' : ''}</span>
                </div>
                <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={onNovaCompra}>+ Repor</button>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {baixoEstoque.map(p => (
                  <div key={p.id} style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.nome}</div>
                      {p.categoria && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{p.categoria}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#f59e0b' }}>{p.estoque}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>mín. {p.estoque_minimo || 5}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabela completa */}
      <div className="dash-card">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Buscar produto ou SKU..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ flex: 1, minWidth: '180px', padding: '7px 12px', fontSize: '13px' }}
          />
          <select className="input" value={filtro} onChange={e => setFiltro(e.target.value)} style={{ padding: '7px 12px', fontSize: '13px', width: 'auto' }}>
            <option value="todos">Todos ({produtos.length})</option>
            <option value="zero">Sem estoque ({semEstoque.length})</option>
            <option value="baixo">Estoque baixo ({baixoEstoque.length})</option>
            <option value="ok">Normal ({normalEstoque.length})</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{filtrados.length} produto{filtrados.length !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                {['Produto', 'SKU', 'Categoria', 'Preço', 'Estoque', 'Mínimo', 'Status'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Nenhum produto encontrado</td></tr>
              ) : filtrados.map(p => {
                const cor = p.estoque === 0 ? '#ef4444' : p.estoque <= (p.estoque_minimo || 5) ? '#f59e0b' : '#10b981'
                const statusLabel = p.estoque === 0 ? 'Zerado' : p.estoque <= (p.estoque_minimo || 5) ? 'Baixo' : 'Normal'
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '600', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</td>
                    <td style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku || '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{p.categoria || '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>R$ {Number(p.preco).toFixed(2)}</td>
                    <td style={{ padding: '10px 16px', minWidth: '120px' }}>
                      <StockBar estoque={p.estoque} minimo={p.estoque_minimo || 5} />
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>{p.estoque_minimo || 5}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ background: `${cor}18`, color: cor, border: `1px solid ${cor}44`, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>{statusLabel}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Stepper de quantidade ──────────────────────────────────────────────────────
function QtdStepper({ value, onChange }) {
  const n = parseInt(value) || 0
  const btn = {
    width: '30px', height: '34px', background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: '16px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', transition: 'color 150ms, background 150ms', flexShrink: 0,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '7px', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <button type="button" style={btn}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)' }}
        onClick={() => onChange(String(Math.max(1, n - 1)))}>−</button>
      <input type="number" min="1"
        style={{ width: '44px', textAlign: 'center', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', outline: 'none', padding: 0 }}
        value={value} onChange={e => onChange(e.target.value)} />
      <button type="button" style={btn}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)' }}
        onClick={() => onChange(String(n + 1))}>+</button>
    </div>
  )
}

// ── Tab Compras ────────────────────────────────────────────────────────────────
function TabCompras({ compras, fornecedores, produtos, addToast, onAtualizar, mostrarFormInicial }) {
  const [mostrarForm, setMostrarForm] = useState(mostrarFormInicial || false)
  const [expandido, setExpandido] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmarReceber, setConfirmarReceber] = useState(null)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [buscaPedido, setBuscaPedido] = useState('')
  const [form, setForm] = useState({
    fornecedor_id: '', observacoes: '',
    data: new Date().toISOString().split('T')[0],
    itens: []
  })

  useEffect(() => { if (mostrarFormInicial) setMostrarForm(true) }, [mostrarFormInicial])

  const produtoMap = useMemo(() => Object.fromEntries(produtos.map(p => [String(p.id), p])), [produtos])

  const adicionarItem = () =>
    setForm(f => ({ ...f, itens: [...f.itens, { produto_id: '', quantidade: '', preco_unitario: '', autoSugg: false }] }))

  const atualizarItem = (idx, campo, valor) => setForm(f => {
    const itens = [...f.itens]
    const item = { ...itens[idx], [campo]: valor }
    if (campo === 'produto_id') {
      const p = produtoMap[valor]
      if (p) {
        item.preco_unitario = Number(p.preco).toFixed(2)
        const falta = (p.estoque_minimo || 5) - p.estoque
        item.quantidade = falta > 0 ? String(falta * 2) : '10'
        item.autoSugg = true
      } else {
        item.autoSugg = false
      }
    }
    if (campo === 'quantidade') item.autoSugg = false
    itens[idx] = item
    return { ...f, itens }
  })

  const removerItem = (idx) => setForm(f => ({ ...f, itens: f.itens.filter((_, i) => i !== idx) }))

  const salvarCompra = async (e) => {
    e.preventDefault()
    if (form.itens.length === 0) { addToast('Adicione ao menos um item', 'error'); return }
    for (const item of form.itens) {
      if (!item.produto_id || !item.quantidade || !item.preco_unitario) {
        addToast('Preencha produto, quantidade e preço em todos os itens', 'error'); return
      }
    }
    try {
      setSalvando(true)
      await CompraService.criar({
        fornecedor_id: form.fornecedor_id || null,
        observacoes: form.observacoes,
        itens: form.itens.map(i => ({
          produto_id: Number(i.produto_id),
          quantidade: Number(i.quantidade),
          preco_unitario: Number(i.preco_unitario)
        }))
      })
      addToast('Ordem de compra registrada!', 'success')
      setForm({ fornecedor_id: '', observacoes: '', data: new Date().toISOString().split('T')[0], itens: [] })
      setMostrarForm(false)
      onAtualizar()
    } catch { addToast('Erro ao registrar compra', 'error') }
    finally { setSalvando(false) }
  }

  const receberCompra = async (id) => {
    try {
      await CompraService.receber(id)
      addToast('Compra recebida! Estoque e financeiro atualizados.', 'success')
      setConfirmarReceber(null)
      setExpandido(null)
      onAtualizar()
    } catch (err) { addToast(err?.response?.data?.mensagem || 'Erro ao receber compra', 'error') }
  }

  const cancelarCompra = async (id) => {
    if (!confirm('Cancelar esta ordem de compra?')) return
    try { await CompraService.cancelar(id); addToast('Compra cancelada', 'success'); onAtualizar() }
    catch { addToast('Erro ao cancelar', 'error') }
  }

  const toggleExpandir = async (compra) => {
    if (expandido?.id === compra.id) { setExpandido(null); return }
    setExpandido(await CompraService.buscarPorId(compra.id))
  }

  const totalForm  = form.itens.reduce((s, i) => s + (Number(i.quantidade) * Number(i.preco_unitario) || 0), 0)
  const count      = (s) => compras.filter(c => c.status === s).length
  const totalGasto = compras.filter(c => c.status === 'recebida').reduce((s, c) => s + Number(c.valor_total), 0)

  const comprasFiltradas = useMemo(() => compras.filter(c => {
    if (filtroStatus && c.status !== filtroStatus) return false
    if (buscaPedido) {
      const q = buscaPedido.toLowerCase()
      return c.numero_pedido?.toLowerCase().includes(q) || c.fornecedor_nome?.toLowerCase().includes(q)
    }
    return true
  }), [compras, filtroStatus, buscaPedido])

  const fornecedorSelecionado = form.fornecedor_id ? fornecedores.find(f => String(f.id) === String(form.fornecedor_id)) : null

  return (
    <div className="page-layout">

      {/* KPIs */}
      <div className="kpi-grid-4">
        <KpiCard label="Pendentes"               valor={count('pendente')}              cor="#f59e0b" rgb="245,158,11"  icon="◷" />
        <KpiCard label="Recebidas"               valor={count('recebida')}              cor="#10b981" rgb="16,185,129"  icon="✓" />
        <KpiCard label="Canceladas"              valor={count('cancelada')}             cor="#ef4444" rgb="239,68,68"   icon="✕" />
        <KpiCard label="Total gasto (recebidas)" valor={`R$ ${totalGasto.toFixed(2)}`} cor="#6366f1" rgb="99,102,241"  icon="◆" />
      </div>

      {/* ── Formulário ── */}
      {mostrarForm && (
        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Nova Ordem de Compra</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                {form.itens.length === 0 ? 'Preencha o fornecedor e adicione os produtos' : `${form.itens.filter(i => i.produto_id).length} produto${form.itens.filter(i => i.produto_id).length !== 1 ? 's' : ''} · ${form.itens.reduce((s, i) => s + (parseInt(i.quantidade) || 0), 0)} un. · R$ ${totalForm.toFixed(2)}`}
              </p>
            </div>
            <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => setMostrarForm(false)}>Fechar</button>
          </div>

          <form onSubmit={salvarCompra}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px' }}>

              {/* ── Painel esquerdo: inputs ── */}
              <div style={{ padding: '20px 24px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Fornecedor + Data */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px', gap: '16px', alignItems: 'start' }}>
                  <div>
                    <Lbl>Fornecedor</Lbl>
                    <select className="input" value={form.fornecedor_id} onChange={e => setForm(f => ({ ...f, fornecedor_id: e.target.value }))}>
                      <option value="">Sem fornecedor especificado</option>
                      {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                    {fornecedorSelecionado && (
                      <div style={{ marginTop: '7px', padding: '8px 12px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.8, display: 'flex', flexWrap: 'wrap', gap: '0 16px' }}>
                        {fornecedorSelecionado.telefone && <span>📞 {fornecedorSelecionado.telefone}</span>}
                        {fornecedorSelecionado.email && <span>✉ {fornecedorSelecionado.email}</span>}
                        {fornecedorSelecionado.cidade && <span>📍 {fornecedorSelecionado.cidade}</span>}
                      </div>
                    )}
                  </div>
                  <div>
                    <Lbl>Data do pedido</Lbl>
                    <input type="date" className="input" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
                  </div>
                </div>

                {/* Produtos */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <Lbl>Produtos da ordem</Lbl>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={adicionarItem}>
                      + Produto
                    </button>
                  </div>

                  {form.itens.length === 0 ? (
                    <div onClick={adicionarItem}
                      style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '2px dashed var(--border)', cursor: 'pointer', transition: 'border-color 150ms, background 150ms' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(99,102,241,0.04)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-secondary)' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.25 }}>📦</div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 3px', fontWeight: '600' }}>Nenhum produto adicionado</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Clique aqui ou em "+ Produto" para começar</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Cabeçalho colunas */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 118px 134px 80px 26px', gap: '8px', padding: '0 10px' }}>
                        {['Produto', 'Quantidade', 'Preço unitário', 'Subtotal', ''].map(h => (
                          <span key={h} style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                        ))}
                      </div>

                      {form.itens.map((item, idx) => {
                        const p = produtoMap[item.produto_id]
                        const subtotal = (Number(item.quantidade) * Number(item.preco_unitario)) || 0
                        const stockCor = !p ? null : p.estoque === 0 ? '#ef4444' : p.estoque <= (p.estoque_minimo || 5) ? '#f59e0b' : '#10b981'
                        const isDup = item.produto_id && form.itens.filter(i => i.produto_id === item.produto_id).length > 1
                        return (
                          <div key={idx} style={{
                            padding: '10px',
                            background: isDup ? 'rgba(245,158,11,0.04)' : 'var(--bg-secondary)',
                            border: `1px solid ${isDup ? 'rgba(245,158,11,0.35)' : 'var(--border)'}`,
                            borderRadius: '10px', transition: 'border-color 150ms',
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 118px 134px 80px 26px', gap: '8px', alignItems: 'center' }}>
                              <select className="input" style={{ fontSize: '13px', padding: '7px 10px', width: '100%' }} value={item.produto_id}
                                onChange={e => atualizarItem(idx, 'produto_id', e.target.value)}>
                                <option value="">Selecione...</option>
                                {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                              </select>

                              <QtdStepper value={item.quantidade} onChange={v => atualizarItem(idx, 'quantidade', v)} />

                              <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text-muted)', pointerEvents: 'none', fontWeight: '600' }}>R$</span>
                                <input className="input" type="number" step="0.01" min="0" placeholder="0,00"
                                  style={{ fontSize: '13px', padding: '7px 10px 7px 28px', width: '100%' }}
                                  value={item.preco_unitario}
                                  onChange={e => atualizarItem(idx, 'preco_unitario', e.target.value)} />
                              </div>

                              <div style={{ fontSize: '13px', fontWeight: '700', color: subtotal > 0 ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {subtotal > 0 ? `R$ ${subtotal.toFixed(2)}` : '—'}
                              </div>

                              <button type="button" onClick={() => removerItem(idx)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 150ms', padding: '2px' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>✕</button>
                            </div>

                            {/* Info inline após selecionar */}
                            {p && (
                              <div style={{ marginTop: '6px', paddingLeft: '2px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estoque atual:</span>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: stockCor }}>{p.estoque} un.</span>
                                {p.estoque_minimo && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>· mín. {p.estoque_minimo}</span>}
                                {p.categoria && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>· {p.categoria}</span>}
                                {p.sku && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</span>}
                                {item.autoSugg && (
                                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#6366f1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '4px', padding: '1px 6px' }}>
                                    Qtd sugerida
                                  </span>
                                )}
                                {isDup && (
                                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '4px', padding: '1px 6px' }}>
                                    ⚠ Produto duplicado
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      <button type="button" className="btn btn-secondary"
                        style={{ width: '100%', padding: '8px', fontSize: '12px', borderStyle: 'dashed' }}
                        onClick={adicionarItem}>
                        + Adicionar mais um produto
                      </button>
                    </div>
                  )}
                </div>

                {/* Observações */}
                <div>
                  <Lbl>Observações</Lbl>
                  <textarea className="input" rows={2} value={form.observacoes}
                    onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                    placeholder="Prazo de entrega, urgência, condições especiais..."
                    style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.5 }} />
                </div>
              </div>

              {/* ── Painel direito: resumo ── */}
              <div style={{ padding: '20px 18px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '0' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px' }}>
                  Resumo do pedido
                </div>

                {/* Fornecedor + data */}
                <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '1px' }}>Fornecedor</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: fornecedorSelecionado ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: fornecedorSelecionado ? 'normal' : 'italic', marginBottom: '8px' }}>
                    {fornecedorSelecionado?.nome || 'Não especificado'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '1px' }}>Data</div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>
                    {form.data ? new Date(form.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                  </div>
                </div>

                {/* Lista de itens */}
                <div style={{ flex: 1, marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {form.itens.filter(i => i.produto_id).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '12px', opacity: 0.7 }}>
                      Nenhum produto adicionado
                    </div>
                  ) : form.itens.filter(i => i.produto_id).map((item, idx) => {
                    const p = produtoMap[item.produto_id]
                    const subtotal = (Number(item.quantidade) * Number(item.preco_unitario)) || 0
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.nome || '...'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.quantidade || '—'} × R$ {Number(item.preco_unitario || 0).toFixed(2)}</div>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', color: subtotal > 0 ? 'var(--text-primary)' : 'var(--text-muted)', flexShrink: 0 }}>
                          {subtotal > 0 ? `R$ ${subtotal.toFixed(2)}` : '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Totais */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    <span>Produtos</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{form.itens.filter(i => i.produto_id).length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    <span>Unidades</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{form.itens.reduce((s, i) => s + (parseInt(i.quantidade) || 0), 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>Total</span>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent)' }}>R$ {totalForm.toFixed(2)}</span>
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button type="submit" className="btn btn-primary"
                    style={{ padding: '10px', fontSize: '13px', width: '100%', fontWeight: '700' }}
                    disabled={salvando || form.itens.filter(i => i.produto_id).length === 0}>
                    {salvando ? 'Registrando...' : '✓ Confirmar Ordem'}
                  </button>
                  <button type="button" className="btn btn-secondary"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                    onClick={() => { setMostrarForm(false); setForm({ fornecedor_id: '', observacoes: '', data: new Date().toISOString().split('T')[0], itens: [] }) }}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Lista de pedidos ── */}
      <div className="dash-card">
        {/* Toolbar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="input" placeholder="Buscar por nº pedido ou fornecedor..."
            value={buscaPedido} onChange={e => setBuscaPedido(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '7px 12px', fontSize: '13px' }} />
          <div style={{ display: 'flex', borderRadius: '7px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
            {[
              { v: '', l: 'Todos', n: compras.length },
              { v: 'pendente', l: 'Pendentes', n: count('pendente') },
              { v: 'recebida', l: 'Recebidas', n: count('recebida') },
              { v: 'cancelada', l: 'Canceladas', n: count('cancelada') },
            ].map(({ v, l, n }) => (
              <button key={v} onClick={() => setFiltroStatus(v)} style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                fontFamily: 'inherit', transition: 'all 150ms', whiteSpace: 'nowrap',
                background: filtroStatus === v ? 'var(--accent)' : 'transparent',
                color: filtroStatus === v ? '#fff' : 'var(--text-muted)',
              }}>
                {l} <span style={{ opacity: 0.7 }}>({n})</span>
              </button>
            ))}
          </div>
          <button className="btn btn-primary" style={{ padding: '7px 16px', fontSize: '13px', flexShrink: 0 }} onClick={() => { setMostrarForm(v => !v) }}>
            {mostrarForm ? '✕ Fechar' : '+ Nova Compra'}
          </button>
        </div>

        {comprasFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 20px' }}>
            <div style={{ fontSize: '32px', opacity: 0.15, marginBottom: '12px' }}>📦</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 6px', fontWeight: '600' }}>
              {compras.length === 0 ? 'Nenhum pedido registrado' : 'Nenhum pedido encontrado'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
              {compras.length === 0 ? 'Clique em "+ Nova Compra" para criar o primeiro pedido' : 'Tente ajustar os filtros'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                {['Nº Pedido', 'Fornecedor', 'Data', 'Itens', 'Total', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comprasFiltradas.map(c => {
                const sc = STATUS_COR[c.status] || { cor: 'var(--text-muted)', bg: 'var(--bg-secondary)', borda: 'var(--border)' }
                const isExpanded = expandido?.id === c.id
                return (
                  <React.Fragment key={c.id}>
                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--border)', background: isExpanded ? 'rgba(99,102,241,0.04)' : 'transparent', transition: 'background 150ms' }}>
                      <td style={{ padding: '11px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'monospace' }}>{c.numero_pedido}</td>
                      <td style={{ padding: '11px 16px', fontSize: '13px' }}>{c.fornecedor_nome || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td style={{ padding: '11px 16px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(c.data).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 7px', color: 'var(--text-muted)' }}>
                          {c.quantidade_itens ?? '—'} it.
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ {Number(c.valor_total).toFixed(2)}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ background: sc.bg, color: sc.cor, border: `1px solid ${sc.borda}`, borderRadius: '4px', padding: '2px 9px', fontSize: '11px', fontWeight: '700' }}>
                          {STATUS_LABEL[c.status] || c.status}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => toggleExpandir(c)}>
                            {isExpanded ? '▲ Fechar' : '▼ Itens'}
                          </button>
                          {c.status === 'pendente' && (
                            <>
                              <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px', background: '#10b981', borderColor: '#10b981' }}
                                onClick={() => setConfirmarReceber(c)}>
                                ✓ Receber
                              </button>
                              <button onClick={() => cancelarCompra(c.id)}
                                style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', padding: '4px 8px', borderRadius: '6px', transition: 'all 150ms', fontFamily: 'inherit' }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)' }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                                Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Detalhe expandido */}
                    {isExpanded && expandido.itens && (
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td colSpan={7} style={{ padding: 0, background: 'rgba(99,102,241,0.03)' }}>
                          <div style={{ padding: '16px 24px 20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'start' }}>
                              {/* Itens */}
                              <div>
                                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
                                  Itens do pedido
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                      {['Produto', 'Qtd', 'Unitário', 'Subtotal'].map(h => (
                                        <th key={h} style={{ padding: '7px 12px', textAlign: h === 'Produto' ? 'left' : 'right', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {expandido.itens.map((i, idx) => (
                                      <tr key={i.id} style={{ borderBottom: idx < expandido.itens.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                        <td style={{ padding: '9px 12px', fontSize: '13px', fontWeight: '500' }}>{i.produto_nome || i.nome}</td>
                                        <td style={{ padding: '9px 12px', fontSize: '13px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600' }}>{i.quantidade}×</td>
                                        <td style={{ padding: '9px 12px', fontSize: '12px', textAlign: 'right', color: 'var(--text-muted)', fontFamily: 'monospace' }}>R$ {Number(i.preco_unitario).toFixed(2)}</td>
                                        <td style={{ padding: '9px 12px', fontSize: '13px', textAlign: 'right', fontWeight: '700' }}>R$ {Number(i.subtotal).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {/* Resumo lateral */}
                              <div style={{ minWidth: '180px' }}>
                                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Resumo</div>
                                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Produtos</span>
                                    <span style={{ fontWeight: '600' }}>{expandido.itens.length}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Unidades</span>
                                    <span style={{ fontWeight: '600' }}>{expandido.itens.reduce((s, i) => s + i.quantidade, 0)}</span>
                                  </div>
                                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ fontWeight: '600' }}>Total</span>
                                    <span style={{ fontWeight: '800', color: 'var(--accent)' }}>R$ {Number(c.valor_total).toFixed(2)}</span>
                                  </div>
                                </div>
                                {c.observacoes && (
                                  <div style={{ marginTop: '10px', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    <span style={{ fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>Observação</span>
                                    {c.observacoes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal confirmar recebimento ── */}
      {confirmarReceber && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmarReceber(null) }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px 32px', width: '400px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '6px' }}>Confirmar Recebimento</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Pedido {confirmarReceber.numero_pedido}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {[
                { icon: '📦', text: 'Estoque dos produtos será atualizado', cor: '#10b981' },
                { icon: '💰', text: `Despesa de R$ ${Number(confirmarReceber.valor_total).toFixed(2)} registrada no financeiro`, cor: '#ef4444' },
                { icon: '✓', text: 'Status alterado para Recebida', cor: '#6366f1' },
              ].map(({ icon, text, cor }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '13px' }}>
                  <span>{icon}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmarReceber(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981', padding: '9px 24px' }}
                onClick={() => receberCompra(confirmarReceber.id)}>
                ✓ Confirmar Recebimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Root Component ─────────────────────────────────────────────────────────────
export default function Compras({ addToast }) {
  const [aba, setAba] = useState('estoque')
  const [compras, setCompras] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [irParaNovaCompra, setIrParaNovaCompra] = useState(false)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    try {
      setLoading(true)
      const [c, f, p] = await Promise.all([
        CompraService.buscarTodas(),
        FornecedorService.buscarTodos(),
        ProdutoService.buscarTodos()
      ])
      setCompras(c)
      setFornecedores(f.filter(x => x.ativo))
      setProdutos(p)
    } finally { setLoading(false) }
  }

  const irParaCompra = () => {
    setIrParaNovaCompra(true)
    setAba('compras')
    setTimeout(() => setIrParaNovaCompra(false), 500)
  }

  if (loading) return <div className="loading"><div className="spinner"></div>Carregando...</div>

  return (
    <div className="page-layout">

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[
          { key: 'estoque', label: 'Estoque', icon: '◧' },
          { key: 'compras', label: 'Compras', icon: '◪' },
        ].map(t => (
          <button key={t.key} onClick={() => setAba(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 18px', border: 'none', borderRadius: '7px', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600', fontFamily: 'inherit', transition: 'all 150ms',
            background: aba === t.key ? 'var(--accent)' : 'transparent',
            color: aba === t.key ? '#fff' : 'var(--text-muted)',
          }}>
            <span style={{ fontSize: '14px' }}>{t.icon}</span>
            {t.label}
            {t.key === 'estoque' && (produtos.filter(p => p.estoque <= (p.estoque_minimo || 5)).length > 0) && (
              <span style={{ background: aba === 'estoque' ? 'rgba(255,255,255,0.25)' : 'var(--danger)', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: '800', lineHeight: 1.4 }}>
                {produtos.filter(p => p.estoque <= (p.estoque_minimo || 5)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {aba === 'estoque' && (
        <TabEstoque produtos={produtos} onNovaCompra={irParaCompra} />
      )}
      {aba === 'compras' && (
        <TabCompras
          compras={compras}
          fornecedores={fornecedores}
          produtos={produtos}
          addToast={addToast}
          onAtualizar={carregar}
          mostrarFormInicial={irParaNovaCompra}
        />
      )}
    </div>
  )
}
