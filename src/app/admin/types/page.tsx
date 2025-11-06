'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { MeditationType } from '@/types';
import { MeditationTypeService } from '@/lib/meditationTypeService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';
import { MEDITATION_CATEGORIES } from '@/constants';

export default function AdminMeditationTypesPage() {
  const { hasPermission } = useAdminAuth();
  const [types, setTypes] = useState<MeditationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingType, setEditingType] = useState<MeditationType | null>(null);
  const { showToast } = useToast();

  // Load meditation types
  const loadTypes = useCallback(async () => {
    try {
      setLoading(true);
      const allTypes = await MeditationTypeService.getAllTypes();
      setTypes(allTypes);
    } catch (error) {
      console.error('Error loading types:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load meditation types',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const handleCreateType = async (formData: FormData) => {
    try {
      const categoryValue = formData.get('category') as string;
      const isActiveValue = formData.get('isActive');
      // For new types, default to true if checkbox not present or checked
      // For existing types, use the checkbox value (checked = 'on', unchecked = null)
      const isActive = isActiveValue === 'on' || (isActiveValue === null && !editingType);
      
      const typeData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        category: categoryValue as 'vipassana' | 'samatha' | 'kasina' | 'mindfulness',
        defaultDuration: parseInt(formData.get('defaultDuration') as string),
        order: types.length + 1,
        isActive,
        tags: (formData.get('tags') as string).split(',').map(tag => tag.trim()).filter(tag => tag),
      };

      await MeditationTypeService.createType(typeData);
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Meditation type created successfully',
        duration: 3000
      });
      setShowCreateForm(false);
      loadTypes();
    } catch (error) {
      console.error('Error creating type:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create meditation type',
        duration: 5000
      });
    }
  };

  const handleUpdateType = async (typeId: string, formData: FormData) => {
    try {
      const categoryValue = formData.get('category') as string;
      const updates = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        category: categoryValue as 'vipassana' | 'samatha' | 'kasina' | 'mindfulness',
        defaultDuration: parseInt(formData.get('defaultDuration') as string),
        isActive: formData.get('isActive') === 'on',
        tags: (formData.get('tags') as string).split(',').map(tag => tag.trim()).filter(tag => tag),
      };

      await MeditationTypeService.updateType(typeId, updates);
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Meditation type updated successfully',
        duration: 3000
      });
      setEditingType(null);
      loadTypes();
    } catch (error) {
      console.error('Error updating type:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update meditation type',
        duration: 5000
      });
    }
  };

  const handleDeleteType = async (typeId: string) => {
    if (!confirm('Are you sure you want to delete this meditation type?')) return;

    try {
      await MeditationTypeService.deleteType(typeId);
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Meditation type deleted successfully',
        duration: 3000
      });
      loadTypes();
    } catch (error) {
      console.error('Error deleting type:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete meditation type',
        duration: 5000
      });
    }
  };

  const handleToggleStatus = async (typeId: string, currentStatus: boolean) => {
    try {
      await MeditationTypeService.toggleTypeStatus(typeId, !currentStatus);
      showToast({
        type: 'success',
        title: 'Success',
        message: `Meditation type ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        duration: 3000
      });
      loadTypes();
    } catch (error) {
      console.error('Error toggling status:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to toggle meditation type status',
        duration: 5000
      });
    }
  };

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout currentPage="/admin/types">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading meditation types...</p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/types">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Meditation Types Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create and manage meditation types for users
              </p>
            </div>
            {hasPermission('content', 'create') && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-[#6b9e7a] hover:bg-[#5a8a68]"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Type
              </Button>
            )}
          </div>

          {/* Create/Edit Form Modal */}
          {(showCreateForm || editingType) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {editingType ? 'Edit Meditation Type' : 'Create New Meditation Type'}
                </h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    if (editingType) {
                      handleUpdateType(editingType.id, formData);
                    } else {
                      handleCreateType(formData);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={editingType?.name || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Anapanasathi Meditation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      required
                      defaultValue={editingType?.description || ''}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Brief description of the meditation practice"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      required
                      defaultValue={editingType?.category || 'theravada'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {MEDITATION_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      name="defaultDuration"
                      required
                      min="1"
                      max="120"
                      defaultValue={editingType?.defaultDuration || 15}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      defaultValue={editingType?.tags?.join(', ') || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="breathing, mindfulness, focus"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      id="isActive"
                      defaultChecked={editingType?.isActive ?? true}
                      className="h-4 w-4 text-[var(--primary)] focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Active (visible to users)
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingType(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#6b9e7a] hover:bg-[#5a8a68]"
                    >
                      {editingType ? 'Update' : 'Create'} Type
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Types List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Meditation Types ({types.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {types.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🧘‍♀️</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No meditation types yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create your first meditation type to get started
                  </p>
                  {hasPermission('content', 'create') && (
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-[#6b9e7a] hover:bg-[#5a8a68]"
                    >
                      Create First Type
                    </Button>
                  )}
                </div>
              ) : (
                types.map((type) => (
                  <div key={type.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${type.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {type.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {type.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Category: {type.category}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Duration: {type.defaultDuration}m
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Order: {type.order}
                              </span>
                            </div>
                            {type.tags && type.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {type.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 text-xs bg-muted dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant={type.isActive ? "outline" : "default"}
                          onClick={() => handleToggleStatus(type.id, type.isActive)}
                          className={type.isActive ? "" : "bg-gray-600 hover:bg-gray-700"}
                        >
                          {type.isActive ? 'Deactivate' : 'Activate'}
                        </Button>

                        {hasPermission('content', 'update') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingType(type)}
                          >
                            Edit
                          </Button>
                        )}

                        {hasPermission('content', 'delete') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteType(type.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-[var(--color-status-error)]/10 dark:hover:bg-red-900/20"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}

