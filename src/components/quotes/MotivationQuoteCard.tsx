'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Quote } from 'lucide-react';
import { db } from '@/lib/firebase';
import { currentQuote, nextQuoteDelay, type MotivationQuote } from '@/lib/motivationQuotes';
import { useLanguage } from '@/contexts/LanguageContext';

export function MotivationQuoteCard() {
  const { language, t } = useLanguage();
  const [quotes, setQuotes] = useState<MotivationQuote[]>([]);
  const [now, setNow] = useState(0);
  useEffect(() => onSnapshot(query(collection(db, 'motivation_quotes'), where('status', '==', 'published')),
    snapshot => setQuotes(snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as MotivationQuote)),
    () => setQuotes([]),
  ), []);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const time = Date.now();
      setNow(time);
      timer = setTimeout(refresh, nextQuoteDelay(time));
    };
    const onVisible = () => { if (!document.hidden) refresh(); };
    refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', refresh); };
  }, []);
  const quote = now ? currentQuote(quotes, now) : undefined;
  if (!quote) return null;
  const textLanguage = language === 'si' ? (quote.textSi ? 'si' : 'en') : (quote.textEn ? 'en' : 'si');
  return (
    <section aria-label={t('quotes.title')} className="rounded-3xl border border-border bg-card/90 p-6 text-card-foreground shadow-sm sm:p-8">
      <div className="mb-4 flex items-center gap-2 text-primary">
        <Quote size={20} aria-hidden="true" />
        <h2 className="text-xs font-semibold uppercase tracking-widest">{t('quotes.title')}</h2>
      </div>
      <figure aria-live="polite" aria-atomic="true">
        <blockquote lang={textLanguage} className="whitespace-pre-wrap break-words text-lg font-medium leading-relaxed sm:text-xl">
          {textLanguage === 'si' ? quote.textSi : quote.textEn}
        </blockquote>
        {quote.author && <figcaption className="mt-4 break-words text-sm text-muted-foreground">— {quote.author}</figcaption>}
      </figure>
      <p className="mt-5 text-xs text-muted-foreground">{t('quotes.rotation')}</p>
    </section>
  );
}
