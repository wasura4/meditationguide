"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DhammaService } from "@/lib/dhammaService";
import { DhammaPostReader } from "@/components/dhamma/DhammaPostReader";
import { Button } from "@/components/ui/button";
import type { DhammaPost } from "@/types/admin";

export default function DhammaPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<DhammaPost | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        if (!params?.id) return;
        const p = await DhammaService.getPostById(params.id);
        if (!p) {
          setError("Post not found");
        } else {
          setPost(p);
        }
      } catch (e) {
        setError("Failed to load post");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="max-w-screen-md mx-auto px-4 py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-screen-md mx-auto px-4 py-12 space-y-4">
        <p className="text-destructive">{error || "Post not found."}</p>
        <Button variant="outline" onClick={() => router.push("/dhamma")}>Back to Library</Button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto px-4 py-6 pb-24">
      <DhammaPostReader post={post} onClose={() => router.push("/dhamma")} />
    </div>
  );
}
