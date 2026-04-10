import type { SelectContext } from "./context.ts";

const registry = new Map<string, SelectContext>();

export function registerContext(cid: string, ctx: SelectContext) {
	registry.set(cid, ctx);
}

export function getContext(cid: string): SelectContext {
	const ctx = registry.get(cid);
	if (!ctx) throw new Error(`No SelectContext found for cid: ${cid}`);
	return ctx;
}

export function unregisterContext(cid: string) {
	registry.delete(cid);
}
