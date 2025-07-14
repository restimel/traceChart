<template>
    <div class="legal-info">
        <h2>About</h2>

        <section>
            <h3>Version</h3>
            <p>{{ version }}</p>
        </section>

        <section>
            <h3>Licence</h3>
            <p><a href="https://github.com/restimel/traceChart/blob/main/LICENSE" target="blank">MIT</a></p>
        </section>

        <section>
            <h3>Report bugs</h3>
            <p><a href="https://github.com/restimel/traceChart/issues" target="_blank">Report issues on Github</a></p>
        </section>
    </div>
</template>

<script setup lang="ts">
const version = __APP_VERSION__;
</script>

<style scoped>
.legal-info {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--padding);
    line-height: 1.6;
}

section {
    margin-bottom: 30px;
}

h3 {
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
}
</style>
