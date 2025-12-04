'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EventService } from '@/lib/eventService';
import { MeditationEvent } from '@/types';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';

export const EventBanner: React.FC = () => {
  const router = useRouter();
  const [activeEvents, setActiveEvents] = useState<MeditationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActiveEvents = async () => {
      try {
        console.log('[EventBanner] Loading active events...');
        const events = await EventService.getActiveEvents();
        console.log('[EventBanner] Active events loaded:', events);
        console.log('[EventBanner] Number of active events:', events.length);
        setActiveEvents(events);
      } catch (error) {
        console.error('[EventBanner] Error loading active events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActiveEvents();
  }, []);

  if (loading || activeEvents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {activeEvents.map((event) => {
        const daysRemaining = differenceInDays(event.endDate, new Date());
        const daysTotal = differenceInDays(event.endDate, event.startDate);
        const daysPassed = daysTotal - daysRemaining;
        const progressPercentage = Math.min(Math.max((daysPassed / daysTotal) * 100, 0), 100);

        return (
          <div
            key={event.id}
            className="group relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent backdrop-blur-xl p-6 sm:p-8 shadow-xl transition-all hover:shadow-2xl hover:border-primary/40"
          >
            {/* Animated Background Glow */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/20 blur-3xl transition-all group-hover:bg-primary/30" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-accent/20 blur-3xl transition-all group-hover:bg-accent/30" />

            <div className="relative z-10">
              {/* Header */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider shadow-sm backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Active Event
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{event.title}</h3>
                  {event.titleEn && (
                    <p className="text-base text-muted-foreground font-medium">{event.titleEn}</p>
                  )}
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-2xl font-bold text-primary">{daysRemaining}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Days Left</div>
                </div>
              </div>

              {/* Description */}
              <p className="mb-6 text-base text-muted-foreground/90 line-clamp-2 max-w-3xl leading-relaxed">
                {event.description}
              </p>

              {/* Progress Section */}
              <div className="mb-8 bg-background/40 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
                <div className="mb-2 flex items-center justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Event Progress</span>
                  <span className="text-primary">
                    {Math.round(progressPercentage)}% Complete
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{format(event.startDate, 'MMM dd')}</span>
                  <span>{format(event.endDate, 'MMM dd')}</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push(`/events/${event.id}`)}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/25 h-12 rounded-xl text-base font-medium transition-all"
                >
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/meditate?eventId=${event.id}`)}
                  className="flex-1 border-primary/20 hover:bg-primary/5 hover:border-primary/40 h-12 rounded-xl text-base font-medium backdrop-blur-sm transition-all"
                >
                  Join Session
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
