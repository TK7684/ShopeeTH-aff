// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    preset: "vercel",
    experimental: {
      wasm: true,
    },
  },
  compatibilityDate: "2024-11-01",
  hooks: {
    "build:before": () => {
      // Ensure server API routes are properly included
      console.log("Build hook: Ensuring API routes are included");
    },
  },
  devtools: { enabled: true },

  css: ["~/assets/css/main.css"],

  app: {
    head: {
      title: "Shopee Product Commission Analyzer",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Find high-commission products to maximize your affiliate earnings",
        },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  runtimeConfig: {
    // Private keys (only available server-side)
    googleCredentialsJson: process.env.GOOGLE_CREDENTIALS_JSON,
    googleSheetsId: process.env.GOOGLE_SHEETS_ID,
    googleSheetsRange: process.env.GOOGLE_SHEETS_RANGE,
    googleSheetsCategoryRange: process.env.GOOGLE_SHEETS_CATEGORY_RANGE,
    pipelineMinRate: process.env.PIPELINE_MIN_RATE,
    pipelineMinCommission: process.env.PIPELINE_MIN_COMMISSION,
    pipelineTop: process.env.PIPELINE_TOP,
    pipelineLimit: process.env.PIPELINE_LIMIT,
    pipelineMaxPages: process.env.PIPELINE_MAX_PAGES,
    pipelineHistoryLimit: process.env.PIPELINE_HISTORY_LIMIT,
    pipelineCategoryTopLimit: process.env.PIPELINE_CATEGORY_TOP_LIMIT,
    pipelineCategoryTabLimit: process.env.PIPELINE_CATEGORY_TAB_LIMIT,

    // Public keys (exposed to client)
    public: {
      apiBase: "",
    },
  },
});
