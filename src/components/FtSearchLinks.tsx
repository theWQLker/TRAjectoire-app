import { ExternalLink } from "lucide-react";
import { ftSearchLinks } from "@/lib/ui";

/**
 * A live France Travail search for this job in the user's zone (decision
 * 2026-11-21), shown while our own ads are stale. One link per chosen zone: the
 * site's search applies only the first zone of a multi-zone query.
 */
export function FtSearchLinks({ romeCode, selected }: { romeCode: string; selected: string[] }) {
  const links = ftSearchLinks(romeCode, selected);
  const cls = "inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-blue hover:underline";
  const icon = (
    <>
      <ExternalLink size={14} strokeWidth={1.5} aria-hidden />
      <span className="sr-only">(nouvel onglet)</span>
    </>
  );
  if (links.length === 1) {
    return (
      <a href={links[0].href} target="_blank" rel="noopener noreferrer" className={cls}>
        Offres actuelles sur francetravail.fr
        {icon}
      </a>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-x-4">
      <span className="text-sm text-text">Offres actuelles sur francetravail.fr :</span>
      {links.map((l) => (
        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={cls}>
          {l.zone}
          {icon}
        </a>
      ))}
    </div>
  );
}
