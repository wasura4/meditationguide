'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { MeditationCategory, MeditationCategoryFormData } from '@/types/admin';
import { MeditationCategoryService } from '@/lib/meditationCategoryService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';

const AVAILABLE_COLORS = [
  { name: 'violet', label: 'Violet', class: 'bg-violet-500' },
  { name: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { name: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { name: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { name: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { name: 'slate', label: 'Slate', class: 'bg-slate-500' },
  { name: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { name: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { name: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { name: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { name: 'teal', label: 'Teal', class: 'bg-teal-500' },
  { name: 'lime', label: 'Lime', class: 'bg-lime-500' },
  { name: 'sky', label: 'Sky', class: 'bg-sky-500' },
  { name: 'gray', label: 'Gray', class: 'bg-gray-500' },
  { name: 'red', label: 'Red', class: 'bg-red-500' },
  { name: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { name: 'stone', label: 'Stone', class: 'bg-stone-500' },
  { name: 'zinc', label: 'Zinc', class: 'bg-zinc-500' },
  { name: 'neutral', label: 'Neutral', class: 'bg-neutral-500' },
  { name: 'fuchsia', label: 'Fuchsia', class: 'bg-fuchsia-500' },
  { name: 'green', label: 'Green', class: 'bg-green-500' },
] as const;

export default function AdminMeditationCategoriesPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [categories, setCategories] = useState<MeditationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MeditationCategory | null>(null);
  const [selectedColor, setSelectedColor] = useState('violet');
  const { showToast } = useToast();

  // Load meditation categories
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const allCategories = await MeditationCategoryService.getAllCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load meditation categories',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (editingCategory) {
      setSelectedColor(editingCategory.color);
    } else {
      setSelectedColor('violet');
    }
  }, [editingCategory]);

  const handleCreateCategory = async (formData: FormData) => {
    if (!hasPermission('content','create')) return;
    if (!adminUser) return;

    try {
      const categoryFormData: MeditationCategoryFormData = {
        name: formData.get('name') as string,
        nameEn: formData.get('nameEn') as string,
        description: formData.get('description') as string,
        color: selectedColor,
        isActive: formData.get('isActive') === 'on',
      };

      await MeditationCategoryService.createCategory(categoryFormData, adminUser.id);
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Meditation category created successfully',
        duration: 3000
      });
      setShowCreateForm(false);
      setSelectedColor('violet');
      loadCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create meditation category',
        duration: 5000
      });
    }
  };

  const handleUpdateCategory = async (categoryId: string, formData: FormData) => {
    if (!hasPermission('content','update')) return;
    try {
      const updates: Partial<MeditationCategoryFormData> = {
        name: formData.get('name') as string,
        nameEn: formData.get('nameEn') as string,
        description: formData.get('description') as string,
        color: selectedColor,
        isActive: formData.get('isActive') === 'on',
      };

      await MeditationCategoryService.updateCategory(categoryId, updates);
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Meditation category updated successfully',
        duration: 3000
      });
      setEditingCategory(null);
      setSelectedColor('violet');
      loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update meditation category',
        duration: 5000
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!hasPermission('content','delete')) return;
    // Check if category is in use
    const isInUse = await MeditationCategoryService.isCategoryInUse(categoryId);
    if (isInUse) {
      showToast({
        type: 'error',
        title: 'Cannot Delete',
        message: 'This category is being used by meditation types. Please reassign them first.',
        duration: 5000
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this meditation category?')) return;

    try {
      await MeditationCategoryService.deleteCategory(categoryId);
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Meditation category deleted successfully',
        duration: 3000
      });
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete meditation category',
        duration: 5000
      });
    }
  };

  const handleToggleStatus = async (categoryId: string, currentStatus: boolean) => {
    if (!hasPermission('content','update')) return;
    try {
      await MeditationCategoryService.toggleActiveStatus(categoryId, !currentStatus);
      showToast({
        type: 'success',
        title: 'Success',
        message: `Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        duration: 3000
      });
      loadCategories();
    } catch (error) {
      console.error('Error toggling status:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to toggle category status',
        duration: 5000
      });
    }
  };

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout currentPage="/admin/categories">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading meditation categories...</p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/categories">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Meditation Categories Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Organize meditation types into meaningful categories
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
                Add New Category
              </Button>
            )}
          </div>

          {/* Create/Edit Form Modal */}
          {(showCreateForm || editingCategory) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {editingCategory ? 'Edit Meditation Category' : 'Create New Meditation Category'}
                </h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    if (editingCategory) {
                      handleUpdateCategory(editingCategory.id, formData);
                    } else {
                      handleCreateCategory(formData);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sinhala Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={editingCategory?.name || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., විපස්සනා"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      English Name *
                    </label>
                    <input
                      type="text"
                      name="nameEn"
                      required
                      defaultValue={editingCategory?.nameEn || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Vipassana"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      required
                      defaultValue={editingCategory?.description || ''}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Brief description of the category"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Color *
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {AVAILABLE_COLORS.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setSelectedColor(color.name)}
                          className={`h-10 w-10 rounded-lg ${color.class} transition-all ${
                            selectedColor === color.name
                              ? 'ring-4 ring-gray-900 dark:ring-white scale-110'
                              : 'hover:scale-105'
                          }`}
                          title={color.label}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Selected: {AVAILABLE_COLORS.find(c => c.name === selectedColor)?.label}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      id="isActive"
                      defaultChecked={editingCategory?.isActive ?? true}
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
                        setEditingCategory(null);
                        setSelectedColor('violet');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#6b9e7a] hover:bg-[#5a8a68]"
                    >
                      {editingCategory ? 'Update' : 'Create'} Category
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Meditation Categories ({categories.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {categories.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📂</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No meditation categories yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create your first category to organize meditation types
                  </p>
                  {hasPermission('content', 'create') && (
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-[#6b9e7a] hover:bg-[#5a8a68]"
                    >
                      Create First Category
                    </Button>
                  )}
                </div>
              ) : (
                categories.map((category) => {
                  const colorClass = AVAILABLE_COLORS.find(c => c.name === category.color)?.class || 'bg-gray-500';
                  return (
                    <div key={category.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-lg ${colorClass} flex-shrink-0`}></div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${category.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {category.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {category.nameEn}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {category.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Order: {category.order}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Color: {AVAILABLE_COLORS.find(c => c.name === category.color)?.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant={category.isActive ? "outline" : "default"}
                            disabled={!hasPermission('content','update')}
                            onClick={() => handleToggleStatus(category.id, category.isActive)}
                            className={category.isActive ? "" : "bg-gray-600 hover:bg-gray-700"}
                          >
                            {category.isActive ? 'Deactivate' : 'Activate'}
                          </Button>

                          {hasPermission('content', 'update') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCategory(category)}
                            >
                              Edit
                            </Button>
                          )}

                          {hasPermission('content', 'delete') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-[var(--color-status-error)]/10 dark:hover:bg-red-900/20"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
