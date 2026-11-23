export const seedProducts = [
  {
    id: "produto-1", name: "Nike Dunk Low Panda",
    brand: "Nike", category: "Sneakers", sku: "VF-001", createdAt: "2026-10-01T12:00:00Z",
    price: 649.9, promo: null,
    description: "O essencial em preto e branco. Uma silhueta atemporal que conecta a energia das quadras ao seu dia a dia, com personalidade em cada detalhe.",
    active: true, featured: true, bestseller: true, launch: false,
    images: [{ src: "assets/images/sneakers-studio.png", tile: 0 }, { src: "assets/images/sneakers-studio.png", tile: 1 }, { src: "assets/images/sneakers-studio.png", tile: 5 }],
    variants: [
      { size: "38", quantity: 0 }, { size: "39", quantity: 4 }, { size: "40", quantity: 5 },
      { size: "41", quantity: 3 }, { size: "42", quantity: 2 }, { size: "43", quantity: 4 },
    ]
  },
  {
    id: "produto-2", name: "Nike Air Force 1",
    brand: "Nike", category: "Sneakers", sku: "VF-002", createdAt: "2026-10-02T12:00:00Z",
    price: 599.9, promo: null,
    description: "Linhas atemporais, couro e uma presença que dispensa apresentação.",
    active: true, featured: true, bestseller: false, launch: false,
    images: [{ src: "assets/images/sneakers-studio.png", tile: 1 }],
    variants: [
      { size: "38", quantity: 4 }, { size: "39", quantity: 5 }, { size: "40", quantity: 6 },
      { size: "41", quantity: 5 }, { size: "42", quantity: 4 }, { size: "43", quantity: 4 },
    ]
  },
  {
    id: "produto-3", name: "Nike Air Max 90",
    brand: "Nike", category: "Sneakers", sku: "VF-003", createdAt: "2026-10-03T12:00:00Z",
    price: 729.9, promo: null,
    description: "A energia das ruas em uma silhueta feita para o dia a dia.",
    active: true, featured: true, bestseller: false, launch: false,
    images: [{ src: "assets/images/sneakers-studio.png", tile: 4 }],
    variants: [
      { size: "38", quantity: 4 }, { size: "39", quantity: 5 }, { size: "40", quantity: 6 },
      { size: "41", quantity: 5 }, { size: "42", quantity: 4 }, { size: "43", quantity: 4 },
    ]
  },
  {
    id: "produto-4", name: "Adidas Campus 00s",
    brand: "Adidas", category: "Sneakers", sku: "VF-004", createdAt: "2026-10-04T12:00:00Z",
    price: 549.9, promo: null,
    description: "Textura de camurça e proporções marcantes para sair do básico.",
    active: true, featured: true, bestseller: true, launch: false,
    images: [{ src: "assets/images/sneakers-studio.png", tile: 2 }],
    variants: [
      { size: "38", quantity: 2 }, { size: "39", quantity: 4 }, { size: "40", quantity: 5 },
      { size: "41", quantity: 3 }, { size: "42", quantity: 4 }, { size: "43", quantity: 2 },
    ]
  },
  {
    id: "produto-5", name: "Adidas Samba OG",
    brand: "Adidas", category: "Sneakers", sku: "VF-005", createdAt: "2026-10-05T12:00:00Z",
    price: 599.9, promo: null,
    description: "O essencial em preto e branco. Um clássico que vai com tudo.",
    active: true, featured: true, bestseller: false, launch: true,
    images: [{ src: "assets/images/sneakers-studio.png", tile: 3 }],
    variants: [
      { size: "38", quantity: 4 }, { size: "39", quantity: 5 }, { size: "40", quantity: 6 },
      { size: "41", quantity: 5 }, { size: "42", quantity: 4 }, { size: "43", quantity: 4 },
    ]
  },
  {
    id: "produto-6", name: "Adidas Gazelle",
    brand: "Adidas", category: "Sneakers", sku: "VF-006", createdAt: "2026-10-06T12:00:00Z",
    price: 529.9, promo: null,
    description: "Linhas atemporais, couro e uma presença que dispensa apresentação.",
    active: true, featured: true, bestseller: false, launch: false,
    images: [{ src: "assets/images/sneakers-studio.png", tile: 3 }],
    variants: [
      { size: "38", quantity: 4 }, { size: "39", quantity: 5 }, { size: "40", quantity: 6 },
      { size: "41", quantity: 5 }, { size: "42", quantity: 4 }, { size: "43", quantity: 4 },
    ]
  },
  {
    id: "produto-7", name: "New Balance 550",
    brand: "New Balance", category: "Sneakers", sku: "VF-007", createdAt: "2026-10-07T12:00:00Z",
    price: 699.9, promo: null,
    description: "A energia das ruas em uma silhueta feita para o dia a dia.",
    active: true, featured: true, bestseller: true, launch: false,
    images: [{ src: "assets/images/sneakers-studio.png", tile: 5 }],
    variants: [
      { size: "38", quantity: 2 }, { size: "39", quantity: 4 }, { size: "40", quantity: 5 },
      { size: "41", quantity: 3 }, { size: "42", quantity: 4 }, { size: "43", quantity: 2 },
    ]
  },
  {
    id: "produto-8", name: "New Balance 9060",
    brand: "New Balance", category: "Sneakers", sku: "VF-008", createdAt: "2026-10-08T12:00:00Z",
    price: 899.9, promo: null,
    description: "Textura de camurça e proporções marcantes para sair do básico.",
    active: true, featured: true, bestseller: false, launch: true,
    images: [{ src: "assets/images/sneakers-studio.png", tile: 4 }],
    variants: [
      { size: "38", quantity: 4 }, { size: "39", quantity: 5 }, { size: "40", quantity: 6 },
      { size: "41", quantity: 5 }, { size: "42", quantity: 4 }, { size: "43", quantity: 4 },
    ]
  },
  {
    id: "produto-9", name: "Air Jordan 1 Low",
    brand: "Jordan", category: "Sneakers", sku: "VF-009", createdAt: "2026-10-09T12:00:00Z",
    price: 799.9, promo: null,
    description: "Sneaker lifestyle da coleção demonstrativa.",
    active: true, featured: false, bestseller: true, launch: false,
    images: [{ src: "assets/images/sneakers-studio.png", tile: 0 }],
    variants: [
      { size: "38", quantity: 4 }, { size: "39", quantity: 5 }, { size: "40", quantity: 6 },
      { size: "41", quantity: 5 }, { size: "42", quantity: 4 }, { size: "43", quantity: 4 },
    ]
  },
  {
    id: "produto-10", name: "Puma Suede Classic",
    brand: "Puma", category: "Sneakers", sku: "VF-010", createdAt: "2026-10-10T12:00:00Z",
    price: 449.9, promo: null,
    description: "Sneaker lifestyle da coleção demonstrativa.",
    active: true, featured: false, bestseller: false, launch: true,
    images: [{ src: "assets/images/sneakers-studio.png", tile: 2 }],
    variants: [
      { size: "38", quantity: 2 }, { size: "39", quantity: 4 }, { size: "40", quantity: 5 },
      { size: "41", quantity: 3 }, { size: "42", quantity: 4 }, { size: "43", quantity: 2 },
    ]
  },
  {
    id: "produto-11", name: "Air Jordan 1 Mid",
    brand: "Jordan", category: "Sneakers", sku: "VF-011", createdAt: "2026-10-11T12:00:00Z",
    price: 849.9, promo: null,
    description: "Sneaker lifestyle da coleção demonstrativa.",
    active: true, featured: false, bestseller: false, launch: true,
    images: [{ src: "assets/images/sneakers-studio.png", tile: 5 }],
    variants: [
      { size: "38", quantity: 4 }, { size: "39", quantity: 5 }, { size: "40", quantity: 6 },
      { size: "41", quantity: 5 }, { size: "42", quantity: 4 }, { size: "43", quantity: 4 },
    ]
  },
  {
    id: "produto-12", name: "Puma Palermo",
    brand: "Puma", category: "Sneakers", sku: "VF-012", createdAt: "2026-10-12T12:00:00Z",
    price: 499.9, promo: null,
    description: "Sneaker lifestyle da coleção demonstrativa.",
    active: true, featured: false, bestseller: false, launch: false,
    images: [{ src: "assets/images/sneakers-studio.png", tile: 3 }],
    variants: [
      { size: "38", quantity: 0 }, { size: "39", quantity: 0 }, { size: "40", quantity: 0 },
      { size: "41", quantity: 0 }, { size: "42", quantity: 0 }, { size: "43", quantity: 0 },
    ]
  }
];

export const categories = ['Sneakers', 'Roupas', 'Acessórios', 'Streetwear'];
export const brands = [...new Set(seedProducts.map(product => product.brand))];
export const sections = {
  banner: 'Banner principal', categories: 'Categorias', bestsellers: 'Mais vendidos',
  launches: 'Lançamentos', offers: 'Ofertas', explore: 'Explore nossos produtos'
};
export const themes = {
  light: { primary: '#202124', secondary: '#eeeeef', background: '#f8f8f8', text: '#171717', button: '#242424', border: '#d9d9d9' },
  dark: { primary: '#c6d2ef', secondary: '#24262b', background: '#151619', text: '#f1f1f3', button: '#dbe4fa', border: '#484c55' },
  urban: { primary: '#96a76c', secondary: '#e3e8d9', background: '#f5f6f1', text: '#20261a', button: '#34432b', border: '#c8d0bc' }
};
export const fonts = {
  original: ['Space Grotesk', 'Anton'], space: ['Space Grotesk', 'Space Grotesk'],
  inter: ['Inter', 'Inter'], archivo: ['Archivo', 'Archivo']
};
export const studio = 'assets/images/sneakers-studio.png';
export const originalAppearance = {
  name: 'VitraFlow', slogan: 'Sua vitrine. Seu fluxo de vendas.',
  description: 'A VitraFlow é uma plataforma de vitrines digitais para lojas de tênis, roupas, acessórios e outros segmentos. Uma experiência simples e moderna para apresentar produtos e aproximar lojistas de seus clientes.',
  logo: 'assets/images/vitraflow-logo.png', cover: studio, mobileCover: '', bannerImage: '',
  theme: 'custom', colors: { primary: '#ff6a00', secondary: '#f0f0f0', background: '#f8f8f8', text: '#0b0b0b', button: '#ff6a00', border: '#d9d9d9' },
  font: 'original', title: 'SUA VITRINE.\nSEU ESTILO.', subtitle: 'Descubra uma nova experiência de explorar produtos.',
  buttonLabel: 'Explore a coleção', align: 'left', showButton: true,
  sections: Object.keys(sections).map(id => ({ id, enabled: id !== 'offers' })),
  whatsapp: '', instagram: '', service: '', delivery: ''
};
