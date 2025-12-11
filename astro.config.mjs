import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  output: 'hybrid',
  adapter: undefined,
  integrations: [tailwind()]
});