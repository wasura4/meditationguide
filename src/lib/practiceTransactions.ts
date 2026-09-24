import { doc, runTransaction, type Firestore } from "firebase/firestore";
import type { MeditationSession } from "@/types";
import type { PracticeClock } from "./meditationClock";

export function practiceSession(clock: PracticeClock): MeditationSession {
  if (
    clock.phase !== "finished" ||
    !clock.endsAt ||
    !clock.outcome ||
    clock.elapsedMs < 1000
  )
    throw new Error("No practice to save");
  return {
    id: clock.id,
    userId: clock.userId,
    typeId: clock.typeId,
    typeName: clock.typeName,
    startTime: new Date(clock.startedAt),
    endTime: new Date(clock.endsAt),
    duration: Math.floor(clock.elapsedMs / 1000) / 60,
    status: clock.outcome,
    tags: [clock.typeId],
    ...(clock.eventId ? { eventId: clock.eventId } : {}),
    createdAt: new Date(clock.endsAt),
    updatedAt: new Date(clock.endsAt),
  };
}

/** Acknowledged once, including event credit. Retries never overwrite reflection. */
export async function savePractice(
  store: Firestore,
  clock: PracticeClock,
): Promise<MeditationSession> {
  const session = practiceSession(clock);
  const reference = doc(store, "meditation_sessions", clock.id);
  return runTransaction(store, async (tx) => {
    const existing = await tx.get(reference);
    if (existing.exists()) {
      if (existing.data().userId !== clock.userId)
        throw new Error("Session owner mismatch");
      const saved = existing.data();
      if (!["completed", "abandoned"].includes(saved.status))
        throw new Error("Session is not finished");
      return {
        ...saved,
        id: existing.id,
        startTime: saved.startTime.toDate(),
        endTime: saved.endTime.toDate(),
        createdAt: saved.createdAt.toDate(),
        updatedAt: saved.updatedAt.toDate(),
      } as MeditationSession;
    }
    const participation =
      clock.eventId && clock.outcome === "completed"
        ? doc(store, "event_participation", `${clock.eventId}_${clock.userId}`)
        : null;
    const previous = participation ? await tx.get(participation) : null;
    const data = { ...session } as Partial<MeditationSession>;
    delete data.id;
    tx.set(reference, data);
    if (participation) {
      const old = previous?.data();
      const endedAt = session.endTime!.getTime();
      tx.set(participation, {
        eventId: clock.eventId,
        userId: clock.userId,
        totalMinutes: (old?.totalMinutes || 0) + session.duration,
        sessionCount: (old?.sessionCount || 0) + 1,
        firstSessionAt: new Date(
          Math.min(old?.firstSessionAt?.toMillis() ?? endedAt, endedAt),
        ),
        lastSessionAt: new Date(
          Math.max(old?.lastSessionAt?.toMillis() ?? endedAt, endedAt),
        ),
        createdAt: old?.createdAt || session.endTime,
        updatedAt: session.endTime,
      });
    }
    return session;
  });
}
