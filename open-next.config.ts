import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // R2 incremental cache disabled - enable if you have an R2 bucket
  // incrementalCache: r2IncrementalCache,
});

