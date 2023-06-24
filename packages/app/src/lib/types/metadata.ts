import type { EventId } from './event';

export interface Metadata {
	username: string;
	agendas: MetadataAgenda[];
	contacts: MetadataContact[];
}

export interface MetadataAgendaProperties {
	name: string;
}

export interface MetadataAgenda extends MetadataAgendaProperties {
	events: MetadataEventAccess[];
}

export interface MetadataEventAccess {
	id: EventId;
	owner: Username;
	password: string;
}

export type MetadataContact = Username;

type Username = string;

export function parseMetadata(string: string): Metadata {
	// throw new Error('Not an Metadata type'); // TODO
	return JSON.parse(string);
}
