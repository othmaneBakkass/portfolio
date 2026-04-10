import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const blogs = defineCollection({
	loader: glob({
		base: "./src/data/blogs",
		pattern: "**/*.md",
	}),
	schema: z.object({
		title: z.string(),
		date: z.string(),
		structuredDate: z.string(),
	}),
} satisfies Parameters<typeof defineCollection>[0]);

const blogs_fr = defineCollection({
	loader: glob({
		base: "./src/data/blogs-fr",
		pattern: "**/*.md",
	}),
	schema: z.object({
		title: z.string(),
		date: z.string(),
		structuredDate: z.string(),
	}),
} satisfies Parameters<typeof defineCollection>[0]);

export const collections = {
	blogs,
	blogs_fr,
};
