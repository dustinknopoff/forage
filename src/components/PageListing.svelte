<script lang="ts">
	import slugify from "slugify"
	import { generateSummary } from "./utils"
	export let page
</script>

<div class="card">
	<div class="topline">
		<ul class="tags">
			{#each page.taxonomies.categories as cat}
				<li>
					<a href={`/categories/${cat}`}>{cat}</a>
				</li>
			{/each}
			{#each page.taxonomies.tags as tag}
				<li>
					<a href={`/tags/${tag}`}>{tag}</a>
				</li>
			{/each}
		</ul>
		<a href={"/articles/" + slugify(page.title)}>
			<h3>{page.title}</h3>
		</a>
	</div>
	<a href={"/articles/" + slugify(page.title)}>
		{#if page.summary}
			{page.summary}
		{:else}
			{generateSummary(page.content.html)}
		{/if}
	</a>
</div>
