<template>
    <div id="app">
        <nav>
            <router-link to="/">Application</router-link>
            <router-link to="/about">About</router-link>
        </nav>
        <main>
            <router-view />
        </main>
        <ErrorNotification />
    </div>
</template>

<script setup lang="ts">
import ErrorNotification from '@/components/ErrorNotification.vue';
</script>

<style>
#app {
    font-family: Arial, sans-serif;
}

nav {
    background-color: #f8f9fa;
    padding: 1rem;
    display: flex;
    gap: 1rem;
}

nav a {
    text-decoration: none;
    color: #007bff;
    padding: 0.5rem 1rem;
    border-radius: 4px;
}

nav a:hover,
nav a.router-link-active {
    background-color: #007bff;
    color: white;
}

main {
    height: calc(100% - 4rem);
}
</style>
