<template>
    <div class="code-editor">
        <h3 class="header">
            Code Editor
            <span class="help" @click="onHelp">
                ?
            </span>
        </h3>
        <textarea
            :class="{ error: error?.origin === 'code' }"
            v-model="localCode"
            @input="onCodeChange"
            :placeholder="placeholder"
            rows="10"
            cols="50"
        ></textarea>
        <CodeHelp v-if="openCodeHelp" @close="openCodeHelp = false" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { error } from '@/store/Store';
import CodeHelp from '@/components/CodeHelp.vue';

interface Props {
    code: string;
}

interface Emits {
    (e: 'update:code', value: string): void;
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localCode = ref(props.code);
const openCodeHelp = ref(false);

const onCodeChange = () => {
    emit('update:code', localCode.value);
};

const placeholder = `Enter the trace-chart code here
such as

+ generateSvgFromCode[svgGenerator] // architecture to generate the svg
++ stringToChartData[parser] // [parse trace chart code]
+++ parseCategories[parser]
+++ parseTrace[parser]
++ svgBody[svgGenerator] // [generate the svg]
+++ svgContent[components]
+++ svgLegend[components]
+++ svgTraceChart[svgGenerator] // write the trace chart code
++++ chartDataToString[parser]
+++++ categoriesStr[parser]
+++++ allTraceStr[parser]
++++++ traceStr[parser]
+++ svgStyle[components]
+++ svgDefs[svgGenerator]
`;

watch(() => props.code, (newCode) => {
    localCode.value = newCode;
});

function onHelp() {
    openCodeHelp.value = true;
}
</script>

<style scoped>
.code-editor {
    margin-bottom: 20px;
}

textarea {
    width: 100%;
    font-family: 'Courier New', monospace;
    border: 1px solid #ccc;
    padding: var(--small-padding);
    border-radius: var(--border-radius);
}

.header {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
}

.help {
    display: inline-block;
    font-size: 0.6em;
    width: 1.5em;
    height: 1.5em;
    border-radius: var(--border-radius-round);
    cursor: help;
    background-color: var(--color-text);
    color: var(--color-background);
    text-align: center;
}
</style>
