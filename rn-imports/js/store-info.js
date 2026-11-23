/* Preencher somente com os dados oficiais fornecidos pela VitraFlow.
   WhatsApp: código do país + DDD + número, somente dígitos. */
const storeInfo = {
  openingDays: '',
  openingHours: '',
  payments: [],
  whatsapp: ''
};

if (storeInfo.openingDays) document.querySelector('[data-store-days]').textContent = storeInfo.openingDays;
if (storeInfo.openingHours) document.querySelector('[data-store-hours]').textContent = storeInfo.openingHours;
if (storeInfo.payments.length) {
  const container = document.querySelector('[data-store-payments]');
  const list = document.createElement('ul');
  list.className = 'store-payment-methods';
  storeInfo.payments.forEach(method => {
    const item = document.createElement('li');
    item.textContent = method;
    list.append(item);
  });
  container.replaceChildren(list);
}
if (/^[1-9]\d{9,14}$/.test(storeInfo.whatsapp)) {
  const contact = document.querySelector('[data-store-whatsapp]');
  contact.href = `https://wa.me/${storeInfo.whatsapp}`;
  contact.hidden = false;
  document.querySelector('[data-store-contact-pending]').hidden = true;
  document.querySelector('[data-store-contact-note]').textContent = 'Abre uma conversa com a loja no WhatsApp.';
}
