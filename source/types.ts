export interface Reminder {
	id: string;
	description: string;
	complete: boolean;
	dueDate: string; // YYYY-MM-DD
	tags: string[];
}
