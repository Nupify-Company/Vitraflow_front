import { signIn } from './demo-session.js';
import { writeStore } from '../js/store.js';

const login = document.querySelector('#login-form');
const register = document.querySelector('#register-form');
const heading = document.querySelector('#access-title');
const error = document.querySelector('#access-error');
const controls = document.querySelectorAll('[data-access]');

function showError(message = '') {
  error.textContent = message;
  error.hidden = !message;
}

function selectMode(mode) {
  const isRegister = mode === 'register';
  login.hidden = isRegister;
  register.hidden = !isRegister;
  heading.textContent = isRegister ? 'Criar conta' : 'Entrar no painel';
  document.title = `${isRegister ? 'Criar conta' : 'Entrar'} | VitraFlow`;
  controls.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.access === mode)));
  showError();
}

controls.forEach(button => button.addEventListener('click', () => selectMode(button.dataset.access)));
for (const form of [login, register]) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    showError();
    const name = form === register ? register.elements.name.value.trim() : '';
    if (form === register && !name) {
      showError('Informe seu nome.');
      register.elements.name.focus();
      return;
    }
    try {
      if (form === register) {
        const email = register.elements.email.value.trim();
        writeStore(state => ({ ...state, profile: { ...state.profile, name, email } }));
      }
      signIn();
      form.reset();
      location.replace('./index.html');
    } catch {
      showError('Não foi possível acessar o painel. Verifique se o navegador permite armazenamento local.');
    }
  });
}
