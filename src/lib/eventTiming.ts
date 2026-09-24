import type { MeditationEvent } from '@/types';

type EventWindow = Pick<MeditationEvent, 'startDate' | 'endDate' | 'isActive'>;

export function eventTiming(event: EventWindow, now = new Date()) {
  const start = event.startDate.getTime();
  const end = event.endDate.getTime();
  const time = now.getTime();
  const valid = Number.isFinite(start) && Number.isFinite(end) && end > start;
  return {
    active: valid && event.isActive && time >= start && time <= end,
    ended: valid && time > end,
    daysRemaining: valid ? Math.max(0, Math.ceil((end - time) / 86_400_000)) : 0,
    elapsedPercent: valid ? Math.min(100, Math.max(0, (time - start) / (end - start) * 100)) : 0,
  };
}

/** Credit by the recorded practice time, so delayed sync still works. */
export function qualifiesForEvent(event: EventWindow, startedAt: number, endedAt: number) {
  return eventTiming(event, new Date(startedAt)).active &&
    Number.isFinite(endedAt) && endedAt >= startedAt && endedAt <= event.endDate.getTime();
}
