export interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  participants: string[];
  meetingLink?: string;
  timezone?: string;
}

export type CreateEventInput = Omit<Event, "id">;
