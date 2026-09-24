"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { MeditationType } from "@/types";
import { MeditationCategory } from "@/types/admin";
import { MeditationTypeService } from "@/lib/meditationTypeService";
import { MeditationCategoryService } from "@/lib/meditationCategoryService";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useToast } from "@/components/ui/toast";

export default function AdminMeditationTypesPage() {
  const { hasPermission } = useAdminAuth();
  const [types, setTypes] = useState<MeditationType[]>([]);
  const [categories, setCategories] = useState<MeditationCategory[]>([]);
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
      console.error("Error loading types:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to load meditation types",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const allCategories =
        await MeditationCategoryService.getActiveCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to load meditation categories",
        duration: 5000,
      });
    }
  }, [showToast]);

  useEffect(() => {
    loadTypes();
    loadCategories();
  }, [loadTypes, loadCategories]);

  const handleCreateType = async (formData: FormData) => {
    if (!hasPermission("content", "create")) return;
    try {
      const categoryValue = formData.get("category") as string;
      const isActive = formData.get("isActive") === "on";

      const typeData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        category: categoryValue, // Now accepts any category ID from database
        defaultDuration: parseInt(formData.get("defaultDuration") as string),
        order: types.length + 1,
        isActive,
        tags: (formData.get("tags") as string)
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      await MeditationTypeService.createType(typeData);
      showToast({
        type: "success",
        title: "Success",
        message: "Meditation type created successfully",
        duration: 3000,
      });
      setShowCreateForm(false);
      loadTypes();
    } catch (error) {
      console.error("Error creating type:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to create meditation type",
        duration: 5000,
      });
    }
  };

  const handleUpdateType = async (typeId: string, formData: FormData) => {
    if (!hasPermission("content", "update")) return;
    try {
      const categoryValue = formData.get("category") as string;
      const updates = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        category: categoryValue, // Now accepts any category ID from database
        defaultDuration: parseInt(formData.get("defaultDuration") as string),
        isActive: formData.get("isActive") === "on",
        tags: (formData.get("tags") as string)
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      await MeditationTypeService.updateType(typeId, updates);
      showToast({
        type: "success",
        title: "Success",
        message: "Meditation type updated successfully",
        duration: 3000,
      });
      setEditingType(null);
      loadTypes();
    } catch (error) {
      console.error("Error updating type:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to update meditation type",
        duration: 5000,
      });
    }
  };

  const handleDeleteType = async (typeId: string) => {
    if (!hasPermission("content", "delete")) return;
    if (!confirm("Are you sure you want to delete this meditation type?"))
      return;

    try {
      await MeditationTypeService.deleteType(typeId);
      showToast({
        type: "success",
        title: "Success",
        message: "Meditation type deleted successfully",
        duration: 3000,
      });
      loadTypes();
    } catch (error) {
      console.error("Error deleting type:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to delete meditation type",
        duration: 5000,
      });
    }
  };

  const handleToggleStatus = async (typeId: string, currentStatus: boolean) => {
    if (!hasPermission("content", "update")) return;
    try {
      await MeditationTypeService.toggleTypeStatus(typeId, !currentStatus);
      showToast({
        type: "success",
        title: "Success",
        message: `Meditation type ${!currentStatus ? "activated" : "deactivated"} successfully`,
        duration: 3000,
      });
      loadTypes();
    } catch (error) {
      console.error("Error toggling status:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to toggle meditation type status",
        duration: 5000,
      });
    }
  };

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout currentPage="/admin/types">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading meditation types...
            </p>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Meditation Types Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and manage meditation types for users
              </p>
            </div>
            {hasPermission("content", "create") && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add New Type
              </Button>
            )}
          </div>

          {/* Create/Edit Form Modal */}
          {(showCreateForm || editingType) && (
            <AdminDialog
              title={
                editingType
                  ? "Edit Meditation Type"
                  : "Create New Meditation Type"
              }
              onClose={() => {
                setShowCreateForm(false);
                setEditingType(null);
              }}
            >
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
                  <label
                    htmlFor="types-name"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    id="types-name"
                    name="name"
                    required
                    defaultValue={editingType?.name || ""}
                    className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g., Anapanasathi Meditation"
                  />
                </div>

                <div>
                  <label
                    htmlFor="types-description"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Description *
                  </label>
                  <textarea
                    id="types-description"
                    name="description"
                    required
                    defaultValue={editingType?.description || ""}
                    rows={3}
                    className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Brief description of the meditation practice"
                  />
                </div>

                <div>
                  <label
                    htmlFor="types-category"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Category *
                  </label>
                  <select
                    id="types-category"
                    name="category"
                    required
                    defaultValue={
                      editingType?.category || categories[0]?.id || ""
                    }
                    className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {categories.length === 0 ? (
                      <option value="">
                        No categories available - Create categories first
                      </option>
                    ) : (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name} ({category.nameEn})
                        </option>
                      ))
                    )}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Please create meditation categories first in the
                      Categories management page.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="types-defaultDuration"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Default Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    id="types-defaultDuration"
                    name="defaultDuration"
                    required
                    min="1"
                    max="120"
                    defaultValue={editingType?.defaultDuration || 15}
                    className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label
                    htmlFor="types-tags"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="types-tags"
                    name="tags"
                    defaultValue={editingType?.tags?.join(", ") || ""}
                    className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="breathing, mindfulness, focus"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    defaultChecked={editingType?.isActive ?? true}
                    className="h-4 w-4 accent-primary focus:ring-ring border-input rounded"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 text-sm text-foreground"
                  >
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
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {editingType ? "Update" : "Create"} Type
                  </Button>
                </div>
              </form>
            </AdminDialog>
          )}

          {/* Types List */}
          <div className="app-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Meditation Types ({types.length})
              </h2>
            </div>

            <div className="divide-y divide-border">
              {types.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="text-muted-foreground text-6xl mb-4">🧘‍♀️</div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No meditation types yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first meditation type to get started
                  </p>
                  {hasPermission("content", "create") && (
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Create First Type
                    </Button>
                  )}
                </div>
              ) : (
                types.map((type) => (
                  <div
                    key={type.id}
                    className="px-6 py-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 shrink-0 rounded-full ${type.isActive ? "bg-green-500" : "bg-gray-400"}`}
                          ></div>
                          <div>
                            <h3 className="break-words font-semibold text-foreground">
                              {type.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {type.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                              <span className="text-xs text-muted-foreground">
                                Category:{" "}
                                {categories.find((c) => c.id === type.category)
                                  ?.name || type.category}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Duration: {type.defaultDuration}m
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Order: {type.order}
                              </span>
                            </div>
                            {type.tags && type.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {type.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Button
                          size="default"
                          variant={type.isActive ? "outline" : "default"}
                          disabled={!hasPermission("content", "update")}
                          onClick={() =>
                            handleToggleStatus(type.id, type.isActive)
                          }
                          className="min-h-11"
                        >
                          {type.isActive ? "Deactivate" : "Activate"}
                        </Button>

                        {hasPermission("content", "update") && (
                          <Button
                            size="default"
                            variant="outline"
                            onClick={() => setEditingType(type)}
                          >
                            Edit
                          </Button>
                        )}

                        {hasPermission("content", "delete") && (
                          <Button
                            size="default"
                            variant="outline"
                            onClick={() => handleDeleteType(type.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
