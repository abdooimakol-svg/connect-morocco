import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  preset: "node-server",
  entry: "./server.ts",
  compatibilityDate: "2024-01-01",
  runtimeConfig: {
    port: process.env.PORT,
  },
});
