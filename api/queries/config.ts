import { getDb } from "./connection";
import { systemConfig, siteContent } from "@db/schema";
import { eq, and } from "drizzle-orm";

// ─── System Config ───

export async function getAllConfig() {
  return getDb().select().from(systemConfig);
}

export async function getConfigValue(key: string) {
  const result = await getDb()
    .select()
    .from(systemConfig)
    .where(eq(systemConfig.configKey, key));
  return result[0] || null;
}

export async function setConfigValue(key: string, value: string) {
  const existing = await getConfigValue(key);
  if (existing) {
    await getDb()
      .update(systemConfig)
      .set({ configValue: value })
      .where(eq(systemConfig.configKey, key));
  } else {
    await getDb().insert(systemConfig).values({ configKey: key, configValue: value });
  }
  return getConfigValue(key);
}

// ─── Site Content ───

export async function getSiteContentByPage(page: string) {
  return getDb()
    .select()
    .from(siteContent)
    .where(eq(siteContent.page, page));
}

export async function getSiteContentByPageAndSection(page: string, section: string) {
  return getDb()
    .select()
    .from(siteContent)
    .where(and(eq(siteContent.page, page), eq(siteContent.section, section)));
}

export async function getSiteContentValue(page: string, section: string, key: string) {
  const result = await getDb()
    .select()
    .from(siteContent)
    .where(
      and(
        eq(siteContent.page, page),
        eq(siteContent.section, section),
        eq(siteContent.contentKey, key)
      )
    );
  return result[0] || null;
}

export async function setSiteContent(
  page: string,
  section: string,
  key: string,
  value: string
) {
  const existing = await getSiteContentValue(page, section, key);
  if (existing) {
    await getDb()
      .update(siteContent)
      .set({ contentValue: value })
      .where(
        and(
          eq(siteContent.page, page),
          eq(siteContent.section, section),
          eq(siteContent.contentKey, key)
        )
      );
  } else {
    await getDb()
      .insert(siteContent)
      .values({ page, section, contentKey: key, contentValue: value });
  }
  return getSiteContentValue(page, section, key);
}
