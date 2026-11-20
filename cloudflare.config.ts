import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "app",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-20",
    assets: {
      notFoundHandling: "none",
    },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
    },
  }),
});
