import { imageURL } from '../js/store.js';

export async function localThumbnail(file) {
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'].includes(file.type) || file.size > 15 * 1024 * 1024) {
    throw new Error('Selecione PNG, JPEG, WebP, AVIF ou GIF de até 15 MB.');
  }
  const objectURL = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectURL;
    await image.decode();
    const scale = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const src = canvas.toDataURL('image/webp', .68);
    if (!src.startsWith('data:image/webp;') || !imageURL(src)) throw new Error('A imagem não pôde ser reduzida. Escolha outra ou informe uma URL.');
    return { src };
  } finally {
    URL.revokeObjectURL(objectURL);
  }
}
