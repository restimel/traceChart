<template>
    <div class="code-editor">
        <h3>Code Editor</h3>
        <textarea
            :class="{ error: error?.origin === 'code' }"
            v-model="localCode"
            @input="onCodeChange"
            placeholder="Enter the code trace-chart code here..."
            rows="10"
            cols="50"
        ></textarea>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { error } from '@/store/Store';

interface Props {
    code: string;
}

interface Emits {
    (e: 'update:code', value: string): void;
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localCode = ref(props.code);

const onCodeChange = () => {
    emit('update:code', localCode.value);
};

watch(() => props.code, (newCode) => {
    localCode.value = newCode;
});
</script>

<style scoped>
.code-editor {
    margin-bottom: 20px;
}

textarea {
    width: 100%;
    font-family: 'Courier New', monospace;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 4px;
}
</style>
