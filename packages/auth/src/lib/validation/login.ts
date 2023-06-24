import { password, passwordError, username, usernameError } from '$lib/store';
import type { Unsubscriber } from 'svelte/store';
import { z } from 'zod';

let unsubscribeUsernameValidation: Unsubscriber;
let usernameDefaultValue = true;

let unsubscribePasswordValidation: Unsubscriber;
let passwordDefaultValue = true;

export function usernameValidation(value: string) {
	if (usernameDefaultValue === true) {
		usernameDefaultValue = false;
		return;
	}

	const validation = z
		.string({ required_error: 'Username is required' })
		.min(1, { message: 'Username is required' })
		.trim()
		.safeParse(value || '');

	if (validation.success) {
		usernameError.set(undefined);
		username.set(validation.data);
	} else {
		const issues = validation.error.issues;
		usernameError.set(issues[0].message);
	}
}

export function passwordValidation(value: string) {
	if (passwordDefaultValue === true) {
		passwordDefaultValue = false;
		return;
	}

	const validation = z
		.string({ required_error: 'Password is required' })
		.min(1, { message: 'Password is required' })
		.trim()
		.safeParse(value || '');

	if (validation.success) {
		passwordError.set(undefined);
		password.set(validation.data);
	} else {
		const issues = validation.error.issues;
		passwordError.set(issues[0].message);
	}
}

export function subscribe() {
	unsubscribeUsernameValidation = username.subscribe(usernameValidation);
	unsubscribePasswordValidation = password.subscribe(passwordValidation);
}

export function unsubscribe() {
	if (unsubscribeUsernameValidation) unsubscribeUsernameValidation();
	usernameError.set(undefined);

	if (unsubscribePasswordValidation) unsubscribePasswordValidation();
	passwordError.set(undefined);
}
