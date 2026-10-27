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
      if (!activity.image || !activity.imageUrl || !activity.imageAlt || !activity.imageTvUrl) {
        throw new Error(`Missing image on ${activity.id}`);
      }
      if (activity.url) {
        if (!activity.qrUrl) throw new Error(`Missing qrUrl on ${activity.id}`);
      } else if ("qrUrl" in activity && activity.qrUrl) {
        throw new Error(`qrUrl set without url on ${activity.id}`);
      }
      if ("imageCredit" in activity && activity.imageCredit) {
        const { author, license, licenseUrl, source } = activity.imageCredit;
        if (!author || !license || !licenseUrl || !source) {
          throw new Error(`Incomplete imageCredit on ${activity.id}`);
        }
        if (/\bNC\b|\bND\b/.test(license)) {
          throw new Error(`Disallowed license "${license}" on ${activity.id}`);
        }
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
    image: activity.image,
    imageAlt: activity.imageAlt,
    ...(activity.imageCredit !== undefined ? { imageCredit: activity.imageCredit } : {}),
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
