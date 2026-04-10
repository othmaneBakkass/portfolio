export function animateChevron(chevron: Element, from: number, to: number) {
	chevron.animate(
		[{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }],
		{ duration: 400, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" },
	);
}
