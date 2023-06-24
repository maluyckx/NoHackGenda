<script lang="ts">
	async function logout() {
		const res = await fetch('/api/auth/logout', {
			method: 'POST'
		});
		if (res.redirected) {
			window.location.href = res.url;
			return;
		}
		if (!res.ok) throw new Error(await res.text());
	}

	async function deleteAccount() {
		const res = await fetch('/api/user/me', {
			method: 'DELETE'
		});
		if (res.redirected) {
			window.location.href = res.url;
			return;
		}
		if (!res.ok) throw new Error(await res.text());
	}
</script>

<button on:click={logout}>Logout</button>
<button on:click={deleteAccount}>Delete account</button>
