<template>
    <div class="svg-viewer">
        <div class="svg-controls">
            <h3>SVG Visualization</h3>
            <span class="actions">
                <input
                    type="file"
                    ref="fileInput"
                    @change="handleFileSelect"
                    accept=".svg"
                    class="hidden"
                >
                <button
                    class="select-btn secondary"
                    :class="{
                        error: error?.origin === 'uploadFile',
                    }"
                    @click="selectFile"
                >
                    Select a File
                </button>
                <button
                    class="download-btn main"
                    @click="downloadSvg"
                    :disabled="!svgContent"
                >
                    Download SVG
                </button>
            </span>
        </div>
        <div class="svg-container" v-html="svgContent"></div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { error } from '@/store/Store';
import {
    downloadSvg as downloadSvgUtil,
    processFile,
} from '@/utils/fileUtils';

interface Props {
    svgContent: string;
}

interface Emits {
    (e: 'file-loaded', content: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const fileInput = ref<HTMLInputElement>();

function downloadSvg() {
    if (props.svgContent) {
        downloadSvgUtil(props.svgContent);
    }
}

function selectFile() {
    fileInput.value?.click();
}

async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
        const content = await processFile(file);

        if (content) {
            emit('file-loaded', content);
        }
    }
}

</script>

<style scoped>
.svg-viewer {
    margin-bottom: 20px;
    max-width: 100%;
}

.svg-viewer :global(svg) {
    max-width: 100%;
}

.svg-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.svg-container {
    border: 1px solid var(--color-border);
    padding: var(--padding);
    min-height: 200px;
    background-color: var(--color-background);
    border-radius: var(--border-radius);
}

.actions {
    display: flex;
    gap: 10px;
}
</style>
