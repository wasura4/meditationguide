'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { MeditationEvent } from '@/types';
import { EventService } from '@/lib/eventService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';
import { Calendar, Plus, Edit2, Trash2, Eye, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminEventsPage() {
  const { adminUser } = useAdminAuth();
  const [events, setEvents] = useState<MeditationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MeditationEvent | null>(null);
  const { showToast } = useToast();

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const allEvents = await EventService.getAllEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load events',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adminUser) return;

    const formData = new FormData(e.currentTarget);

    try {
      const eventData = {
        title: formData.get('title') as string,
        titleEn: formData.get('titleEn') as string,
        description: formData.get('description') as string,
        descriptionEn: formData.get('descriptionEn') as string,
        meditationType: (formData.get('meditationType') as string) || undefined,
        startDate: new Date(formData.get('startDate') as string),
        endDate: new Date(formData.get('endDate') as string),
        isActive: formData.get('isActive') === 'on',
        goalMinutes: formData.get('goalMinutes')
          ? parseInt(formData.get('goalMinutes') as string, 10)
          : undefined,
        createdBy: adminUser.id,
      };

      await EventService.createEvent(eventData);
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Event created successfully',
        duration: 3000,
      });
      setShowCreateForm(false);
      loadEvents();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error creating event:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create event',
        duration: 5000,
      });
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEvent) return;

    const formData = new FormData(e.currentTarget);

    try {
      const updates = {
        title: formData.get('title') as string,
        titleEn: formData.get('titleEn') as string,
        description: formData.get('description') as string,
        descriptionEn: formData.get('descriptionEn') as string,
        meditationType: (formData.get('meditationType') as string) || undefined,
        startDate: new Date(formData.get('startDate') as string),
        endDate: new Date(formData.get('endDate') as string),
        isActive: formData.get('isActive') === 'on',
        goalMinutes: formData.get('goalMinutes')
          ? parseInt(formData.get('goalMinutes') as string, 10)
          : undefined,
      };

      await EventService.updateEvent(editingEvent.id, updates);
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Event updated successfully',
        duration: 3000,
      });
      setEditingEvent(null);
      loadEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update event',
        duration: 5000,
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await EventService.deleteEvent(eventId);
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Event deleted successfully',
        duration: 3000,
      });
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete event',
        duration: 5000,
      });
    }
  };

  const getEventStatus = (event: MeditationEvent): string => {
    const now = new Date();
    if (event.startDate > now) return 'upcoming';
    if (event.endDate < now) return 'past';
    return 'active';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'past':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminProtectedRoute requiredPermission={{ resource: 'content', action: 'read' }}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Meditation Events</h1>
              <p className="mt-2 text-muted-foreground">
                Create and manage special meditation events for your community
              </p>
            </div>
            <Button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setEditingEvent(null);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </div>

          {(showCreateForm || editingEvent) && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-xl font-semibold text-card-foreground">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-card-foreground">
                      Title (Sinhala) *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      defaultValue={editingEvent?.title}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                      placeholder="උදා: මෛත්‍රී භාවනා සතිය"
                    />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-card-foreground">
                      Title (English)
                    </label>
                    <input
                      type="text"
                      name="titleEn"
                      defaultValue={editingEvent?.titleEn}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                      placeholder="e.g., Metta Meditation Week"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="mb-1 block text-sm font-medium text-card-foreground">
                      Description (Sinhala) *
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      defaultValue={editingEvent?.description}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                      placeholder="ගංවතුර බලපෑමට ලක් වූවන් වෙනුවෙන් මෛත්‍රී භාවනා සතිය..."
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="mb-1 block text-sm font-medium text-card-foreground">
                      Description (English)
                    </label>
                    <textarea
                      name="descriptionEn"
                      rows={3}
                      defaultValue={editingEvent?.descriptionEn}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                      placeholder="7-day Metta meditation for flood victims..."
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-card-foreground">
                      Meditation Type (Optional)
                    </label>
                    <input
                      type="text"
                      name="meditationType"
                      defaultValue={editingEvent?.meditationType}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                      placeholder="e.g., මෛත්‍රී භාවනාව"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-card-foreground">
                      Goal Minutes (Optional)
                    </label>
                    <input
                      type="number"
                      name="goalMinutes"
                      defaultValue={editingEvent?.goalMinutes}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                      placeholder="10000"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-card-foreground">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      required
                      defaultValue={
                        editingEvent
                          ? format(editingEvent.startDate, 'yyyy-MM-dd')
                          : undefined
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-card-foreground">
                      End Date *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      required
                      defaultValue={
                        editingEvent ? format(editingEvent.endDate, 'yyyy-MM-dd') : undefined
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                    />
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      id="isActive"
                      defaultChecked={editingEvent ? editingEvent.isActive : true}
                      className="h-4 w-4 rounded border-input"
                    />
                    <label htmlFor="isActive" className="text-sm text-card-foreground">
                      Active
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Button type="submit">{editingEvent ? 'Update' : 'Create'} Event</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingEvent(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading events...</div>
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-card-foreground">No events yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first meditation event to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const status = getEventStatus(event);
                return (
                  <div
                    key={event.id}
                    className="rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-card-foreground">
                            {event.title}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(status)}`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                          {!event.isActive && (
                            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              Inactive
                            </span>
                          )}
                        </div>
                        {event.titleEn && (
                          <p className="mt-1 text-sm text-muted-foreground">{event.titleEn}</p>
                        )}
                        <p className="mt-2 text-sm text-card-foreground">{event.description}</p>
                        {event.meditationType && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Type: {event.meditationType}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(event.startDate, 'MMM dd, yyyy')} -{' '}
                            {format(event.endDate, 'MMM dd, yyyy')}
                          </span>
                          {event.goalMinutes && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Goal: {event.goalMinutes.toLocaleString()} minutes
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.location.href = `/events/${event.id}`;
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEvent(event);
                            setShowCreateForm(false);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
