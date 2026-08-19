import type { Dictionary } from "@/lib/i18n/get-dictionary";

type LegalBlock = Dictionary["legal"]["terms"]["blocks"][number];

type LegalCopy = {
  heading: string;
  blocks: readonly LegalBlock[];
};

type LegalDocumentProps = {
  documentTitle: string;
  copy: LegalCopy;
};

function LegalBlockView({ block }: { block: LegalBlock }) {
  if (block.type === "heading") {
    return (
      <h2 className="mt-8 font-display text-xl font-black tracking-tight text-product-ink">
        {block.text}
      </h2>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="list-disc space-y-1 pl-5 text-base leading-7 text-product-ink/80">
        {(block.items ?? []).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <p className="text-base leading-7 text-product-ink/80">{block.text}</p>
  );
}

/** Long-form legal document for storefront policy pages. */
export function LegalDocument({ documentTitle, copy }: LegalDocumentProps) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-8">
      <header className="flex flex-col gap-3">
        {documentTitle !== copy.heading ? (
          <p className="font-display text-sm font-black tracking-[0.18em] text-brand uppercase">
            {documentTitle}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-black tracking-tight text-product-ink md:text-4xl">
          {copy.heading}
        </h1>
      </header>
      {copy.blocks.map((block, index) => (
        <LegalBlockView
          key={`${block.type}-${index}`}
          block={block}
        />
      ))}
    </article>
  );
}
