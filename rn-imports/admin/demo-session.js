const signOutKey = 'vitraflow-demo-signed-out';

export function isSignedOut() {
  return sessionStorage.getItem(signOutKey) === '1';
}

export function signOut() {
  sessionStorage.setItem(signOutKey, '1');
}

export function signIn() {
  sessionStorage.removeItem(signOutKey);
}
