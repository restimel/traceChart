<template>
    <div class="legend-editor">
        <h3>Categories Editor</h3>

        <table
            :class="[
                'legend-table',
                { error: error?.origin === 'legend' },
            ]"
        >
            <thead>
                <tr class="header">
                    <th>Key</th>
                    <th>Label</th>
                    <th>Color</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="legend of legendOrder"
                    :key="identifiers.get(legend.key) ?? legend.key"
                >
                    <td>
                        <input
                            type="text"
                            :value="legend.key"
                            @input="changeKey(legend.key, ($event.target as HTMLInputElement).value ?? '')"
                            :key="`${identifiers.get(legend.key) ?? legend.key}-key`"
                        />
                    </td>
                    <td>
                        <input
                            type="text"
                            :value="legend.label || legend.key"
                            @input="changeLabel(legend.key, ($event.target as HTMLInputElement).value ?? '')"
                            :key="`${identifiers.get(legend.key) ?? legend.key}-label`"
                        />
                    </td>
                    <td>
                        <input
                            type="color"
                            :value="legend.color"
                            @input="changeColor(legend.key, ($event.target as HTMLInputElement).value ?? '')"
                            :key="`${identifiers.get(legend.key) ?? legend.key}-color`"
                        />
                    </td>
                    <td>
                        <button v-if="canRemove(legend)"
                            @click="remove(legend.key)"
                        >
                            ✖
                        </button>
                        <span v-else-if="!legend.used"
                            class="not-used"
                            title="This category is currently not used. Remove it from the code if you don't want it anymore."
                        >
                            ?
                        </span>
                    </td>
                </tr>

                <tr v-if="newLegend"
                    :key="newLegendId"
                >
                    <td>
                        <input
                            type="text"
                            v-model="newLegend.key"
                            :placeholder="newLegendId"
                            @blur="updateNew(newLegend.key)"
                            :key="`${newLegendId}-key`"
                        />
                    </td>
                    <td>
                        <input
                            type="text"
                            v-model="newLegend.label"
                            :placeholder="newLegend.key"
                            @blur="updateNew(newLegend.label)"
                            :key="`${newLegendId}-label`"
                        />
                    </td>
                    <td>
                        <input
                            type="color"
                            v-model="newLegend.color"
                            @change="updateNew(newLegend.color)"
                            :key="`${newLegendId}-color`"
                        />
                    </td>
                    <td>
                        <button
                            @click="newLegend = null"
                        >
                            ✖
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        <button
            class="main"
            @click="addNew"
        >
            + add
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { error } from '@/store/Store';
import { getColor } from '@/utils/chart';
import type { Categories, Category } from '@/types';

interface Props {
    categories: Categories;
}

interface Emits {
    (e: 'update:code', value: Categories): void;
};

/* TODO: allow to change order */

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localLegend = ref<Categories>(new Map());
const newLegend = ref<Category | null>(null);

const identifiers = new Map<string, string>();
let inc = 0;

const legendOrder = computed(() => {
    const list = Array.from(localLegend.value.values());

    list.sort((a, b) => a.order - b.order);

    /* Reset order */
    list.forEach((value, index) => {
        value.order = index;
    });

    return list;
});

const newLegendId = computed(() => {
    return 'category ' + localLegend.value.size;
});

const onCodeChange = () => {
    emit('update:code', localLegend.value);
};

const changeColor = (key: string, color: string) => {
    const info = localLegend.value.get(key)!;
    info.color = color;
    info.origin = 'legend';
    onCodeChange();
};

const changeLabel = (key: string, label: string) => {
    const info = localLegend.value.get(key)!;
    info.label = label;
    info.origin = 'legend';
    onCodeChange();
};

const changeKey = (key: string, newKeyValue: string) => {
    const info = localLegend.value.get(key)!;
    info.key = newKeyValue;
    info.origin = 'legend';
    localLegend.value.delete(key);
    localLegend.value.set(newKeyValue, info);

    const keyId = identifiers.get(key) ?? newKeyValue;
    identifiers.set(newKeyValue, keyId);
    identifiers.delete(key);

    onCodeChange();
};

const remove = (key: string) => {
    localLegend.value.delete(key);
    onCodeChange();
};

const addNew = () => {
    const legend: Category = {
        key: '',
        label: '',
        color: getColor(identifiers.size),
        origin: 'legend',
        used: false,
        order: identifiers.size,
    };

    newLegend.value = legend;
};

const updateNew = (value: string) => {
    const legend = newLegend.value;

    if (!legend || !value) {
        return;
    }

    const keyId = newLegendId.value;
    const key = legend.key || keyId;
    legend.key = key;

    localLegend.value.set(key, legend);

    identifiers.set(key, keyId);
    newLegend.value = null;
};

watch(() => props.categories, (newValue) => {
    localLegend.value = new Map(newValue);

    newValue.forEach((_info, key) => {
        if (!identifiers.has(key)) {
            identifiers.set(key, `id-${key}-${inc++}`);
        }
    });
}, {immediate: true, deep: true});

function canRemove(legend: Category): boolean {
    return !legend.used && (
        legend.origin === 'legend' ||
        legend.origin === 'file'
    );
}
</script>

<style scoped>
.legend-editor {
    margin-bottom: 20px;
}

.legend-table {
    border: 1px solid var(--color-border);
    padding: var(--small-padding);
    border-radius: var(--border-radius);
    width: 100%;
}

.not-used {
    cursor: help;
}
</style>
