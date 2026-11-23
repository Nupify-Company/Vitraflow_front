import { originalAppearance, seedProducts, sections, studio, fonts, themes } from './mock-data.js';

export const storageKey = 'vitraflow-demo-v1';
const root = new URL('../', import.meta.url);
export const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
export const hex = value => /^#[0-9a-f]{6}$/i.test(value);
export const total = product => product.variants.reduce((sum, variant) => sum + variant.quantity, 0);
export const isLow = (product, threshold) => !product.variants.length || product.variants.some(({ quantity }) => quantity <= threshold);
export function stockAlerts({ products, threshold }) {
  return products.filter(product => isLow(product, threshold)).map(product => {
    const sizes = product.variants.filter(item => item.quantity <= threshold);
    const quantities = sizes.map(item => [item.size, item.quantity]).sort((a, b) => a[0].localeCompare(b[0]));
    return { product, sizes, key: JSON.stringify([product.id, quantities]) };
  });
}

export const price = product => product.promo ?? product.price;
export const primaryImage = product => product.images[0] || { src: studio, tile: 0 };
export const normalize = value => value.trim().normalize('NFKC').toLocaleLowerCase('pt-BR');
const integer = value => Number.isSafeInteger(value) && value >= 0;
const validPrice = value => Number.isFinite(value) && value >= 0;

export function imageURL(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  if (/^data:image\/webp;base64,[\w+/=]+$/.test(value) && value.length < 180000) return value;
  try {
    const url = new URL(value, root);
    return ['http:', 'https:', 'file:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

export function productError(product, others = []) {
  if (typeof product.name !== 'string' || !product.name.trim()) return 'Informe o nome do produto.';
  if (typeof product.brand !== 'string' || !product.brand.trim()) return 'Informe a marca.';
  if (typeof product.sku !== 'string' || !product.sku.trim()) return 'Informe o SKU.';
  if (others.some(item => item.id !== product.id && normalize(item.sku) === normalize(product.sku))) return 'Já existe um produto com esse SKU.';
  if (!validPrice(product.price) || (product.promo != null && (!validPrice(product.promo) || product.promo >= product.price))) {
    return 'Informe um preço não negativo e, se houver promoção, um valor menor que o preço normal.';
  }
  if (!Array.isArray(product.variants) || product.variants.some(item => !item || typeof item.size !== 'string' || !item.size.trim() || !integer(item.quantity))) {
    return 'Preencha todas as numerações com quantidades inteiras e não negativas.';
  }
  if (new Set(product.variants.map(item => normalize(item.size))).size !== product.variants.length) return 'Cada numeração pode aparecer apenas uma vez.';
  return '';
}

export function defaults() {
  return { products: structuredClone(seedProducts), threshold: 3, sales: [], dismissedAlerts: [], profile: { name: 'Administrador VitraFlow', email: '', phone: '', photo: '' }, appearance: structuredClone(originalAppearance), appearanceSaved: false, productsChanged: false };
}

export function readStore() {
  const initial = defaults();
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (!stored || typeof stored !== 'object') return initial;
    if (Array.isArray(stored.products)) {
      const products = [];
      const ids = new Set();
      for (const item of stored.products) {
        if (!item || typeof item.id !== 'string' || ids.has(item.id) || productError(item, products)) continue;
        ids.add(item.id);
        products.push({
          ...item, category: typeof item.category === 'string' && item.category ? item.category : 'Sneakers',
          description: typeof item.description === 'string' ? item.description : '',
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
          active: item.active !== false,
          images: Array.isArray(item.images) ? item.images.filter(image => imageURL(image?.src)) : []
        });
      }
      if (products.length || !stored.products.length) initial.products = products;
    }
    if (Array.isArray(stored.sales)) {
      const saleIds = new Set();
      initial.sales = stored.sales.filter(sale => {
        if (!sale || typeof sale.id !== 'string' || saleIds.has(sale.id) ||
          typeof sale.productName !== 'string' || typeof sale.createdAt !== 'string' ||
          !Number.isFinite(Date.parse(sale.createdAt)) || !integer(sale.quantity) || sale.quantity === 0 ||
          !integer(sale.unitCents) || !integer(sale.quantity * sale.unitCents)) return false;
        saleIds.add(sale.id);
        return true;
      });
    }
    if (typeof stored.profile?.name === 'string' && stored.profile.name.trim()) {
      initial.profile.name = stored.profile.name.trim().slice(0, 80);
    }
    if (typeof stored.profile?.email === 'string') initial.profile.email = stored.profile.email.trim().slice(0, 160);
    if (typeof stored.profile?.phone === 'string') initial.profile.phone = stored.profile.phone.trim().slice(0, 30);
    if (typeof stored.profile?.photo === 'string' && stored.profile.photo.startsWith('data:image/webp;base64,') && imageURL(stored.profile.photo)) {
      initial.profile.photo = stored.profile.photo;
    }
    if (Array.isArray(stored.dismissedAlerts)) initial.dismissedAlerts = stored.dismissedAlerts.filter(key => typeof key === 'string');
    if (integer(stored.threshold)) initial.threshold = stored.threshold;
    initial.productsChanged = stored.productsChanged === true;
    if (stored.appearance && typeof stored.appearance === 'object') {
      const clean = initial.appearance;
      for (const key of Object.keys(clean)) {
        if (typeof stored.appearance[key] === typeof clean[key] && typeof clean[key] !== 'object') clean[key] = stored.appearance[key];
      }
      for (const key of Object.keys(clean.colors)) {
        const value = stored.appearance.colors?.[key];
        if (hex(value)) clean.colors[key] = value;
      }
      if (!Object.hasOwn(fonts, clean.font)) clean.font = 'original';
      if (!Object.hasOwn(themes, clean.theme)) clean.theme = 'custom';
      if (!['left', 'center', 'right'].includes(clean.align)) clean.align = 'left';
      if (Array.isArray(stored.appearance.sections)) {
        const seen = new Set();
        clean.sections = [...stored.appearance.sections, ...clean.sections].filter(item => {
          if (!item || !Object.hasOwn(sections, item.id) || typeof item.enabled !== 'boolean' || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        }).map(({ id, enabled }) => ({ id, enabled }));
      }
      initial.appearanceSaved = stored.appearanceSaved === true;
    }
  } catch {
    return initial;
  }
  return initial;
}

export function writeStore(update) {
  const next = update(readStore());
  if (next.dismissedAlerts.length) {
    const active = new Set(stockAlerts(next).map(alert => alert.key));
    next.dismissedAlerts = next.dismissedAlerts.filter(key => active.has(key));
  }
  localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}

export function contrastColor(hexColor) {
  const rgb = [1, 3, 5].map(index => parseInt(hexColor.slice(index, index + 2), 16) / 255)
    .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722 > .179 ? '#0b0b0b' : '#ffffff';
}

export function appearanceVariables(element, appearance) {
  for (const [key, value] of Object.entries(appearance.colors)) element.style.setProperty(`--shop-${key}`, value);
  element.style.setProperty('--shop-button-text', contrastColor(appearance.colors.button));
  const [body, display] = fonts[appearance.font];
  element.style.setProperty('--shop-font', `"${body}", sans-serif`);
  element.style.setProperty('--shop-display', `"${display}", "${body}", sans-serif`);
}
