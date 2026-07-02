import Image from "next/image";
import { getActivityLink, type Activity } from "@/lib/activities";

export function ActivityCard({ activity }: { activity: Activity }) {
  const link = getActivityLink(activity);

  return (
    <article className="group overflow-hidden rounded-2xl border border-sage-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden bg-sage-100">
        <Image
          src={activity.image}
          alt={activity.imageAlt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {activity.season && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-sage-800 backdrop-blur-sm">
            {activity.season}
          </span>
        )}
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl text-sage-900">{activity.name}</h3>
          {activity.distance && (
            <span className="shrink-0 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-medium text-sage-600">
              {activity.distance}
            </span>
          )}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-sage-700">
          {activity.description}
        </p>

        {activity.tip && (
          <p className="mt-3 text-sm text-sage-500">
            <span className="font-semibold text-sage-700">Tip:</span> {activity.tip}
          </p>
        )}

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center text-sm font-semibold text-cedar-600 hover:text-cedar-700"
          >
            Learn more
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </article>
  );
}
