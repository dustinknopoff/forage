<script>
	let key
	let keyCode

	function handleKeydown(event) {
		key = event.key
		keyCode = event.keyCode
		console.log({ event })
	}
</script>

<div on:keypress={handleKeydown}>
	<slot />
</div>
