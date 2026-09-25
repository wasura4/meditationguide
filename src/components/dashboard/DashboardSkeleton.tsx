"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton, SkeletonStatus } from "@/components/ui/Skeleton";

export function PracticeSkeleton() {
  const { t } = useLanguage();
  return <SkeletonStatus label={t("common.loading")}>
    <div className="space-y-3 sm:space-y-4">
      <div className="home-glass p-5 sm:p-7">
        <div className="flex h-11 items-center justify-between">
          <Skeleton className="h-3 w-36" /><Skeleton className="h-5 w-5" />
        </div>
        <div className="flex items-center justify-between gap-4 pb-5">
          <div className="flex-1 space-y-3"><Skeleton className="h-12 w-28 sm:h-16" /><Skeleton className="h-4 w-32" /></div>
          <Skeleton className="h-24 w-24 shrink-0 !rounded-full sm:h-28 sm:w-28" />
        </div>
        <Skeleton className="h-13 w-full !rounded-full" />
      </div>
      <div className="home-glass p-5 sm:p-6">
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(index => <div key={index} className="flex flex-col items-center gap-2"><Skeleton className="h-8 w-14" /><Skeleton className="h-4 w-full max-w-24" /></div>)}
        </div>
      </div>
      <div className="home-glass p-5 sm:p-6">
        <Skeleton className="mb-5 h-6 w-28" />
        <div className="grid grid-cols-7 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map(index => <div key={index} className="flex flex-col items-center gap-2"><Skeleton className="aspect-square w-full max-w-11 !rounded-full" /><Skeleton className="h-3 w-6" /></div>)}
        </div>
      </div>
    </div>
  </SkeletonStatus>;
}

export function ReadingSkeleton({ count = 2 }: { count?: number }) {
  const { t } = useLanguage();
  return <SkeletonStatus label={t("common.loading")}>
    {Array.from({ length: count }, (_, index) => <div key={index} className="flex min-h-20 items-center gap-4 border-b border-border/60 p-4 last:border-0">
      <Skeleton className="h-7 w-7 shrink-0" />
      <div className="flex-1 space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-20" /></div>
    </div>)}
  </SkeletonStatus>;
}

/** Used while the dashboard route or authentication is resolving. */
export function DashboardSkeleton() {
  const { t } = useLanguage();
  return <div className="home-dashboard">
    <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
      <SkeletonStatus label={t("common.loading")}>
        <div className="home-header flex items-center justify-between gap-3"><Skeleton className="h-6 w-32" /><Skeleton className="h-11 w-11 !rounded-full" /></div>
        <div className="artwork-header artwork-header-home">
          <div className="min-w-0 space-y-4"><Skeleton className="h-3 w-24 max-w-full" /><Skeleton className="h-24 w-64 max-w-full" /><Skeleton className="h-5 w-56 max-w-full" /></div>
          <Skeleton className="artwork-header-image" />
        </div>
      </SkeletonStatus>
      <div className="home-content space-y-6 pb-8">
        <PracticeSkeleton />
        <div className="home-glass overflow-hidden"><ReadingSkeleton /></div>
      </div>
    </div>
  </div>;
}
