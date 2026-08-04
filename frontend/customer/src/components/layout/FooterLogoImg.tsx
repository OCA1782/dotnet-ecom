"use client";

export default function FooterLogoImg({ src, alt, imgClassName }: { src: string; alt: string; imgClassName?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={imgClassName ?? "w-full h-full object-contain p-0.5"}
      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
    />
  );
}
