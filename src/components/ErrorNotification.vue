<template>
    <aside v-if="error"
        class="error"
        @click="clearError()"
    >
        <pre>{{ error.message }}</pre>
    </aside>
</template>

<script setup lang="ts">
import { clearError, error } from '@/store/Store';

</script>

<style scoped>
.error {
    border: 2px solid var(--color-error);
    background: color(from var(--color-error) srgb r g b / 0.15);
    color: var(--color-error);
    border-radius: 5px;

    position: fixed;
    z-index: 1000;
    top: 10px;
    left: 50%;
    transform: translate(-50%, 0);
    padding: 10px;

    cursor: pointer;

}
</style>
