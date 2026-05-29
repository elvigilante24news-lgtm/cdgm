import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  getAllConfig,
  getConfigValue,
  setConfigValue,
} from "./queries/config";

export const configRouter = createRouter({
  list: publicQuery.query(() => getAllConfig()),

  get: publicQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const config = await getConfigValue(input.key);
      return config?.configValue || null;
    }),

  set: publicQuery
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(({ input }) => setConfigValue(input.key, input.value)),

  // Get all config as an object (for frontend)
  getAllObject: publicQuery.query(async () => {
    const configs = await getAllConfig();
    const result: Record<string, string> = {};
    for (const c of configs) {
      result[c.configKey] = c.configValue;
    }
    return result;
  }),
});
