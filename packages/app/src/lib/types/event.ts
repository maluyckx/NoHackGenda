export interface EventProperties {
	name: string;
	time: {
		begin: string;
		end: string;
	};
	location: string;
	description: string;
}

export interface Event extends EventProperties {
	id: EventId;
	owner: UsernameHashed;
	attendees: UsernameHashed[];
}

export type EventId = string;

type UsernameHashed = string;

export function parseEvent(string: string): Event {
	// throw new Error('Not an Event type'); // TODO
	return JSON.parse(string);
}
