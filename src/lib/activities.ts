import activitiesJson from "../../public/data/activities.json";
import { SEASONS, type ActivitiesFile, type Activity, type ActivityJson, type ActivitySection } from "./content-types";

const SEASON_SET = new Set<string>(SEASONS);
const CALENDAR = new Set<string>(["winter", "spring", "summer", "fall"]);

function loadActivities(file: typeof activitiesJson): ActivitiesFile {
  for (const section of file.activitySections) {
    if ("seasonPriority" in section) {
      throw new Error(`seasonPriority was removed; set seasonRank on activities in ${section.id}`);
    }
    for (const activity of section.activities) {
      if (activity.season.length === 0) {
        throw new Error(`Missing season on ${activity.id}`);
      }
      for (const season of activity.season) {
        if (!SEASON_SET.has(season)) {
          throw new Error(`Invalid season "${season}" on ${activity.id}`);
        }
      }
      if (activity.seasonRank) {
        for (const [key, rank] of Object.entries(activity.seasonRank)) {
          if (!CALENDAR.has(key) || typeof rank !== "number" || !Number.isInteger(rank) || rank < 1) {
            throw new Error(`Invalid seasonRank ${key}=${rank} on ${activity.id}`);
          }
        }
      }
      if (activity.image && !activity.imageUrl) {
        throw new Error(`Missing imageUrl on ${activity.id}`);
      }
    }
  }
  return file as ActivitiesFile;
}

const activitiesFile = loadActivities(activitiesJson);

export type { Activity, ActivitySection };

function toActivity(activity: ActivityJson): Activity {
  return {
    id: activity.id,
    name: activity.name,
    description: activity.description,
    ...(activity.image !== undefined ? { image: activity.image } : {}),
    ...(activity.imageAlt !== undefined ? { imageAlt: activity.imageAlt } : {}),
    ...(activity.distance !== undefined ? { distance: activity.distance } : {}),
    season: activity.seasonLabel,
    ...(activity.difficulty !== undefined ? { difficulty: activity.difficulty } : {}),
    ...(activity.trailDistance !== undefined ? { trailDistance: activity.trailDistance } : {}),
    ...(activity.gettingThere !== undefined ? { gettingThere: activity.gettingThere } : {}),
    ...(activity.tip !== undefined ? { tip: activity.tip } : {}),
    ...(activity.url !== undefined ? { url: activity.url } : {}),
    ...(activity.affiliateUrl !== undefined ? { affiliateUrl: activity.affiliateUrl } : {}),
  };
}

export const activitySections: ActivitySection[] = activitiesFile.activitySections.map((section) => ({
  id: section.id,
  title: section.title,
  ...(section.subtitle !== undefined ? { subtitle: section.subtitle } : {}),
  activities: section.activities.map(toActivity),
}));

export function getActivityLink(activity: Activity): string | undefined {
  return activity.affiliateUrl ?? activity.url;
}

export default activitySections;
