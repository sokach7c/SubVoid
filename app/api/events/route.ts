import { NextResponse } from "next/server";
import { createEvent, listEventsInRange } from "@/lib/events/repository";
import type { CreateEventInput } from "@/lib/events/types";
import { verifyRequestAuth } from "@/lib/auth";

export const runtime = "nodejs";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

interface EventPayload {
  title?: unknown;
  date?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  participants?: unknown;
  meetingLink?: unknown;
  timezone?: unknown;
}

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await verifyRequestAuth(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!start || !end || !DATE_PATTERN.test(start) || !DATE_PATTERN.test(end)) {
    return NextResponse.json(
      { message: "Valid start and end dates are required." },
      { status: 400 }
    );
  }

  return NextResponse.json({ events: listEventsInRange(start, end) });
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await verifyRequestAuth(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as EventPayload;
  const input = parseCreateEventPayload(payload);

  if (!input) {
    return NextResponse.json(
      { message: "A valid event payload is required." },
      { status: 400 }
    );
  }

  return NextResponse.json({ event: createEvent(input) }, { status: 201 });
}

function parseCreateEventPayload(payload: EventPayload): CreateEventInput | null {
  if (
    typeof payload.title !== "string" ||
    typeof payload.date !== "string" ||
    typeof payload.startTime !== "string" ||
    typeof payload.endTime !== "string" ||
    !payload.title.trim() ||
    !DATE_PATTERN.test(payload.date) ||
    !TIME_PATTERN.test(payload.startTime) ||
    !TIME_PATTERN.test(payload.endTime)
  ) {
    return null;
  }

  const participants = Array.isArray(payload.participants)
    ? payload.participants.filter(
        (participant): participant is string => typeof participant === "string"
      )
    : [];

  return {
    title: payload.title.trim(),
    date: payload.date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    participants,
    meetingLink:
      typeof payload.meetingLink === "string" && payload.meetingLink.trim()
        ? payload.meetingLink.trim()
        : undefined,
    timezone:
      typeof payload.timezone === "string" && payload.timezone.trim()
        ? payload.timezone.trim()
        : undefined,
  };
}
