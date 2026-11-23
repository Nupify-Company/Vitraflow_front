const number = new Intl.NumberFormat('pt-BR');
export const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
export const units = value => number.format(value);

function dayAtOffset(today, offset) {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
}

export function summarize(sales) {
  const totals = sales.reduce((result, sale) => {
    result.units += sale.quantity;
    result.revenue += sale.unitCents * sale.quantity;
    return result;
  }, { units: 0, revenue: 0 });
  return { ...totals, transactions: sales.length, average: sales.length ? totals.revenue / sales.length : 0 };
}

export function buildReport(sales, days, today = new Date()) {
  const start = dayAtOffset(today, 1 - days);
  const end = dayAtOffset(today, 1);
  const previousStart = dayAtOffset(today, 1 - days * 2);
  const slots = [];
  const step = days === 30 ? 5 : 1;
  for (let offset = 1 - days; offset <= 0; offset += step) {
    slots.push({ start: dayAtOffset(today, offset), end: dayAtOffset(today, Math.min(1, offset + step)), sales: [] });
  }

  const previous = [];
  for (const sale of sales) {
    const time = new Date(sale.createdAt);
    if (time < start && time >= previousStart) previous.push(sale);
    else if (time >= start && time < end) slots.find(slot => time >= slot.start && time < slot.end).sales.push(sale);
  }
  const current = slots.flatMap(slot => slot.sales);
  return {
    start, end: dayAtOffset(today, 0), sales: current,
    current: summarize(current), previous: summarize(previous),
    slots: slots.map(slot => ({ ...slot, summary: summarize(slot.sales) }))
  };
}

export function rankProducts(sales, products) {
  const catalog = new Map(products.map(product => [product.id, product.name]));
  const idsByName = new Map(products.map(product => [product.name, product.id]));
  const totals = new Map();
  for (const sale of sales) {
    const id = sale.productId || idsByName.get(sale.productName);
    const key = id ? `id:${id}` : `nome:${sale.productName}`;
    const total = totals.get(key) || { name: catalog.get(id) || sale.productName, units: 0 };
    total.units += sale.quantity;
    totals.set(key, total);
  }
  return [...totals.values()].sort((a, b) => b.units - a.units || a.name.localeCompare(b.name, 'pt-BR'));
}

function csvCell(value) {
  const text = String(value);
  const safe = /^\s*[=+\-@]|^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function exportRows(sales) {
  return [
    ['Data', 'Produto', 'Quantidade', 'Preço unitário (R$)', 'Total (R$)'],
    ...sales.map(sale => [
      new Date(sale.createdAt).toLocaleString('pt-BR'), sale.productName, sale.quantity,
      (sale.unitCents / 100).toFixed(2).replace('.', ','),
      (sale.unitCents * sale.quantity / 100).toFixed(2).replace('.', ',')
    ])
  ].map(row => row.map(csvCell).join(';')).join('\r\n');
}
