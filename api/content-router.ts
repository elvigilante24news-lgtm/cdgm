import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  getSiteContentByPage,
  getSiteContentByPageAndSection,
  setSiteContent,
} from "./queries/config";

export const contentRouter = createRouter({
  byPage: publicQuery
    .input(z.object({ page: z.string() }))
    .query(async ({ input }) => {
      const contents = await getSiteContentByPage(input.page);
      // Group by section
      const result: Record<string, Record<string, string>> = {};
      for (const c of contents) {
        if (!result[c.section]) result[c.section] = {};
        result[c.section][c.contentKey] = c.contentValue;
      }
      return result;
    }),

  byPageAndSection: publicQuery
    .input(z.object({ page: z.string(), section: z.string() }))
    .query(async ({ input }) => {
      const contents = await getSiteContentByPageAndSection(
        input.page,
        input.section
      );
      const result: Record<string, string> = {};
      for (const c of contents) {
        result[c.contentKey] = c.contentValue;
      }
      return result;
    }),

  set: publicQuery
    .input(
      z.object({
        page: z.string(),
        section: z.string(),
        key: z.string(),
        value: z.string(),
      })
    )
    .mutation(({ input }) =>
      setSiteContent(input.page, input.section, input.key, input.value)
    ),

  // Batch update multiple content values
  batchSet: publicQuery
    .input(
      z.object({
        page: z.string(),
        section: z.string(),
        values: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ input }) => {
      for (const [key, value] of Object.entries(input.values)) {
        await setSiteContent(input.page, input.section, key, value);
      }
      return { success: true };
    }),
});
