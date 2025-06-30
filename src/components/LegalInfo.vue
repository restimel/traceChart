<template>
    <div class="legal-info">
        <h2>About</h2>

        <section>
            <h3>Version</h3>
            <p>{{ version }}</p>
        </section>

        <section>
            <h3>Licence</h3>
            <p>MIT</p>
        </section>

        <section>
            <h3>Contact</h3>
            <p></p>
        </section>

        <section>
            <h3>Report bugs</h3>
            <p></p>
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
    padding: 20px;
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
