// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
// @ts-ignore
import addClasses from "rehype-add-classes";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				"@": "/src",
			},
		},
	},

	i18n: {
		locales: ["en", "fr"],
		defaultLocale: "en",
	},

	markdown: {
		shikiConfig: {
			theme: "catppuccin-mocha",
		},
		rehypePlugins: [[addClasses, { pre: "not-prose" }]],
	},

	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: "JetBrains Mono",
			cssVariable: "--font-mono",
		},
		{
			provider: fontProviders.fontsource(),
			name: "Inter",
			cssVariable: "--font-inter",
			weights: [400, 500, 600],
		},
		{
			provider: fontProviders.fontsource(),
			name: "Carattere",
			cssVariable: "--font-carattere",
		},
	],
	output: "static",
	adapter: cloudflare({
		imageService: "compile",
	}),
});
