export interface SelectState {
	isOpen: boolean;
	selectedValue: string | null;
	activeIndex: number;
}

export type StateKey = keyof SelectState;
export type KeyedListener<K extends StateKey> = (value: SelectState[K]) => void;

export interface SelectContext {
	getState: () => SelectState;
	open: () => void;
	close: () => void;
	select: (value: string) => void;
	setActiveIndex: (index: number) => void;
	subscribe<K extends StateKey>(key: K, listener: KeyedListener<K>): () => void;
}

export function createSelectContext(initial: SelectState): SelectContext {
	let state: SelectState = { ...initial };

	const keyedListeners = {
		isOpen: new Set<KeyedListener<"isOpen">>(),
		selectedValue: new Set<KeyedListener<"selectedValue">>(),
		activeIndex: new Set<KeyedListener<"activeIndex">>(),
	} satisfies { [K in StateKey]: Set<KeyedListener<K>> };

	function setState(patch: Partial<SelectState>) {
		const changedKeys = (Object.keys(patch) as StateKey[]).filter(
			(k) => patch[k] !== state[k],
		);

		if (changedKeys.length === 0) return;

		Object.assign(state, patch);

		for (const key of changedKeys) {
			(keyedListeners[key] as Set<KeyedListener<typeof key>>).forEach((l) =>
				l(state[key]),
			);
		}
	}

	return {
		getState: () => state,

		open: () => setState({ isOpen: true }),

		close: () => setState({ isOpen: false, activeIndex: 0 }),

		select: (value) =>
			setState({ selectedValue: value, isOpen: false }),

		setActiveIndex: (index) => setState({ activeIndex: index }),

		subscribe<K extends StateKey>(
			key: K,
			listener: KeyedListener<K>,
		): () => void {
			const set = keyedListeners[key] as Set<KeyedListener<K>>;
			set.add(listener);
			return () => set.delete(listener);
		},
	};
}
