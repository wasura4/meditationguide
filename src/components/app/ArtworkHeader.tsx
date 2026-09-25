import Image from "next/image";

export type PageArtwork = "home" | "meditate" | "listen" | "dhamma" | "progress";

/** Decorative artwork stays separate from translated, accessible page text. */
export function ArtworkHeader({
  artwork,
  title,
  subtitle,
  eyebrow,
}: {
  artwork: PageArtwork;
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <section className={`artwork-header${artwork === "home" ? " artwork-header-home" : ""}`}>
      <div className="artwork-header-copy">
        {eyebrow && <p className="artwork-header-eyebrow">{eyebrow}</p>}
        <h1 className="artwork-header-title">{title}</h1>
        {subtitle && <p className="artwork-header-subtitle">{subtitle}</p>}
      </div>
      <div className="artwork-header-image" aria-hidden="true">
        <Image
          src={`/images/artwork/${artwork}.jpg`}
          alt=""
          fill
          priority
          unoptimized={false}
          sizes={artwork === "home" ? "(max-width: 639px) 100vw, (max-width: 1023px) 65vw, 640px" : "(max-width: 639px) 40vw, 240px"}
          className="object-contain"
        />
      </div>
    </section>
  );
}
