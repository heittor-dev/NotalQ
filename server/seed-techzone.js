const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database/pdv.db'));

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

const PRODUTOS = [
  { nome: 'Notebook Dell Inspiron 15', descricao: 'Intel Core i5-1235U, 8GB RAM, 256GB SSD, Tela 15.6" Full HD', preco: 4299.00, custo: 2800.00, estoque: 5, sku: 'NTB-DELL-001', categoria: 'Notebooks', estoque_minimo: 3 },
  { nome: 'Notebook Lenovo IdeaPad 3', descricao: 'AMD Ryzen 5 7520U, 8GB RAM, 512GB SSD, Tela 15.6"', preco: 3499.00, custo: 2200.00, estoque: 4, sku: 'NTB-LNV-002', categoria: 'Notebooks', estoque_minimo: 3 },
  { nome: 'Notebook Gamer ASUS ROG Strix', descricao: 'Intel Core i7-12700H, 16GB RAM, 512GB SSD, RTX 3060, 144Hz', preco: 7999.00, custo: 5500.00, estoque: 3, sku: 'NTB-ASUS-003', categoria: 'Notebooks', estoque_minimo: 2 },
  { nome: 'iPhone 15 128GB', descricao: 'Apple iPhone 15, Chip A16 Bionic, Câmera 48MP, 5G', preco: 5499.00, custo: 3800.00, estoque: 6, sku: 'CEL-APL-001', categoria: 'Smartphones', estoque_minimo: 3 },
  { nome: 'Samsung Galaxy S24 128GB', descricao: 'Snapdragon 8 Gen 3, 8GB RAM, Câmera 50MP, 5G', preco: 4299.00, custo: 2900.00, estoque: 5, sku: 'CEL-SAM-002', categoria: 'Smartphones', estoque_minimo: 3 },
  { nome: 'Monitor LG 24" Full HD', descricao: 'LG 24MP400, IPS, 1080p, 75Hz, HDMI+VGA', preco: 999.00, custo: 650.00, estoque: 7, sku: 'MON-LG-001', categoria: 'Monitores', estoque_minimo: 4 },
  { nome: 'Mouse Logitech MX Master 3S', descricao: 'Sem fio, 8000 DPI, Ergonômico, Scroll MagSpeed, Bluetooth', preco: 449.00, custo: 280.00, estoque: 12, sku: 'MOU-LOG-001', categoria: 'Periféricos', estoque_minimo: 5 },
  { nome: 'Teclado Mecânico HyperX Alloy', descricao: 'Switch Red, RGB, ABNT2, Anti-ghosting, Cabo destacável', preco: 319.00, custo: 190.00, estoque: 9, sku: 'TEC-HYP-001', categoria: 'Periféricos', estoque_minimo: 4 },
  { nome: 'Headset HyperX Cloud II', descricao: '7.1 Surround Virtual, Drivers 53mm, USB+P2, PC/PS/Xbox', preco: 399.00, custo: 240.00, estoque: 8, sku: 'HEAD-HYP-001', categoria: 'Periféricos', estoque_minimo: 4 },
  { nome: 'SSD Kingston 480GB SATA', descricao: 'A400 480GB, Leitura 500MB/s, Gravação 450MB/s, 2.5"', preco: 299.00, custo: 180.00, estoque: 15, sku: 'SSD-KNG-001', categoria: 'Armazenamento', estoque_minimo: 6 },
  { nome: 'Memória RAM Corsair 16GB DDR4', descricao: 'Vengeance 16GB (2x8GB) DDR4-3200MHz CL16', preco: 359.00, custo: 220.00, estoque: 12, sku: 'RAM-COR-001', categoria: 'Componentes', estoque_minimo: 5 },
  { nome: 'Webcam Logitech C920 HD Pro', descricao: '1080p 30fps, Foco automático, Microfone estéreo, USB', preco: 449.00, custo: 280.00, estoque: 6, sku: 'CAM-LOG-001', categoria: 'Periféricos', estoque_minimo: 3 },
  { nome: 'Mousepad Gamer XL Extended', descricao: 'Base antiderrapante, Superfície lisa, 900x400mm', preco: 99.00, custo: 55.00, estoque: 18, sku: 'PAD-GAM-001', categoria: 'Acessórios', estoque_minimo: 8 },
  { nome: 'Hub USB-C 7 em 1', descricao: 'HDMI 4K, USB 3.0 x3, SD, TF, Power Delivery 100W', preco: 149.00, custo: 85.00, estoque: 12, sku: 'HUB-USB-001', categoria: 'Acessórios', estoque_minimo: 6 },
  { nome: 'Carregador GaN 65W USB-C', descricao: 'Tecnologia GaN, 65W, USB-C + USB-A, Bivolt, Compacto', preco: 119.00, custo: 65.00, estoque: 14, sku: 'CAR-GAN-001', categoria: 'Acessórios', estoque_minimo: 6 },
  { nome: 'Cabo HDMI 2.0 2 metros', descricao: '4K 60Hz, HDR, Alta Velocidade 18Gbps, Nylon trançado', preco: 69.00, custo: 35.00, estoque: 22, sku: 'CAB-HDM-001', categoria: 'Cabos', estoque_minimo: 10 },
  { nome: 'Case Notebook 15.6" Premium', descricao: 'Impermeável, espuma protetora, alça de ombro, múltiplos bolsos', preco: 89.00, custo: 45.00, estoque: 14, sku: 'CASE-NTB-001', categoria: 'Acessórios', estoque_minimo: 6 },
  { nome: 'Suporte Ergonômico para Notebook', descricao: 'Alumínio, altura ajustável, refrigeração passiva, 11-17"', preco: 179.00, custo: 95.00, estoque: 9, sku: 'SUP-NTB-001', categoria: 'Acessórios', estoque_minimo: 4 },
];

const FORNECEDORES = [
  { nome: 'Distribuidora TechPro Ltda', cnpj: '12.345.678/0001-90', email: 'vendas@techpro.com.br', telefone: '(11) 4567-8901', endereco: 'Rua do Comércio, 500 - Santo André/SP', categoria: 'Informática' },
  { nome: 'National Imports Eletrônicos', cnpj: '23.456.789/0001-01', email: 'pedidos@nationalimports.com.br', telefone: '(11) 5678-9012', endereco: 'Av. Industrial, 2000 - Guarulhos/SP', categoria: 'Eletrônicos' },
  { nome: 'MegaStock Computadores', cnpj: '34.567.890/0001-12', email: 'comercial@megastock.com.br', telefone: '(11) 6789-0123', endereco: 'Rua das Indústrias, 800 - São Bernardo/SP', categoria: 'Informática' },
];

let _vendaCounters = { '2026-03': 1, '2026-04': 1, '2026-05': 1 };
let _compraCounter = 1;

async function criarVenda(data, items, forma_pagamento, desconto = 0) {
  const mes = data.substring(0, 7);
  const n = String(_vendaCounters[mes]++).padStart(4, '0');
  const prefix = mes === '2026-03' ? 'VND-MAR' : mes === '2026-04' ? 'VND-ABR' : 'VND-MAI';
  const numero_venda = `${prefix}-${n}`;

  let total = items.reduce((s, i) => s + i.preco * i.qtd, 0) - desconto;
  total = Math.round(total * 100) / 100;
  const qtd_total = items.reduce((s, i) => s + i.qtd, 0);

  const v = await run(
    'INSERT INTO vendas (numero_venda,data,valor_total,quantidade_itens,desconto,forma_pagamento,status,criado_em) VALUES (?,?,?,?,?,?,?,?)',
    [numero_venda, data, total, qtd_total, desconto, forma_pagamento, 'pago', data + ' 10:00:00']
  );

  for (const item of items) {
    const sub = Math.round(item.preco * item.qtd * 100) / 100;
    await run(
      'INSERT INTO venda_itens (venda_id,produto_id,quantidade,preco_unitario,subtotal,criado_em) VALUES (?,?,?,?,?,?)',
      [v.lastID, item.id, item.qtd, item.preco, sub, data + ' 10:00:00']
    );
  }

  await run(
    'INSERT INTO movimentos_financeiros (tipo,categoria,descricao,valor,data,forma_pagamento,referencia_id,referencia_tipo,criado_em) VALUES (?,?,?,?,?,?,?,?,?)',
    ['receita', 'Venda', `Venda ${numero_venda}`, total, data, forma_pagamento, v.lastID, 'venda', data + ' 10:00:00']
  );
}

async function criarCompra(fornecedor_id, data, items) {
  const numero = 'PC-' + String(_compraCounter++).padStart(4, '0');
  let total = items.reduce((s, i) => s + i.custo * i.qtd, 0);
  total = Math.round(total * 100) / 100;

  const c = await run(
    'INSERT INTO compras (fornecedor_id,numero_pedido,data,valor_total,status,criado_em) VALUES (?,?,?,?,?,?)',
    [fornecedor_id, numero, data, total, 'recebido', data + ' 09:00:00']
  );

  for (const item of items) {
    const sub = Math.round(item.custo * item.qtd * 100) / 100;
    await run(
      'INSERT INTO compra_itens (compra_id,produto_id,quantidade,preco_unitario,subtotal) VALUES (?,?,?,?,?)',
      [c.lastID, item.id, item.qtd, item.custo, sub]
    );
  }

  await run(
    'INSERT INTO movimentos_financeiros (tipo,categoria,descricao,valor,data,forma_pagamento,referencia_id,referencia_tipo,criado_em) VALUES (?,?,?,?,?,?,?,?,?)',
    ['despesa', 'Compra', `Compra ${numero}`, total, data, 'transferencia', c.lastID, 'compra', data + ' 09:00:00']
  );
}

async function criarDespesa(data, categoria, descricao, valor, forma = 'transferencia') {
  await run(
    'INSERT INTO movimentos_financeiros (tipo,categoria,descricao,valor,data,forma_pagamento,criado_em) VALUES (?,?,?,?,?,?,?)',
    ['despesa', categoria, descricao, valor, data, forma, data + ' 08:00:00']
  );
}

async function seed() {
  console.log('Limpando dados antigos...');
  await run('DELETE FROM movimentos_financeiros');
  await run('DELETE FROM venda_itens');
  await run('DELETE FROM vendas');
  await run('DELETE FROM compra_itens');
  await run('DELETE FROM compras');
  await run('DELETE FROM produtos');
  await run('DELETE FROM fornecedores');
  await run("DELETE FROM sqlite_sequence WHERE name IN ('movimentos_financeiros','venda_itens','vendas','compra_itens','compras','produtos','fornecedores')");

  console.log('Configurando empresa...');
  const configs = [
    ['nome_empresa', 'TechZone Informática'],
    ['cnpj', '45.678.901/0001-23'],
    ['telefone', '(11) 3456-7890'],
    ['email', 'contato@techzone.com.br'],
    ['endereco', 'Av. Paulista, 1234 - Bela Vista, São Paulo/SP'],
  ];
  for (const [chave, valor] of configs) {
    await run(
      "INSERT OR REPLACE INTO configuracoes (chave, valor, atualizado_em) VALUES (?, ?, datetime('now'))",
      [chave, valor]
    );
  }

  console.log('Inserindo fornecedores...');
  const fornIds = [];
  for (const f of FORNECEDORES) {
    const r = await run(
      "INSERT INTO fornecedores (nome,cnpj,email,telefone,endereco,categoria,ativo,criado_em) VALUES (?,?,?,?,?,?,1,datetime('now'))",
      [f.nome, f.cnpj, f.email, f.telefone, f.endereco, f.categoria]
    );
    fornIds.push(r.lastID);
  }

  console.log('Inserindo produtos...');
  const p = {};
  for (const prod of PRODUTOS) {
    const r = await run(
      "INSERT INTO produtos (nome,descricao,preco,estoque,sku,criado_em,estoque_minimo,categoria) VALUES (?,?,?,?,?,datetime('now'),?,?)",
      [prod.nome, prod.descricao, prod.preco, prod.estoque, prod.sku, prod.estoque_minimo, prod.categoria]
    );
    p[prod.sku] = { id: r.lastID, ...prod };
  }

  // ── MARÇO 2026 ────────────────────────────────────────────
  console.log('Populando Março/2026...');

  await criarCompra(fornIds[0], '2026-03-03', [
    { id: p['NTB-DELL-001'].id, custo: 2800, qtd: 3 },
    { id: p['NTB-ASUS-003'].id, custo: 5500, qtd: 2 },
    { id: p['NTB-LNV-002'].id, custo: 2200, qtd: 2 },
  ]);
  await criarCompra(fornIds[1], '2026-03-05', [
    { id: p['CEL-APL-001'].id, custo: 3800, qtd: 4 },
    { id: p['CEL-SAM-002'].id, custo: 2900, qtd: 3 },
  ]);
  await criarCompra(fornIds[2], '2026-03-07', [
    { id: p['MON-LG-001'].id, custo: 650, qtd: 4 },
    { id: p['MOU-LOG-001'].id, custo: 280, qtd: 3 },
    { id: p['TEC-HYP-001'].id, custo: 190, qtd: 1 },
    { id: p['HEAD-HYP-001'].id, custo: 240, qtd: 1 },
    { id: p['CAM-LOG-001'].id, custo: 280, qtd: 1 },
    { id: p['SSD-KNG-001'].id, custo: 180, qtd: 6 },
    { id: p['RAM-COR-001'].id, custo: 220, qtd: 3 },
    { id: p['HUB-USB-001'].id, custo: 85, qtd: 2 },
    { id: p['CAR-GAN-001'].id, custo: 65, qtd: 2 },
    { id: p['CAB-HDM-001'].id, custo: 35, qtd: 3 },
    { id: p['CASE-NTB-001'].id, custo: 45, qtd: 3 },
    { id: p['SUP-NTB-001'].id, custo: 95, qtd: 1 },
    { id: p['PAD-GAM-001'].id, custo: 55, qtd: 4 },
  ]);

  await criarDespesa('2026-03-05', 'Aluguel', 'Aluguel loja - Março/2026', 4500);
  await criarDespesa('2026-03-05', 'Energia', 'Conta de Energia - Março/2026', 850);
  await criarDespesa('2026-03-05', 'Internet', 'Internet Fibra 500MB - Março/2026', 280);
  await criarDespesa('2026-03-05', 'Salários', 'Folha de Pagamento - Março/2026', 6800);
  await criarDespesa('2026-03-10', 'Marketing', 'Anúncios Google/Meta - Março/2026', 1200);

  await criarVenda('2026-03-04', [{ id: p['NTB-DELL-001'].id, preco: 4299, qtd: 1 }], 'credito');
  await criarVenda('2026-03-05', [{ id: p['CEL-APL-001'].id, preco: 5499, qtd: 1 }], 'credito');
  await criarVenda('2026-03-06', [{ id: p['MOU-LOG-001'].id, preco: 449, qtd: 2 }, { id: p['PAD-GAM-001'].id, preco: 99, qtd: 2 }], 'debito');
  await criarVenda('2026-03-07', [{ id: p['NTB-ASUS-003'].id, preco: 7999, qtd: 1 }], 'credito');
  await criarVenda('2026-03-08', [{ id: p['CEL-SAM-002'].id, preco: 4299, qtd: 1 }], 'pix');
  await criarVenda('2026-03-10', [{ id: p['MON-LG-001'].id, preco: 999, qtd: 2 }], 'pix');
  await criarVenda('2026-03-11', [{ id: p['SSD-KNG-001'].id, preco: 299, qtd: 2 }, { id: p['RAM-COR-001'].id, preco: 359, qtd: 1 }], 'debito');
  await criarVenda('2026-03-12', [{ id: p['NTB-LNV-002'].id, preco: 3499, qtd: 1 }], 'credito');
  await criarVenda('2026-03-13', [{ id: p['CEL-APL-001'].id, preco: 5499, qtd: 1 }], 'credito');
  await criarVenda('2026-03-14', [{ id: p['TEC-HYP-001'].id, preco: 319, qtd: 1 }, { id: p['HEAD-HYP-001'].id, preco: 399, qtd: 1 }, { id: p['MOU-LOG-001'].id, preco: 449, qtd: 1 }], 'pix');
  await criarVenda('2026-03-15', [{ id: p['NTB-DELL-001'].id, preco: 4299, qtd: 1 }], 'credito');
  await criarVenda('2026-03-17', [{ id: p['CEL-SAM-002'].id, preco: 4299, qtd: 1 }], 'debito');
  await criarVenda('2026-03-18', [{ id: p['MON-LG-001'].id, preco: 999, qtd: 1 }, { id: p['CAM-LOG-001'].id, preco: 449, qtd: 1 }], 'credito');
  await criarVenda('2026-03-19', [{ id: p['HUB-USB-001'].id, preco: 149, qtd: 2 }, { id: p['CAR-GAN-001'].id, preco: 119, qtd: 2 }, { id: p['CAB-HDM-001'].id, preco: 69, qtd: 3 }], 'pix');
  await criarVenda('2026-03-20', [{ id: p['NTB-LNV-002'].id, preco: 3499, qtd: 1 }], 'credito');
  await criarVenda('2026-03-21', [{ id: p['CEL-APL-001'].id, preco: 5499, qtd: 1 }], 'credito');
  await criarVenda('2026-03-22', [{ id: p['SSD-KNG-001'].id, preco: 299, qtd: 3 }], 'pix');
  await criarVenda('2026-03-24', [{ id: p['NTB-ASUS-003'].id, preco: 7999, qtd: 1 }], 'credito');
  await criarVenda('2026-03-25', [{ id: p['CASE-NTB-001'].id, preco: 89, qtd: 2 }, { id: p['SUP-NTB-001'].id, preco: 179, qtd: 1 }, { id: p['PAD-GAM-001'].id, preco: 99, qtd: 2 }], 'pix');
  await criarVenda('2026-03-26', [{ id: p['CEL-SAM-002'].id, preco: 4299, qtd: 1 }], 'debito');
  await criarVenda('2026-03-27', [{ id: p['RAM-COR-001'].id, preco: 359, qtd: 2 }, { id: p['SSD-KNG-001'].id, preco: 299, qtd: 1 }], 'pix');
  await criarVenda('2026-03-28', [{ id: p['NTB-DELL-001'].id, preco: 4299, qtd: 1 }], 'credito');
  await criarVenda('2026-03-29', [{ id: p['MON-LG-001'].id, preco: 999, qtd: 1 }], 'pix');
  await criarVenda('2026-03-31', [{ id: p['CEL-APL-001'].id, preco: 5499, qtd: 1 }, { id: p['CASE-NTB-001'].id, preco: 89, qtd: 1 }], 'credito');

  // ── ABRIL 2026 ────────────────────────────────────────────
  console.log('Populando Abril/2026...');

  await criarCompra(fornIds[0], '2026-04-02', [
    { id: p['NTB-DELL-001'].id, custo: 2800, qtd: 4 },
    { id: p['NTB-ASUS-003'].id, custo: 5500, qtd: 3 },
    { id: p['NTB-LNV-002'].id, custo: 2200, qtd: 2 },
  ]);
  await criarCompra(fornIds[1], '2026-04-04', [
    { id: p['CEL-APL-001'].id, custo: 3800, qtd: 4 },
    { id: p['CEL-SAM-002'].id, custo: 2900, qtd: 4 },
  ]);
  await criarCompra(fornIds[2], '2026-04-08', [
    { id: p['MON-LG-001'].id, custo: 650, qtd: 3 },
    { id: p['MOU-LOG-001'].id, custo: 280, qtd: 4 },
    { id: p['TEC-HYP-001'].id, custo: 190, qtd: 1 },
    { id: p['HEAD-HYP-001'].id, custo: 240, qtd: 2 },
    { id: p['CAM-LOG-001'].id, custo: 280, qtd: 1 },
    { id: p['SSD-KNG-001'].id, custo: 180, qtd: 6 },
    { id: p['RAM-COR-001'].id, custo: 220, qtd: 3 },
    { id: p['HUB-USB-001'].id, custo: 85, qtd: 3 },
    { id: p['CAR-GAN-001'].id, custo: 65, qtd: 3 },
    { id: p['CAB-HDM-001'].id, custo: 35, qtd: 4 },
    { id: p['CASE-NTB-001'].id, custo: 45, qtd: 3 },
    { id: p['SUP-NTB-001'].id, custo: 95, qtd: 2 },
    { id: p['PAD-GAM-001'].id, custo: 55, qtd: 5 },
  ]);

  await criarDespesa('2026-04-05', 'Aluguel', 'Aluguel loja - Abril/2026', 4500);
  await criarDespesa('2026-04-05', 'Energia', 'Conta de Energia - Abril/2026', 920);
  await criarDespesa('2026-04-05', 'Internet', 'Internet Fibra 500MB - Abril/2026', 280);
  await criarDespesa('2026-04-05', 'Salários', 'Folha de Pagamento - Abril/2026', 6800);
  await criarDespesa('2026-04-10', 'Marketing', 'Anúncios Google/Meta - Abril/2026', 1500);
  await criarDespesa('2026-04-15', 'Manutenção', 'Manutenção equipamentos loja', 350);

  await criarVenda('2026-04-03', [{ id: p['NTB-DELL-001'].id, preco: 4299, qtd: 1 }], 'credito');
  await criarVenda('2026-04-04', [{ id: p['CEL-APL-001'].id, preco: 5499, qtd: 1 }], 'credito');
  await criarVenda('2026-04-05', [{ id: p['NTB-ASUS-003'].id, preco: 7999, qtd: 1 }], 'credito');
  await criarVenda('2026-04-07', [{ id: p['MON-LG-001'].id, preco: 999, qtd: 2 }], 'pix');
  await criarVenda('2026-04-08', [{ id: p['CEL-SAM-002'].id, preco: 4299, qtd: 1 }], 'debito');
  await criarVenda('2026-04-09', [{ id: p['NTB-LNV-002'].id, preco: 3499, qtd: 1 }, { id: p['SSD-KNG-001'].id, preco: 299, qtd: 1 }], 'credito');
  await criarVenda('2026-04-10', [{ id: p['MOU-LOG-001'].id, preco: 449, qtd: 2 }, { id: p['TEC-HYP-001'].id, preco: 319, qtd: 1 }, { id: p['PAD-GAM-001'].id, preco: 99, qtd: 2 }], 'pix');
  await criarVenda('2026-04-11', [{ id: p['CEL-APL-001'].id, preco: 5499, qtd: 1 }], 'credito');
  await criarVenda('2026-04-12', [{ id: p['NTB-DELL-001'].id, preco: 4299, qtd: 2 }], 'credito');
  await criarVenda('2026-04-14', [{ id: p['HEAD-HYP-001'].id, preco: 399, qtd: 2 }, { id: p['CAM-LOG-001'].id, preco: 449, qtd: 1 }], 'pix');
  await criarVenda('2026-04-15', [{ id: p['CEL-SAM-002'].id, preco: 4299, qtd: 1 }], 'pix');
  await criarVenda('2026-04-16', [{ id: p['RAM-COR-001'].id, preco: 359, qtd: 2 }, { id: p['SSD-KNG-001'].id, preco: 299, qtd: 2 }], 'debito');
  await criarVenda('2026-04-17', [{ id: p['NTB-ASUS-003'].id, preco: 7999, qtd: 1 }], 'credito');
  await criarVenda('2026-04-18', [{ id: p['HUB-USB-001'].id, preco: 149, qtd: 3 }, { id: p['CAR-GAN-001'].id, preco: 119, qtd: 3 }, { id: p['CAB-HDM-001'].id, preco: 69, qtd: 4 }], 'pix');
  await criarVenda('2026-04-19', [{ id: p['CEL-APL-001'].id, preco: 5499, qtd: 1 }], 'credito');
  await criarVenda('2026-04-21', [{ id: p['NTB-LNV-002'].id, preco: 3499, qtd: 1 }], 'debito');
  await criarVenda('2026-04-22', [{ id: p['MON-LG-001'].id, preco: 999, qtd: 1 }, { id: p['MOU-LOG-001'].id, preco: 449, qtd: 1 }], 'pix');
  await criarVenda('2026-04-23', [{ id: p['CEL-SAM-002'].id, preco: 4299, qtd: 1 }], 'credito');
  await criarVenda('2026-04-24', [{ id: p['NTB-DELL-001'].id, preco: 4299, qtd: 1 }], 'credito');
  await criarVenda('2026-04-25', [{ id: p['CASE-NTB-001'].id, preco: 89, qtd: 3 }, { id: p['SUP-NTB-001'].id, preco: 179, qtd: 2 }, { id: p['PAD-GAM-001'].id, preco: 99, qtd: 3 }], 'pix');
  await criarVenda('2026-04-26', [{ id: p['CEL-APL-001'].id, preco: 5499, qtd: 1 }], 'credito');
  await criarVenda('2026-04-28', [{ id: p['SSD-KNG-001'].id, preco: 299, qtd: 3 }, { id: p['RAM-COR-001'].id, preco: 359, qtd: 1 }], 'debito');
  await criarVenda('2026-04-29', [{ id: p['NTB-ASUS-003'].id, preco: 7999, qtd: 1 }], 'credito');
  await criarVenda('2026-04-30', [{ id: p['CEL-SAM-002'].id, preco: 4299, qtd: 1 }, { id: p['MOU-LOG-001'].id, preco: 449, qtd: 1 }], 'pix');

  // ── MAIO 2026 ─────────────────────────────────────────────
  // Target: receitas ~R$106.581 | despesas ~R$87.895 | lucro ~R$18.686
  console.log('Populando Maio/2026...');

  await criarCompra(fornIds[0], '2026-05-02', [
    { id: p['NTB-DELL-001'].id, custo: 2800, qtd: 4 },
    { id: p['NTB-LNV-002'].id, custo: 2200, qtd: 2 },
    { id: p['NTB-ASUS-003'].id, custo: 5500, qtd: 4 },
  ]);
  await criarCompra(fornIds[1], '2026-05-05', [
    { id: p['CEL-APL-001'].id, custo: 3800, qtd: 5 },
    { id: p['CEL-SAM-002'].id, custo: 2900, qtd: 3 },
  ]);
  await criarCompra(fornIds[2], '2026-05-07', [
    { id: p['MON-LG-001'].id, custo: 650, qtd: 3 },
    { id: p['MOU-LOG-001'].id, custo: 280, qtd: 3 },
    { id: p['HEAD-HYP-001'].id, custo: 240, qtd: 3 },
    { id: p['PAD-GAM-001'].id, custo: 55, qtd: 5 },
    { id: p['SSD-KNG-001'].id, custo: 180, qtd: 3 },
    { id: p['TEC-HYP-001'].id, custo: 190, qtd: 3 },
    { id: p['CAM-LOG-001'].id, custo: 280, qtd: 1 },
    { id: p['HUB-USB-001'].id, custo: 85, qtd: 2 },
    { id: p['RAM-COR-001'].id, custo: 220, qtd: 2 },
    { id: p['CAR-GAN-001'].id, custo: 65, qtd: 2 },
    { id: p['CAB-HDM-001'].id, custo: 35, qtd: 2 },
    { id: p['CASE-NTB-001'].id, custo: 45, qtd: 1 },
    { id: p['SUP-NTB-001'].id, custo: 95, qtd: 1 },
  ]);

  await criarDespesa('2026-05-05', 'Aluguel', 'Aluguel loja - Maio/2026', 4500);
  await criarDespesa('2026-05-05', 'Energia', 'Conta de Energia - Maio/2026', 890);
  await criarDespesa('2026-05-05', 'Internet', 'Internet Fibra 500MB - Maio/2026', 280);
  await criarDespesa('2026-05-05', 'Salários', 'Folha de Pagamento - Maio/2026', 6800);
  await criarDespesa('2026-05-10', 'Marketing', 'Campanha Dia das Mães - Maio/2026', 2200);
  await criarDespesa('2026-05-12', 'Manutenção', 'Troca de ar-condicionado loja', 1800);

  await criarVenda('2026-05-02', [{ id: p['NTB-DELL-001'].id, preco: 4299, qtd: 1 }], 'credito');
  await criarVenda('2026-05-03', [{ id: p['CEL-APL-001'].id, preco: 5499, qtd: 1 }], 'credito');
  await criarVenda('2026-05-04', [{ id: p['NTB-ASUS-003'].id, preco: 7999, qtd: 1 }], 'credito');
  await criarVenda('2026-05-05', [{ id: p['MOU-LOG-001'].id, preco: 449, qtd: 2 }, { id: p['HEAD-HYP-001'].id, preco: 399, qtd: 1 }, { id: p['PAD-GAM-001'].id, preco: 99, qtd: 2 }], 'pix');
  await criarVenda('2026-05-06', [{ id: p['CEL-SAM-002'].id, preco: 4299, qtd: 1 }], 'debito');
  await criarVenda('2026-05-07', [{ id: p['MON-LG-001'].id, preco: 999, qtd: 2 }], 'pix');
  await criarVenda('2026-05-08', [{ id: p['NTB-LNV-002'].id, preco: 3499, qtd: 1 }, { id: p['SSD-KNG-001'].id, preco: 299, qtd: 1 }], 'credito');
  await criarVenda('2026-05-09', [{ id: p['CEL-APL-001'].id, preco: 5499, qtd: 1 }], 'credito');
  await criarVenda('2026-05-10', [{ id: p['TEC-HYP-001'].id, preco: 319, qtd: 2 }, { id: p['CAM-LOG-001'].id, preco: 449, qtd: 1 }, { id: p['HUB-USB-001'].id, preco: 149, qtd: 2 }], 'pix');
  await criarVenda('2026-05-11', [{ id: p['NTB-DELL-001'].id, preco: 4299, qtd: 2 }], 'credito');
  await criarVenda('2026-05-12', [{ id: p['CEL-SAM-002'].id, preco: 4299, qtd: 1 }, { id: p['CASE-NTB-001'].id, preco: 89, qtd: 1 }], 'credito');
  await criarVenda('2026-05-13', [{ id: p['RAM-COR-001'].id, preco: 359, qtd: 2 }, { id: p['SSD-KNG-001'].id, preco: 299, qtd: 2 }], 'debito');
  await criarVenda('2026-05-14', [{ id: p['NTB-ASUS-003'].id, preco: 7999, qtd: 1 }], 'credito');
  await criarVenda('2026-05-15', [{ id: p['CEL-APL-001'].id, preco: 5499, qtd: 1 }], 'credito');
  await criarVenda('2026-05-16', [{ id: p['MON-LG-001'].id, preco: 999, qtd: 1 }, { id: p['MOU-LOG-001'].id, preco: 449, qtd: 1 }, { id: p['CAR-GAN-001'].id, preco: 119, qtd: 2 }, { id: p['CAB-HDM-001'].id, preco: 69, qtd: 2 }], 'pix');
  await criarVenda('2026-05-17', [{ id: p['NTB-LNV-002'].id, preco: 3499, qtd: 1 }], 'credito');
  await criarVenda('2026-05-19', [{ id: p['CEL-APL-001'].id, preco: 5499, qtd: 1 }, { id: p['SUP-NTB-001'].id, preco: 179, qtd: 1 }], 'credito');
  await criarVenda('2026-05-20', [{ id: p['NTB-DELL-001'].id, preco: 4299, qtd: 1 }], 'credito');
  await criarVenda('2026-05-21', [{ id: p['CEL-SAM-002'].id, preco: 4299, qtd: 1 }], 'pix');
  await criarVenda('2026-05-22', [{ id: p['HEAD-HYP-001'].id, preco: 399, qtd: 2 }, { id: p['TEC-HYP-001'].id, preco: 319, qtd: 1 }, { id: p['PAD-GAM-001'].id, preco: 99, qtd: 3 }], 'debito');
  await criarVenda('2026-05-23', [{ id: p['NTB-ASUS-003'].id, preco: 7999, qtd: 1 }], 'credito');
  await criarVenda('2026-05-24', [{ id: p['NTB-ASUS-003'].id, preco: 7999, qtd: 1 }], 'credito');
  await criarVenda('2026-05-24', [{ id: p['CEL-APL-001'].id, preco: 5499, qtd: 1 }], 'credito');

  // ── Resumo ────────────────────────────────────────────────
  const meses = ['2026-03', '2026-04', '2026-05'];
  console.log('\n=== RESUMO FINANCEIRO ===');
  for (const mes of meses) {
    const [rec] = await all("SELECT COALESCE(SUM(valor),0) AS t FROM movimentos_financeiros WHERE tipo='receita' AND data LIKE ?", [mes + '%']);
    const [dep] = await all("SELECT COALESCE(SUM(valor),0) AS t FROM movimentos_financeiros WHERE tipo='despesa' AND data LIKE ?", [mes + '%']);
    const lucro = rec.t - dep.t;
    console.log(`${mes} | Receitas: R$${rec.t.toFixed(2).padStart(10)} | Despesas: R$${dep.t.toFixed(2).padStart(10)} | Lucro: R$${lucro.toFixed(2)}`);
  }

  console.log('\nSeed concluido!');
  db.close();
}

seed().catch(err => {
  console.error('ERRO:', err.message);
  db.close();
  process.exit(1);
});
