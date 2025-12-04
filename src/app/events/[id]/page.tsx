'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { BottomNav } from '@/components/app/BottomNav';
import { EventService } from '@/lib/eventService';
import { MeditationEvent, EventStats, EventParticipation } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInDays } from 'date-fns';
import { Calendar, Users, Clock, Target, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const eventId = params.id as string;

  const [event, setEvent] = useState<MeditationEvent | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [userParticipation, setUserParticipation] = useState<EventParticipation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEventData = async () => {
      if (!eventId || !user) return;

      try {
        setLoading(true);
        const [eventData, statsData, participationData] = await Promise.all([
          EventService.getEvent(eventId),
          EventService.getEventStats(eventId),
          EventService.getUserParticipation(eventId, user.id),
        ]);

        setEvent(eventData);
        setStats(statsData);
        setUserParticipation(participationData);
      } catch (error) {
        console.error('Error loading event data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId, user]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading event...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!event) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
          <h1 className="text-2xl font-bold text-foreground">Event not found</h1>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  const now = new Date();
  const daysRemaining = differenceInDays(event.endDate, now);
  const daysTotal = differenceInDays(event.endDate, event.startDate);
  const isActive = event.startDate <= now && event.endDate >= now;
  const hasEnded = event.endDate < now;
  const progressPercentage = event.goalMinutes
    ? Math.min(((stats?.totalMinutes || 0) / event.goalMinutes) * 100, 100)
    : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="mb-4">
              ← Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
            {event.titleEn && (
              <p className="mt-1 text-lg text-muted-foreground">{event.titleEn}</p>
            )}
          </div>

          {/* Status Banner */}
          <div
            className={`mb-6 rounded-lg border p-4 ${
              isActive
                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                : hasEnded
                  ? 'border-gray-500 bg-gray-50 dark:bg-gray-900'
                  : 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                {isActive && (
                  <>
                    <p className="font-semibold text-green-700 dark:text-green-300">
                      Event Active
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                    </p>
                  </>
                )}
                {hasEnded && (
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Event Ended</p>
                )}
                {!isActive && !hasEnded && (
                  <>
                    <p className="font-semibold text-blue-700 dark:text-blue-300">
                      Upcoming Event
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Starts {format(event.startDate, 'MMM dd, yyyy')}
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(event.startDate, 'MMM dd')} - {format(event.endDate, 'MMM dd, yyyy')}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6 rounded-lg border border-border bg-card p-6">
            <h2 className="mb-3 text-xl font-semibold text-card-foreground">About This Event</h2>
            <p className="text-card-foreground">{event.description}</p>
            {event.descriptionEn && (
              <p className="mt-2 text-muted-foreground">{event.descriptionEn}</p>
            )}
            {event.meditationType && (
              <div className="mt-4 rounded-md bg-accent/50 p-3">
                <p className="text-sm font-medium text-accent-foreground">
                  Recommended Practice: {event.meditationType}
                </p>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">Participants</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-card-foreground">
                {stats?.totalParticipants || 0}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Total Minutes</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-card-foreground">
                {(stats?.totalMinutes || 0).toLocaleString()}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Sessions</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-card-foreground">
                {stats?.totalSessions || 0}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span className="text-sm">Avg/User</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-card-foreground">
                {Math.round(stats?.averageMinutesPerUser || 0)}
              </p>
            </div>
          </div>

          {/* Goal Progress */}
          {event.goalMinutes && (
            <div className="mb-6 rounded-lg border border-border bg-card p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-card-foreground">Collective Goal</h3>
                <span className="text-sm text-muted-foreground">
                  {(stats?.totalMinutes || 0).toLocaleString()} / {event.goalMinutes.toLocaleString()} minutes
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-accent/30">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {progressPercentage.toFixed(1)}% complete
              </p>
            </div>
          )}

          {/* Your Contribution */}
          {userParticipation && (
            <div className="mb-6 rounded-lg border border-primary/50 bg-primary/5 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-card-foreground">Your Contribution</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Minutes Meditated</p>
                  <p className="text-2xl font-bold text-primary">
                    {userParticipation.totalMinutes}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sessions Completed</p>
                  <p className="text-2xl font-bold text-primary">
                    {userParticipation.sessionCount}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Top Contributors */}
          {stats && stats.topContributors.length > 0 && (
            <div className="mb-6 rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-card-foreground">
                Top Contributors
              </h3>
              <div className="space-y-3">
                {stats.topContributors.slice(0, 5).map((contributor, index) => (
                  <div
                    key={contributor.userId}
                    className="flex items-center justify-between rounded-md bg-accent/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                          index === 0
                            ? 'bg-yellow-500 text-white'
                            : index === 1
                              ? 'bg-gray-400 text-white'
                              : index === 2
                                ? 'bg-amber-600 text-white'
                                : 'bg-accent text-accent-foreground'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium text-card-foreground">
                        {contributor.displayName}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-card-foreground">
                        {contributor.minutes} min
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contributor.sessions} sessions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Button */}
          {isActive && (
            <div className="text-center">
              <Button
                size="lg"
                onClick={() => router.push(`/meditate?eventId=${eventId}`)}
                className="px-8"
              >
                Meditate for This Event
              </Button>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
