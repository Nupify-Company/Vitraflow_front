import { audiences, brands, categories } from '../js/mock-data.js';
import { defaults, escape as e, imageURL, isLow, money, normalize, price, primaryImage, productError, readStore, stockAlerts, storageKey, total, writeStore } from '../js/store.js';
import { photo, priceLabel } from '../js/shop-view.js';
import { renderAppearance } from './appearance.js';
import { localThumbnail } from './image-upload.js';
import { renderFinance } from './finance.js';
import { isSignedOut, signOut } from './demo-session.js';

const content = document.querySelector('#content');
const nav = document.querySelector('#navigation');
const dialog = document.querySelector('#confirmation');
const notice = document.querySelector('#notice');
const notifications = document.querySelector('#header-notifications');
const notificationToggle = document.querySelector('#notification-toggle');
const profileLink = document.querySelector('#profile-link');
let toastTimer;
let route = '';
let hasDraft = () => false;
let disposePage;

const icons = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  products: '<path d="M4 8l8-5 8 5v9l-8 4-8-4zM4 8l8 5 8-5M12 13v8M8 5.5l8 5"/>',
  finance: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01m12 0h.01"/>',
  stock: '<path d="M3 3v18h18M8 16v-4m5 4V8m5 8V5"/>',
  appearance: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18m-12 0v11"/>',
  settings: '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="2" fill="white"/><circle cx="15" cy="12" r="2" fill="white"/><circle cx="10" cy="17" r="2" fill="white"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  hidden: '<path d="M3 3l18 18M10 10a3 3 0 0 0 4 4M7 7c-3 2-4 5-4 5s3 6 9 6c1 0 3 0 5-1m3-3 1-2s-3-6-9-6h-2"/>',
  alert: '<path d="M10 4 3 17a2 2 0 0 0 2 3h14a2 2 0 0 0 2-3L14 4a2 2 0 0 0-4 0Z M12 9v4m0 3h.01"/>',
  shop: '<path d="M4 10h16v10H4zM3 10l2-6h14l2 6M9 20v-6h6v6"/>',
  next: '<path d="m9 6 6 6-6 6"/>'
};
const pages = { overview: 'Visão geral', products: 'Produtos', stock: 'Estoque', finance: 'Financeiro', appearance: 'Aparência da vitrine', settings: 'Configurações' };
const pageTitles = { ...pages, profile: 'Meu perfil' };
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const status = product => `<span class="badge ${product.active ? 'active' : ''}">${product.active ? 'Ativo' : 'Oculto'}</span>`;
const thumb = product => `<span class="thumb">${photo(primaryImage(product))}</span>`;
const heading = (title, description, actions = '') => `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div>${actions}</div>`;
const newProduct = `<a class="button primary" href="#products/new">${icon('plus')} Novo produto</a>`;
const recent = products => [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

function notify(message) {
  clearTimeout(toastTimer);
  notice.hidden = false;
  notice.textContent = message;
  toastTimer = setTimeout(() => { notice.hidden = true; }, 5000);
}

async function confirmAction(title, copy, label) {
  if (dialog.open) return false;
  dialog.querySelector('#confirmation-title').textContent = title;
  dialog.querySelector('#confirmation-copy').textContent = copy;
  dialog.querySelector('#confirmation-action').textContent = label;
  dialog.returnValue = '';
  dialog.showModal();
  await new Promise(resolve => dialog.addEventListener('close', resolve, { once: true }));
  return dialog.returnValue === 'confirm';
}

function persist(update, message) {
  try {
    const state = writeStore(update);
    updateHeader(state);
    if (message) notify(message);
    return state;
  } catch (error) {
    const messages = {
      QuotaExceededError: 'O armazenamento está cheio. Reduza o número de imagens locais.',
      SecurityError: 'O navegador bloqueou o armazenamento local. Abra o painel pelo servidor estático.'
    };
    notify(messages[error.name] || error.message || 'Não foi possível salvar neste navegador.');
    return null;
  }
}

function overview(state) {
  const { products, threshold } = state;
  const low = products.filter(product => isLow(product, threshold));
  const visibleAlerts = low.slice(0, 6);
  const active = products.filter(product => product.active).length;
  const metrics = [
    ['products', 'Produtos cadastrados', products.length, 'No catálogo administrativo'],
    ['check', 'Produtos ativos', active, 'Visíveis na vitrine'],
    ['hidden', 'Produtos ocultos', products.length - active, 'Fora da vitrine'],
    ['alert', 'Estoque baixo', low.length, `Até ${threshold} un. por numeração`]
  ];
  const shortcuts = [
    ['plus', 'Cadastrar produto', '#products/new'], ['stock', 'Gerenciar estoque', '#stock'],
    ['appearance', 'Personalizar vitrine', '#appearance'], ['shop', 'Visualizar vitrine', '../index.html']
  ];
  content.innerHTML = `${heading('Visão geral', 'Acompanhe seu catálogo e organize a operação da sua vitrine.', newProduct)}
    <section class="stats" aria-label="Indicadores do catálogo">${metrics.map(([key, label, value, detail]) => `<article class="metric"><div class="metric-title"><span class="tile-icon">${icon(key)}</span>${label}</div><strong>${value}</strong><small class="muted">${detail}</small></article>`).join('')}</section>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-heading"><div><h2>Produtos recentes</h2><p>Últimos itens adicionados ao catálogo.</p></div><a class="button compact" href="#products">Ver produtos</a></div>
      ${products.length ? `<ul class="list">${recent(products).slice(0, 6).map(product => `<li>${thumb(product)}<div><a href="#products/${encodeURIComponent(product.id)}"><strong>${e(product.name)}</strong></a><small>${e(product.brand)} · ${e(product.sku)}</small></div><div class="right">${status(product)}</div></li>`).join('')}</ul>` : '<p class="empty">Cadastre seu primeiro produto para começar.</p>'}</section>
      <section class="panel dashboard-alerts" aria-labelledby="stock-alert-title">
        <div class="panel-heading">
          <div><h2 id="stock-alert-title">Alertas de estoque</h2><p>Até ${threshold} un. por numeração</p></div>
          <a class="button compact" href="#stock">Ver estoque</a>
        </div>
        ${low.length ? `<ul class="list stock-alert-list">${visibleAlerts.map(product => {
          const sizes = product.variants.filter(item => item.quantity <= threshold);
          return `<li><span class="tile-icon">${icon('alert')}</span><div>
            <strong>${e(product.name)}</strong>
            <div class="stock-alert-sizes">${sizes.length ? sizes.map(item =>
              `<span class="badge ${item.quantity ? 'warning' : 'out'}">${e(item.size)} · ${item.quantity ? `${item.quantity} un.` : 'esgotado'}</span>`
            ).join('') : '<span class="badge warning">Sem numerações cadastradas</span>'}</div>
          </div></li>`;
        }).join('')}</ul>${low.length > visibleAlerts.length ? `<p class="stock-alert-overflow muted">Mostrando ${visibleAlerts.length} de ${low.length} produtos com alerta.</p>` : ''}`
          : '<p class="empty">Nenhum alerta de estoque.</p>'}
      </section>
    </div>
    <section class="panel dashboard-shortcuts" aria-labelledby="quick-title">
      <div class="panel-heading"><h2 id="quick-title">Ações rápidas</h2></div>
      <ul class="dashboard-shortcut-grid">${shortcuts.map(([key, label, href]) => `<li><a href="${href}"><span class="tile-icon">${icon(key)}</span><span>${label}</span></a></li>`).join('')}</ul>
    </section>`;
}

function productsPage() {
  const state = readStore();
  const allBrands = [...new Set([...brands, ...state.products.map(product => product.brand)])].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  content.innerHTML = `${heading('Produtos', 'Cadastre, edite e controle quais produtos aparecem na vitrine.', newProduct)}
    <section class="panel" aria-label="Catálogo administrativo"><form class="filters" id="filters">
      <label class="field">Pesquisar<input name="query" type="search" placeholder="Nome do produto"></label>
      <button type="button" class="button filter-toggle" aria-controls="advanced-filters" aria-expanded="false">Filtros</button>
      <div id="advanced-filters" class="advanced-filters">
      <label class="field">Marca<select name="brand"><option value="">Todas</option>${allBrands.map(brand => `<option>${e(brand)}</option>`).join('')}</select></label>
      <label class="field">Status<select name="status"><option value="">Todos</option><option value="active">Ativo</option><option value="hidden">Oculto</option></select></label>
      <label class="field">Ordenar por<select name="order"><option value="recent">Mais recentes</option><option value="old">Mais antigos</option><option value="asc">Menor preço</option><option value="desc">Maior preço</option></select></label>
      </div>
    </form><p class="sr-only" id="product-count" role="status"></p><div id="results"></div></section>`;
  const filters = content.querySelector('#filters');
  const results = content.querySelector('#results');
  function refresh() {
    const fields = new FormData(filters);
    const query = normalize(fields.get('query'));
    const brand = fields.get('brand');
    const selectedStatus = fields.get('status');
    const products = recent(readStore().products).filter(product =>
      normalize(product.name).includes(query) && (!brand || product.brand === brand) &&
      (!selectedStatus || product.active === (selectedStatus === 'active')));
    const order = fields.get('order');
    if (order === 'old') products.reverse();
    if (order === 'asc' || order === 'desc') products.sort((a, b) => (price(a) - price(b)) * (order === 'asc' ? 1 : -1));
    content.querySelector('#product-count').textContent = `${products.length} produtos encontrados.`;
    results.innerHTML = products.length ? `<table><thead><tr>${['Produto', 'Marca', 'Tipo de produto', 'Preço', 'Estoque', 'Status', 'Ações'].map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>
      ${products.map(product => `<tr><td><div class="table-product">${thumb(product)}<div><strong title="${e(product.name)}">${e(product.name)}</strong><small class="muted">${e(product.sku)}</small></div></div></td>
        <td data-label="Marca">${e(product.brand)}</td><td data-label="Tipo de produto">${e(product.category)}</td><td data-label="Preço"><span>${priceLabel(product)}</span></td>
        <td data-label="Estoque">${total(product)}</td><td data-label="Status">${status(product)}</td><td data-label="Ações"><div class="actions">
        <a class="button compact" href="#products/${encodeURIComponent(product.id)}">Editar<span class="sr-only"> ${e(product.name)}</span></a>
        <button class="button compact" data-id="${e(product.id)}" data-product-action="toggle">${product.active ? 'Ocultar' : 'Reativar'}<span class="sr-only"> ${e(product.name)}</span></button>
        <button class="button compact danger" data-id="${e(product.id)}" data-product-action="delete">Excluir<span class="sr-only"> ${e(product.name)}</span></button></div></td></tr>`).join('')}</tbody></table>` : '<p class="empty">Nenhum produto encontrado.</p>';
  }
  const filterToggle = filters.querySelector('.filter-toggle');
  filterToggle.addEventListener('click', () => {
    const expanded = filterToggle.getAttribute('aria-expanded') === 'true';
    filterToggle.setAttribute('aria-expanded', String(!expanded));
  });
  filters.addEventListener('input', refresh);
  filters.addEventListener('submit', event => event.preventDefault());
  results.addEventListener('click', async event => {
    const button = event.target.closest('[data-product-action]');
    if (!button) return;
    const product = readStore().products.find(item => item.id === button.dataset.id);
    if (!product) return refresh();
    const remove = button.dataset.productAction === 'delete';
    if (remove && !await confirmAction('Excluir produto?', `${product.name} será removido do painel e do catálogo. Use Ocultar para retirá-lo temporariamente da vitrine.`, 'Excluir produto')) return;
    if (persist(state => {
      state.products = remove ? state.products.filter(item => item.id !== product.id) :
        state.products.map(item => item.id === product.id ? { ...item, active: !item.active } : item);
      state.productsChanged = true;
      return state;
    }, remove ? 'Produto excluído.' : product.active ? 'Produto ocultado.' : 'Produto reativado.')) {
      refresh();
      const action = [...results.querySelectorAll('[data-product-action]')].find(item => item.dataset.id === product.id);
      (action || filters.elements.query).focus({ preventScroll: true });
    }
  });
  refresh();
}

const field = (label, name, value = '', attrs = '', classes = '') =>
  `<label class="field ${classes}">${label}<input name="${name}" value="${e(value)}" ${attrs}></label>`;
const checked = (name, label, value) =>
  `<label class="check"><input type="checkbox" name="${name}" ${value ? 'checked' : ''}>${label}</label>`;
const panel = (title, body, detail = '') =>
  `<section class="panel"><div class="panel-heading"><div><h2>${title}</h2>${detail ? `<p>${detail}</p>` : ''}</div></div><div class="panel-body">${body}</div></section>`;

function productForm(id) {
  const state = readStore();
  const existing = state.products.find(item => item.id === id);
  if (id && !existing) {
    content.innerHTML = heading('Produto indisponível', 'Este produto não está mais cadastrado.', '<a class="button" href="#products">Voltar aos produtos</a>');
    return;
  }
  const product = existing || { name: '', brand: '', category: 'Tênis', audience: 'Unissex', sku: '', description: '', price: '', promo: null, variants: [], images: [], active: true };
  const productTypes = categories.includes(product.category) ? categories : [...categories, product.category];
  const images = [...product.images];
  const editGroups = { basic: 'Dados', images: 'Imagens', stock: 'Estoque', display: 'Vitrine' };
  const editSection = (key, body) => existing
    ? `<div id="product-${key}" ${key === 'basic' ? '' : 'hidden'}>${body}</div>` : body;
  content.innerHTML = `${heading(existing ? 'Editar produto' : 'Novo produto', existing ? e(existing.name) : 'Preencha os dados para adicionar um item ao catálogo.', '<a class="button" href="#products">Voltar aos produtos</a>')}
    <form class="form-layout${existing ? ' product-edit' : ''}" id="product-form" novalidate>
    ${existing ? `<div class="editor-groups" role="group" aria-label="Seções da edição">
      ${Object.entries(editGroups).map(([key, label]) => `<button class="button" type="button" data-edit-group="${key}" aria-controls="product-${key}" aria-pressed="${key === 'basic'}">${label}</button>`).join('')}
    </div>` : ''}
    ${editSection('basic', panel('Informações básicas', `<div class="field-grid">
      ${field('Nome do produto', 'name', product.name, 'required maxlength="120"')}
      ${field('Marca', 'brand', product.brand, 'required list="brand-options" maxlength="60"')}
      <datalist id="brand-options">${[...new Set([...brands, ...state.products.map(item => item.brand)])].map(brand => `<option value="${e(brand)}"></option>`).join('')}</datalist>
      <label class="field">Público-alvo<select name="audience" required>${audiences.map(audience =>
        `<option${audience === product.audience ? ' selected' : ''}>${e(audience)}</option>`).join('')}</select></label>
      <label class="field">Tipo de produto<select name="category" required>${productTypes.map(category =>
        `<option${category === product.category ? ' selected' : ''}>${e(category)}</option>`).join('')}</select></label>
      ${field('Código / SKU', 'sku', product.sku, 'required maxlength="60"')}
      ${field('Preço em R$', 'price', product.price, 'required type="number" min="0" step="0.01"')}
      ${field('Preço promocional em R$ (opcional)', 'promo', product.promo ?? '', 'type="number" min="0" step="0.01"')}
      <label class="field full">Descrição<textarea name="description" rows="3" maxlength="1500">${e(product.description)}</textarea></label>
    </div>`))}
    ${editSection('images', panel('Imagens', `<div class="stack"><div id="images" class="image-grid"></div>
      <label class="field">Selecionar imagens locais<input type="file" name="files" multiple accept="image/png,image/jpeg,image/webp,image/avif,image/gif"></label>
      <div class="actions">${field('Endereço da imagem (URL)', 'image-url', '', 'placeholder="https://…"')}<button class="button" type="button" id="add-image">Adicionar URL</button></div>
      <p class="muted"><small>Até seis imagens. O navegador salva apenas versões reduzidas das imagens locais. O armazenamento definitivo será implementado futuramente.</small></p>
      <p class="form-error" role="alert" id="image-error" hidden></p>
    </div>`))}
    ${editSection('stock', panel('Estoque e numerações', '<div class="stack"><div id="variants" class="stack"></div><div class="actions"><button class="button" type="button" id="add-variant">Adicionar numeração</button><strong id="variant-total" aria-live="polite"></strong></div></div>'))}
    ${editSection('display', panel('Organização na vitrine', `<div class="field-grid">${checked('active', 'Produto ativo', product.active)}${checked('featured', 'Destaque', product.featured)}${checked('bestseller', 'Mais vendido', product.bestseller)}${checked('launch', 'Lançamento', product.launch)}</div>`, 'Desmarque Produto ativo para ocultar o item na vitrine.'))}
    <div class="product-save"><p class="form-error" role="alert" id="form-error" hidden></p>
    <div class="actions"><button class="button primary" type="submit">Salvar produto</button><a class="button" href="#products">Cancelar</a></div></div></form>`;
  const form = content.querySelector('form');
  const groupButtons = [...form.querySelectorAll('[data-edit-group]')];
  function selectEditGroup(key) {
    groupButtons.forEach(button => {
      const active = button.dataset.editGroup === key;
      button.setAttribute('aria-pressed', String(active));
      form.querySelector(`#product-${button.dataset.editGroup}`).hidden = !active;
    });
  }
  groupButtons.forEach(button => button.addEventListener('click', () => selectEditGroup(button.dataset.editGroup)));
  const variants = form.querySelector('#variants');
  const fileInput = form.elements.files;
  const imageError = form.querySelector('#image-error');
  const imageGrid = form.querySelector('#images');
  const showImageError = message => {
    imageError.hidden = !message;
    imageError.textContent = message;
  };
  function renderImages() {
    imageGrid.innerHTML = images.map((image, index) => `<div class="image-option"><div class="thumb">${photo(image, `Imagem ${index + 1}`)}</div>
      <label class="check"><input type="radio" name="primary" value="${index}" ${index === 0 ? 'checked' : ''}>Principal</label>
      <button type="button" class="button compact" data-image-index="${index}" aria-label="Remover imagem ${index + 1}">Remover</button></div>`).join('');
  }
  renderImages();
  imageGrid.addEventListener('change', event => {
    if (event.target.name !== 'primary') return;
    images.unshift(...images.splice(Number(event.target.value), 1));
    renderImages();
    imageGrid.querySelector('input:checked')?.focus();
  });
  imageGrid.addEventListener('click', event => {
    const button = event.target.closest('[data-image-index]');
    if (!button) return;
    images.splice(Number(button.dataset.imageIndex), 1);
    renderImages();
    (imageGrid.querySelector('button') || fileInput).focus();
  });
  form.querySelector('#add-image').addEventListener('click', () => {
    const input = form.elements['image-url'];
    const value = input.value.trim();
    if (!/^https?:\/\//i.test(value) || !imageURL(value)) return showImageError('Informe uma URL de imagem válida, iniciada por http:// ou https://.');
    if (images.length >= 6) return showImageError('O limite é de seis imagens por produto.');
    images.push({ src: value });
    input.value = '';
    showImageError('');
    renderImages();
  });
  fileInput.addEventListener('change', async () => {
    const files = [...fileInput.files];
    fileInput.value = '';
    showImageError('');
    if (files.length + images.length > 6) return showImageError('O limite é de seis imagens por produto.');
    fileInput.disabled = true;
    const save = form.querySelector('[type="submit"]');
    save.disabled = true;
    try {
      const imported = await Promise.all(files.map(localThumbnail));
      if (images.length + imported.length > 6) throw new Error('O limite é de seis imagens por produto.');
      images.push(...imported);
      renderImages();
    } catch (error) {
      showImageError(error.message || 'Não foi possível ler as imagens selecionadas.');
    } finally {
      fileInput.disabled = false;
      save.disabled = false;
    }
  });
  function addVariant(size = '', quantity = 0) {
    variants.insertAdjacentHTML('beforeend', `<div class="variant">
      ${field('Numeração', 'size', size, 'maxlength="12"')}
      ${field('Quantidade', 'quantity', quantity, 'type="number" min="0" step="1"')}
      <button type="button" class="button" data-remove-variant>Remover</button></div>`);
  }
  function values() {
    return [...variants.children].map(row => ({
      size: row.querySelector('[name="size"]').value.trim(),
      quantity: row.querySelector('[name="quantity"]').valueAsNumber
    }));
  }
  function refreshTotal() {
    const valid = values().filter(item => Number.isSafeInteger(item.quantity) && item.quantity >= 0);
    form.querySelector('#variant-total').textContent = `Estoque total: ${total({ variants: valid })} un.`;
  }
  product.variants.forEach(item => addVariant(item.size, item.quantity));
  refreshTotal();
  form.querySelector('#add-variant').addEventListener('click', () => {
    addVariant();
    variants.lastElementChild.querySelector('input').focus();
    refreshTotal();
  });
  variants.addEventListener('input', refreshTotal);
  variants.addEventListener('click', event => {
    if (!event.target.closest('[data-remove-variant]')) return;
    const row = event.target.closest('.variant');
    const next = row.nextElementSibling || row.previousElementSibling;
    row.remove();
    (next?.querySelector('input') || form.querySelector('#add-variant')).focus();
    refreshTotal();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const next = {
      id: existing?.id || (globalThis.crypto?.randomUUID?.() ?? `produto-${Date.now()}-${Math.random().toString(36).slice(2)}`), createdAt: existing?.createdAt || new Date().toISOString(),
      ...Object.fromEntries(['name', 'brand', 'audience', 'category', 'sku', 'description'].map(key => [key, data.get(key).trim()])),
      ...Object.fromEntries(['active', 'featured', 'bestseller', 'launch'].map(key => [key, data.has(key)])),
      price: form.elements.price.valueAsNumber, promo: form.elements.promo.value === '' && !form.elements.promo.validity.badInput ? null : form.elements.promo.valueAsNumber,
      images, variants: values()
    };
    const products = readStore().products;
    const basicError = productError({ ...next, variants: [] }, products) ||
      (!audiences.includes(next.audience) ? 'Selecione o público-alvo.' : '') ||
      (!productTypes.includes(next.category) ? 'Selecione o tipo de produto.' : '') ||
      (form.elements.price.validity.stepMismatch || form.elements.promo.validity.stepMismatch ? 'Use até duas casas decimais nos preços.' : '');
    const error = basicError || productError(next, products);
    const feedback = form.querySelector('#form-error');
    feedback.hidden = !error;
    feedback.textContent = error;
    if (error) {
      selectEditGroup(basicError ? 'basic' : 'stock');
      feedback.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (persist(store => {
      if (existing && !store.products.some(item => item.id === next.id)) throw new Error('Este produto foi excluído. Volte à listagem.');
      const latestError = productError(next, store.products);
      if (latestError) throw new Error(latestError);
      store.products = existing ? store.products.map(item => item.id === next.id ? next : item) : [...store.products, next];
      store.productsChanged = true;
      return store;
    }, existing ? 'Produto atualizado.' : 'Produto cadastrado.')) location.hash = 'products';
  });
}

function stockBadge(quantity, threshold) {
  if (quantity === 0) return '<span class="badge out">Esgotado</span>';
  if (quantity <= threshold) return '<span class="badge warning">Baixo</span>';
  return '<span class="badge active">Disponível</span>';
}

function stockPage(state) {
  const { products, threshold } = state;
  function summary(product) {
    const quantity = total(product);
    const badge = quantity && isLow(product, threshold)
      ? '<span class="badge warning">Estoque baixo</span>' : stockBadge(quantity, 0);
    return `<strong>${quantity} un.</strong> ${badge}`;
  }
  content.innerHTML = `${heading('Estoque', 'Edite as quantidades por numeração. As alterações são salvas ao sair do campo.', '<a class="button" href="#settings">Configurar limite</a>')}
    <div class="stack" id="stock-list">${products.length ? products.map(product => `<section class="panel" data-product="${e(product.id)}">
      <div class="panel-heading"><div><h2>${e(product.name)}</h2><p>${e(product.sku)} · ${e(product.brand)} · ${product.active ? 'Ativo' : 'Oculto'}</p></div><div class="actions" data-stock-summary>${summary(product)}</div></div>
      <div class="panel-body stock-variants">${product.variants.length ? product.variants.map(({ size, quantity }) =>
        `<label class="field stock-variant">${e(size)}<input type="number" min="0" step="1" required value="${quantity}" data-size="${e(size)}" aria-label="Quantidade de ${e(product.name)}, tamanho ${e(size)}"><span data-variant-status>${stockBadge(quantity, threshold)}</span></label>`).join('') :
        `<p class="muted">Sem numerações cadastradas. <a href="#products/${encodeURIComponent(product.id)}"><u>Editar produto</u></a></p>`}</div></section>`).join('') : '<p class="empty">Nenhum produto cadastrado.</p>'}</div>`;
  const list = content.querySelector('#stock-list');
  list.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.matches('[data-size]')) {
      event.preventDefault();
      event.target.blur();
    }
  });
  list.addEventListener('change', event => {
    const input = event.target;
    if (!input.matches('[data-size]')) return;
    const quantity = input.valueAsNumber;
    const card = input.closest('[data-product]');
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      input.value = input.defaultValue;
      notify('Informe uma quantidade inteira e não negativa.');
      return;
    }
    const result = persist(next => {
      const product = next.products.find(item => item.id === card.dataset.product);
      const variant = product?.variants.find(item => item.size === input.dataset.size);
      if (!variant) throw new Error('Esta numeração foi removida. Reabra a página de estoque.');
      variant.quantity = quantity;
      next.productsChanged = true;
      return next;
    }, 'Estoque atualizado.');
    if (!result) { input.value = input.defaultValue; return; }
    input.defaultValue = String(quantity);
    input.parentElement.querySelector('[data-variant-status]').innerHTML = stockBadge(quantity, threshold);
    card.querySelector('[data-stock-summary]').innerHTML = summary(result.products.find(item => item.id === card.dataset.product));
  });
}

function settingsPage(state) {
  content.innerHTML = `${heading('Configurações', 'Defina os parâmetros de estoque e gerencie os dados demonstrativos.')}
    <div class="form-layout">
    ${panel('Limite de estoque baixo', `<form class="stack" id="threshold-form">
      <div class="field-grid">${field('Unidades por numeração', 'threshold', state.threshold, 'required type="number" min="0" step="1"')}</div>
      <div class="actions"><button type="submit" class="button primary">Salvar limite</button></div>
    </form>`, 'Uma numeração com quantidade igual ou inferior ao limite gera um alerta.')}
    ${panel('Dados demonstrativos', '<button type="button" class="button danger" id="reset-data">Restaurar dados da demonstração</button>', 'Esta ação redefine produtos, estoque e aparência neste navegador.')}
    </div>`;
  content.querySelector('#threshold-form').addEventListener('submit', event => {
    event.preventDefault();
    const quantity = event.target.elements.threshold.valueAsNumber;
    if (!Number.isSafeInteger(quantity) || quantity < 0) return notify('Informe um limite inteiro e não negativo.');
    persist(next => ({ ...next, threshold: quantity }), 'Limite de estoque salvo.');
  });
  content.querySelector('#reset-data').addEventListener('click', async () => {
    if (!await confirmAction('Restaurar dados iniciais?', 'Produtos, vendas e alterações de estoque, perfil e aparência serão descartados neste navegador.', 'Restaurar dados')) return;
    const next = persist(defaults, 'Dados iniciais restaurados.');
    if (next) settingsPage(next);
  });
}

function initials(name) {
  const words = name.trim().split(/\s+/);
  return (words.length > 1 ? [words[0][0], words.at(-1)[0]] : Array.from(words[0]).slice(0, 2)).join('').toLocaleUpperCase('pt-BR');
}

function renderAvatar(element, name, photo) {
  element.textContent = initials(name);
  if (!photo) return;
  const picture = document.createElement('img');
  picture.alt = '';
  picture.hidden = true;
  element.append(picture);
  picture.addEventListener('load', () => {
    if (picture.parentElement === element) {
      picture.hidden = false;
      element.replaceChildren(picture);
    }
  }, { once: true });
  picture.src = imageURL(photo);
}

function updateHeader(state) {
  renderAvatar(profileLink, state.profile.name, state.profile.photo);
  const dismissed = new Set(state.dismissedAlerts);
  const alerts = stockAlerts(state).filter(alert => !dismissed.has(alert.key));
  const count = document.querySelector('#notification-count');
  count.hidden = !alerts.length;
  count.textContent = alerts.length > 99 ? '99+' : alerts.length;
  notificationToggle.setAttribute('aria-label', alerts.length
    ? `Notificações: ${alerts.length} ${alerts.length === 1 ? 'alerta' : 'alertas'} de estoque` : 'Notificações');
  document.querySelector('#clear-notifications').hidden = !alerts.length;
  document.querySelector('#notification-list').innerHTML = alerts.length ? `<ul class="notification-items">${alerts.map(({ product, sizes }) => `<li>
    <a href="#stock" class="notification-item"><span class="tile-icon">${icon('alert')}</span><div>
      <span class="notification-app">Estoque</span><strong>${e(product.name)}</strong>
      <small>${sizes.map(item => `${e(item.size)}: ${item.quantity ? `${item.quantity} un.` : 'esgotado'}`).join(' · ') || 'Sem numerações cadastradas'}</small>
    </div></a></li>`).join('')}</ul>` : '<p class="notification-empty">Nenhuma notificação</p>';
}

function profilePage({ profile }) {
  let saved = profile;
  let photo = profile.photo;
  let revision = 0;
  content.innerHTML = `${heading('Meu perfil', 'Gerencie seus dados de contato e a foto exibida no painel.')}
    <div class="form-layout">
      ${panel('Dados do perfil', `<form class="stack" id="profile-form">
        <div class="profile-photo-row">
          <span class="avatar profile-photo" aria-hidden="true"></span>
          <div class="stack profile-photo-controls">
            <label class="field">Foto do perfil<input id="profile-photo-file" type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif"></label>
            <button class="button compact" type="button" id="remove-profile-photo" hidden>Remover foto</button>
          </div>
        </div>
        <div class="field-grid">
          ${field('Nome', 'name', profile.name, 'required maxlength="80" autocomplete="name"')}
          ${field('E-mail', 'email', profile.email, 'type="email" maxlength="160" autocomplete="email"')}
          ${field('Telefone', 'phone', profile.phone, 'type="tel" maxlength="30" autocomplete="tel"')}
        </div>
        <p class="form-error" id="profile-error" role="alert" hidden></p>
        <div class="actions"><button class="button primary" type="submit">Salvar perfil</button><button class="button" type="button" id="cancel-profile">Cancelar alterações</button></div>
      </form>`)}
      ${panel('Sessão', '<button class="button danger" type="button" id="sign-out">Sair</button>')}
    </div>`;
  const form = content.querySelector('#profile-form');
  const preview = form.querySelector('.profile-photo');
  const file = form.querySelector('#profile-photo-file');
  const remove = form.querySelector('#remove-profile-photo');
  const cancel = form.querySelector('#cancel-profile');
  const save = form.querySelector('[type="submit"]');
  const error = form.querySelector('#profile-error');
  const current = () => ({
    name: form.elements.name.value.trim(), email: form.elements.email.value.trim(),
    phone: form.elements.phone.value.trim(), photo
  });
  const dirty = () => {
    const draft = current();
    return Object.keys(saved).some(key => saved[key] !== draft[key]);
  };
  function showError(message = '') {
    error.textContent = message;
    error.hidden = !message;
  }
  function refresh() {
    renderAvatar(preview, form.elements.name.value.trim() || saved.name, photo);
    remove.hidden = !photo;
    cancel.disabled = !dirty() && !file.disabled;
  }
  form.addEventListener('input', refresh);
  file.addEventListener('change', async () => {
    const [selected] = file.files;
    file.value = '';
    if (!selected) return;
    const request = ++revision;
    file.disabled = save.disabled = true;
    showError();
    refresh();
    try {
      const result = await localThumbnail(selected);
      if (request === revision) photo = result.src;
    } catch (cause) {
      if (request === revision) showError(cause.message || 'Não foi possível importar a foto.');
    } finally {
      if (request === revision) {
        file.disabled = save.disabled = false;
        refresh();
      }
    }
  });
  remove.addEventListener('click', () => {
    revision++;
    file.disabled = save.disabled = false;
    photo = '';
    showError();
    refresh();
    file.focus();
  });
  cancel.addEventListener('click', () => {
    revision++;
    file.disabled = save.disabled = false;
    for (const key of ['name', 'email', 'phone']) form.elements[key].value = saved[key];
    photo = saved.photo;
    showError();
    refresh();
    form.elements.name.focus();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (file.disabled) return;
    const next = current();
    if (!next.name) {
      showError('Informe seu nome.');
      form.elements.name.focus();
      return;
    }
    if (persist(state => ({ ...state, profile: next }), 'Perfil atualizado.')) {
      saved = next;
      for (const key of ['name', 'email', 'phone']) form.elements[key].value = saved[key];
      showError();
      refresh();
    }
  });
  const unsaved = () => dirty() || file.disabled;
  content.querySelector('#sign-out').addEventListener('click', async () => {
    if (unsaved() && !await confirmAction('Sair do painel?', 'As alterações do perfil ainda não foram salvas.', 'Sair')) return;
    try {
      signOut();
      revision++;
      hasDraft = () => false;
      location.replace(new URL('./login.html', import.meta.url));
    } catch {
      notify('Não foi possível sair. Verifique o armazenamento do navegador.');
    }
  });
  refresh();
  return unsaved;
}

document.querySelector('#clear-notifications').addEventListener('click', () => {
  if (persist(state => ({ ...state, dismissedAlerts: stockAlerts(state).map(alert => alert.key) }))) notificationToggle.focus();
});

notifications.addEventListener('click', event => {
  const link = event.target.closest('a[href="#stock"]');
  if (!link) return;
  notifications.open = false;
  if (route === 'stock') content.focus({ preventScroll: true });
});
document.addEventListener('click', event => {
  if (notifications.open && !notifications.contains(event.target)) notifications.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !notifications.open) return;
  notifications.open = false;
  notificationToggle.focus();
});
window.addEventListener('storage', event => {
  if (event.key === storageKey || event.key === null) updateHeader(readStore());
});

const mobileLabels = { overview: 'Início', products: 'Produtos', stock: 'Estoque', finance: 'Financeiro', appearance: 'Aparência', settings: 'Ajustes' };
nav.innerHTML = Object.entries(pages).map(([key, label]) =>
  `<a class="nav-link" href="#${key}">${icon(key)}<span class="nav-desktop-label">${label}</span><span class="nav-mobile-label">${mobileLabels[key]}</span></a>`).join('');

document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  content.focus();
});
window.addEventListener('beforeunload', event => {
  if (!hasDraft()) return;
  event.preventDefault();
  event.returnValue = '';
});

function render(target) {
  disposePage?.();
  disposePage = undefined;
  route = target;
  hasDraft = () => false;
  const [page, item] = target.split('/');
  const state = readStore();
  updateHeader(state);
  notifications.open = false;
  if (page === 'profile') profileLink.setAttribute('aria-current', 'page');
  else profileLink.removeAttribute('aria-current');
  document.querySelector('#page-label').textContent = pageTitles[page];
  document.title = `${pageTitles[page]} | VitraFlow`;
  nav.querySelectorAll('a').forEach(link => {
    if (link.hash === `#${page}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (page === 'products' && item) productForm(item === 'new' ? '' : decodeURIComponent(item));
  else if (page === 'products') productsPage();
  else if (page === 'stock') stockPage(state);
  else if (page === 'finance') disposePage = renderFinance({ content, heading, panel, field, persist, confirmAction });
  else if (page === 'settings') settingsPage(state);
  else if (page === 'profile') hasDraft = profilePage(state);
  else if (page === 'appearance') hasDraft = renderAppearance({ content, heading, panel, field, checked, confirmAction, persist, notify });
  else overview(state);
}

function currentRoute() {
  const hash = location.hash.slice(1);
  try {
    decodeURIComponent(hash);
    if (Object.hasOwn(pageTitles, hash.split('/')[0])) return hash;
  } catch { /* Invalid fragments open the dashboard. */ }
  return 'overview';
}
window.addEventListener('hashchange', async () => {
  const target = currentRoute();
  if (target === route) return;
  if (hasDraft()) {
    history.replaceState(null, '', `#${route}`);
    if (!await confirmAction('Descartar alterações?', 'Suas alterações ainda não foram salvas.', 'Descartar')) return;
    history.replaceState(null, '', `#${target}`);
  }
  render(target);
  window.scrollTo(0, 0);
  content.focus({ preventScroll: true });
});
function redirectIfSignedOut() {
  if (!isSignedOut()) return false;
  location.replace(new URL('./login.html', import.meta.url));
  return true;
}
window.addEventListener('pageshow', redirectIfSignedOut);
if (!redirectIfSignedOut()) render(currentRoute());
