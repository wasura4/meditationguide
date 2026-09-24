import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from "firebase/firestore";
import { checkinDay, type CheckinQuestion } from "./checkins";

export async function saveCheckin(
  db: Firestore,
  uid: string,
  questionId: string,
  answer: boolean,
  expectedDay: string,
  expectedVersion?: number,
) {
  const day = checkinDay();
  if (day.day !== expectedDay) throw new Error("day-changed");
  const ref = doc(
    db,
    "users",
    uid,
    "daily_checkins",
    `${day.day}_${questionId}`,
  );
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists()) {
      transaction.update(ref, { answer, updatedAt: serverTimestamp() });
      return;
    }
    const question = await transaction.get(
      doc(db, "daily_checkin_questions", questionId),
    );
    if (!question.exists() || question.data().status !== "active")
      throw new Error("question-changed");
    const data = question.data();
    if (expectedVersion !== undefined && data.version !== expectedVersion)
      throw new Error("question-changed");
    transaction.set(ref, {
      day: day.day,
      questionId,
      questionVersion: data.version,
      titleEn: data.titleEn,
      titleSi: data.titleSi,
      answer,
      dayStart: Timestamp.fromDate(day.start),
      dayEnd: Timestamp.fromDate(day.end),
      startOffset: day.startOffset,
      endOffset: day.endOffset,
      timeZone: day.timeZone,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function saveCheckinQuestion(
  db: Firestore,
  uid: string,
  input: Pick<CheckinQuestion, "titleEn" | "titleSi" | "order" | "status">,
  original?: CheckinQuestion,
) {
  const ref = original
    ? doc(db, "daily_checkin_questions", original.id)
    : doc(collection(db, "daily_checkin_questions"));
  await runTransaction(db, async (transaction) => {
    if (original) {
      const current = await transaction.get(ref);
      if (!current.exists() || current.data().version !== original.version)
        throw new Error("conflict");
      transaction.update(ref, {
        ...input,
        version: original.version + 1,
        updatedBy: uid,
        updatedAt: serverTimestamp(),
      });
    } else {
      transaction.set(ref, {
        ...input,
        version: 1,
        createdBy: uid,
        updatedBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  });
}
