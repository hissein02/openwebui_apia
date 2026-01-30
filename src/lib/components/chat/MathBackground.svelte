<script>
	import { onMount } from 'svelte';

	const formulas = [
		'E = mc^2',
		'e^{i\\pi} + 1 = 0',
		'\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}',
		'a^2 + b^2 = c^2',
		'\\frac{d}{dx} e^x = e^x',
		'F = ma',
		'\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}',
		'i^2 = -1',
		'\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}',
		'A = \\pi r^2',
		'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
		'\\sin^2(x) + \\cos^2(x) = 1',
		'\\log_{b}(xy) = \\log_{b}(x) + \\log_{b}(y)',
		'\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1',
		'\\phi = \\frac{1 + \\sqrt{5}}{2}'
	];

	// Duplicate formulas to ensure enough coverage (simple randomization)
	const displayFormulas = [...formulas, ...formulas, ...formulas, ...formulas].sort(
		() => 0.5 - Math.random()
	);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div
	class="math-background absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-5 select-none font-handwritten"
>
	<div class="animate-scrolling-text">
		{#each Array(10) as _, i}
			<div class="whitespace-nowrap flex gap-12 text-2xl lg:text-4xl py-4 opacity-50">
				{#each displayFormulas as formula}
					<span class="inline-block transform rotate-[-2deg]">{formula}</span>
				{/each}
			</div>
			<div class="whitespace-nowrap flex gap-16 text-3xl lg:text-5xl py-6 opacity-30 ml-20">
				{#each displayFormulas.slice().reverse() as formula}
					<span class="inline-block transform rotate-[2deg]">{formula}</span>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.font-handwritten {
		font-family: 'Caveat', cursive;
		color: currentColor; /* Inherit text color, heavily reliant on parent's contrast settings, but we set opacity */
	}

	/* Ensure visible in both modes, though opacity handles blending */
	:global(.dark) .math-background {
		color: rgba(255, 255, 255, 0.8);
	}
	:global(html:not(.dark)) .math-background {
		color: rgba(0, 0, 0, 0.8);
	}

	.animate-scrolling-text {
		animation: scroll 60s linear infinite;
	}

	@keyframes scroll {
		0% {
			transform: translateY(0);
		}
		100% {
			transform: translateY(-50%);
		}
	}

	/* Make the container tall enough to scroll */
	.math-background > div {
		height: 200%;
	}
</style>
