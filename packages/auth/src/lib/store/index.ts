import { writable } from 'svelte/store';

export const mode = writable<'login' | 'register'>('login');

export const username = writable<string>('');
export const password = writable<string>('');
export const name = writable<string>('');
export const email = writable<string>('');

export const usernameError = writable<string | undefined>(undefined);
export const passwordError = writable<string | undefined>(undefined);
export const nameError = writable<string | undefined>(undefined);
export const emailError = writable<string | undefined>(undefined);
