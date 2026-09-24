'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EventService } from '@/lib/eventService';
import { MeditationEvent } from '@/types';
import { ArrowRight, Flower2 } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { eventTiming } from '@/lib/eventTiming';
import { Button } from '@/components/ui/button';

export const EventBanner: React.FC = () => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [activeEvents, setActiveEvents] = useState<MeditationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let disposed = false;
    let request = 0;
    const loadActiveEvents = async () => {
      const current = ++request;
      setNow(new Date());
      try {
        const events = await EventService.getActiveEvents();
        if (!disposed && current === request) { setActiveEvents(events); setError(false); }
      } catch {
        if (!disposed && current === request) setError(true);
      } finally {
        if (!disposed && current === request) setLoading(false);
      }
    };

    const onVisible = () => { if (!document.hidden) void loadActiveEvents(); };
    void loadActiveEvents();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    const timer = window.setInterval(onVisible, 60000);
    return () => {
      disposed = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, [attempt]);

  if (loading || (!error && activeEvents.length === 0)) {
    return null;
  }

  const visibleEvents = activeEvents.filter(event => eventTiming(event, now).active);
  if (!error && visibleEvents.length === 0) return null;

  return (
    <section aria-label={t('eventInvite.section')} className="space-y-3">
      {error && <div role="alert" className="home-glass p-4 text-sm">{t('eventInvite.error')} <button className="min-h-11 underline" onClick={() => setAttempt(value => value + 1)}>{t('common.retry')}</button></div>}
      {visibleEvents.map(event => {
        const { daysRemaining } = eventTiming(event, now);
        const title = language === 'en' ? event.titleEn || event.title : event.title;
        return (
          <article key={event.id} aria-labelledby={'event-invite-' + event.id} className="home-event-invite relative isolate overflow-hidden rounded-3xl border border-primary/30 p-4 sm:p-5">
            <Flower2 aria-hidden="true" strokeWidth={0.8} className="pointer-events-none absolute -right-5 -top-5 -z-10 h-40 w-40 rotate-12 text-primary/15" />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-2.5 py-1 text-foreground">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t('eventInvite.live')}
              </span>
              <span className="text-muted-foreground">{t(daysRemaining === 1 ? 'eventInvite.lastDay' : 'eventInvite.daysLeft', { count: daysRemaining })}</span>
            </div>
            <h2 id={'event-invite-' + event.id} className="mt-3 line-clamp-2 break-words text-lg font-semibold leading-relaxed tracking-tight sm:text-xl">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('eventInvite.invitation')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <Button disabled={error} onClick={() => router.push('/meditate?eventId=' + encodeURIComponent(event.id))} className="h-auto min-h-11 max-w-full whitespace-normal rounded-full px-5 py-2 text-sm font-semibold">
                {t('eventInvite.join')}
                <ArrowRight size={16} className="ml-2 shrink-0" aria-hidden="true" />
              </Button>
              <Link href={'/events/' + encodeURIComponent(event.id)} className="inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-medium underline decoration-primary/35 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{t('eventInvite.details')}</Link>
            </div>
          </article>
        );
      })}
    </section>
  );
};
