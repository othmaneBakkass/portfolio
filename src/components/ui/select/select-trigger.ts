import { getContext } from "./registry.ts";
import type { SelectContext } from "./context.ts";
import { WebComponent } from "../shared/web-component.ts";

class SelectTrigger extends WebComponent {
	private ctx!: SelectContext;
	private button!: HTMLButtonElement;
	private isOpenSubscriptionCleanup = () => {};

	protected mount() {
		this.ctx = getContext(this.cid);
		this.button = this.querySelector("button")!;
		this.isOpenSubscriptionCleanup = this.ctx.subscribe("isOpen", (isOpen) => {
			this.button.setAttribute("aria-expanded", String(isOpen));
			if (!isOpen) this.button.focus();
		});
		this.button.addEventListener("click", this.handleClick);
		this.button.addEventListener("keydown", this.handleKeyDown);
		this.button.setAttribute("aria-expanded", "false");
	}

	protected unmount() {
		this.isOpenSubscriptionCleanup();
		this.button.removeEventListener("click", this.handleClick);
		this.button.removeEventListener("keydown", this.handleKeyDown);
	}

	private open() {
		const { selectedValue } = this.ctx.getState();
		const root = document.querySelector(
			`select-root[data-prop-cid="${this.cid}"]`,
		);
		const items = Array.from(
			root?.querySelectorAll("select-item") ?? [],
		) as HTMLElement[];
		const selectedIndex = items.findIndex(
			(el) => el.dataset.propValue === selectedValue,
		);
		this.ctx.setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
		this.ctx.open();
	}

	private handleClick = () => {
		const { isOpen } = this.ctx.getState();
		isOpen ? this.ctx.close() : this.open();
	};

	private handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "ArrowDown" || e.key === "ArrowUp") {
			e.preventDefault();
			this.open();
		}
	};
}

customElements.define("select-trigger", SelectTrigger);
