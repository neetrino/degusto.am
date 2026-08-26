import Image from "next/image";
import { Clock3, ExternalLink, Mail, Phone } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/get-dictionary";
import {
  googleMapsEmbedUrl,
  googleMapsSearchUrl,
} from "@/lib/maps/google-maps-url";
import { staticAssetUrl } from "@/lib/media/static-asset-url";
import { splitPhoneLine } from "@/lib/phone/tel";

const ICON_PIN = staticAssetUrl("/assets/footer/icon-pin.webp");

type ContactMapProps = {
  copy: Dictionary["contact"];
  footer: Dictionary["footer"];
};

/** Immersive full-bleed map with a floating Degusto-branded location panel. */
export function ContactMap({ copy, footer }: ContactMapProps) {
  const primaryAddress = footer.addresses[0] ?? copy.storeAddress;

  return (
    <section
      aria-label={copy.mapTitle}
      className="contact-map-section relative isolate min-h-[calc(100dvh-10rem)] w-full overflow-hidden rounded-[var(--radius)] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.38)] md:min-h-[calc(100dvh-11rem)]"
    >
      <div className="absolute inset-0">
        <iframe
          title={copy.mapTitle}
          src={googleMapsEmbedUrl(primaryAddress)}
          width="100%"
          height="100%"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
          allowFullScreen
        />
      </div>

      <div className="relative z-10 flex min-h-[inherit] items-end px-4 pb-8 pt-24 sm:px-6 lg:items-center lg:px-10 lg:pb-10 lg:pt-28">
        <div className="mx-auto w-full max-w-7xl">
          <div className="contact-map-panel w-full max-w-[440px] rounded-[20px] border border-white/12 bg-surface-dark/82 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:p-7 lg:max-w-[500px] lg:p-8">
            <div className="mb-5 flex items-center gap-2">
              <Image
                src={ICON_PIN}
                alt=""
                width={18}
                height={24}
                className="h-6 w-[18px] object-contain"
                aria-hidden
              />
              <p className="font-display text-xs font-black tracking-[0.24em] text-brand uppercase">
                Degusto Food Studio
              </p>
            </div>

            <h1 className="font-display text-3xl font-black leading-tight tracking-tight text-white md:text-4xl">
              {copy.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/72 md:text-base">
              {copy.mapTitle}
            </p>

            <ul className="mt-6 flex flex-col gap-2.5">
              {footer.addresses.map((address) => (
                <li key={address}>
                  <a
                    href={googleMapsSearchUrl(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/address flex items-start gap-3 rounded-[calc(var(--radius)-2px)] border border-white/10 bg-white/5 px-3.5 py-3 text-sm leading-6 text-white/88 transition hover:border-brand/45 hover:bg-white/10 hover:text-white"
                  >
                    <span
                      aria-hidden
                      className="mt-2 size-2 shrink-0 rounded-full bg-brand transition group-hover/address:scale-125"
                    />
                    <span>{address}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
              <div className="flex items-start gap-3 text-sm leading-6 text-white/78">
                <Clock3
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  aria-hidden
                />
                <div>
                  <p>{copy.hoursWeekdays}</p>
                  <p>{copy.hoursSaturday}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm leading-6 text-white/78">
                <Phone
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  aria-hidden
                />
                <p>
                  {splitPhoneLine(footer.phones).map((part, index) =>
                    part.kind === "tel" ? (
                      <a
                        key={`${part.href}-${index}`}
                        href={part.href}
                        className="font-medium text-white transition hover:text-brand"
                      >
                        {part.display}
                      </a>
                    ) : (
                      <span key={`text-${index}`}>{part.value}</span>
                    ),
                  )}
                </p>
              </div>

              <a
                href={`mailto:${footer.email}`}
                className="flex items-center gap-3 text-sm leading-6 text-white/78 transition hover:text-brand"
              >
                <Mail className="size-4 shrink-0 text-brand" aria-hidden />
                <span className="font-medium text-white">{footer.email}</span>
              </a>
            </div>

            <a
              href={googleMapsSearchUrl(primaryAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-3.5 font-display text-sm font-black tracking-wide text-white uppercase transition hover:bg-brand-strong"
            >
              {copy.openInMaps}
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
