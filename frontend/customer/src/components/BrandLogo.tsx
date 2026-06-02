interface Props {
  name: string;
  size?: "sm" | "md" | "lg";
}

function parseBrandName(name: string): { main: string; sub: string | null } {
  const words = name.trim().split(/\s+/);
  if (words.length >= 3) {
    return { main: words.slice(0, -1).join(" "), sub: words[words.length - 1] };
  }
  return { main: name, sub: null };
}

const FONT_SIZE: Record<string, string> = {
  sm: "1.125rem",
  md: "1.5rem",
  lg: "2rem",
};

export default function BrandLogo({ name, size = "md" }: Props) {
  const { main, sub } = parseBrandName(name);
  return (
    <span className="flex flex-col" style={{ gap: "2px" }}>
      <span data-brand-name style={{ fontSize: FONT_SIZE[size] }}>{main}</span>
      {sub && <span data-brand-subtitle>{sub}</span>}
    </span>
  );
}
