---
title: "examples of memory leaks in react"
date: "March 16, 2026"
structuredDate: "2026-03-16"
---

Sometimes our code looks fine but it actually consumes more memory then it needs. This is known as a memory leak. In React, this usually comes from things React doesn’t manage for you.

### TL;DR

React doesn't automatically clean up external connections or anything you keep alive through closures. You have to do it yourself:

- Clear intervals, close sockets, disconnect observers
- Pair `addEventListener` with `removeEventListener`
- Watch what your closures capture, especially in memoized callbacks

## Why closures sometimes cause memory leaks

A **closure** is a function that retains access to every variable declared in the scope where it was defined, _not just the ones it actually uses_.

```js
function outer() {
  const name = "joe";
  function greet() { ... }
  class Person { ... }
  const handler = () => { ... }

  return function inner() {
    console.log(name);
  }
}
```

`inner` only uses `name`, but it still holds references to everything in `outer`. So if you store `inner` somewhere _long-lived_, like an event listener, the whole scope stays in memory. The garbage collector can’t clean it up and eventually memory usage creeps up.

### Memoization and closures

`useCallback` and `useMemo` work by holding a reference to the function you pass them. That function is a closure that captures everything in scope, which is where things can go wrong.

#### Where it goes wrong

```js
function ReportView({ reportId, userId }) {
	// Large datasets — could be megabytes each
	const rawData = useRawReportData(reportId);
	const allTransactions = useAllTransactions(userId);

	// Only needs reportId — never touches rawData
	const handleExport = useCallback(() => {
		exportReport(reportId);
	}, [reportId]);

	// Only needs userId — never touches allTransactions
	const pageTitle = useMemo(() => {
		return `Dashboard for user ${userId}`;
	}, [userId]);
}
```

`handleExport` doesn’t use `rawData`, `pageTitle` doesn’t use `allTransactions`.

Still, **both closures capture them** because they’re memoized, they stay alive until dependencies _change_ or the component _unmounts_. That means large datasets can sit in memory longer than expected.

Usually that’s just one snapshot. But if you keep creating new callbacks while old ones are still referenced, you can end up holding multiple copies, leading to massive performance hits.

#### How to avoid it?

- **Minimize closure scopes**:
  keep functions small; smaller components and custom hooks reduce the number of captured variables.
- **Avoid capturing other closures**:
  nesting functions inside a component can cause a chain reaction where every dependent function must also be memoized.
- **Memoize only when necessary**:
  `useCallback` and `useMemo` have overhead; skip them unless you're fixing a measurable re-render issue.
- **Use `useRef` for large objects**:
  refs aren't captured in closures, so they won't accidentally extend the lifetime of large data.

#### The underlying rule

> Memoization extends the lifetime of a closure, and that closure owns everything in scope. Before reaching for `useCallback` or `useMemo`, consider what else lives in that scope — not just what the function uses.

## Unreleased external resources

Any time a component talks to an outside system a browser API or a server, react doesn't handle the cleanup. That's on us and the way to do it is by always returning a cleanup function from `useEffect`.

```js
useEffect(() => {
	// setInterval, new WebSocket, observer.observe...
	const resource = acquireResource();

	return () => {
		// clearInterval, ws.close, observer.disconnect...
		releaseResource(resource);
	};
}, []);
```

### Example with event listeners

```js
function SearchBar() {
	const [query, setQuery] = useState("");

	// ❌ incorrect
	useEffect(() => {
		function handleKeydown(e) {
			if (e.key === "/") setQuery("");
		}

		// Attaches a new listener every render
		window.addEventListener("keydown", handleKeydown);

		// No cleanup — listener stays attached
		// even after SearchBar unmounts
	}, []);

	// ✅ correct
	useEffect(() => {
		function handleKeydown(e) {
			if (e.key === "/") setQuery("");
		}

		window.addEventListener("keydown", handleKeydown);

		// React calls this when the component unmounts
		// or before the effect re-runs
		return () => {
			window.removeEventListener("keydown", handleKeydown);
		};
	}, []);
}
```

The pattern is always the same regardless of the resource type. Once you internalize _"acquire on mount, release on unmount"_, you'll catch these before they ship.

## Conclusion

Memory leaks in React are subtle but preventable. They usually come from closures, memoization, event listeners, or external resources that outlive the component. Paying attention to what stays reachable, cleaning up after effects, and limiting what your closures capture will help keep your app’s memory usage under control. Following these practices consistently avoids performance issues before they accumulate into serious problems.
