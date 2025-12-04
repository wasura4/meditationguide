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
    <div className="space-y-4">
      {activeEvents.map((event) => {
        const daysRemaining = differenceInDays(event.endDate, new Date());
        const daysTotal = differenceInDays(event.endDate, event.startDate);
        const daysPassed = daysTotal - daysRemaining;
        const progressPercentage = (daysPassed / daysTotal) * 100;

        return (
          <div
            key={event.id}
            className="group relative overflow-hidden rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6 transition-all hover:shadow-lg"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] bg-[size:24px_24px]" />
            </div>

            <div className="relative">
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                    <Calendar className="h-3 w-3" />
                    Active Event
                  </div>
                  <h3 className="mt-3 text-2xl font-bold text-foreground">{event.title}</h3>
                  {event.titleEn && (
                    <p className="mt-1 text-sm text-muted-foreground">{event.titleEn}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="mb-4 text-sm text-foreground/80 line-clamp-2">
                {event.description}
              </p>

              {/* Stats */}
              <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(event.startDate, 'MMM dd')} - {format(event.endDate, 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Event Progress</span>
                  <span>
                    Day {daysPassed} of {daysTotal}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-accent/30">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push(`/events/${event.id}`)}
                  className="flex-1 group-hover:shadow-md"
                >
                  View Event Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/meditate?eventId=${event.id}`)}
                  className="px-6"
                >
                  Meditate
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
