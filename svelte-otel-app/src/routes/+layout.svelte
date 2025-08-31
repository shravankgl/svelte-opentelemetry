<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';
	import { initializeTracing } from  '$lib/tracing.js';
	import { initializeMetrics } from '$lib/metrics.js';
	import { initializeLogging, getLogger } from '$lib/logging.js';
	initializeTracing();
	initializeMetrics();
	initializeLogging();

	let { children } = $props();

	function logButtonClick() {
		const logger = getLogger();
		if (logger) {
			logger.emit({
				body: 'Custom button clicked!',
				severityNumber: 9, // INFO
				severityText: 'INFO',
				attributes: {
					'custom.event': 'button_click',
					'page.route': window.location.pathname
				}
			});
			// Optionally, show feedback
			alert('Custom log sent!');
		}
	}
</script>

<div class="app">
	<Header />

	<main>
		<button onclick={logButtonClick} style="margin-bottom: 1rem;">Log Custom Event</button>
		{@render children()}
	</main>

	<footer>
		<p>
			visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to learn about SvelteKit
		</p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
