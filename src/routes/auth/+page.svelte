<script lang="ts">
	import DOMPurify from 'dompurify';
	import { marked } from 'marked';

	import { toast } from 'svelte-sonner';

	import { onMount, getContext, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	import { getBackendConfig } from '$lib/apis';
	import {
		ldapUserSignIn,
		getSessionUser,
		userSignIn,
		userSignUp,
		updateUserTimezone
	} from '$lib/apis/auths';

	import { WEBUI_API_BASE_URL, WEBUI_BASE_URL } from '$lib/constants';
	import { WEBUI_NAME, config, user, socket } from '$lib/stores';

	import { generateInitialsImage, canvasPixelTest, getUserTimezone } from '$lib/utils';

	import Spinner from '$lib/components/common/Spinner.svelte';
	import OnBoarding from '$lib/components/OnBoarding.svelte';
	import SensitiveInput from '$lib/components/common/SensitiveInput.svelte';
	import { redirect } from '@sveltejs/kit';
	import MathBackground from '$lib/components/chat/MathBackground.svelte';

	const i18n = getContext('i18n');

	let loaded = false;

	let mode = $config?.features.enable_ldap ? 'ldap' : 'signin';

	let form = null;

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';

	let ldapUsername = '';

	const setSessionUser = async (sessionUser, redirectPath: string | null = null) => {
		if (sessionUser) {
			console.log(sessionUser);
			toast.success($i18n.t(`You're now logged in.`));
			if (sessionUser.token) {
				localStorage.token = sessionUser.token;
			}
			$socket.emit('user-join', { auth: { token: sessionUser.token } });
			await user.set(sessionUser);
			await config.set(await getBackendConfig());

			// Update user timezone
			const timezone = getUserTimezone();
			if (sessionUser.token && timezone) {
				updateUserTimezone(sessionUser.token, timezone);
			}

			if (!redirectPath) {
				redirectPath = $page.url.searchParams.get('redirect') || '/';
			}

			goto(redirectPath);
			localStorage.removeItem('redirectPath');
		}
	};

	const signInHandler = async () => {
		const sessionUser = await userSignIn(email, password).catch((error) => {
			toast.error(`${error}`);
			return null;
		});

		await setSessionUser(sessionUser);
	};

	const signUpHandler = async () => {
		if ($config?.features?.enable_signup_password_confirmation) {
			if (password !== confirmPassword) {
				toast.error($i18n.t('Passwords do not match.'));
				return;
			}
		}

		const sessionUser = await userSignUp(name, email, password, generateInitialsImage(name)).catch(
			(error) => {
				toast.error(`${error}`);
				return null;
			}
		);

		await setSessionUser(sessionUser);
	};

	const ldapSignInHandler = async () => {
		const sessionUser = await ldapUserSignIn(ldapUsername, password).catch((error) => {
			toast.error(`${error}`);
			return null;
		});
		await setSessionUser(sessionUser);
	};

	const submitHandler = async () => {
		if (mode === 'ldap') {
			await ldapSignInHandler();
		} else if (mode === 'signin') {
			await signInHandler();
		} else {
			await signUpHandler();
		}
	};

	const oauthCallbackHandler = async () => {
		// Get the value of the 'token' cookie
		function getCookie(name) {
			const match = document.cookie.match(
				new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
			);
			return match ? decodeURIComponent(match[1]) : null;
		}

		const token = getCookie('token');
		if (!token) {
			return;
		}

		const sessionUser = await getSessionUser(token).catch((error) => {
			toast.error(`${error}`);
			return null;
		});

		if (!sessionUser) {
			return;
		}

		localStorage.token = token;
		await setSessionUser(sessionUser, localStorage.getItem('redirectPath') || null);
	};

	let onboarding = false;

	async function setLogoImage() {
		await tick();
		const logo = document.getElementById('logo');

		if (logo) {
			const isDarkMode = document.documentElement.classList.contains('dark');

			if (isDarkMode) {
				const darkImage = new Image();
				darkImage.src = `${WEBUI_BASE_URL}/static/favicon-dark.png`;

				darkImage.onload = () => {
					logo.src = `${WEBUI_BASE_URL}/static/favicon-dark.png`;
					logo.style.filter = ''; // Ensure no inversion is applied if favicon-dark.png exists
				};

				darkImage.onerror = () => {
					logo.style.filter = 'invert(1)'; // Invert image if favicon-dark.png is missing
				};
			}
		}
	}

	onMount(async () => {
		const redirectPath = $page.url.searchParams.get('redirect');
		if ($user !== undefined) {
			goto(redirectPath || '/');
		} else {
			if (redirectPath) {
				localStorage.setItem('redirectPath', redirectPath);
			}
		}

		const error = $page.url.searchParams.get('error');
		if (error) {
			toast.error(error);
		}

		await oauthCallbackHandler();
		form = $page.url.searchParams.get('form');

		loaded = true;
		setLogoImage();

		if (($config?.features.auth_trusted_header ?? false) || $config?.features.auth === false) {
			await signInHandler();
		} else {
			onboarding = $config?.onboarding ?? false;
		}
	});
</script>

<svelte:head>
	<title>
		{`${$WEBUI_NAME}`}
	</title>
</svelte:head>

<OnBoarding
	bind:show={onboarding}
	getStartedHandler={() => {
		onboarding = false;
		mode = $config?.features.enable_ldap ? 'ldap' : 'signup';
	}}
/>

<div class="w-full h-screen text-gray-900 relative flex overflow-hidden bg-white" id="auth-page">
	{#if loaded}
		<!-- Left Side: Login Form -->
		<div
			class="w-full lg:w-1/2 h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 bg-white z-10 overflow-y-auto per-scrollbar relative"
		>
			<!-- Math Background (Left Side - Subtle) -->
			<div class="absolute inset-0 opacity-[50] z-0 pointer-events-none">
				<MathBackground />
			</div>

			<div class="w-full max-w-md mx-auto py-10 relative z-10">
				{#if ($config?.features.auth_trusted_header ?? false) || $config?.features.auth === false}
					<div class="my-auto pb-10 w-full">
						<div
							class="flex items-center justify-center gap-3 text-xl sm:text-2xl text-center font-medium dark:text-gray-200"
						>
							<div>{$i18n.t('Signing in to {{WEBUI_NAME}}', { WEBUI_NAME: $WEBUI_NAME })}</div>
							<div><Spinner className="size-5" /></div>
						</div>
					</div>
				{:else}
					<!-- Header Section -->
					<div class="mb-10">
						<div class="flex items-center gap-2 mb-8 lg:hidden">
							<img src="{WEBUI_BASE_URL}/static/favicon.png" class="size-10" alt="Logo" />
						</div>

						<h1 class="text-4xl font-bold text-gray-900 dark:text-black tracking-tight mb-2">
							{#if $config?.onboarding ?? false}
								{$i18n.t(`Commencer`)}
							{:else if mode === 'ldap'}
								{$i18n.t(`Connexion LDAP`)}
							{:else if mode === 'signin'}
								{$i18n.t(`Bonjour,`)}
								<br />
								<span class="text-3xl">{$i18n.t(`Heureux de vous revoir`)}</span>
							{:else}
								{$i18n.t(`Créer un compte`)}
							{/if}
						</h1>

						<p class="text-gray-500 text-lg">
							{#if mode === 'signin'}
								{$i18n.t('Connectez-vous pour continuer.')}
							{:else if mode === 'signup'}
								{$i18n.t("Rejoignez APIA dès aujourd'hui.")}
							{/if}
						</p>
					</div>

					<!-- Form -->
					<form
						class="flex flex-col gap-5"
						on:submit={(e) => {
							e.preventDefault();
							submitHandler();
						}}
					>
						{#if $config?.features.enable_login_form || $config?.features.enable_ldap || form}
							<div class="flex flex-col gap-4">
								{#if mode === 'signup'}
									<div>
										<label for="name" class="text-sm font-semibold text-gray-700 block mb-1.5"
											>{$i18n.t('Nom')}</label
										>
										<input
											bind:value={name}
											type="text"
											id="name"
											class="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-hidden transition text-gray-900 placeholder-gray-400"
											autocomplete="name"
											placeholder={$i18n.t('Entrez votre nom complet')}
											required
										/>
									</div>
								{/if}

								{#if mode === 'ldap'}
									<div>
										<label for="username" class="text-sm font-semibold text-gray-700 block mb-1.5"
											>{$i18n.t("Nom d'utilisateur")}</label
										>
										<input
											bind:value={ldapUsername}
											type="text"
											class="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-hidden transition text-gray-900 placeholder-gray-400"
											autocomplete="username"
											name="username"
											id="username"
											placeholder={$i18n.t("Entrez votre nom d'utilisateur")}
											required
										/>
									</div>
								{:else}
									<div>
										<label for="email" class="text-sm font-semibold text-gray-700 block mb-1.5"
											>{$i18n.t('Email')}</label
										>
										<input
											bind:value={email}
											type="email"
											id="email"
											class="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-hidden transition text-gray-900 placeholder-gray-400"
											autocomplete="email"
											name="email"
											placeholder={$i18n.t('nom@exemple.com')}
											required
										/>
									</div>
								{/if}

								<div>
									<div class="flex justify-between items-center mb-1.5">
										<label for="password" class="text-sm font-semibold text-gray-700"
											>{$i18n.t('Mot de passe')}</label
										>
										{#if mode === 'signin'}
											<a href="#" class="text-xs font-medium text-gray-900 hover:underline"
												>Mot de passe oublié ?</a
											>
										{/if}
									</div>
									<SensitiveInput
										bind:value={password}
										type="password"
										id="password"
										class="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-hidden transition text-gray-900 placeholder-gray-400"
										placeholder={'••••••••'}
										autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
										name="password"
										required
									/>
								</div>

								{#if mode === 'signup' && $config?.features?.enable_signup_password_confirmation}
									<div>
										<label
											for="confirm-password"
											class="text-sm font-semibold text-gray-700 block mb-1.5"
											>{$i18n.t('Confirmer le mot de passe')}</label
										>
										<SensitiveInput
											bind:value={confirmPassword}
											type="password"
											id="confirm-password"
											class="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-hidden transition text-gray-900 placeholder-gray-400"
											placeholder={'••••••••'}
											autocomplete="new-password"
											name="confirm-password"
											required
										/>
									</div>
								{/if}
							</div>
						{/if}

						<div class="mt-4">
							<button
								class="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 rounded-xl transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
								type="submit"
							>
								{mode === 'signin'
									? $i18n.t('Se connecter')
									: ($config?.onboarding ?? false)
										? $i18n.t('Créer un compte Admin')
										: $i18n.t("S'inscrire")}
							</button>

							{#if $config?.features.enable_signup && !($config?.onboarding ?? false)}
								<div class="mt-6 text-sm text-center text-gray-600">
									{mode === 'signin'
										? $i18n.t("Vous n'avez pas de compte ?")
										: $i18n.t('Vous avez déjà un compte ?')}

									<button
										class="font-bold text-gray-900 hover:underline ml-1"
										type="button"
										on:click={() => {
											mode = mode === 'signin' ? 'signup' : 'signin';
										}}
									>
										{mode === 'signin' ? $i18n.t("S'inscrire") : $i18n.t('Se connecter')}
									</button>
								</div>
							{/if}
						</div>
					</form>

					{#if Object.keys($config?.oauth?.providers ?? {}).length > 0}
						<div class="relative py-8">
							<div class="absolute inset-0 flex items-center">
								<div class="w-full border-t border-gray-200"></div>
							</div>
							<div class="relative flex justify-center text-sm">
								<span class="px-2 bg-white text-gray-500">Ou continuer avec</span>
							</div>
						</div>

						<!-- OAuth Buttons (Simplified) -->
						<div class="grid grid-cols-2 gap-3">
							{#if $config?.oauth?.providers?.google}
								<button
									class="flex justify-center items-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-xl transition"
									on:click={() => {
										window.location.href = `${WEBUI_BASE_URL}/oauth/google/login`;
									}}
								>
									<svg class="size-5 mr-2" viewBox="0 0 48 48"
										><path
											fill="#EA4335"
											d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
										/><path
											fill="#4285F4"
											d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
										/><path
											fill="#FBBC05"
											d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
										/><path
											fill="#34A853"
											d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
										/><path fill="none" d="M0 0h48v48H0z" /></svg
									>
									Google
								</button>
							{/if}
							<!-- Add other providers as needed in similar clean style -->
							{#if $config?.oauth?.providers?.github}
								<button
									class="flex justify-center items-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-xl transition"
									on:click={() => {
										window.location.href = `${WEBUI_BASE_URL}/oauth/github/login`;
									}}
								>
									<svg class="size-5 mr-2" viewBox="0 0 24 24"
										><path
											fill="currentColor"
											d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.92 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12z"
										/></svg
									>
									GitHub
								</button>
							{/if}
						</div>
					{/if}

					{#if $config?.metadata?.login_footer}
						<div class="max-w-3xl mx-auto mt-8">
							<div class="text-xs text-gray-400 text-center">
								{@html DOMPurify.sanitize(marked($config?.metadata?.login_footer))}
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<!-- Right Side: Branding (Floating Card Style) -->
		<div class="hidden lg:flex w-1/2 h-full p-4 pl-0">
			<div
				class="w-full h-full bg-gray-900 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center p-12 text-center text-white shadow-2xl"
			>
				<!-- Background Gradient -->
				<div class="absolute inset-0 bg-linear-to-br from-gray-900 to-gray-800 z-0"></div>

				<!-- Math Background -->
				<div class="absolute inset-0 opacity-10 z-10 pointer-events-none">
					<MathBackground />
				</div>

				<!-- Content -->
				<div class="relative z-20 max-w-lg">
					<div
						class="bg-white/10 backdrop-blur-sm p-6 rounded-full inline-block mb-8 border border-white/10 shadow-lg"
					>
						<img
							src="{WEBUI_BASE_URL}/static/favicon.png"
							class="h-20 w-auto opacity-100"
							alt="Logo"
						/>
					</div>
					<!-- <h2 class="text-4xl font-bold tracking-tight mb-4">Prêt à te surpasser ?</h2>
					<p class="text-xl text-gray-300 font-light leading-relaxed">
						L'excellence est une habitude. <br /> <strong class="text-white">APIA</strong> est ton outil.
					</p> -->
				</div>
			</div>
		</div>
	{/if}
</div>
