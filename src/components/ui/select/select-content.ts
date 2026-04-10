import { getContext } from "./registry.ts";
import type { SelectContext } from "./context.ts";
import { WebComponent } from "../shared/web-component.ts";

class SelectContent extends WebComponent {
	private ctx!: SelectContext;
	private unsubIsOpen!: () => void;
	private unsubActiveIndex!: () => void;

	protected mount() {
		this.ctx = getContext(this.cid);
		this.unsubIsOpen = this.ctx.subscribe("isOpen", () => this.update());
		this.unsubActiveIndex = this.ctx.subscribe("activeIndex", () =>
			this.updateActiveDescendant(),
		);
		this.addEventListener("keydown", this.handleKeyDown);
		document.addEventListener("pointerdown", this.handleOutsideClick);
		this.update();
	}

	protected unmount() {
		this.unsubIsOpen();
		this.unsubActiveIndex();
		this.removeEventListener("keydown", this.handleKeyDown);
		document.removeEventListener("pointerdown", this.handleOutsideClick);
	}

	private handleOutsideClick = (e: PointerEvent) => {
		const root = this.closest("select-root");
		if (root && !root.contains(e.target as Node)) this.ctx.close();
	};

	private handleKeyDown = (e: KeyboardEvent) => {
		const { activeIndex } = this.ctx.getState();
		const items = Array.from(
			this.querySelectorAll("select-item"),
		) as HTMLElement[];

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				this.ctx.setActiveIndex(Math.min(activeIndex + 1, items.length - 1));
				break;
			case "ArrowUp":
				e.preventDefault();
				this.ctx.setActiveIndex(Math.max(activeIndex - 1, 0));
				break;
			case "Enter":
			case " ":
				e.preventDefault();
				items[activeIndex]?.click();
				break;
			case "Escape":
			case "Tab":
				this.ctx.close();
				break;
		}
	};

	private update() {
		const { isOpen } = this.ctx.getState();
		this.setAttribute("aria-hidden", String(!isOpen));
		if (isOpen) this.updateActiveDescendant();
	}

	private updateActiveDescendant() {
		const { activeIndex } = this.ctx.getState();
		const items = Array.from(
			this.querySelectorAll("select-item"),
		) as HTMLElement[];
		const activeId = items[activeIndex]?.id;
		if (activeId) this.setAttribute("aria-activedescendant", activeId);
	}
}

customElements.define("select-content", SelectContent);
