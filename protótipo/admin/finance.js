import { escape as e, money, price, readStore, storageKey } from '../js/store.js';
import { buildReport, exportRows, rankProducts, shortDate, units } from './finance-report.js';

const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' });
const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function renderFinance({ content, heading, panel, field, persist, confirmAction }) {
  const { products } = readStore();
  content.innerHTML = `<div class="finance-report">
    ${heading('Relatórios de vendas', 'Acompanhe os resultados da sua loja por período.', `<div class="actions report-actions">
      <label class="field"><span class="sr-only">Período</span><select id="report-period">
        <option value="7">Últimos 7 dias</option><option value="14">Últimos 14 dias</option><option value="30">Últimos 30 dias</option>
      </select></label><button class="button primary" type="button" id="export-sales">Exportar CSV</button>
    </div>`)}
    <p class="report-range muted" id="report-range"></p>
    <section class="stats finance-stats" id="sales-metrics" aria-label="Resumo de vendas"></section>
    <div class="report-grid">
      <section class="panel"><div class="panel-heading"><div><h2>Vendas por período</h2><p>Selecione uma barra para filtrar o ranking.</p></div><span class="report-unit">Receita · R$</span></div>
        <div class="report-chart" id="sales-chart" role="group" aria-label="Receita por intervalo"></div>
        <p id="chart-reading" class="report-reading" role="status"></p>
      </section>
      <section class="panel"><div class="panel-heading"><div><h2>Produtos mais vendidos</h2><p id="ranking-period">Unidades vendidas no período</p></div><button class="button compact" id="clear-chart-filter" type="button" hidden>Ver período todo</button></div><div id="sales-ranking"></div></section>
    </div>
    <section class="panel report-summary"><div class="panel-heading"><h2>Resumo operacional</h2></div><dl id="sales-summary"></dl></section>
    <details class="panel report-records"><summary>Registros de vendas</summary><div class="stack report-record-body">
      ${panel('Registrar venda', products.length ? `<form class="stack" id="sale-form">
        <div class="field-grid finance-form">
          <label class="field">Produto<select name="product" required><option value="">Selecione um produto</option>
            ${products.map(item => `<option value="${e(item.id)}">${e(item.name)} · ${e(item.sku)}</option>`).join('')}
          </select></label>
          ${field('Quantidade', 'quantity', 1, 'required type="number" min="1" step="1"')}
          ${field('Preço unitário (R$)', 'unitPrice', '', 'required type="number" min="0" step="0.01"')}
        </div>
        <p class="form-error" id="sale-error" role="alert" hidden></p>
        <div class="actions"><button class="button primary" type="submit">Registrar venda</button></div>
      </form>` : '<p>Cadastre um produto antes de registrar uma venda.</p><a class="button" href="#products/new">Novo produto</a>')}
      <section class="panel"><div class="panel-heading"><h2>Histórico do período</h2></div><div id="sales-history"></div></section>
    </div></details></div>`;
  const metrics = content.querySelector('#sales-metrics');
  const history = content.querySelector('#sales-history');
  const form = content.querySelector('#sale-form');

  const period = content.querySelector('#report-period');
  const chart = content.querySelector('#sales-chart');
  const reading = content.querySelector('#chart-reading');
  const ranking = content.querySelector('#sales-ranking');
  const clearFilter = content.querySelector('#clear-chart-filter');
  const exportButton = content.querySelector('#export-sales');
  let selectedSlot = null;
  let report;

  function comparison(value, previous) {
    if (!previous) return '<small class="muted">Sem base de comparação</small>';
    const change = (value - previous) / previous;
    return `<small class="${change > 0 ? 'report-up' : change < 0 ? 'report-down' : 'muted'}">${percent.format(change)} vs. período anterior</small>`;
  }

  function slotLabel(slot) {
    const last = new Date(slot.end);
    last.setDate(last.getDate() - 1);
    return Number(slot.start) === Number(last) ? shortDate.format(slot.start) : `${shortDate.format(slot.start)}–${shortDate.format(last)}`;
  }

  function updateRanking() {
    const slot = report.slots[selectedSlot] || null;
    const sales = slot ? slot.sales : report.sales;
    const best = rankProducts(sales, readStore().products).slice(0, 6);
    clearFilter.hidden = !slot;
    content.querySelector('#ranking-period').textContent = slot ? `Unidades vendidas · ${slotLabel(slot)}` : 'Unidades vendidas no período';
    ranking.innerHTML = best.length ? `<ol class="report-ranking">${best.map(item => `<li>
      <div><strong>${e(item.name)}</strong><span>${units(item.units)} un.</span></div>
      <div class="report-progress" aria-hidden="true"><span style="width:${100 * item.units / best[0].units}%"></span></div>
    </li>`).join('')}</ol>` : '<p class="empty">Nenhuma venda neste intervalo.</p>';
    chart.querySelectorAll('[data-slot]').forEach((button, index) => button.setAttribute('aria-pressed', String(index === selectedSlot)));
    reading.textContent = slot
      ? `${slotLabel(slot)} · ${money.format(slot.summary.revenue / 100)} · ${units(slot.summary.units)} un.`
      : report.sales.length ? `Receita do período: ${money.format(report.current.revenue / 100)}` : 'Nenhuma venda registrada no período.';
  }

  function updateSummary(allSales) {
    report = buildReport(allSales, Number(period.value));
    const { current, previous, slots, sales } = report;
    content.querySelector('#report-range').textContent = `${shortDate.format(report.start)} a ${shortDate.format(report.end)} · comparação com o período anterior de mesma duração`;
    exportButton.disabled = !sales.length;
    metrics.innerHTML = [
      ['Faturamento', money.format(current.revenue / 100), current.revenue, previous.revenue],
      ['Vendas registradas', units(current.transactions), current.transactions, previous.transactions],
      ['Ticket médio', money.format(current.average / 100), current.average, previous.average],
      ['Unidades vendidas', units(current.units), current.units, previous.units]
    ].map(([label, value, currentValue, previousValue]) => `<article class="metric"><div class="metric-title">${label}</div><strong>${value}</strong>${comparison(currentValue, previousValue)}</article>`).join('');
    const maximum = Math.max(1, ...slots.map(slot => slot.summary.revenue));
    chart.style.setProperty('--chart-slots', slots.length);
    chart.innerHTML = slots.map((slot, index) => `<button type="button" class="report-bar" data-slot="${index}" aria-label="${slotLabel(slot)}, ${money.format(slot.summary.revenue / 100)}" aria-pressed="false">
      <span class="report-bar-track"><span class="report-bar-fill${slot.summary.revenue ? '' : ' is-zero'}" style="--bar-size:${100 * slot.summary.revenue / maximum}%"></span></span>
      <span class="report-bar-label">${slots.length === 7 ? weekday.format(slot.start) : slots.length === 14 ? slot.start.getDate() : slotLabel(slot)}</span>
    </button>`).join('');
    const rankingAll = rankProducts(sales, readStore().products);
    content.querySelector('#sales-summary').innerHTML = [
      ['Produtos distintos vendidos', units(rankingAll.length)],
      ['Unidades por venda', current.transactions ? (current.units / current.transactions).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0'],
      ['Melhor intervalo', current.revenue ? slotLabel(slots.reduce((best, slot) => slot.summary.revenue > best.summary.revenue ? slot : best)) : '—'],
      ['Receita no período anterior', money.format(previous.revenue / 100)]
    ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
    updateRanking();
    history.innerHTML = sales.length
      ? `<ul class="list">${[...sales].reverse().map(sale => `<li class="finance-entry">
        <div><strong>${e(sale.productName)}</strong><small>${date.format(new Date(sale.createdAt))} · ${sale.quantity} un. × ${money.format(sale.unitCents / 100)}</small></div>
        <strong>${money.format(sale.quantity * sale.unitCents / 100)}</strong>
        <button class="button compact" type="button" data-sale="${e(sale.id)}" aria-label="Remover registro de ${e(sale.productName)}">Remover</button>
      </li>`).join('')}</ul>`
      : '<p class="empty">Nenhuma venda registrada.</p>';
  }

  if (form) {
    const error = form.querySelector('#sale-error');
    form.elements.product.addEventListener('change', () => {
      const product = readStore().products.find(item => item.id === form.elements.product.value);
      form.elements.unitPrice.value = product ? price(product).toFixed(2) : '';
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      error.hidden = true;
      const quantity = form.elements.quantity.valueAsNumber;
      const unitCents = Math.round(form.elements.unitPrice.valueAsNumber * 100);
      if (!Number.isSafeInteger(quantity) || quantity < 1 || !Number.isSafeInteger(unitCents) ||
        unitCents < 0 || !Number.isSafeInteger(quantity * unitCents)) {
        error.textContent = 'Informe uma quantidade inteira positiva e um preço válido.';
        error.hidden = false;
        return;
      }
      const next = persist(state => {
        const product = state.products.find(item => item.id === form.elements.product.value);
        if (!product) throw new Error('Este produto não está mais cadastrado.');
        state.sales.push({
          id: globalThis.crypto?.randomUUID?.() ?? `venda-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          productId: product.id, productName: product.name, quantity, unitCents, createdAt: new Date().toISOString()
        });
        return state;
      }, 'Venda registrada.');
      if (!next) return;
      form.reset();
      updateSummary(next.sales);
    });
  }

  history.addEventListener('click', async event => {
    const button = event.target.closest('[data-sale]');
    if (!button) return;
    const sale = readStore().sales.find(item => item.id === button.dataset.sale);
    if (!sale || !await confirmAction('Remover registro de venda?', `${sale.productName} · ${sale.quantity} un. serão retiradas do resumo de vendas.`, 'Remover registro')) return;
    const next = persist(state => ({ ...state, sales: state.sales.filter(item => item.id !== sale.id) }), 'Registro removido.');
    if (next) {
      updateSummary(next.sales);
      (history.querySelector('button') || form?.elements.product || content).focus({ preventScroll: true });
    }
  });
  period.addEventListener('change', () => {
    selectedSlot = null;
    updateSummary(readStore().sales);
  });
  chart.addEventListener('click', event => {
    const button = event.target.closest('[data-slot]');
    if (!button) return;
    const index = Number(button.dataset.slot);
    selectedSlot = selectedSlot === index ? null : index;
    updateRanking();
  });
  clearFilter.addEventListener('click', () => {
    const previous = chart.querySelector('[aria-pressed="true"]');
    selectedSlot = null;
    updateRanking();
    previous?.focus();
  });
  exportButton.addEventListener('click', () => {
    const blob = new Blob(['\ufeff', exportRows(report.sales)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vitraflow-vendas.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  function refreshFromStorage(event) {
    if (event.key === storageKey || event.key === null) updateSummary(readStore().sales);
  }
  window.addEventListener('storage', refreshFromStorage);
  updateSummary(readStore().sales);
  return () => window.removeEventListener('storage', refreshFromStorage);
}
