import { categories, studio } from './mock-data.js';
import { escape, imageURL, money, price, primaryImage, total } from './store.js';

export const available = products => products.filter(product => product.active);
export const categoriesFor = products => [...new Set([...categories, ...products.map(product => product.category)])];

export function collection(products, id) {
  if (id === 'bestsellers') return products.filter(product => product.bestseller);
  if (id === 'launches') {
    const originalOrder = ['produto-8', 'produto-5', 'produto-10', 'produto-11'];
    const position = id => originalOrder.includes(id) ? originalOrder.indexOf(id) : originalOrder.length;
    return products.filter(product => product.launch).sort((a, b) => position(a.id) - position(b.id));
  }
  if (id === 'offers') return products.filter(product => product.promo != null);
  return [...products].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
}

export function photo(image, alt = '', lazy = true) {
  const tiled = image.src === studio && Number.isInteger(image.tile) && image.tile >= 0 && image.tile < 6;
  return `<div class="sneaker-photo ${tiled ? `photo-${image.tile}` : 'shop-photo-single'}"><img src="${escape(imageURL(image.src) || imageURL(studio))}" alt="${escape(alt)}"${lazy ? ' loading="lazy"' : ''}></div>`;
}

export function priceLabel(product) {
  return `${product.promo != null ? `<del>${money.format(product.price)}</del> ` : ''}${money.format(price(product))}`;
}

export const productURL = product => `produto.html?id=${encodeURIComponent(product.id)}`;

export function card(product) {
  const out = total(product) === 0;
  const content = `<div class="product-image">${photo(primaryImage(product), product.name)}<span class="tag ${out ? 'sold' : ''}">${out ? 'ESGOTADO' : product.promo != null ? 'OFERTA' : 'DISPONÍVEL'}</span><span class="card-arrow" aria-hidden="true">↗</span></div>
    <div class="product-brand">${escape(product.brand)}<span>${escape(product.category === 'Sneakers' ? 'Lifestyle' : product.category)}</span></div>
    <h3>${escape(product.name)}</h3><p class="price">${priceLabel(product)}</p>`;
  return `<article class="product-card ${out ? 'is-unavailable' : ''}"><a href="${productURL(product)}">${content}</a></article>`;
}
