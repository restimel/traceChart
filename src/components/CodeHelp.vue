<template>
    <div class="mask"
        @click="close"
    >
    </div>
    <div class="modal">
        <button class="close-btn" @click="close">
            ×
        </button>
        <code><pre>
            {{ content }}
        </pre></code>
    </div>
</template>

<script setup lang="ts">

const emit = defineEmits<{
    close: []
}>();

const content = `
## Trace syntax

A trace line syntax is:
\`\`\`
<level> <name> [<category>] // [<Action>] <comment>
\`\`\`
* \`<level>\` (**mandatory**): indicate the level of this trace event.
This is 1 \`+\` for level 1, for a child of the previous trace add another \`+\` (so \`++\` for level 2).
* \`<name>\`  (**optional** but highly recommended): the name of the trace event.
Special characters (such as \`[]/\\\`) can be escaped with \`\\\`.
* \`<category>\` (**optional**): indicate in which category the trace event is linked to.
It will use the defined color for this category.
If missing, it will use the same category as the parent trace event.
* \`<Action>\` (**optional**): Add an important comment for this trace event.
* \`<comment>\` (**optional**): Add a small comment for this trace event.

## Example

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
