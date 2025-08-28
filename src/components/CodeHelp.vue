<template>
    <div class="mask"
        @click="close"
    >
    </div>
    <div class="modal">
        <button class="close-btn" @click="close">
            ×
        </button>
        <VueMarkdownRender
            :source="content"
            :options="options"
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VueMarkdownRender from 'vue-markdown-render';

export type MessageKind = '' | 'code' | 'parseFromConsole';

const props = defineProps<{
    message: MessageKind;
}>();
const emit = defineEmits<{
    close: []
}>();

const options = {
    html: false,
    xhtmlOut: false,
    breaks: true,
    linkify: false,
    typographer: true,
    quotes: '“”‘’', /* ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for french */
};

const codeExplanation = `
## Trace syntax

A trace line syntax is:
\`\`\`
<level> <name> [<category>] // [<action>] <comment>
\`\`\`
* \`<level>\` (**mandatory**): indicate the level of this trace event.
This is 1 \`+\` for level 1, for a child of the previous trace add another \`+\` (so \`++\` for level 2).
* \`<name>\`  (**optional** but highly recommended): the name of the trace event.
Special characters (such as \`[]/\\\`) can be escaped with \`\\\`.
* \`<category>\` (**optional**): indicate in which category the trace event is linked to.
It will use the defined color for this category.
If missing, it will use the same category as the parent trace event.
* \`<action>\` (**optional**): Add an important comment for this trace event.
* \`<comment>\` (**optional**): Add a small comment for this trace event.

### Example

\`\`\`
traces:
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
\`\`\`
`;

const parseFromConsoleExplanation = `
## Parse from console

When copy-pasting text from the browser console, each line often includes the file name and line number before the actual message.

Instead of manually cleaning the text, this option will automatically **ignore the first word of each line**.

For example, this input:
\`\`\`
CodeEditor.vue:120 + onHelp()
\`\`\`
will be parsed as
\`\`\`
+ onHelp()
\`\`\`
`;

const content = computed<string>(() => {
    switch (props.message) {
        case 'code':
            return codeExplanation;
        case 'parseFromConsole':
            return parseFromConsoleExplanation;
        default:
            return '';
    }
});

function close() {
    emit('close');
}
</script>

<style scoped>
.mask {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}

.modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    padding: var(--padding);

    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    background: var(--color-background-mute);

    max-height: 95vh;
    max-width: 95vw;
    overflow: auto;

    box-shadow: 0 0 200px 0 #99999999;
}

.modal :deep(code) {
    font-size: 0.9em;
    color: #77431d;
}

.modal :deep(pre) {
    background: var(--color-background-code);
    padding: var(--small-padding);
}

.modal :deep(strong) {
    font-weight: bolder;
}

.close-btn {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0;
    font-size: 0.6em;
    width: 1.5em;
    height: 1.5em;
    border-radius: var(--border-radius-round);
    background-color: var(--color-text);
    color: var(--color-background);
    text-align: center;
}
</style>
