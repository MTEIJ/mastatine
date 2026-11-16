import Image from "next/image";

interface CommitteeBannerProps {
  url: string | null;
  className?: string;
  priority?: boolean;
}

/** A committee's uploaded banner, or a plain branded block when it has none. */
export default function CommitteeBanner({ url, className = "", priority = false }: CommitteeBannerProps) {
  if (!url) return <div aria-hidden="true" className={`bg-soft ${className}`} />;
  return (
    <Image
      src={url}
      alt=""
      width={1200}
      height={400}
      quality={75}
      priority={priority}
      className={`w-full object-cover ${className}`}
    />
  );
}
