import {
	nameError,
	password,
	passwordError,
	username,
	usernameError,
	name,
	email,
	emailError
} from '$lib/store';
import type { Unsubscriber } from 'svelte/store';
import { z } from 'zod';

let unsubscribeUsernameValidation: Unsubscriber;
let usernameDefaultValue = true;

let unsubscribePasswordValidation: Unsubscriber;
let passwordDefaultValue = true;

let unsubscribeNameValidation: Unsubscriber;
let nameDefaultValue = true;

let unsubscribeEmailValidation: Unsubscriber;
let emailDefaultValue = true;

export function usernameValidation(value: string, required = true) {
	if (usernameDefaultValue === true) {
		usernameDefaultValue = false;
		return;
	}

	if (!required) {
		if (value === '') {
			usernameError.set(undefined);
			username.set('');
			return;
		}
	}

	const validation = z
		.string({ required_error: 'required' })
		.min(1, { message: 'required' })
		.min(3, { message: 'must be at least 3 characters' })
		.regex(/^[\w\d]+$/, { message: 'invalid character' })
		.max(32, { message: 'must be less than 32 characters' })
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

export function passwordValidation(value: string, required = true) {
	if (passwordDefaultValue === true) {
		passwordDefaultValue = false;
		return;
	}

	if (!required) {
		if (value === '') {
			passwordError.set(undefined);
			password.set('');
			return;
		}
	}

	const validation = z
		.string({ required_error: 'required' })
		.min(1, { message: 'required' })
		.min(8, { message: 'must be at least 8 characters' })
		.regex(/\d/, { message: 'must contains at least one digit' })
		.regex(/[A-Z]/, { message: 'must contains at least one uppercase' })
		.regex(/[#\\$%&@\\^~\\.,\\*\\+!\\?=]/, {
			message: 'must contains at least one special character (#$%&@^~.,*+!?=)'
		})
		.max(32, { message: 'must be less than 32 characters' })
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

export function nameValidation(value: string, required = true) {
	if (nameDefaultValue === true) {
		nameDefaultValue = false;
		return;
	}

	if (!required) {
		if (value === '') {
			nameError.set(undefined);
			name.set('');
			return;
		}
	}

	const validation = z
		.string({ required_error: 'Name is required' })
		.min(1, { message: 'Name is required' })
		.min(6, { message: 'Name must be at least 6 characters' })
		.max(32, { message: 'Name must be less than 32 characters' })
		.trim()
		.safeParse(value || '');

	if (validation.success) {
		nameError.set(undefined);
		name.set(validation.data);
	} else {
		const issues = validation.error.issues;
		nameError.set(issues[0].message);
	}
}

export function emailValidation(value: string, required = true) {
	if (emailDefaultValue === true) {
		emailDefaultValue = false;
		return;
	}

	if (!required) {
		if (value === '') {
			emailError.set(undefined);
			email.set('');
			return;
		}
	}

	const validation = z
		.string({ required_error: 'Email is required' })
		.email({ message: 'Email not valid' })
		.trim()
		.safeParse(value || '');

	if (validation.success) {
		emailError.set(undefined);
		email.set(validation.data);
	} else {
		const issues = validation.error.issues;
		emailError.set(issues[0].message);
	}
}

export function subscribe() {
	unsubscribeUsernameValidation = username.subscribe((value) => usernameValidation(value));
	unsubscribePasswordValidation = password.subscribe((value) => passwordValidation(value));
	unsubscribeNameValidation = name.subscribe((value) => nameValidation(value, false));
	unsubscribeEmailValidation = email.subscribe((value) => emailValidation(value, false));
}

export function unsubscribe() {
	if (unsubscribeUsernameValidation) unsubscribeUsernameValidation();
	usernameError.set(undefined);

	if (unsubscribePasswordValidation) unsubscribePasswordValidation();
	passwordError.set(undefined);

	if (unsubscribeNameValidation) unsubscribeNameValidation();
	nameError.set(undefined);

	if (unsubscribeEmailValidation) unsubscribeEmailValidation();
	emailError.set(undefined);
}
