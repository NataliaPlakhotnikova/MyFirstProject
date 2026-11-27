import Image from "next/image";

export function BrandLogo({ variant = "white" }: { variant?: "white" | "blue" }) {
  const src =
    variant === "blue" ? "/brand/logo-gpb-blue.svg" : "/brand/logo-gpb-white.svg";
  return (
    <Image
      src={src}
      alt="Лото онлайн"
      width={40}
      height={40}
      className="h-10 w-10"
      priority
    />
  );
}