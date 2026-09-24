import { collection, doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { MotivationQuote } from './motivationQuotes';

export async function saveMotivationQuote(
  db: Firestore,
  uid: string,
  input: Pick<MotivationQuote, 'textEn' | 'textSi' | 'author' | 'order' | 'status'>,
  original?: MotivationQuote,
) {
  const data = { ...input, textEn: input.textEn.trim(), textSi: input.textSi.trim(), author: input.author.trim() };
  if ((!data.textEn && !data.textSi) || data.textEn.length > 1200 || data.textSi.length > 1200 || data.author.length > 160 ||
      !Number.isInteger(data.order) || data.order < 0 || data.order > 999 || !['draft', 'published', 'archived'].includes(data.status)) {
    throw new Error('invalid-quote');
  }
  const ref = original ? doc(db, 'motivation_quotes', original.id) : doc(collection(db, 'motivation_quotes'));
  await runTransaction(db, async transaction => {
    if (original) {
      const current = await transaction.get(ref);
      if (!current.exists() || current.data().version !== original.version) throw new Error('conflict');
      transaction.update(ref, { ...data, version: original.version + 1, updatedBy: uid, updatedAt: serverTimestamp() });
    } else {
      transaction.set(ref, { ...data, version: 1, createdBy: uid, updatedBy: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
  });
}
