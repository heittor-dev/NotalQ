import React from 'react'

export default function Cupom({ dadosCupom, onNovaVenda }) {
  if (!dadosCupom) {
    return (
      <div className="alert alert-error">
        <span>⚠</span>
        <span>Nenhum cupom para exibir.</span>
      </div>
    )
  }

  const {
    numero_venda,
    data_hora,
    itens,
    subtotal_bruto,
    desconto,
    valor_total,
    forma_pagamento,
    codigo_autorizacao
  } = dadosCupom

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .sidebar, .header, .nav-menu { display: none !important; }
          body { background: white !important; }
          .cupom-papel { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

      <div className="no-print btn-group" style={{ marginBottom: '24px' }}>
        <button className="btn btn-primary" onClick={() => window.print()} style={{ fontWeight: '600' }}>
          🖨 Imprimir Cupom
        </button>
        <button className="btn btn-success" onClick={onNovaVenda} style={{ fontWeight: '600' }}>
          + Nova Venda
        </button>
      </div>

      <div className="cupom-papel" style={{
        background: 'white', color: '#000', fontFamily: '"Courier New", monospace',
        maxWidth: '380px', margin: '0 auto', padding: '32px 24px',
        borderRadius: '8px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        fontSize: '13px', lineHeight: '1.6'
      }}>
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '4px' }}>PDV SYSTEM</div>
          <div style={{ fontSize: '11px', marginTop: '4px' }}>CUPOM NÃO FISCAL</div>
        </div>

        <div style={{ marginBottom: '12px', fontSize: '11px' }}>
          <div>Data: {data_hora}</div>
          <div>Venda: {numero_venda}</div>
          <div>Auth: {codigo_autorizacao}</div>
        </div>

        <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '12px 0', marginBottom: '12px' }}>
          {itens.map((item, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: '700' }}>{item.nome}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.quantidade}x R$ {Number(item.preco_unitario).toFixed(2)}</span>
                <span>R$ {Number(item.subtotal).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>R$ {Number(subtotal_bruto).toFixed(2)}</span>
          </div>
          {desconto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Desconto</span>
              <span>- R$ {Number(desconto).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div style={{ borderTop: '2px solid #000', paddingTop: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '16px' }}>
            <span>TOTAL</span>
            <span>R$ {Number(valor_total).toFixed(2)}</span>
          </div>
          <div style={{ marginTop: '4px', fontSize: '12px' }}>Pagamento: {forma_pagamento}</div>
        </div>

        <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '12px', fontSize: '11px' }}>
          <div>Obrigado pela preferência!</div>
          <div style={{ marginTop: '4px' }}>PDV System — Powered by Node.js</div>
        </div>
      </div>
    </div>
  )
}
