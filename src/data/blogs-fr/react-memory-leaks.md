---
title: "Exemples de fuites de mémoire dans React"
date: "16 mars 2026"
structuredDate: "2026-03-16"
---

Parfois, notre code semble tout à fait correct, mais il consomme en réalité plus de mémoire qu'il n'en a besoin. C'est ce qu'on appelle une **fuite de mémoire** (memory leak). Dans React, cela provient généralement d'éléments que React ne gère pas pour vous.

### TL;DR

React ne nettoie pas automatiquement les connexions externes ou tout ce que vous maintenez en vie via des closures. C'est à vous de vous en charger :

- **Effacez les intervals**, fermez les sockets, déconnectez les observers.
- Associez chaque `addEventListener` à un `removeEventListener`.
- Surveillez ce que vos **closures capturent**, particulièrement dans les callbacks mémoïsés.

---

## Pourquoi les closures causent parfois des fuites de mémoire

Une **closure** est une fonction qui conserve l'accès à chaque variable déclarée dans la portée (scope) où elle a été définie, _et pas seulement à celles qu'elle utilise réellement_.

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

`inner` n'utilise que `name`, mais elle conserve des références à tout ce qui se trouve dans `outer`. Par conséquent, si vous stockez `inner` dans un endroit à longue durée de vie, comme un écouteur d'événement, toute la portée reste en mémoire. Le ramasse-miettes (garbage collector) ne peut pas la nettoyer et, avec le temps, l'utilisation de la mémoire grimpe.

### Mémoïsation et closures

`useCallback` et `useMemo` fonctionnent en conservant une référence à la fonction que vous leur passez. Cette fonction est une closure qui capture tout ce qui se trouve dans la portée, et c'est là que les choses peuvent mal tourner.

#### Là où ça coince

```js
function ReportView({ reportId, userId }) {
	// Jeux de données volumineux — pourraient peser plusieurs mégaoctets chacun
	const rawData = useRawReportData(reportId);
	const allTransactions = useAllTransactions(userId);

	// N'a besoin que de reportId — ne touche jamais à rawData
	const handleExport = useCallback(() => {
		exportReport(reportId);
	}, [reportId]);

	// N'a besoin que de userId — ne touche jamais à allTransactions
	const pageTitle = useMemo(() => {
		return `Dashboard for user ${userId}`;
	}, [userId]);
}
```

`handleExport` n'utilise pas `rawData`, et `pageTitle` n'utilise pas `allTransactions`.

Pourtant, **ces deux closures les capturent** car elles sont mémoïsées ; elles restent actives jusqu'à ce que les dépendances changent ou que le composant soit démonté. Cela signifie que des ensembles de données volumineux peuvent stagner en mémoire plus longtemps que prévu.

En règle générale, il ne s'agit que d'un instantané (snapshot). Mais si vous continuez à créer de nouveaux callbacks alors que les anciens sont toujours référencés, vous pouvez vous retrouver avec plusieurs copies, ce qui entraîne des chutes de performance massives.

#### Comment l'éviter ?

- **Minimisez la portée des closures** : Gardez vos fonctions petites ; des composants plus restreints et des hooks personnalisés réduisent le nombre de variables capturées.
- **Évitez de capturer d'autres closures** : Imbriquer des fonctions à l'intérieur d'un composant peut provoquer une réaction en chaîne où chaque fonction dépendante finit par être mémoïsée.
- **Ne mémoïsez que si nécessaire** : `useCallback` et `useMemo` ont un coût ; évitez-les à moins de corriger un problème de rendu (_re-render_) mesurable.
- **Utilisez `useRef` pour les objets volumineux** : Les refs ne sont pas capturées dans les closures, elles ne prolongeront donc pas accidentellement la durée de vie de données volumineuses.

#### La règle fondamentale

> La mémoïsation prolonge la durée de vie d'une closure, et cette closure possède tout ce qui se trouve dans sa portée. Avant d'utiliser `useCallback` ou `useMemo`, demandez-vous ce qui vit d'autre dans cette portée — pas seulement ce que la fonction utilise.

---

## Ressources externes non libérées

Chaque fois qu'un composant communique avec un système extérieur (une API de navigateur ou un serveur), React ne gère pas le nettoyage. C'est notre responsabilité, et la solution consiste à toujours retourner une **fonction de nettoyage** (_cleanup function_) depuis `useEffect`.

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

### Exemple avec les écouteurs d'événements

```js
function SearchBar() {
	const [query, setQuery] = useState("");

	// ❌ incorrect
	useEffect(() => {
		function handleKeydown(e) {
			if (e.key === "/") setQuery("");
		}

		// Attache un nouvel écouteur à chaque rendu
		window.addEventListener("keydown", handleKeydown);

		// Pas de nettoyage — l'écouteur reste attaché
		// même après le démontage de SearchBar
	}, []);

	// ✅ correct
	useEffect(() => {
		function handleKeydown(e) {
			if (e.key === "/") setQuery("");
		}

		window.addEventListener("keydown", handleKeydown);

		// React appelle ceci quand le composant est démonté
		// ou avant que l'effet ne s'exécute à nouveau
		return () => {
			window.removeEventListener("keydown", handleKeydown);
		};
	}, []);
}
```

Le schéma est toujours le même, quel que soit le type de ressource. Une fois que vous avez assimilé le principe **"acquérir au montage, libérer au démontage"**, vous détecterez ces problèmes avant qu'ils ne partent en production.

---

## Conclusion

Les fuites de mémoire dans React sont subtiles mais évitables. Elles proviennent généralement des closures, de la mémoïsation, des écouteurs d'événements ou des ressources externes qui survivent au composant. En prêtant attention à ce qui reste accessible, en nettoyant systématiquement après les effets et en limitant ce que vos closures capturent, vous garderez l'utilisation mémoire de votre application sous contrôle. Appliquer ces pratiques de manière cohérente permet d'éviter que les problèmes de performance ne s'accumulent.
