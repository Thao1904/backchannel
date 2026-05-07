import type { ReactNode } from "react";

type StepHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
};

export function StepHeader({
  title,
  description,
  align = "center",
}: StepHeaderProps) {
  return (
    <header className={align === "center" ? "text-center" : "text-left"}>
      <h1 className="display-font text-[38px] font-bold leading-[0.92] tracking-normal text-black sm:text-[58px]">
        {title}
      </h1>
      {description ? (
        <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-black/58 sm:text-[18px]">
          {description}
        </p>
      ) : null}
    </header>
  );
}
