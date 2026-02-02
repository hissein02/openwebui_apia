<script lang="ts">
	import { getVersionUpdates } from '$lib/apis';
	import { getOllamaVersion } from '$lib/apis/ollama';
	import { WEBUI_BUILD_HASH, WEBUI_VERSION } from '$lib/constants';
	import { WEBUI_NAME, config, showChangelog } from '$lib/stores';
	import { compareVersion } from '$lib/utils';
	import { onMount, getContext } from 'svelte';

	import Tooltip from '$lib/components/common/Tooltip.svelte';

	const i18n = getContext('i18n');

	let ollamaVersion = '';

	let updateAvailable = null;
	let version = {
		current: '',
		latest: ''
	};

	const checkForVersionUpdates = async () => {
		updateAvailable = null;
		version = await getVersionUpdates(localStorage.token).catch((error) => {
			return {
				current: WEBUI_VERSION,
				latest: WEBUI_VERSION
			};
		});

		console.log(version);

		updateAvailable = compareVersion(version.latest, version.current);
		console.log(updateAvailable);
	};

	onMount(async () => {
		ollamaVersion = await getOllamaVersion(localStorage.token).catch((error) => {
			return '';
		});

		if ($config?.features?.enable_version_update_check) {
			checkForVersionUpdates();
		}
	});
</script>

<div id="tab-about" class="flex flex-col h-full justify-between space-y-3 text-sm mb-6">
	<div class="space-y-4">
		<!-- Titre -->
		<div>
			<div class="mb-1 text-sm font-medium text-primary">APIA</div>
			<div class="text-xs text-gray-600 italic">
				Assistant Pédagogique Intelligent pour l’Apprentissage
			</div>
		</div>

		<!-- Version -->
		<div class="flex flex-col text-xs text-gray-700 dark:text-gray-200">
			<div class="flex gap-1 items-center">
				<Tooltip content={WEBUI_BUILD_HASH}>
					v{WEBUI_VERSION}
				</Tooltip>

				{#if $config?.features?.enable_version_update_check}
					<span class="text-gray-400">
						{updateAvailable === null
							? $i18n.t('Checking for updates...')
							: updateAvailable
								? `(v${version.latest} disponible)`
								: '(à jour)'}
					</span>
				{/if}
			</div>

			<button
				class="underline text-xs text-gray-500 w-fit"
				on:click={() => showChangelog.set(true)}
			>
				Voir les nouveautés
			</button>
		</div>

		<hr class="border-gray-100/30 dark:border-gray-850/30" />

		<!-- Description -->
		<p class="text-sm text-gray-700 dark:text-gray-200">
			APIA est une application développée dans un cadre pédagogique à l’EFREI. Elle a pour objectif
			d’accompagner les étudiants et enseignants dans leurs activités d’apprentissage,
			d’expérimentation et de réflexion autour de l’intelligence artificielle.
		</p>

		<!-- Objectifs -->
		<div>
			<div class="text-sm font-medium mb-1">Objectifs</div>
			<ul class="list-disc list-inside text-sm text-gray-700 dark:text-gray-200">
				<li>Faciliter l’interaction avec des modèles d’IA</li>
				<li>Proposer une interface claire et accessible</li>
				<li>Servir de support à des projets académiques EFREI</li>
			</ul>
		</div>

		<!-- Ollama -->
		{#if ollamaVersion}
			<hr class="border-gray-100/30 dark:border-gray-850/30" />
			<div>
				<div class="text-sm font-medium mb-1">
					{$i18n.t('Ollama Version')}
				</div>
				<div class="text-xs text-gray-700 dark:text-gray-200">
					{ollamaVersion}
				</div>
			</div>
		{/if}

		<!-- Footer -->
		<div class="pt-4 text-xs text-gray-400 dark:text-gray-500 border-t">
			Projet académique EFREI – © {new Date().getFullYear()}
		</div>
	</div>
</div>
