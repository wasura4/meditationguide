"use client";

import Image from "next/image";
import { useState } from "react";
import { Leaf } from "lucide-react";

export function AudioArtwork({
  src,
  className = "",
}: {
  src?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState<string>();
  const valid = src && /^(https?:\/\/|\/[^/])/.test(src) && failed !== src;
  return (
    <span
      aria-hidden="true"
      className={`listen-artwork relative block shrink-0 overflow-hidden ${className}`}
    >
      {valid ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, 320px"
          className="object-cover"
          onError={() => setFailed(src)}
        />
      ) : (
        <Leaf
          className="absolute left-1/2 top-1/2 h-[36%] w-[36%] -translate-x-1/2 -translate-y-1/2 text-primary"
          strokeWidth={1.1}
        />
      )}
    </span>
  );
}
