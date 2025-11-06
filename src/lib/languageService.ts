import { collection, doc, setDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
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

  // Get translation by key
  static async getTranslationByKey(key: string): Promise<Translation | null> {
    try {
      const q = query(collection(db, this.COLLECTION), orderBy('key', 'asc'));
      const querySnapshot = await getDocs(q);
      
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        if (data.key === key) {
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
        }
      }

      return null;
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

  // Get translations by category
  static async getTranslationsByCategory(category: string): Promise<Translation[]> {
    try {
      const allTranslations = await this.getAllTranslations();
      return allTranslations.filter(t => t.category === category);
    } catch (error) {
      console.error('Error fetching translations by category:', error);
      throw new Error('Failed to fetch translations by category');
    }
  }
}

