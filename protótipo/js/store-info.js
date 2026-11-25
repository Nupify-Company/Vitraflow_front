/* Dados de atendimento da loja. */
const storeInfo = {
  openingDays: '',
  openingHours: '',
  payments: []
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
