export interface Metadata {
	username: string;
	agendas: MetadataAgenda[];
	contacts: MetadataContact[];
}

interface MetadataAgendaProperties {
	name: string;
}

interface MetadataAgenda extends MetadataAgendaProperties {
	events: MetadataEventAccess[];
}

interface MetadataEventAccess {
	id: EventId;
	password: string;
}

type MetadataContact = Username;

type Username = string;

type EventId = string;
