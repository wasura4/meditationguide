'use client';

import React from 'react';
import Link from 'next/link';
import { PlaylistDoc } from '@/lib/playlistService';

export function GuideCard({ guide }: { guide: PlaylistDoc }) {
  return (
    <Link href={`/guides/${guide.id}`} className="group block overflow-hidden rounded-2xl border border-border bg-background hover:shadow-lg transition-shadow">
      <div className="relative h-40 w-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
        {guide.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={guide.thumbnailUrl} alt={guide.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="p-4">
        <div className="text-[11px] font-medium text-green-600 dark:text-green-400">Meditation Guide</div>
        <div className="mt-1 text-base font-semibold line-clamp-1">{guide.name}</div>
        {guide.authorName && (
          <div className="text-xs text-muted-foreground mt-0.5">{guide.authorName}</div>
        )}
        <div className="text-sm text-muted-foreground mt-2 line-clamp-2">{guide.description}</div>
        <div className="mt-3 text-xs text-muted-foreground">{guide.audioFiles?.length || 0} tracks</div>
      </div>
    </Link>
  );
}

