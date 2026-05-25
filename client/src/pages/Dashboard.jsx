import React, { useState, useEffect } from 'react'
import { DashboardService, ConfiguracaoService } from '../services/api'
import KpiCard from '../components/ui/KpiCard'

const CHART_H = 100

function getSaudacao() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Bom dia'
  if (h >= 12 && h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const formasLabel = { pix: 'PIX', credito: 'Crédito', debito: 'Débito', dinheiro: 'Dinheiro' }

export default function Dashboard({ onNavegar }) {
  const [barAtiva, setBarAtiva] = useState(null)
  const [dados, setDados] = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => { carregarDados() }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [res, configs] = await Promise.all([
        DashboardService.obterEstatisticas(),
        ConfiguracaoService.buscarTodas()
      ])
      setDados(res.dados)
      setNomeEmpresa(configs.nome_empresa || 'PDV System')
    } catch {
      setErro('Erro ao carregar dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="loading"><div className="spinner"></div>Carregando estatísticas...</div>
  )
  if (erro) return <div className="alert alert-error"><span>⚠</span><span>{erro}</span></div>
  if (!dados) return null

  const crescimento = dados.crescimento_percentual
  const saldoPos = (dados.saldo_mes ?? 0) >= 0
  const alertasCount = dados.produtos_sem_estoque + dados.produtos_estoque_baixo

  const maxFat7d = Math.max(...(dados.faturamento_7dias?.map(d => d.faturamento) ?? [0]), 1)
  const maxVendas = Math.max(...dados.vendas_por_pagamento.map(v => v.quantidade), 1)
  const maxTopProd = Math.max(...(dados.top_produtos?.map(p => p.total_vendido) ?? [0]), 1)
  const totalFat7d = dados.faturamento_7dias?.reduce((s, d) => s + d.faturamento, 0) ?? 0

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dStr = d.toISOString().split('T')[0]
    const found = dados.faturamento_7dias?.find(x => x.dia === dStr)
    return {
      dia: dStr,
      label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      faturamento: found?.faturamento || 0,
      qtd_vendas: found?.qtd_vendas || 0,
      isToday: i === 6
    }
  })

  const receitas = Number(dados.receitas_mes ?? 0)
  const despesas = Number(dados.despesas_mes ?? 0)
  const totalMes = receitas + despesas
  const pctReceitas = totalMes > 0 ? (receitas / totalMes) * 100 : 0

  return (
    <div className="page-layout">

      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.03) 100%)',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: '12px',
        padding: '24px 28px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '500', textTransform: 'capitalize' }}>
            {getSaudacao()} · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {nomeEmpresa}
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{dados.total_vendas}</span> vendas no total
            </span>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--border-light)', display: 'inline-block' }}></span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Ticket médio <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>R$ {Number(dados.ticket_medio ?? 0).toFixed(2)}</span>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Receita Total
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--success)', lineHeight: 1, letterSpacing: '-1px', marginBottom: '4px' }}>
              R$ {Number(dados.receitas_total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>acumulado</div>
          </div>
          <div style={{ textAlign: 'right', paddingLeft: '28px', borderLeft: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Hoje
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent)', lineHeight: 1, letterSpacing: '-1px', marginBottom: '4px' }}>
              R$ {Number(dados.faturamento_dia).toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {dados.vendas_hoje} venda{dados.vendas_hoje !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards — Totais Acumulados */}
      <div className="kpi-grid-3">
        <KpiCard
          label="Receita Total" sub="acumulado · todos os períodos"
          valor={`R$ ${Number(dados.receitas_total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="+" cor="#10b981"
          bg="linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)"
          borda="rgba(16,185,129,0.3)"
        />
        <KpiCard
          label="Despesas Total" sub="acumulado · todos os períodos"
          valor={`R$ ${Number(dados.despesas_total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="−" cor="#ef4444"
          bg="linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 100%)"
          borda="rgba(239,68,68,0.3)"
        />
        <KpiCard
          label="Saldo Acumulado" sub="receitas − despesas"
          valor={`R$ ${Number(dados.saldo_total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={(dados.saldo_total ?? 0) >= 0 ? '↑' : '↓'}
          cor={(dados.saldo_total ?? 0) >= 0 ? '#10b981' : '#ef4444'}
          bg={`linear-gradient(135deg, ${(dados.saldo_total ?? 0) >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'} 0%, ${(dados.saldo_total ?? 0) >= 0 ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)'} 100%)`}
          borda={(dados.saldo_total ?? 0) >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}
        />
      </div>

      {/* KPI Cards — Operacional */}
      <div className="kpi-grid-3">
        <KpiCard label="Total de Vendas" sub="todas as vendas" valor={dados.total_vendas} icon="◈" cor="#6366f1" bg="linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%)" borda="rgba(99,102,241,0.3)" />
        <KpiCard label="Compras Pendentes" sub="aguardando recebimento" valor={dados.compras_pendentes ?? 0} icon="○" cor="#a78bfa" bg="linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0.04) 100%)" borda="rgba(167,139,250,0.3)" />
        <KpiCard label="Alertas de Estoque" sub={alertasCount > 0 ? `${dados.produtos_sem_estoque} sem estoque` : 'tudo em ordem'} valor={alertasCount} icon="▲" cor={alertasCount > 0 ? '#f59e0b' : '#10b981'} bg={alertasCount > 0 ? 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)' : 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)'} borda={alertasCount > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'} />
      </div>

      {/* Gráfico 7 dias + Composição financeira */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        <div className="dash-card">
          <div className="dash-card__header">
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Faturamento — 7 Dias</h3>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>R$ {totalFat7d.toFixed(2)}</span>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div className="bar-chart-v">
              {diasSemana.map(d => {
                const barH = maxFat7d > 0 ? Math.max((d.faturamento / maxFat7d) * CHART_H, d.faturamento > 0 ? 4 : 0) : 0
                const ativo = barAtiva === d.dia
                return (
                  <div key={d.dia} className="bar-chart-v__col" style={{ position: 'relative' }} title={`${d.qtd_vendas} venda(s) — R$ ${Number(d.faturamento).toFixed(2)}`}>
                    <div className="bar-chart-v__track" style={{ cursor: 'pointer' }} onClick={() => { setBarAtiva(ativo ? null : d.dia); onNavegar?.('vendas', { dataInicio: d.dia, dataFim: d.dia }) }}>
                      <div
                        className={`bar-chart-v__bar bar-click${ativo ? ' ativo' : ''}`}
                        style={{ height: `${barH}px`, background: d.isToday ? 'var(--success)' : ativo ? '#a78bfa' : 'var(--accent)', opacity: d.isToday ? 1 : 0.78 }}
                      />
                    </div>
                    {ativo && (
                      <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)', zIndex: 10, marginBottom: '4px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--success)' }}>R$ {Number(d.faturamento).toFixed(2)}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{d.qtd_vendas} venda(s)</div>
                      </div>
                    )}
                    <span className="bar-chart-v__label" style={{ fontWeight: d.isToday || ativo ? '700' : '400', color: d.isToday ? 'var(--text-primary)' : ativo ? 'var(--accent)' : undefined }}>
                      {d.label}
                    </span>
                  </div>
                )
              })}
            </div>
            {barAtiva && (
              <p style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '8px', textAlign: 'center' }}>
                Abrindo Vendas… clique novamente para fechar o destaque
              </p>
            )}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__header">
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Composição Financeira</h3>
            {crescimento !== null && !isNaN(crescimento) && (
              <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: crescimento >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: crescimento >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {crescimento >= 0 ? '▲' : '▼'} {Math.abs(crescimento).toFixed(1)}% vs mês ant.
              </span>
            )}
          </div>
          <div style={{ padding: '20px 24px' }}>
            {/* Barra de composição */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '600' }}>Receitas {pctReceitas.toFixed(0)}%</span>
                <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: '600' }}>Despesas {(100 - pctReceitas).toFixed(0)}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(239,68,68,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pctReceitas}%`, background: 'var(--success)', borderRadius: '4px', transition: 'width 400ms ease' }} />
              </div>
            </div>

            {/* Valores */}
            {[
              { label: 'Receitas', valor: `R$ ${receitas.toFixed(2)}`, cor: 'var(--success)', prefix: '+' },
              { label: 'Despesas', valor: `R$ ${despesas.toFixed(2)}`, cor: 'var(--danger)', prefix: '−' },
            ].map(({ label, valor, cor, prefix }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: cor }}>{prefix} {valor}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 0' }}>
              <span style={{ fontSize: '13px', fontWeight: '700' }}>Saldo</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: saldoPos ? 'var(--success)' : 'var(--danger)' }}>
                R$ {Number(dados.saldo_mes ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top produtos — linha própria */}
      {dados.top_produtos?.length > 0 && (
        <div className="dash-card">
          <div className="dash-card__header">
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Top Produtos</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>este mês</span>
          </div>
          <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {dados.top_produtos.map((p, i) => {
              const pct = Math.round((p.total_vendido / maxTopProd) * 100)
              const cores = ['#6366f1', '#a78bfa', '#c4b5fd', '#ddd6fe']
              return (
                <div key={i} className="row-click" style={{ borderRadius: '8px', padding: '4px 6px', margin: '0 -6px' }}
                  onClick={() => onNavegar?.('produtos', { busca: p.nome })}
                  title={`Ver ${p.nome} em Produtos`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: i === 0 ? '#f59e0b' : 'var(--text-muted)', minWidth: '16px' }}>#{i + 1}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{p.nome}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.total_vendido} un.</span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: cores[i] || 'var(--border-light)', borderRadius: '3px', transition: 'width 400ms ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Formas de pagamento + Alertas + Últimas vendas — mesma linha, mesmo padrão */}
      {(dados.vendas_por_pagamento.length > 0 || dados.alertas_estoque.length > 0 || dados.ultimas_vendas.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '20px' }}>

          {/* Formas de pagamento */}
          <div className="dash-card">
            <div className="dash-card__header">
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Pagamentos</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {(() => { const t = dados.vendas_por_pagamento.reduce((s, v) => s + v.quantidade, 0); return `${t} venda${t !== 1 ? 's' : ''}` })()}
              </span>
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {dados.vendas_por_pagamento.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Sem dados</p>
              ) : dados.vendas_por_pagamento.map((v, i) => {
                const pct = Math.round((v.quantidade / maxVendas) * 100)
                const cores = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
                return (
                  <div key={v.forma_pagamento} className="row-click" style={{ borderRadius: '8px', padding: '4px 6px', margin: '0 -6px' }}
                    onClick={() => onNavegar?.('vendas', { forma: v.forma_pagamento })} title={`Ver vendas — ${formasLabel[v.forma_pagamento] || v.forma_pagamento}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{formasLabel[v.forma_pagamento] || v.forma_pagamento}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.quantidade} · R$ {Number(v.total).toFixed(2)}</span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: cores[i] || '#10b981', borderRadius: '3px', transition: 'width 400ms ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alertas de estoque */}
          <div className="dash-card">
            <div className="dash-card__header">
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Alertas de Estoque</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dados.alertas_estoque.length} item{dados.alertas_estoque.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {dados.alertas_estoque.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '8px 0', textAlign: 'center' }}>Tudo em ordem</p>
              ) : dados.alertas_estoque.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{p.nome}</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: p.estoque === 0 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: p.estoque === 0 ? 'var(--danger)' : 'var(--warning)' }}>
                    {p.estoque === 0 ? 'Sem estoque' : `${p.estoque} un.`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Últimas vendas */}
          <div className="dash-card">
            <div className="dash-card__header">
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Últimas Vendas</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dados.ultimas_vendas.length} registro{dados.ultimas_vendas.length !== 1 ? 's' : ''}</span>
            </div>
            {dados.ultimas_vendas.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '16px 24px' }}>Nenhuma venda registrada</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-secondary)' }}>
                  <tr>
                    {['Nº Venda', 'Valor', 'Pagamento', 'Data'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dados.ultimas_vendas.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '11px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'monospace' }}>{v.numero_venda || `#${v.id}`}</td>
                      <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>R$ {Number(v.valor_total).toFixed(2)}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' }}>
                          {formasLabel[v.forma_pagamento] || v.forma_pagamento}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(v.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {dados.total_vendas === 0 && (
        <div className="dash-card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
            Nenhuma venda registrada ainda. Acesse <strong style={{ color: 'var(--text-primary)' }}>Simular Vendas</strong> para realizar a primeira venda.
          </p>
        </div>
      )}

    </div>
  )
}
