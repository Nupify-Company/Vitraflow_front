import { originalAppearance, sections, studio } from './mock-data.js';
import { appearanceVariables, escape as e, imageURL, money, price, primaryImage, readStore, storageKey, total } from './store.js';
import { available, card, categoriesFor, collection, photo, priceLabel, productURL } from './shop-view.js';

const state = readStore();
const productList = available(state.products);
let appearance = state.appearance;
const page = location.pathname.split('/').pop() || 'index.html';
const previewMode = page === 'index.html' && window.parent !== window
  && new URLSearchParams(location.search).get('preview') === 'appearance';
const $ = (selector, root = document) => root.querySelector(selector);
const setText = (selector, value) => { const element = $(selector); if (element) element.textContent = value; };
const empty = '<p class="shop-empty">Nenhum produto nesta seção.</p>';

function cards(target, products) {
  target.innerHTML = products.length ? products.map(product => card(product)).join('') : empty;
}

function linkOriginalCards() {
  document.querySelectorAll('.product-card, .sneaker-row').forEach(item => {
    const name = $('h3', item)?.textContent;
    const product = productList.find(record => record.name === name);
    if (product) $('a', item).href = productURL(product);
  });
}

function categoryChips() {
  const categories = categoriesFor(productList);
  document.querySelectorAll('.category-chips').forEach(nav => {
    const buttons = [...nav.querySelectorAll('[data-category]')];
    const existing = new Set(buttons.map(button => button.textContent.trim()));
    for (const category of categories) {
      if (existing.has(category)) continue;
      const button = buttons[0].cloneNode(false);
      button.textContent = category;
      button.setAttribute('aria-pressed', 'false');
      nav.insertBefore(button, buttons.at(-1));
    }
  });
}

function row(product) {
  return `<article class="sneaker-row ${total(product) ? '' : 'is-unavailable'}"><a href="${productURL(product)}">
    <div class="sneaker-row-copy"><span class="eyebrow">${e(product.brand)} / ${e(product.category === 'Sneakers' ? 'LIFESTYLE' : product.category)}</span>
      <h3>${e(product.name)}</h3><p class="row-description">${e(product.description)}</p>
      <p class="row-sizes">${product.variants.length ? `BR ${product.variants.map(item => e(item.size)).join(' · ')}` : 'Sem numerações'}</p>
      <p class="price">${priceLabel(product)}</p></div>
    <div class="row-image">${photo(primaryImage(product), product.name)}<span class="card-arrow" aria-hidden="true">↗</span></div></a></article>`;
}

function home(customized) {
  const targets = {
    banner: $('.store-banner'), categories: $('.discovery-bar'),
    bestsellers: $('#bestsellers')?.closest('section'), launches: $('#new-products')?.closest('section'),
    explore: $('#explore')
  };
  if (state.productsChanged) {
    cards($('#bestsellers'), collection(productList, 'bestsellers'));
    cards($('#new-products'), collection(productList, 'launches'));
    $('.sneaker-list').innerHTML = productList.length ? collection(productList, 'explore').map(row).join('') : empty;
  }
  if (!customized) return;
  const banner = targets.banner;
  const title = $('#store-banner-title');
  if (appearance.title !== originalAppearance.title) {
    title.classList.add('shop-edited-title');
    const [first, ...rest] = appearance.title.split('\n');
    title.replaceChildren(document.createTextNode(first));
    if (rest.length) {
      const span = document.createElement('span');
      span.textContent = rest.join(' ');
      title.append(document.createElement('br'), span);
    }
  }
  setText('.banner-copy p', appearance.subtitle);
  const button = $('.banner-link');
  button.firstChild.textContent = `${appearance.buttonLabel} `;
  button.hidden = !appearance.showButton || !appearance.buttonLabel.trim();
  if (!appearance.sections.find(item => item.id === 'explore').enabled) button.href = 'catalogo.html';
  if (appearance.align !== originalAppearance.align) {
    $('.banner-copy').dataset.align = appearance.align;
    banner.classList.add('shop-aligned-banner');
  }
  if (!appearance.sections.find(item => item.id === 'categories').enabled) {
    $('.banner-search').href = 'catalogo.html';
    $('.banner-search').setAttribute('aria-label', 'Ver catálogo');
  }
  const desktop = imageURL(appearance.bannerImage || (appearance.cover !== studio ? appearance.cover : ''));
  const mobile = imageURL(appearance.mobileCover);
  if (desktop || mobile || !appearance.cover) {
    banner.classList.add(desktop || !appearance.cover ? 'shop-custom-cover' : 'shop-mobile-cover');
    if (desktop || mobile) banner.insertAdjacentHTML('afterbegin', `<picture class="shop-banner-picture">
      ${mobile ? `<source media="(max-width: 767px)" srcset="${e(mobile)}">` : ''}
      <img src="${e(desktop || mobile)}" alt=""></picture>`);
  }
  const offerSection = document.createElement('section');
  offerSection.className = 'collection';
  offerSection.innerHTML = '<div class="section-head"><h2>Ofertas</h2></div><div class="product-grid"></div>';
  cards($('.product-grid', offerSection), collection(productList, 'offers'));
  targets.offers = offerSection;
  const explore = targets.explore;
  if (appearance.sections.find(item => item.id === 'offers').enabled) explore.before(offerSection);
  const originalOrder = originalAppearance.sections.map(item => item.id).join(',');
  if (JSON.stringify(appearance.sections) !== JSON.stringify(originalAppearance.sections)) {
    targets.categories.classList.add('shop-configured-categories');
  }
  if (appearance.sections.map(item => item.id).join(',') !== originalOrder) {
    const main = $('#main');
    const layout = document.createElement('div');
    layout.className = 'shop-section-order';
    main.prepend(layout);
    for (const { id, enabled } of appearance.sections) {
      const target = targets[id];
      target.hidden = !enabled;
      if (['banner', 'categories'].includes(id)) layout.append(target);
      else {
        const wrapper = document.createElement('div');
        wrapper.className = 'container shop-section';
        wrapper.hidden = !enabled;
        wrapper.append(target);
        layout.append(wrapper);
      }
      if (id === 'banner') layout.append($('.store-profile'));
    }
  } else {
    for (const { id, enabled } of appearance.sections) targets[id].hidden = !enabled;
  }
}

function catalog() {
  if (!state.productsChanged) return;
  cards($('.product-grid'), productList);
  const count = $('.results-bar > span');
  count.textContent = `${productList.length} ${productList.length === 1 ? 'produto' : 'produtos'} · seleção ilustrativa`;
}

function details() {
  const requested = new URLSearchParams(location.search).get('id');
  const product = productList.find(item => item.id === (requested ?? 'produto-1')) || (!requested && productList[0]);
  if (!product) {
    $('#main').innerHTML = '<section class="container page-section"><h1>Produto indisponível</h1><p>Este produto não está disponível na vitrine.</p><a class="text-link" href="catalogo.html">Voltar ao catálogo</a></section>';
    document.title = `Produto indisponível | ${appearance.name}`;
    return;
  }
  if (state.productsChanged || product.id !== 'produto-1') {
    const name = product.name;
    document.title = `${name} | ${appearance.name}`;
    const breadcrumb = $('.breadcrumb');
    breadcrumb.lastChild.textContent = ` / ${name}`;
    $('.product-info > .eyebrow').textContent = `${product.brand.toUpperCase()} / ${product.category === 'Sneakers' ? 'LIFESTYLE' : product.category.toUpperCase()}`;
    setText('.product-info h1', name);
    $('.detail-price').innerHTML = priceLabel(product);
    setText('.description', product.description);
    const stock = $('.stock-status');
    stock.innerHTML = total(product) ? '<span class="availability-dot" aria-hidden="true"></span> Disponível · exemplo ilustrativo' : 'Esgotado';
    const images = product.images.length ? product.images : [primaryImage(product)];
    $('#main-visual').innerHTML = photo(images[0], name, false);
    $('.thumbnails').innerHTML = images.map((image, index) => `<button class="thumb ${index === 0 ? 'selected' : ''}" type="button" data-product-image="${index}" aria-pressed="${index === 0}" aria-label="Imagem ${index + 1} de ${e(name)}">${photo(image)}</button>`).join('');
    $('.thumbnails').addEventListener('click', event => {
      const button = event.target.closest('[data-product-image]');
      if (!button) return;
      document.querySelectorAll('[data-product-image]').forEach(thumb => {
        thumb.classList.toggle('selected', thumb === button);
        thumb.setAttribute('aria-pressed', String(thumb === button));
      });
      $('#main-visual').innerHTML = photo(images[Number(button.dataset.productImage)], name, false);
    });
    const selected = product.variants.find(item => item.size === '40' && item.quantity > 0) || product.variants.find(item => item.quantity > 0);
    const choices = $('.sizes > div');
    choices.innerHTML = product.variants.map(item => `<button class="size ${item === selected ? 'selected' : ''}" type="button" ${item.quantity ? '' : 'disabled'} data-size-value="${e(item.size)}" aria-pressed="${item === selected}">${e(item.size)}</button>`).join('') || '<p class="muted">Sem numerações cadastradas.</p>';
    const sizeLabel = item => item ? `BR ${item} · 1 unidade ilustrativa` : 'Sem estoque disponível';
    setText('.purchase-summary strong', money.format(price(product)));
    setText('.purchase-size', sizeLabel(selected?.size));
    updateInterest([{ product, size: selected?.size }]);
    choices.addEventListener('click', event => {
      const button = event.target.closest('[data-size-value]');
      if (!button || button.disabled) return;
      choices.querySelectorAll('button').forEach(item => {
        item.classList.toggle('selected', item === button);
        item.setAttribute('aria-pressed', String(item === button));
      });
      setText('.purchase-size', sizeLabel(button.dataset.sizeValue));
      updateInterest([{ product, size: button.dataset.sizeValue }]);
    });
    setText('.product-info details:first-of-type p', product.description);
    if (!total(product)) document.querySelectorAll('.purchase-buttons button').forEach(button => { button.disabled = true; });
    cards($('.product-grid'), productList.filter(item => item.id !== product.id).slice(0, 4));
  }
  if (appearance.delivery) setText('.product-info details:last-child p', appearance.delivery);
}

const bagItems = [
  { id: 'produto-1', size: '40' }, { id: 'produto-4', size: '39' }
].flatMap(item => {
  const product = productList.find(record => record.id === item.id);
  return product ? [{ ...item, product }] : [];
});

function updateInterest(items) {
  $('.confirm-items').innerHTML = items.map(({ product, size }) => {
    const amount = money.format(price(product));
    return `<div class="confirm-item">${photo(primaryImage(product), product.name)}
      <div><span class="eyebrow">${e(product.brand)}</span><strong>${e(product.name)}</strong>
      <p>${size ? `Numeração BR ${e(size)} · Quantidade 1` : 'Sem estoque disponível'}</p><p>${amount} / un.</p>
      <p class="confirm-subtotal">Subtotal ${amount}</p></div></div>`;
  }).join('');
  setText('#interest-dialog .total-line strong', money.format(items.reduce((sum, { product }) => sum + price(product), 0)));
}

function bag() {
  document.querySelectorAll('.bag-item').forEach((item, index) => {
    const entry = bagItems.find(record => record.id === (index ? 'produto-4' : 'produto-1'));
    if (!entry) { item.remove(); return; }
    const { product, size } = entry;
    item.querySelectorAll('a').forEach(link => { link.href = productURL(product); });
    if (!state.productsChanged) return;
    const [imageLink] = item.querySelectorAll('a');
    imageLink.innerHTML = photo(primaryImage(product), product.name);
    setTextIn(item, 'h2 a', product.name);
    setTextIn(item, '.eyebrow', `${product.brand} / ${product.category === 'Sneakers' ? 'Lifestyle' : product.category}`);
    setTextIn(item, '.muted', `Numeração BR ${size} · ${money.format(price(product))} / un.`);
    setTextIn(item, '.item-subtotal strong', money.format(price(product)));
    const remove = $('.remove', item);
    remove.setAttribute('aria-label', `Remover ${product.name}, demonstração`);
  });
  if (!state.productsChanged) return;
  updateInterest(bagItems);
  const amount = money.format(bagItems.reduce((sum, item) => sum + price(item.product), 0));
  const count = `${bagItems.length} ${bagItems.length === 1 ? 'item ilustrativo' : 'itens ilustrativos'}`;
  setText('.title-count', bagItems.length);
  setText('.bag-summary .total-line:first-of-type span:first-child', count);
  setText('.bag-summary .total-line:first-of-type span:last-child', amount);
  setText('.bag-summary .total-line strong:last-child', amount);
  setText('.bag-checkout-dock .purchase-summary .small', `Total estimado · ${count}`);
  setText('.bag-checkout-dock .purchase-summary strong', amount);
  if (!bagItems.length) document.querySelectorAll('.bag-layout [data-open-interest]').forEach(button => { button.disabled = true; });
}

function setTextIn(root, selector, value) {
  const element = $(selector, root);
  if (element) element.textContent = value;
}

function applyAppearance() {
  const root = document.documentElement;
  appearanceVariables(root, appearance);
  if (JSON.stringify(appearance.colors) !== JSON.stringify(originalAppearance.colors)) root.classList.add('shop-custom-colors');
  if (appearance.font !== originalAppearance.font) root.classList.add('shop-custom-font');
  const name = appearance.name;
  document.title = document.title.replace(/VitraFlow$/, () => name);
  document.querySelector('meta[name="description"]').content = appearance.description;
  document.querySelectorAll('.brand-logo').forEach(image => {
    image.alt = name;
    image.closest('a').setAttribute('aria-label', `${name}, início`);
    const source = imageURL(appearance.logo);
    image.hidden = !source;
    if (source && appearance.logo !== originalAppearance.logo) {
      image.src = source;
      image.classList.add('shop-custom-logo');
    }
    if (!source) image.parentElement.append(document.createTextNode(name));
  });
  if (appearance.logo !== originalAppearance.logo) {
    document.querySelectorAll('.store-monogram img').forEach(image => {
      const source = imageURL(appearance.logo);
      if (source && appearance.logo !== originalAppearance.logo) {
      image.src = source;
      image.classList.add('shop-custom-logo');
    }
      else image.parentElement.hidden = true;
    });
  }
  setText('#store-name', name);
  $('.store-profile-link')?.setAttribute('aria-label', `${name}, informações da loja`);
  setText('#store-info-title', name);
  setText('.store-information-heading .eyebrow', `CONHEÇA A ${name.toUpperCase()}`);
  setText('.store-profile-copy p', appearance.slogan);
  setText('.store-information-heading p', appearance.slogan);
  setText('.announcement', appearance.slogan.toUpperCase());
  if (appearance.slogan !== originalAppearance.slogan) setText('.footer-brand p', appearance.slogan);
  setText('.footer-column:last-child h2', name);
  setText('.footer-column:last-child a', `Sobre ${name}`);
  setText('.footer-bottom > span', `© 2026 ${name}.`);
  setText('.store-description p', appearance.description);
  if ($('.banner-edition')) setText('.banner-edition', `${name.toUpperCase()} / VOL. 01`);
  const contact = $('.store-contact-card');
  if (contact) {
    if (appearance.service) setTextIn(contact, '.muted', appearance.service);
    if (appearance.whatsapp || appearance.instagram || appearance.delivery) {
      contact.querySelector('[data-store-contact-pending]').hidden = Boolean(appearance.whatsapp);
      const list = document.createElement('ul');
      list.className = 'shop-contact';
      [appearance.whatsapp && `WhatsApp: ${appearance.whatsapp}`, appearance.instagram && `Instagram: ${appearance.instagram}`, appearance.delivery]
        .filter(Boolean).forEach(value => { const li = document.createElement('li'); li.textContent = value; list.append(li); });
      contact.append(list);
    }
  }
  if (appearance.delivery && page === 'sacola.html') setText('.bag-summary > p', appearance.delivery);
}

function renderStorefront(customized) {
  linkOriginalCards();
  if (customized) applyAppearance();
  if (state.productsChanged) {
    categoryChips();
    document.querySelectorAll('.bag-count').forEach(badge => {
      badge.textContent = bagItems.length;
      if (badge.hasAttribute('aria-label')) badge.setAttribute('aria-label', `${bagItems.length} itens ilustrativos`);
      if (badge.closest('.bag-link')) badge.closest('a').setAttribute('aria-label', `Ver sacola ilustrativa com ${bagItems.length} itens`);
    });
  }
  if (page === 'index.html') home(customized);
  if (page === 'catalogo.html') catalog();
  if (page === 'produto.html') details();
  if (page === 'sacola.html') bag();
}

function connectPreview() {
  const selectors = ['#header', '#main', '#footer'];
  const templates = selectors.map(selector => $(selector).cloneNode(true));
  const originalTitle = document.title;
  const meta = $('meta[name="description"]');
  const originalDescription = meta.content;
  const root = document.documentElement;
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent
      || event.data?.type !== 'vitraflow:appearance-preview' || !event.data.appearance) return;
    const scrollTop = window.scrollY;
    const railPositions = new Map([...document.querySelectorAll('.product-rail')].map(rail => [rail.id, rail.scrollLeft]));
    selectors.forEach((selector, index) => $(selector).replaceWith(templates[index].cloneNode(true)));
    document.title = originalTitle;
    meta.content = originalDescription;
    root.classList.remove('shop-custom-colors', 'shop-custom-font');
    appearance = event.data.appearance;
    renderStorefront(JSON.stringify(appearance) !== JSON.stringify(originalAppearance));
    for (const rail of document.querySelectorAll('.product-rail')) rail.scrollLeft = railPositions.get(rail.id) || 0;
    window.scrollTo({ top: scrollTop, behavior: 'instant' });
    document.dispatchEvent(new Event('vitraflow:preview-rendered'));
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (link && !link.getAttribute('href').startsWith('#')) event.preventDefault();
  });
}

if (previewMode) connectPreview();
renderStorefront(state.appearanceSaved);

window.addEventListener('storage', event => {
  if (event.key === storageKey || event.key === null) location.reload();
});
window.addEventListener('pageshow', event => {
  if (event.persisted && JSON.stringify(readStore()) !== JSON.stringify(state)) location.reload();
});
