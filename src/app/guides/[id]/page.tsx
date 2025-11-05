'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlaylistDoc, PlaylistService } from '@/lib/playlistService';
import Link from 'next/link';

export default function GuideDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [guide, setGuide] = useState<PlaylistDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const g = await PlaylistService.getById(id);
        setGuide(g);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }
  if (!guide) {
    return <div className="p-6">Not found</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with gradient and artwork */}
      <div className="relative h-72 w-full bg-gradient-to-b from-zinc-700 to-background">
        <div className="absolute inset-x-0 top-6 flex items-center justify-between px-4">
          <button onClick={() => router.back()} className="text-white/90">
            ← Back
          </button>
          <div className="text-white/90 font-semibold">Class Insights</div>
          <div className="text-white/90">⋮</div>
        </div>
        <div className="absolute left-1/2 -bottom-14 -translate-x-1/2">
          <div className="h-28 w-28 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 border-4 border-background shadow-xl overflow-hidden">
            {guide.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={guide.thumbnailUrl} alt={guide.name} className="h-full w-full object-cover" />
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pt-20 pb-28">
        <div className="text-green-600 text-xs font-semibold">Meditation</div>
        <h1 className="mt-1 text-2xl font-bold">{guide.name}</h1>
        {guide.authorName && (
          <div className="text-sm text-muted-foreground">{guide.authorName}</div>
        )}

        <h2 className="mt-6 text-lg font-semibold">Description</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-6">{guide.description}</p>

        <button
          onClick={() => router.push(`/kamatahan?tab=playlists&start=${guide.id}`)}
          className="fixed bottom-6 left-6 right-6 h-12 rounded-xl bg-lime-400 text-black font-semibold shadow-lg"
        >
          Start
        </button>
      </div>
    </div>
  );
}

