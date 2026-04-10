import { getCollection, type CollectionKey } from "astro:content";

export const getStaticContent = async (collection: CollectionKey) => {
	const data = await getCollection(collection);
	return data.map((content) => ({
		params: { slug: content.id },
		props: { content },
	}));
};
