import { Leaf } from "lucide-react";

type AboutLeafDividerProps = {
  className?: string;
};

/** Gold leaf rule used under about-page headings. */
export function AboutLeafDivider({
  className = "mt-4",
}: AboutLeafDividerProps) {
  return (
    <div className={`flex w-full items-center gap-3 ${className}`} aria-hidden>
      <span className="h-px min-w-[2.6rem] flex-1 bg-[#C9A45C]/75" />
      <Leaf className="h-4 w-4 shrink-0 text-[#C9A45C]" strokeWidth={1.7} />
      <span className="h-px min-w-[2.6rem] flex-1 bg-[#C9A45C]/60" />
    </div>
  );
}
