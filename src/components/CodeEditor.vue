<template>
    <div class="code-editor">
        <h3 class="header">
            Code Editor
            <span class="help" @click="onHelp('code')">
                ?
            </span>
        </h3>
        <div class="options">
            <label>
                <input
                    type="checkbox"
                    :value="parameters.parseFromConsole"
                    @input="toggleParseFromConsole()"
                >
                Parse from console
                <span class="help" @click.stop.prevent="onHelp('parseFromConsole')">
                    ?
                </span>
            </label>
        </div>
        <code-mirror
            :class="{ error: error?.origin === 'code' }"
            v-model="localCode"
            @change="onCodeChange"
            :extensions="[
                basicSetup,
                wrapExtension,
                customLinter,
                lintGutter(),
                placeholder(placeholderValue)
            ]"
        />
        <CodeHelp v-if="!!codeHelpMessage" :message="codeHelpMessage" @close="codeHelpMessage = ''" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { codeErrors, error, parameters, toggleParseFromConsole } from '@/store/Store';
import CodeHelp, { type MessageKind } from '@/components/CodeHelp.vue';
import CodeMirror from 'vue-codemirror6';
import { EditorView, placeholder } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';

interface Props {
    code: string;
}

interface Emits {
    (e: 'update:code', value: string): void;
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localCode = ref(props.code);
const codeHelpMessage = ref<MessageKind>('');

const onCodeChange = () => {
    emit('update:code', localCode.value);
};

const placeholderValue = `Enter trace-chart code here
such as

+ main() // start
++ parse argv
++ do tasks
`;

const charSize = '55ch';
const wrapExtension = EditorView.theme({
    '&': { maxWidth: charSize },
    '.cm-scroller': {
        overflow: 'auto',
        maxWidth: charSize,
        'min-height': '140px',
    },
    '.cm-line': {
        maxWidth: charSize,
        wordWrap: 'break-word',
    },
});

const customLinter = linter((view) => {
    const diagnostics: Diagnostic[] = [];

    codeErrors.value.forEach(error => {
        let from: number;
        let to: number;

        if ('line' in error) {
            const line = view.state.doc.line(error.line);
            from = line.from + (error.from ?? 0);
            to = typeof error.to === 'number' ? line.from + error.to : line.to;
        } else {
            from = error.fromChar;
            to = error.toChar;
        }

        diagnostics.push({
            from: from,
            to: to,
            severity: error.severity || 'error',
            message: error.message,
        });
    });

    return diagnostics;
});

watch(() => props.code, (newCode) => {
    localCode.value = newCode;
});

function onHelp(value: MessageKind) {
    codeHelpMessage.value = value;
}
</script>

<style scoped>
.code-editor {
    margin-bottom: 20px;
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

.options {
    font-size: 0.85em;
    text-align: right;
}
</style>
