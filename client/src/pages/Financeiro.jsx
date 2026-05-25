import React, { useState, useEffect, useMemo } from 'react'
import { FinanceiroService } from '../services/api'
import KpiCard from '../components/ui/KpiCard'

const FORM_VAZIO = {
  tipo: 'despesa', categoria: '', descricao: '', valor: '',
  data: new Date().toISOString().split('T')[0]
}

const Lbl = ({ children }) => <label className="field-label">{children}</label>

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const COR_CAT = {
  'Salários': '#6366f1', 'Aluguel': '#8b5cf6', 'Impostos': '#a78bfa',
  'Utilidades': '#f59e0b', 'Marketing': '#f97316', 'Logística': '#fb923c',
  'Operacional': '#10b981', 'Manutenção': '#34d399', 'Tecnologia': '#06b6d4',
  'Benefícios': '#3b82f6', 'Contabilidade': '#60a5fa', 'Transporte': '#818cf8',
  'Alimentação': '#ec4899', 'Educação': '#d946ef', 'Seguros': '#a3e635',
  'venda': '#10b981', 'compra': '#ef4444',
}
function corCategoria(cat) { return COR_CAT[cat] || '#71717a' }

function fmt(v) {
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}


export default function Financeiro({ addToast }) {
  const [movimentos, setMovimentos] = useState([])
  const [resumo, setResumo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [filtroCat, setFiltroCat] = useState('')
  const [mesSelecionado, setMesSelecionado] = useState('')
  const [abaCat, setAbaCat] = useState('despesa')

  const selecionarMes = (key) => {
    if (mesSelecionado === key) { setMesSelecionado(''); setDataInicio(''); setDataFim(''); return }
    const [ano, m] = key.split('-')
    const inicio = `${ano}-${m}-01`
    const fim = new Date(Number(ano), Number(m), 0).toISOString().split('T')[0]
    setMesSelecionado(key)
    setDataInicio(inicio)
    setDataFim(fim)
  }

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    try {
      setLoading(true)
      const [mov, res] = await Promise.all([FinanceiroService.buscarMovimentos(), FinanceiroService.obterResumo()])
      setMovimentos(mov)
      setResumo(res)
    } finally { setLoading(false) }
  }

  const salvar = async (e) => {
    e.preventDefault()
    if (!form.descricao || !form.valor || !form.data) { addToast('Preencha todos os campos obrigatórios', 'error'); return }
    try {
      setSalvando(true)
      await FinanceiroService.criar({ ...form, valor: Number(form.valor) })
      addToast('Movimento registrado!', 'success')
      setForm(FORM_VAZIO)
      await carregar()
    } catch { addToast('Erro ao salvar movimento', 'error') }
    finally { setSalvando(false) }
  }

  const remover = async (id) => {
    if (!confirm('Remover este movimento?')) return
    try { await FinanceiroService.deletar(id); addToast('Movimento removido', 'success'); await carregar() }
    catch { addToast('Erro ao remover', 'error') }
  }

  // ── Acumulado (todos os movimentos) ───────────────────────────────────────
  const acumulado = useMemo(() => {
    const rec = movimentos.filter(m => m.tipo === 'receita').reduce((s, m) => s + Number(m.valor), 0)
    const des = movimentos.filter(m => m.tipo === 'despesa').reduce((s, m) => s + Number(m.valor), 0)
    return { receitas: rec, despesas: des, saldo: rec - des, total: movimentos.length }
  }, [movimentos])

  // ── Evolução 12 meses ──────────────────────────────────────────────────────
  const meses12 = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (11 - i))
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: MESES_PT[d.getMonth()],
      ano: d.getFullYear()
    }
  }), [])

  const evolucao = useMemo(() => meses12.map(({ key, label, ano }) => ({
    key, label, ano,
    receitas: movimentos.filter(m => m.tipo === 'receita' && m.data.startsWith(key)).reduce((s, m) => s + Number(m.valor), 0),
    despesas: movimentos.filter(m => m.tipo === 'despesa' && m.data.startsWith(key)).reduce((s, m) => s + Number(m.valor), 0),
  })), [movimentos, meses12])

  const maxEvol = useMemo(() => Math.max(...evolucao.flatMap(e => [e.receitas, e.despesas]), 1), [evolucao])
  const CHART_H = 110

  // ── Categorias ────────────────────────────────────────────────────────────
  const porCategoria = useMemo(() => {
    const fonte = movimentos.filter(m => m.tipo === abaCat)
    const agg = fonte.reduce((acc, m) => {
      const cat = m.categoria || 'Outros'
      acc[cat] = (acc[cat] || 0) + Number(m.valor)
      return acc
    }, {})
    return Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [movimentos, abaCat])
  const maxCat = Math.max(...porCategoria.map(([, v]) => v), 1)

  // ── Melhor mês (receitas) ──────────────────────────────────────────────────
  const melhorMes = useMemo(() => {
    if (evolucao.every(e => e.receitas === 0)) return null
    return evolucao.reduce((m, e) => e.receitas > (m?.receitas || 0) ? e : m, null)
  }, [evolucao])

  // ── Tabela mensal resumida ─────────────────────────────────────────────────
  const tabelaMensal = useMemo(() => evolucao.slice().reverse(), [evolucao])

  // ── Filtro da tabela ───────────────────────────────────────────────────────
  const movimentosFiltrados = useMemo(() => movimentos.filter(m => {
    if (filtroTipo && m.tipo !== filtroTipo) return false
    if (filtroCat && m.categoria !== filtroCat) return false
    if (dataInicio && m.data < dataInicio) return false
    if (dataFim && m.data > dataFim) return false
    return true
  }), [movimentos, filtroTipo, filtroCat, dataInicio, dataFim])

  const totalFiltrado = useMemo(() => movimentosFiltrados.reduce((acc, m) => {
    m.tipo === 'receita' ? (acc.receitas += Number(m.valor)) : (acc.despesas += Number(m.valor))
    return acc
  }, { receitas: 0, despesas: 0 }), [movimentosFiltrados])

  if (loading) return <div className="loading"><div className="spinner"></div>Carregando...</div>

  const saldoPos = resumo && Number(resumo.saldo) >= 0
  const saldoAcumPos = acumulado.saldo >= 0
  const mesAtual = new Date().toISOString().slice(0, 7)

  return (
    <div className="page-layout">

      {/* ── KPI Acumulado ─────────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
          Total acumulado · {movimentos.length} lançamentos
        </div>
        <div className="kpi-grid-4">
          <KpiCard label="Receita Total"    valor={`R$ ${fmt(acumulado.receitas)}`}  sub="todos os períodos"   cor="#10b981" rgb="16,185,129"  icon="↑" />
          <KpiCard label="Despesa Total"    valor={`R$ ${fmt(acumulado.despesas)}`}  sub="todos os períodos"   cor="#ef4444" rgb="239,68,68"   icon="↓" />
          <KpiCard label="Saldo Acumulado"  valor={`R$ ${fmt(acumulado.saldo)}`}     sub={saldoAcumPos ? 'positivo' : 'negativo'}   cor={saldoAcumPos ? '#10b981' : '#ef4444'} rgb={saldoAcumPos ? '16,185,129' : '239,68,68'} icon={saldoAcumPos ? '◈' : '▼'} />
          <KpiCard label="Melhor Mês"       valor={melhorMes ? `R$ ${fmt(melhorMes.receitas)}` : '—'}  sub={melhorMes ? `${melhorMes.label}/${melhorMes.ano}` : 'sem dados'} cor="#a78bfa" rgb="167,139,250" icon="◉" />
        </div>
      </div>

      {/* ── KPI Este Mês ──────────────────────────────────────────────────── */}
      {resumo && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
            Este mês — {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
          <div className="kpi-grid-4">
            <KpiCard label="Receitas"     valor={`R$ ${fmt(resumo.receitas)}`}  cor="#10b981" rgb="16,185,129"  icon="↑" />
            <KpiCard label="Despesas"     valor={`R$ ${fmt(resumo.despesas)}`}  cor="#ef4444" rgb="239,68,68"   icon="↓" />
            <KpiCard label="Saldo"        valor={`R$ ${fmt(resumo.saldo)}`}     cor={saldoPos ? '#10b981' : '#ef4444'} rgb={saldoPos ? '16,185,129' : '239,68,68'} icon={saldoPos ? '◈' : '▼'} />
            <KpiCard label="Lançamentos"  valor={movimentos.filter(m => m.data && m.data.startsWith(mesAtual)).length} cor="#a78bfa" rgb="167,139,250" icon="◉" />
          </div>
        </div>
      )}

      {/* ── Gráficos ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Evolução 12 meses */}
        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Receitas vs Despesas</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>últimos 12 meses</p>
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px', fontWeight: '600' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--success)', display: 'inline-block' }} /> Receitas
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--danger)', display: 'inline-block' }} /> Despesas
              </span>
            </div>
          </div>
          <div style={{ padding: '20px 24px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: `${CHART_H + 28}px` }}>
              {evolucao.map(({ key, label, receitas, despesas: desp }) => {
                const hRec = receitas > 0 ? Math.max((receitas / maxEvol) * CHART_H, 3) : 0
                const hDes = desp > 0 ? Math.max((desp / maxEvol) * CHART_H, 3) : 0
                const ativo = mesSelecionado === key
                const ehMesAtual = key === mesAtual
                return (
                  <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', borderRadius: '4px', padding: '0 1px', background: ativo ? 'rgba(99,102,241,0.08)' : 'transparent', transition: 'background 150ms' }}
                    onClick={() => selecionarMes(key)}>
                    <div style={{ width: '100%', height: `${CHART_H}px`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px' }}>
                      <div className="bar-click" style={{ flex: 1, height: `${hRec}px`, background: 'var(--success)', borderRadius: '2px 2px 0 0', opacity: ativo ? 1 : 0.8, transition: 'height 400ms ease' }} title={`Receitas: R$ ${fmt(receitas)}`} />
                      <div className="bar-click" style={{ flex: 1, height: `${hDes}px`, background: 'var(--danger)', borderRadius: '2px 2px 0 0', opacity: ativo ? 1 : 0.8, transition: 'height 400ms ease' }} title={`Despesas: R$ ${fmt(desp)}`} />
                    </div>
                    <span style={{ fontSize: '9px', color: ativo ? 'var(--accent)' : ehMesAtual ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '5px', fontWeight: ativo || ehMesAtual ? '700' : '500', textAlign: 'center' }}>{label}</span>
                  </div>
                )
              })}
            </div>

            {/* Saldo por mês — linha de saldo */}
            <div style={{ marginTop: '14px', display: 'flex', gap: '4px' }}>
              {evolucao.map(({ key, receitas, despesas: desp }) => {
                const saldo = receitas - desp
                const cor = saldo >= 0 ? '#10b981' : '#ef4444'
                return (
                  <div key={key} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ width: '100%', height: '3px', borderRadius: '2px', background: cor, opacity: Math.abs(saldo) / maxEvol > 0.01 ? 1 : 0.2 }} />
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px', textAlign: 'right' }}>saldo mensal</div>

            {mesSelecionado && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                <button onClick={() => selecionarMes(mesSelecionado)} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--accent)', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {evolucao.find(e => e.key === mesSelecionado)?.label} ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Categorias */}
        <div className="dash-card">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Por Categoria</h3>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>acumulado total</p>
            </div>
            <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              {['receita', 'despesa'].map(t => (
                <button key={t} onClick={() => setAbaCat(t)} style={{
                  padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600', fontFamily: 'inherit', transition: 'all 150ms',
                  background: abaCat === t ? (t === 'receita' ? 'var(--success)' : 'var(--danger)') : 'transparent',
                  color: abaCat === t ? '#fff' : 'var(--text-muted)',
                }}>{t === 'receita' ? 'Receitas' : 'Despesas'}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: '4px 20px 8px' }}>
            {porCategoria.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '13px' }}>Sem dados</p>
            ) : porCategoria.map(([cat, val], i) => {
              const pct = Math.round((val / maxCat) * 100)
              const cor = corCategoria(cat)
              const ativo = filtroCat === cat
              return (
                <div key={cat} className={`row-click${ativo ? ' ativo' : ''}`}
                  onClick={() => setFiltroCat(ativo ? '' : cat)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 4px', margin: '0 -4px', borderBottom: i < porCategoria.length - 1 ? '1px solid var(--border)' : 'none', borderRadius: ativo ? '6px' : undefined }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cor, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '6px' }}>{pct}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: '2px', transition: 'width 500ms ease' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Tabela resumo mensal ───────────────────────────────────────────── */}
      <div className="dash-card">
        <div className="dash-card__header">
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Resumo Mensal</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>últimos 12 meses</p>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-secondary)' }}>
            <tr>
              {['Mês', 'Receitas', 'Despesas', 'Saldo', ''].map(h => (
                <th key={h} style={{ padding: '9px 20px', textAlign: h === 'Mês' || h === '' ? 'left' : 'right', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabelaMensal.map(({ key, label, ano, receitas, despesas: desp }) => {
              const saldo = receitas - desp
              const ehAtual = key === mesAtual
              const temDados = receitas > 0 || desp > 0
              return (
                <tr key={key} style={{ borderBottom: '1px solid var(--border)', background: ehAtual ? 'rgba(99,102,241,0.04)' : 'transparent', opacity: temDados ? 1 : 0.4 }}>
                  <td style={{ padding: '10px 20px', fontSize: '13px', fontWeight: ehAtual ? '700' : '500', color: ehAtual ? 'var(--accent)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {label}/{ano}
                    {ehAtual && <span style={{ fontSize: '9px', background: 'var(--accent)', color: '#fff', borderRadius: '4px', padding: '1px 5px', fontWeight: '700' }}>ATUAL</span>}
                  </td>
                  <td style={{ padding: '10px 20px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: receitas > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                    {receitas > 0 ? `R$ ${fmt(receitas)}` : '—'}
                  </td>
                  <td style={{ padding: '10px 20px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: desp > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {desp > 0 ? `R$ ${fmt(desp)}` : '—'}
                  </td>
                  <td style={{ padding: '10px 20px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: saldo >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {temDados ? `${saldo >= 0 ? '+' : ''}R$ ${fmt(saldo)}` : '—'}
                  </td>
                  <td style={{ padding: '10px 20px', width: '120px' }}>
                    {temDados && (
                      <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(Math.abs(saldo) / Math.max(...tabelaMensal.map(e => Math.abs(e.receitas - e.despesas)), 1) * 100, 100)}%`, height: '100%', background: saldo >= 0 ? 'var(--success)' : 'var(--danger)', borderRadius: '2px' }} />
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot style={{ background: 'var(--bg-secondary)' }}>
            <tr>
              <td style={{ padding: '10px 20px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total 12 meses</td>
              <td style={{ padding: '10px 20px', textAlign: 'right', fontSize: '13px', fontWeight: '800', color: 'var(--success)' }}>R$ {fmt(evolucao.reduce((s, e) => s + e.receitas, 0))}</td>
              <td style={{ padding: '10px 20px', textAlign: 'right', fontSize: '13px', fontWeight: '800', color: 'var(--danger)' }}>R$ {fmt(evolucao.reduce((s, e) => s + e.despesas, 0))}</td>
              <td style={{ padding: '10px 20px', textAlign: 'right', fontSize: '13px', fontWeight: '800', color: evolucao.reduce((s, e) => s + e.receitas - e.despesas, 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {(() => { const t = evolucao.reduce((s, e) => s + e.receitas - e.despesas, 0); return `${t >= 0 ? '+' : ''}R$ ${fmt(t)}` })()}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Layout: form + tabela de lançamentos ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Formulário */}
        <div className="dash-card">
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', background: form.tipo === 'receita' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Novo Lançamento</h3>
          </div>
          <div style={{ padding: '20px 22px' }}>
            <form onSubmit={salvar}>
              <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '18px' }}>
                {['receita', 'despesa'].map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipo: t }))} style={{
                    flex: 1, padding: '9px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit', transition: 'all 150ms',
                    background: form.tipo === t ? (t === 'receita' ? 'var(--success)' : 'var(--danger)') : 'transparent',
                    color: form.tipo === t ? '#fff' : 'var(--text-muted)',
                  }}>
                    {t === 'receita' ? '+ Receita' : '− Despesa'}
                  </button>
                ))}
              </div>
              {[
                { label: 'Categoria', key: 'categoria', placeholder: 'Ex: Aluguel, Salários…', type: 'text' },
                { label: 'Descrição *', key: 'descricao', placeholder: 'Descrição do movimento', type: 'text' },
                { label: 'Valor (R$) *', key: 'valor', placeholder: '0,00', type: 'number', step: '0.01', min: '0.01' },
                { label: 'Data *', key: 'data', type: 'date' },
              ].map(({ label, key, ...props }) => (
                <div key={key} style={{ marginBottom: '14px' }}>
                  <Lbl>{label}</Lbl>
                  <input className="input" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} {...props} />
                </div>
              ))}
              <button type="submit" disabled={salvando} style={{
                width: '100%', padding: '11px', marginTop: '4px', border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 150ms',
                background: form.tipo === 'receita' ? 'var(--success)' : 'var(--danger)',
                color: '#fff', opacity: salvando ? 0.7 : 1,
              }}>
                {salvando ? 'Salvando…' : `Registrar ${form.tipo === 'receita' ? 'Receita' : 'Despesa'}`}
              </button>
            </form>
          </div>
        </div>

        {/* Tabela de lançamentos */}
        <div className="dash-card">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <Lbl>Tipo</Lbl>
                <select className="input" style={{ padding: '7px 10px', fontSize: '13px', width: '130px' }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="receita">Receitas</option>
                  <option value="despesa">Despesas</option>
                </select>
              </div>
              <div>
                <Lbl>De</Lbl>
                <input type="date" className="input" style={{ padding: '7px 10px', fontSize: '13px' }} value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              </div>
              <div>
                <Lbl>Até</Lbl>
                <input type="date" className="input" style={{ padding: '7px 10px', fontSize: '13px' }} value={dataFim} onChange={e => setDataFim(e.target.value)} />
              </div>
              {(filtroTipo || dataInicio || dataFim || filtroCat) && (
                <button className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: '13px', alignSelf: 'flex-end' }}
                  onClick={() => { setFiltroTipo(''); setDataInicio(''); setDataFim(''); setFiltroCat(''); setMesSelecionado('') }}>
                  Limpar filtros
                </button>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
              <div>{movimentosFiltrados.length} registro{movimentosFiltrados.length !== 1 ? 's' : ''}</div>
              {movimentosFiltrados.length > 0 && (
                <div style={{ marginTop: '2px' }}>
                  <span style={{ color: 'var(--success)' }}>+R$ {fmt(totalFiltrado.receitas)}</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 5px' }}>·</span>
                  <span style={{ color: 'var(--danger)' }}>−R$ {fmt(totalFiltrado.despesas)}</span>
                </div>
              )}
            </div>
          </div>

          {movimentosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>Nenhum movimento encontrado</div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: '440px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    {['Tipo', 'Descrição', 'Categoria', 'Valor', 'Data', ''].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movimentosFiltrados.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                          background: m.tipo === 'receita' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: m.tipo === 'receita' ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {m.tipo === 'receita' ? '↑' : '↓'} {m.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '500', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descricao}</td>
                      <td style={{ padding: '10px 16px' }}>
                        {m.categoria ? (
                          <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', background: `${corCategoria(m.categoria)}22`, color: corCategoria(m.categoria) }}>
                            {m.categoria}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap', color: m.tipo === 'receita' ? 'var(--success)' : 'var(--danger)' }}>
                        {m.tipo === 'receita' ? '+' : '−'}R$ {fmt(m.valor)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {!m.referencia_id && (
                          <button onClick={() => remover(m.id)} title="Remover"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '15px', padding: '2px 6px', borderRadius: '4px', transition: 'color 150ms, background 150ms' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}>✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
