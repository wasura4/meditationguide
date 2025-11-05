import React from "react";
import { DhammaService } from "@/lib/dhammaService";
import { DhammaPostReader } from "@/components/dhamma/DhammaPostReader";

export default async function DhammaPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await DhammaService.getPostById(id);
  if (!post) {
    return (
      <div className="max-w-screen-md mx-auto px-4 py-12">
        <p className="text-muted-foreground">Post not found.</p>
      </div>
    );
  }
  return (
    <div className="max-w-screen-md mx-auto px-4 py-6 pb-24">
      <DhammaPostReader post={post} onClose={() => {}} />
    </div>
  );
}
