import { collection, doc, setDoc, getDocs, query, orderBy, where, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export interface Translation {
  id: string;
  key: string;
  english: string;
  sinhala: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export class LanguageService {
  private static COLLECTION = 'translations';

  // Get all translations
  static async getAllTranslations(): Promise<Translation[]> {
    try {
      const q = query(collection(db, this.COLLECTION), orderBy('key', 'asc'));
      const querySnapshot = await getDocs(q);
      const translations: Translation[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        translations.push({
          id: docSnapshot.id,
          key: data.key || '',
          english: data.english || '',
          sinhala: data.sinhala || '',
          category: data.category || 'common',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          updatedBy: data.updatedBy || '',
        } as Translation);
      });

      return translations;
    } catch (error) {
      console.error('Error fetching translations:', error);
      throw new Error('Failed to fetch translations');
    }
  }

  // Get translation by key (optimized with where clause)
  static async getTranslationByKey(key: string): Promise<Translation | null> {
    try {
      // Use where() for efficient single key lookup
      const q = query(
        collection(db, this.COLLECTION),
        where('key', '==', key)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const docSnapshot = querySnapshot.docs[0];
      const data = docSnapshot.data();

      return {
        id: docSnapshot.id,
        key: data.key || '',
        english: data.english || '',
        sinhala: data.sinhala || '',
        category: data.category || 'common',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        updatedBy: data.updatedBy || '',
      } as Translation;
    } catch (error) {
      console.error('Error fetching translation:', error);
      throw new Error('Failed to fetch translation');
    }
  }

  // Create or update translation
  static async saveTranslation(translation: Omit<Translation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
    try {
      const translationRef = translation.id 
        ? doc(db, this.COLLECTION, translation.id)
        : doc(collection(db, this.COLLECTION));

      const translationData = {
        key: translation.key,
        english: translation.english,
        sinhala: translation.sinhala,
        category: translation.category || 'common',
        updatedBy: translation.updatedBy,
        updatedAt: Timestamp.now(),
        ...(translation.id ? {} : { createdAt: Timestamp.now() }),
      };

      await setDoc(translationRef, translationData, { merge: true });
      this.clearCache();
      return translationRef.id;
    } catch (error: unknown) {
      // Surface Firebase error details
      const err = error as { message?: string; code?: string };
      const msg = err?.message || 'Failed to save translation';
      const code = err?.code ? ` (${err.code})` : '';
      console.error('Error saving translation:', error);
      throw new Error(`${msg}${code}`);
    }
  }

  // Bulk import translations from JSON
  static async importTranslations(translations: Array<{ key: string; english: string; sinhala: string; category?: string }>, updatedBy: string): Promise<void> {
    try {
      const batch = translations.map(t => this.saveTranslation({
        key: t.key,
        english: t.english,
        sinhala: t.sinhala,
        category: t.category || 'common',
        updatedBy,
      }));

      await Promise.all(batch);
    } catch (error) {
      console.error('Error importing translations:', error);
      throw new Error('Failed to import translations');
    }
  }

  // Get translations by category (optimized with where clause)
  static async getTranslationsByCategory(category: string): Promise<Translation[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('category', '==', category),
        orderBy('key', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const translations: Translation[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        translations.push({
          id: docSnapshot.id,
          key: data.key || '',
          english: data.english || '',
          sinhala: data.sinhala || '',
          category: data.category || 'common',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          updatedBy: data.updatedBy || '',
        } as Translation);
      });

      return translations;
    } catch (error) {
      console.error('Error fetching translations by category:', error);
      throw new Error('Failed to fetch translations by category');
    }
  }

  // Bulk sync all English keys to Firestore
  static async syncAllEnglishKeys(
    englishTranslations: Record<string, unknown>,
    updatedBy: string,
    prefix = ''
  ): Promise<{ synced: number; errors: number }> {
    try {
      const keysToSync: Array<{ key: string; english: string; category: string }> = [];

      // Recursively extract all keys from nested object
      const extractKeys = (obj: Record<string, unknown>, currentPrefix = '') => {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const fullKey = currentPrefix ? `${currentPrefix}.${key}` : key;
            const value = obj[key];

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              extractKeys(value as Record<string, unknown>, fullKey);
            } else if (typeof value === 'string') {
              keysToSync.push({
                key: fullKey,
                english: value,
                category: fullKey.split('.')[0] || 'common'
              });
            }
          }
        }
      };

      extractKeys(englishTranslations, prefix);

      // Get existing translations to preserve Sinhala
      const existingTranslations = await this.getAllTranslations();
      const existingMap = new Map(existingTranslations.map(t => [t.key, t]));

      // Use batched writes for efficiency (max 500 per batch)
      const BATCH_SIZE = 500;
      let synced = 0;
      let errors = 0;

      for (let i = 0; i < keysToSync.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = keysToSync.slice(i, i + BATCH_SIZE);

        chunk.forEach(({ key, english, category }) => {
          const existing = existingMap.get(key);
          const translationRef = existing?.id
            ? doc(db, this.COLLECTION, existing.id)
            : doc(collection(db, this.COLLECTION));

          batch.set(
            translationRef,
            {
              key,
              english,
              sinhala: existing?.sinhala || '', // Preserve existing Sinhala
              category,
              updatedBy,
              updatedAt: Timestamp.now(),
              ...(existing?.id ? {} : { createdAt: Timestamp.now() }),
            },
            { merge: true }
          );
        });

        try {
          await batch.commit();
          synced += chunk.length;
        } catch (error) {
          console.error('Batch commit error:', error);
          errors += chunk.length;
        }
      }

      return { synced, errors };
    } catch (error) {
      console.error('Error syncing English keys:', error);
      throw new Error('Failed to sync English keys');
    }
  }

  // Clear cache (call this after updates to force reload)
  static clearCache(): void {
    // This is a helper for the LanguageContext cache
    // Implementation depends on how you expose cache clearing
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('nirvanaya-translations-updated'));
  }
}

