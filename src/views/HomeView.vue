<template>
    <div class="home"
        :class="{
            dragging: dragging,
        }"
        @drop="handleDrop"
        @dragover.prevent="dragging = true"
        @dragenter.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
    >
      <h1>Trace-chart</h1>

      <div class="app-layout">
          <div class="left-panel">
              <CodeEditor
                  :code="code"
                  @update:code="updateCode"
              />
              <LegendEditor
                  :categories="legend"
                  @update:code="updateLegendCode"
              />
          </div>

          <div class="right-panel">
              <SvgViewer :svg-content="svgContent" @file-loaded="loadSvgFile" />
          </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import CodeEditor from '@/components/CodeEditor.vue';
import LegendEditor from '@/components/LegendEditor.vue';
import SvgViewer from '@/components/SvgViewer.vue';
import { code, legend, setError, updateLegend } from '@/store/Store';
import { processFile } from '@/utils/fileUtils';
import { chartDataToString, extractCode, stringToChartData } from '@/utils/parser';
import { generateSvgFromCode, type SvgInfo } from '@/utils/svgGenerator';
import type { Categories } from '@/types';

const dragging = ref(false);

const svgParsing = computed<SvgInfo | Partial<SvgInfo>>(() => {
    const value = code.value;

    if (!value) {
        return {};
    }

    return generateSvgFromCode(value, legend.value);
});

const svgContent = computed(() => {
    return svgParsing.value?.svg ?? '';
});

const updateCode = (newCode: string) => {
    code.value = newCode;

    const newLegend = svgParsing.value;
    const categories = newLegend?.chartData?.categories;

    updateLegend(categories);
};

const updateLegendCode = (newLegend: Categories) => {
    legend.value = newLegend;
};

const loadSvgFile = (content: string) => {
    if (typeof content !== 'string') {
        setError('File should be a text file.', 'uploadFile');
        return;
    }

    const newCode = extractCode(content);

    if (!newCode) {
        setError('No "trace-chart" code have been detected in this file.', 'uploadFile');
        return;
    }

    const chartData = stringToChartData(newCode);
    const stringCode = chartDataToString(chartData, true);

    legend.value = chartData?.categories;
    code.value = stringCode;
};


const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    dragging.value = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
        const content = await processFile(files[0]);

        if (content) {
            loadSvgFile(content);
        }
    }
};

</script>

<style scoped>
.home {
    padding: var(--padding);
    height: 100%;
}

.home.dragging {
    border: 2px dashed var(--color-secondary-bg);
}

.app-layout {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 20px;
    margin-top: 20px;
}

@media (max-width: 768px) {
    .app-layout {
        grid-template-columns: 1fr;
    }
}
</style>
