import { WebComponentRoot } from "../shared/web-component.ts";
import { createSelectContext } from "./context.ts";
import { registerContext, unregisterContext } from "./registry.ts";
import type { KeyedListener, SelectContext } from "./context.ts";

const CHILD_TAGS = new Set(["select-trigger", "select-content", "select-item"]);
const CHILD_TAGS_SELECTOR = Array.from(CHILD_TAGS).join(", ");

export class SelectRoot extends WebComponentRoot {
	private _ctx: SelectContext = createSelectContext({
		isOpen: false,
		selectedValue: null,
		activeIndex: 0,
	});

	private observer!: MutationObserver;

	onOpenChange(cb: KeyedListener<"isOpen">) {
		this._ctx.subscribe("isOpen", (v) => cb(v));
		return this;
	}

	onSelectChange(cb: KeyedListener<"selectedValue">) {
		this._ctx.subscribe("selectedValue", (v) => cb(v));
	}

	protected mount() {
		const defaultItem = this.querySelector("select-item[data-prop-is-default='true']") as HTMLElement | null;
		const defaultValue = defaultItem?.dataset.propValue ?? (this.dataset.propSelectedValue || null);

		this._ctx = createSelectContext({
			isOpen: this.dataset.propIsOpen === "true",
			selectedValue: defaultValue,
			activeIndex: Number(this.dataset.propActiveIndex),
		});

		registerContext(this.cid, this._ctx);

		this.observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (
						node instanceof HTMLElement &&
						CHILD_TAGS.has(node.tagName.toLowerCase())
					) {
						node.dataset.propCid = this.cid;
					}
				}
			}
		});

		this.observer.observe(this, { childList: true, subtree: true });

		this.querySelectorAll(CHILD_TAGS_SELECTOR).forEach((node) => {
			(node as HTMLElement).dataset.propCid = this.cid;
		});

		const id = this.dataset.propSelectLabel!;

		const content = this.querySelector("select-content")!;
		content.id = id;

		const button = this.querySelector(
			"select-trigger button",
		) as HTMLButtonElement;
		button.setAttribute("aria-controls", id);
	}

	protected unmount() {
		this.observer.disconnect();
		unregisterContext(this.cid);
	}
}

customElements.define("select-root", SelectRoot);
