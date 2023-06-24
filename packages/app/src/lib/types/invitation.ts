import type { MetadataEventAccess } from './metadata';

export type Invitation = InvitationContact | InvitationEvent;

export interface InvitationContact {
	type: 'contact';
	username: string;
	publicKeyArmored: string;
}

export interface InvitationEvent {
	type: 'event';
	username: string;
	publicKeyArmored: string;
	eventAccess: MetadataEventAccess;
}

export function parseInvitation(string: string): Invitation {
	// throw new Error('Not an Invitation type'); // TODO
	return JSON.parse(string);
}
