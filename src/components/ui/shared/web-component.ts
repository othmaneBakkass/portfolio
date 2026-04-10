export abstract class WebComponent extends HTMLElement {
	protected cid!: string;

	connectedCallback() {
		const cid = this.dataset.propCid;
		if (!cid) throw new Error(`${this.tagName} is missing data-prop-cid`);
		this.cid = cid;
		this.mount();
	}

	disconnectedCallback() {
		this.unmount();
	}

	protected abstract mount(): void;
	protected abstract unmount(): void;
}

export abstract class WebComponentRoot extends HTMLElement {
	protected cid!: string;

	connectedCallback() {
		this.cid = crypto.randomUUID();
		this.dataset.propCid = this.cid;
		this.mount();
	}

	disconnectedCallback() {
		this.unmount();
	}

	protected abstract mount(): void;
	protected abstract unmount(): void;
}
