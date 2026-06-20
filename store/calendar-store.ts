"use client";

import { addDays, format, startOfWeek } from "date-fns";
import { create } from "zustand";
import { getAuthHeaders } from "@/lib/auth-storage";
import type { CreateEventInput, Event } from "@/lib/events/types";

type EventTypeFilter = "all" | "with-meeting" | "without-meeting";
type ParticipantsFilter = "all" | "with-participants" | "without-participants";

interface CalendarState {
  currentWeekStart: Date;
  events: Event[];
  searchQuery: string;
  eventTypeFilter: EventTypeFilter;
  participantsFilter: ParticipantsFilter;
  isLoadingEvents: boolean;
  eventsError: string | null;
  setSearchQuery: (value: string) => void;
  setEventTypeFilter: (value: EventTypeFilter) => void;
  setParticipantsFilter: (value: ParticipantsFilter) => void;
  goToToday: () => void;
  goToDate: (date: Date) => void;
  goToNextWeek: () => void;
  goToPreviousWeek: () => void;
  getWeekDays: () => Date[];
  getCurrentWeekEvents: () => Event[];
  loadWeekEvents: () => Promise<void>;
  addEvent: (input: CreateEventInput) => Promise<void>;
}

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function toDateParam(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function eventHasMeeting(event: Event): boolean {
  return Boolean(event.meetingLink) || /call|meeting/i.test(event.title);
}

function filterEvents(
  events: Event[],
  searchQuery: string,
  eventTypeFilter: EventTypeFilter,
  participantsFilter: ParticipantsFilter
): Event[] {
  const query = searchQuery.trim().toLowerCase();

  return events.filter((event) => {
    if (query && !event.title.toLowerCase().includes(query)) return false;
    if (eventTypeFilter === "with-meeting" && !eventHasMeeting(event)) return false;
    if (eventTypeFilter === "without-meeting" && eventHasMeeting(event)) return false;
    if (participantsFilter === "with-participants" && event.participants.length === 0) return false;
    if (participantsFilter === "without-participants" && event.participants.length > 0) return false;
    return true;
  });
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentWeekStart: getWeekStart(new Date()),
  events: [],
  searchQuery: "",
  eventTypeFilter: "all",
  participantsFilter: "all",
  isLoadingEvents: false,
  eventsError: null,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setEventTypeFilter: (eventTypeFilter) => set({ eventTypeFilter }),
  setParticipantsFilter: (participantsFilter) => set({ participantsFilter }),

  goToToday: () => set({ currentWeekStart: getWeekStart(new Date()) }),
  goToDate: (date) => set({ currentWeekStart: getWeekStart(date) }),
  goToNextWeek: () => set((state) => ({ currentWeekStart: addDays(state.currentWeekStart, 7) })),
  goToPreviousWeek: () => set((state) => ({ currentWeekStart: addDays(state.currentWeekStart, -7) })),

  getWeekDays: () => {
    const { currentWeekStart } = get();
    return Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index));
  },

  getCurrentWeekEvents: () => {
    const { events, searchQuery, eventTypeFilter, participantsFilter } = get();
    return filterEvents(events, searchQuery, eventTypeFilter, participantsFilter);
  },

  loadWeekEvents: async () => {
    const { currentWeekStart } = get();
    const start = toDateParam(currentWeekStart);
    const end = toDateParam(addDays(currentWeekStart, 6));

    set({ isLoadingEvents: true, eventsError: null });

    try {
      const response = await fetch(`/api/events?start=${start}&end=${end}`, {
        headers: getAuthHeaders(),
      });
      const payload = (await response.json().catch(() => ({}))) as { events?: Event[]; message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load events.");
      }

      set({ events: Array.isArray(payload.events) ? payload.events : [], isLoadingEvents: false });
    } catch (error) {
      set({
        events: [],
        isLoadingEvents: false,
        eventsError: error instanceof Error ? error.message : "Unable to load events.",
      });
    }
  },

  addEvent: async (input) => {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(input),
    });
    const payload = (await response.json().catch(() => ({}))) as { event?: Event; message?: string };

    if (!response.ok || !payload.event) {
      throw new Error(payload.message || "Unable to create event.");
    }

    set((state) => ({ events: [...state.events, payload.event as Event] }));
  },
}));
