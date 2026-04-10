import { getContext } from "./registry.ts";
import type { SelectContext } from "./context.ts";
import { WebComponent } from "../shared/web-component.ts";

class SelectItem extends WebComponent {
	private ctx!: SelectContext;
	private SelectedValueSubscriptionCleanup = () => {};

	private unsubActiveIndex!: () => void;
	private unsubIsOpen!: () => void;

	protected mount() {
		this.ctx = getContext(this.cid);
		this.setAttribute("role", "option");
		this.setAttribute("tabindex", "-1");
		const siblings = Array.from(
			this.parentElement?.querySelectorAll("select-item") ?? [],
		) as SelectItem[];
		this.id = `${this.cid}-option-${siblings.indexOf(this)}`;
		this.SelectedValueSubscriptionCleanup = this.ctx.subscribe(
			"selectedValue",
			() => this.update(),
		);
		this.unsubActiveIndex = this.ctx.subscribe("activeIndex", () =>
			this.updateFocus(),
		);
		this.unsubIsOpen = this.ctx.subscribe("isOpen", () => this.updateFocus());
		this.addEventListener("click", this.handleClick);
		this.update();
	}

	protected unmount() {
		this.SelectedValueSubscriptionCleanup();
		this.unsubActiveIndex();
		this.unsubIsOpen();
		this.removeEventListener("click", this.handleClick);
	}

	private handleClick = () => {
		const value = this.dataset.propValue;
		if (!value) throw new Error(`select-item is missing data-prop-value`);
		const siblings = Array.from(
			this.parentElement?.querySelectorAll("select-item") ?? [],
		) as SelectItem[];
		const index = siblings.indexOf(this);
		this.ctx.setActiveIndex(index);
		this.ctx.select(value);
	};

	private update() {
		const { selectedValue } = this.ctx.getState();
		const value = this.dataset.propValue;
		this.setAttribute("aria-selected", String(selectedValue === value));
	}

	private updateFocus() {
		const { activeIndex, isOpen } = this.ctx.getState();
		const siblings = Array.from(
			this.parentElement?.querySelectorAll("select-item") ?? [],
		) as SelectItem[];
		const index = siblings.indexOf(this);
		if (isOpen && index === activeIndex) requestAnimationFrame(() => this.focus());
	}
}

customElements.define("select-item", SelectItem);
