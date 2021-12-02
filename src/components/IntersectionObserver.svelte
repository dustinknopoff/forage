<script>
	import { onMount } from "svelte"

	// Intersection Observer Options
	var options = {
		root: null,
		rootMargin: "0px",
		threshold: [1],
	}

	onMount(() => {
		var wrapping = document.querySelector(".content")
		var allHtags = wrapping.querySelectorAll("h1,h2")
		// Each Intersection Observer runs setCurrent
		var observeHtags = new IntersectionObserver(setCurrent, options)
		// Function that runs when the Intersection Observer fires
		function setCurrent(e) {
			var allSectionLinks = document.querySelectorAll(".toc-Link")
			e.map((i) => {
				if (i.isIntersecting === true) {
					allSectionLinks.forEach((link) => link.classList.remove("current"))
					document.querySelector(`a[href="#${i.target.id.replace("h-", "")}"]`).classList.add("current")
				}
			})
		}

		// Now
		allHtags.forEach((tag) => {
			observeHtags.observe(tag)
		})
	})
</script>

<slot />
