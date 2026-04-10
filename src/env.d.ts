declare namespace astroHTML.JSX {
	interface IntrinsicElements {
		"select-root": astroHTML.JSX.HTMLAttributes & {
			"data-prop-is-open"?: string;
			"data-prop-selected-value"?: string;
			"data-prop-active-index"?: string;
		};
		"select-trigger": astroHTML.JSX.HTMLAttributes;
		"select-content": astroHTML.JSX.HTMLAttributes & {
			role?: "listbox";
			"aria-hidden": boolean | string;
		};
		"select-item": astroHTML.JSX.HTMLAttributes & {
			role?: "option";
			"aria-selected"?: string;
			"data-prop-value": string;
		};
	}
}
