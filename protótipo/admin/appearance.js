import { originalAppearance, sections, themes } from '../js/mock-data.js';
import { hex, imageURL, readStore } from '../js/store.js';
import { localThumbnail } from './image-upload.js';

const themeLabels = { light: 'Minimalista claro', dark: 'Minimalista escuro', urban: 'Urbano', custom: 'Personalizado' };
const colorLabels = { primary: 'Principal', secondary: 'Secundária', background: 'Fundo', text: 'Texto', button: 'Botões', border: 'Bordas' };
const fontLabels = { original: 'Space Grotesk + Anton', space: 'Space Grotesk', inter: 'Inter', archivo: 'Archivo' };
const alignLabels = { left: 'Esquerda', center: 'Centro', right: 'Direita' };
const groups = { identity: 'Identidade', style: 'Estilo', home: 'Página inicial', contact: 'Contato' };
const isImportedLogo = value => value.startsWith('data:image/webp;base64,') && Boolean(imageURL(value));
const assetNames = ['cover', 'mobileCover', 'bannerImage'];
const select = (label, name, options) => `<label class="field">${label}<select name="${name}">
  ${Object.entries(options).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}</select></label>`;
const textarea = (label, name, rows = 2) => `<label class="field full">${label}<textarea name="${name}" rows="${rows}" maxlength="600"></textarea></label>`;

export function renderAppearance({ content, heading, panel, field, checked, confirmAction, persist }) {
  let saved = readStore().appearance;
  let draft = structuredClone(saved);
  let mode = matchMedia('(max-width: 900px)').matches ? 'mobile' : 'desktop';
  let invalidColor = false;
  const isDirty = () => invalidColor || JSON.stringify(draft) !== JSON.stringify(saved);
  content.innerHTML = `${heading('Aparência da vitrine', 'Personalize a experiência da sua loja e confira o resultado antes de aplicar.', '<button class="button preview-jump" type="button" aria-controls="shop-preview" aria-expanded="false">Ver prévia</button>')}
    <div class="appearance-grid" data-view="editor">
      <form class="stack" id="appearance-form" novalidate>
        <div class="editor-groups" role="group" aria-label="Seções do editor">
          ${Object.entries(groups).map(([key, label]) => `<button type="button" class="button" data-group="${key}" aria-pressed="${key === 'identity'}" aria-controls="editor-${key}">${label}</button>`).join('')}
        </div>
        <div class="stack editor-group" id="editor-identity">
        ${panel('Identidade da loja', `<div class="field-grid">
          ${field('Nome da loja', 'name', '', 'required maxlength="80"')}
          ${field('Slogan', 'slogan', '', 'maxlength="120"')}
          ${textarea('Descrição curta', 'description')}
          <div class="stack identity-logo full">
            <label class="field">Importar logo<input id="logo-file" type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif"></label>
            <div class="actions" id="imported-logo" hidden>
              <img class="identity-logo-preview" alt="Logo importado">
              <button class="button compact" type="button" id="remove-logo">Remover imagem</button>
            </div>
            <p class="form-error" id="logo-error" role="alert" hidden></p>
          </div>
        </div>`, 'Importe uma imagem para usar como logo da loja.')}
        </div>
        <div class="stack editor-group" id="editor-style" hidden>
        ${panel('Cores e tipografia', `<div class="field-grid">
          ${select('Tema', 'theme', themeLabels)}
          ${select('Tipografia', 'font', fontLabels)}
          ${Object.entries(colorLabels).map(([key, label]) => `<div class="field"><label for="hex-${key}">${label}</label>
            <div class="color-pair"><input type="color" name="color-${key}" aria-label="Escolher cor ${label.toLowerCase()}">
              <input id="hex-${key}" name="hex-${key}" type="text" maxlength="7" placeholder="#000000" spellcheck="false"></div></div>`).join('')}
        </div>`)}
        </div>
        <div class="stack editor-group" id="editor-home" hidden>
        ${panel('Banner principal', `<div class="field-grid">
          ${textarea('Título principal', 'title')}
          ${textarea('Subtítulo', 'subtitle')}
          ${field('Texto do botão', 'buttonLabel', '', 'maxlength="80"')}
          ${select('Alinhamento do texto', 'align', alignLabels)}
          ${field('Imagem de capa (URL ou caminho)', 'cover', '', 'maxlength="1000"', 'full')}
          ${field('Capa para celular (opcional)', 'mobileCover', '', 'maxlength="1000"', 'full')}
          ${field('Imagem de fundo (opcional)', 'bannerImage', '', 'maxlength="1000"', 'full')}
          ${checked('showButton', 'Exibir botão do banner', true)}
        </div>`)}
        ${panel('Seções da página inicial', '<div id="section-order" class="stack"></div>', 'Escolha quais seções aparecem e ajuste a ordem de exibição.')}
        </div>
        <div class="stack editor-group" id="editor-contact" hidden>
        ${panel('Informações de contato', `<div class="field-grid">
          ${field('WhatsApp', 'whatsapp', '', 'type="tel" maxlength="25"')}
          ${field('Instagram', 'instagram', '', 'maxlength="80"')}
          ${textarea('Descrição do atendimento', 'service')}
          ${textarea('Entrega e retirada', 'delivery')}
        </div>`)}
        </div>
        <section class="panel appearance-actions"><div class="panel-body stack">
          <p id="draft-status" role="status"></p><p class="form-error" role="alert" id="appearance-error" hidden></p>
          <div class="actions"><button class="button primary" type="submit">Salvar alterações</button><button class="button" type="button" id="cancel-appearance">Cancelar</button><button class="button" type="button" id="reset-appearance">Restaurar padrão</button></div>
        </div></section>
      </form>
      <section class="panel preview-panel" id="shop-preview" tabindex="-1"><div class="panel-heading"><div><h2>Prévia da vitrine</h2><p>Página inicial</p></div>
        <div class="preview-tools"><div class="preview-modes" role="group" aria-label="Tamanho da prévia"><button type="button" class="button compact" data-mode="desktop">Desktop</button><button type="button" class="button compact" data-mode="mobile">Mobile</button></div><button type="button" class="button compact preview-expand" aria-pressed="false">Ampliar</button></div></div>
        <div class="preview-wrap">
          <div class="preview-window">
            <div class="preview-chrome"><span class="window-lights" aria-hidden="true"><i></i><i></i><i></i></span><span id="preview-dimensions"></span></div>
            <div class="preview-viewport"><iframe class="preview" src="../index.html?preview=appearance" title="Prévia da página inicial da vitrine"></iframe></div>
          </div>
        </div>
      </section>
    </div>`;
  const form = content.querySelector('#appearance-form');
  const preview = content.querySelector('.preview');
  const order = form.querySelector('#section-order');
  const groupButtons = [...form.querySelectorAll('[data-group]')];
  function selectGroup(key) {
    groupButtons.forEach(button => {
      const selected = key === button.dataset.group;
      button.setAttribute('aria-pressed', String(selected));
      form.querySelector(`#editor-${button.dataset.group}`).hidden = !selected;
    });
  }
  groupButtons.forEach(button => button.addEventListener('click', () => selectGroup(button.dataset.group)));
  function focusField(field) {
    if (!field) return;
    const group = field.closest('.editor-group');
    if (group) selectGroup(group.id.slice('editor-'.length));
    field.focus();
  }
  const error = form.querySelector('#appearance-error');
  const logoFile = form.querySelector('#logo-file');
  const logoError = form.querySelector('#logo-error');
  const importedLogo = form.querySelector('#imported-logo');
  const logoPreview = importedLogo.querySelector('img');
  const save = form.querySelector('[type="submit"]');
  function syncLogo() {
    const imported = isImportedLogo(draft.logo);
    importedLogo.hidden = !imported;
    if (imported) logoPreview.src = draft.logo;
    else logoPreview.removeAttribute('src');
  }
  function showLogoError(message = '') {
    logoError.textContent = message;
    logoError.hidden = !message;
  }
  function showError(message = '') {
    error.hidden = !message;
    error.textContent = message;
  }
  const viewport = content.querySelector('.preview-viewport');
  const previewWindow = content.querySelector('.preview-window');
  const dimensions = content.querySelector('#preview-dimensions');
  function fitPreview() {
    const width = mode === 'mobile' ? 390 : 1120;
    const scale = Math.min(1, viewport.clientWidth / width);
    if (!scale) return;
    const height = Math.round(viewport.clientHeight / scale);
    preview.style.width = `${width}px`;
    preview.style.height = `${height}px`;
    preview.style.transform = `scale(${scale})`;
    dimensions.textContent = `${width} px`;
  }
  // The draft is sent directly to the frame and never written to storage here.
  function sendDraft() {
    preview.contentWindow?.postMessage({ type: 'vitraflow:appearance-preview', appearance: draft }, location.origin);
  }
  preview.addEventListener('load', sendDraft);
  const resize = new ResizeObserver(fitPreview);
  resize.observe(viewport);
  const removal = new MutationObserver(() => {
    if (viewport.isConnected) return;
    resize.disconnect();
    removal.disconnect();
  });
  removal.observe(content, { childList: true });
  function updatePreviewMode() {
    previewWindow.dataset.mode = mode;
    content.querySelectorAll('button[data-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    });
    fitPreview();
  }
  function renderPreview() {
    sendDraft();
    form.querySelector('#draft-status').textContent = isDirty() ? 'Há alterações não salvas.' : 'Configurações salvas.';
    form.querySelector('#cancel-appearance').disabled = !isDirty();
  }
  function renderOrder() {
    order.innerHTML = draft.sections.map(({ id, enabled }, index) => `<div class="section-order">
      ${checked(`section-${id}`, sections[id], enabled)}
      <button type="button" class="icon-button" data-shift="-1" data-section="${id}" aria-label="Mover ${sections[id]} para cima" ${index ? '' : 'disabled'}>↑</button>
      <button type="button" class="icon-button" data-shift="1" data-section="${id}" aria-label="Mover ${sections[id]} para baixo" ${index === draft.sections.length - 1 ? 'disabled' : ''}>↓</button>
    </div>`).join('');
  }
  function syncColors() {
    Object.entries(draft.colors).forEach(([key, value]) => {
      form.elements[`color-${key}`].value = value;
      form.elements[`hex-${key}`].value = value;
      form.elements[`hex-${key}`].removeAttribute('aria-invalid');
    });
    invalidColor = false;
  }
  function populate() {
    for (const [key, value] of Object.entries(draft)) {
      const control = form.elements[key];
      if (!control) continue;
      if (control.type === 'checkbox') control.checked = value;
      else control.value = value;
    }
    syncColors();
    syncLogo();
    showLogoError();
    renderOrder();
    renderPreview();
    showError();
  }
  logoFile.addEventListener('change', async () => {
    const [file] = logoFile.files;
    logoFile.value = '';
    if (!file) return;
    const currentDraft = draft;
    const previousLogo = draft.logo;
    logoFile.disabled = true;
    save.disabled = true;
    showLogoError();
    try {
      const { src } = await localThumbnail(file);
      if (!form.isConnected || draft !== currentDraft || draft.logo !== previousLogo) return;
      draft.logo = src;
      syncLogo();
      renderPreview();
    } catch (error) {
      if (draft === currentDraft) showLogoError(error.message || 'Não foi possível importar o logo.');
    } finally {
      logoFile.disabled = false;
      save.disabled = false;
    }
  });
  form.querySelector('#remove-logo').addEventListener('click', () => {
    draft.logo = '';
    syncLogo();
    renderPreview();
    (logoFile.disabled ? form.querySelector('[data-group="identity"]') : logoFile).focus();
  });
  form.addEventListener('input', event => {
    const input = event.target;
    const key = input.name || '';
    if (!key) return;
    if (key === 'theme') {
      draft.theme = input.value;
      if (themes[input.value]) { draft.colors = { ...themes[input.value] }; syncColors(); }
    } else if (key.startsWith('color-') || key.startsWith('hex-')) {
      const color = key.split('-')[1];
      const value = input.value.trim();
      const isValid = hex(value);
      if (isValid) {
        draft.colors[color] = value.toLowerCase();
        form.elements[`color-${color}`].value = value.toLowerCase();
      }
      const text = form.elements[`hex-${color}`];
      if (input.type === 'color') text.value = value;
      text.setAttribute('aria-invalid', String(!hex(text.value.trim())));
      invalidColor = Object.keys(colorLabels).some(name => !hex(form.elements[`hex-${name}`].value.trim()));
      draft.theme = 'custom';
      form.elements.theme.value = 'custom';
    } else if (key.startsWith('section-')) {
      draft.sections.find(item => item.id === key.slice(8)).enabled = input.checked;
    } else if (Object.hasOwn(draft, key)) {
      draft[key] = input.type === 'checkbox' ? input.checked : input.value;
    }
    showError(invalidColor ? 'Use uma cor hexadecimal com seis dígitos, como #242424.' : '');
    renderPreview();
  });
  order.addEventListener('click', event => {
    const button = event.target.closest('[data-shift]');
    if (!button) return;
    const index = draft.sections.findIndex(item => item.id === button.dataset.section);
    const next = index + Number(button.dataset.shift);
    [draft.sections[index], draft.sections[next]] = [draft.sections[next], draft.sections[index]];
    renderOrder();
    const targets = [...order.querySelectorAll(`[data-section="${button.dataset.section}"]`)];
    (targets.find(item => !item.disabled && item.dataset.shift === button.dataset.shift) || targets.find(item => !item.disabled))?.focus();
    renderPreview();
  });
  content.querySelectorAll('button[data-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    updatePreviewMode();
  }));
  content.querySelector('.preview-expand').addEventListener('click', event => {
    const button = event.currentTarget;
    const expanded = content.querySelector('.appearance-grid').classList.toggle('preview-expanded');
    button.setAttribute('aria-pressed', String(expanded));
    button.textContent = expanded ? 'Recolher' : 'Ampliar';
    if (expanded) content.querySelector('#shop-preview').scrollIntoView({ block: 'start' });
  });
  const previewToggle = content.querySelector('.preview-jump');
  previewToggle.addEventListener('click', () => {
    const grid = content.querySelector('.appearance-grid');
    const viewing = grid.dataset.view === 'preview';
    grid.dataset.view = viewing ? 'editor' : 'preview';
    previewToggle.textContent = viewing ? 'Ver prévia' : 'Voltar ao editor';
    previewToggle.setAttribute('aria-expanded', String(!viewing));
    if (!viewing) content.querySelector('#shop-preview').focus();
  });
  form.querySelector('#cancel-appearance').addEventListener('click', () => {
    saved = readStore().appearance;
    draft = structuredClone(saved);
    populate();
  });
  form.querySelector('#reset-appearance').addEventListener('click', async () => {
    if (!await confirmAction('Restaurar aparência padrão?', 'Os campos voltarão aos valores iniciais. Salve para aplicar o padrão à vitrine.', 'Restaurar padrão')) return;
    draft = structuredClone(originalAppearance);
    populate();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (logoFile.disabled) return;
    if (!draft.name.trim()) { showError('Informe o nome da loja.'); focusField(form.elements.name); return; }
    if (invalidColor) { showError('Corrija as cores hexadecimais antes de salvar.'); focusField(form.querySelector('[aria-invalid="true"]')); return; }
    const invalidAsset = assetNames.find(key => {
      const value = draft[key].trim();
      return value && (!imageURL(value) || !/^(?:https?:\/\/|(?:\.\/)?assets\/)/i.test(value));
    });
    if (invalidAsset) { showError('Use um endereço iniciado por http://, https:// ou assets/.'); focusField(form.elements[invalidAsset]); return; }
    if (draft.title.trim() === '' && draft.sections.find(section => section.id === 'banner').enabled) {
      showError('Informe o título do banner ou desative a seção.');
      focusField(form.elements.title);
      return;
    }
    draft.name = draft.name.trim();
    assetNames.forEach(key => { draft[key] = draft[key].trim(); });
    const next = persist(state => ({ ...state, appearance: draft, appearanceSaved: JSON.stringify(draft) !== JSON.stringify(originalAppearance) }), 'Aparência aplicada à vitrine.');
    if (next) {
      saved = structuredClone(next.appearance);
      populate();
    }
  });
  updatePreviewMode();
  populate();
  return isDirty;
}
