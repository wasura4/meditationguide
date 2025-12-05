'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { BottomNav } from '@/components/app/BottomNav';
import { EventService } from '@/lib/eventService';
import { MeditationEvent, EventStats, EventParticipation } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInDays } from 'date-fns';
import { Calendar, Users, Clock, Target, TrendingUp, Award, ArrowLeft, Sparkles, Trophy, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
          </div>
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
  const isActive = event.startDate <= now && event.endDate >= now;
  const hasEnded = event.endDate < now;
  const progressPercentage = event.goalMinutes
    ? Math.min(((stats?.totalMinutes || 0) / event.goalMinutes) * 100, 100)
    : 0;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background relative overflow-hidden pb-24">
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-40 right-20 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-sm supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-foreground truncate">Event Details</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 relative z-10">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* Hero Section */}
            <motion.div variants={item} className="text-center space-y-4">
              <div className="inline-flex items-center justify-center">
                {isActive && (
                  <div className="px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-medium flex items-center gap-2 shadow-lg shadow-green-500/5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    Active Event • {daysRemaining} days left
                  </div>
                )}
                {hasEnded && (
                  <div className="px-4 py-1.5 rounded-full bg-gray-500/10 border border-gray-500/20 text-muted-foreground text-sm font-medium">
                    Event Ended
                  </div>
                )}
                {!isActive && !hasEnded && (
                  <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-medium">
                    Starts {format(event.startDate, 'MMM dd')}
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
                  {event.title}
                </h1>
                {event.titleEn && (
                  <p className="text-lg text-muted-foreground font-light">{event.titleEn}</p>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-white/5 inline-flex px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                <Calendar className="h-4 w-4" />
                <span>{format(event.startDate, 'MMM dd')} - {format(event.endDate, 'MMM dd, yyyy')}</span>
              </div>
            </motion.div>

            {/* Description Card */}
            <motion.div variants={item} className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Sparkles className="w-5 h-5" />
                <h2 className="font-semibold">About This Event</h2>
              </div>
              <p className="text-foreground/90 leading-relaxed text-lg">{event.description}</p>
              {event.descriptionEn && (
                <p className="mt-3 text-muted-foreground leading-relaxed">{event.descriptionEn}</p>
              )}
              {event.meditationType && (
                <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary mt-0.5">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">Recommended Practice</p>
                    <p className="text-foreground font-medium">{event.meditationType}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Participants', value: stats?.totalParticipants || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Total Minutes', value: (stats?.totalMinutes || 0).toLocaleString(), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { label: 'Sessions', value: stats?.totalSessions || 0, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
                { label: 'Avg/User', value: Math.round(stats?.averageMinutesPerUser || 0), icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              ].map((stat, i) => (
                <div key={i} className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-5 hover:bg-white/10 transition-colors">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            {/* Goal Progress */}
            {event.goalMinutes && (
              <motion.div variants={item} className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Collective Goal
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">Join the community to reach the target</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{(stats?.totalMinutes || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">of {event.goalMinutes.toLocaleString()} mins</p>
                    </div>
                  </div>

                  <div className="h-4 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-sm border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-amber-500 relative"
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </motion.div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <span className="text-sm font-medium text-primary">{progressPercentage.toFixed(1)}% Complete</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Your Contribution */}
            {userParticipation && (
              <motion.div variants={item} className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Your Contribution</h3>
                    <p className="text-sm text-muted-foreground">Keep up the good practice!</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                    <p className="text-sm text-muted-foreground mb-1">Minutes Meditated</p>
                    <p className="text-2xl font-bold text-primary">{userParticipation.totalMinutes}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                    <p className="text-sm text-muted-foreground mb-1">Sessions Completed</p>
                    <p className="text-2xl font-bold text-primary">{userParticipation.sessionCount}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Leaderboard */}
            {stats && stats.topContributors.length > 0 && (
              <motion.div variants={item} className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6 sm:p-8">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Medal className="w-5 h-5 text-amber-500" />
                  Top Contributors
                </h3>
                <div className="space-y-3">
                  {stats.topContributors.slice(0, 5).map((contributor, index) => (
                    <div
                      key={contributor.userId}
                      className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm shadow-lg ${index === 0
                              ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-white'
                              : index === 1
                                ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                                : index === 2
                                  ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
                                  : 'bg-white/10 text-muted-foreground'
                            }`}
                        >
                          {index + 1}
                        </div>
                        <span className="font-medium text-foreground">
                          {contributor.displayName}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {contributor.minutes} min
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contributor.sessions} sessions
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* CTA Button */}
            {isActive && (
              <motion.div variants={item} className="fixed bottom-24 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none">
                <Button
                  size="lg"
                  onClick={() => router.push(`/meditate?eventId=${eventId}`)}
                  className="pointer-events-auto px-8 py-6 rounded-full text-lg font-semibold shadow-2xl shadow-primary/25 hover:scale-105 transition-transform"
                >
                  Meditate for This Event
                </Button>
              </motion.div>
            )}
          </motion.div>
        </main>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
