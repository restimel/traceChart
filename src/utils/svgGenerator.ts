import { svgContent } from '@/components/svg/contentSvg';
import { svgLegend } from '@/components/svg/legendSvg';
import { svgStyle } from '@/components/svg/styleSVG';

import type { Categories, ChartData } from '@/types';
import { chartDataToString, stringToChartData } from './parser';
import { clearError, setError } from '@/store/Store';

export type SvgInfo = {
    svg: string;
    chartData: ChartData | null;
}

export const generateSvgFromCode = (code: string, categories?: Categories): SvgInfo => {
    clearError('code');

    try {
        const data = stringToChartData(code, categories);
        const svg = svgBody(data);

        return {
            svg,
            chartData: data,
        };
    } catch(err) {
        let message: string;

        if (err instanceof Error) {
            message = err.message;
        } else {
            message = String(err);
        }

        setError(message, 'code');

        return {
            svg: '',
            chartData: null,
        };
    }
};

function svgBody(data: ChartData): string {
    const contents = svgContent(data);
    const legends = svgLegend(data, contents.dimension);

    const width = Math.max(contents.dimension[1][0], legends.dimension[1][0]);
    const height = Math.max(contents.dimension[1][1], legends.dimension[1][1]);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${svgTraceChart(data)}
    ${svgStyle(data)}
    ${legends.content}
    ${svgDefs()}
    ${contents.content}
</svg>
`;
}

function svgDefs(): string {
    return `
    <defs>
        <marker id="arrowhead" markerWidth="5" markerHeight="7" refX="4" refY="1.75" orient="auto">
            <polygon points="0,0 5,1.75 0,3.5" fill="context-stroke" />
        </marker>

        <marker id="bullet" markerWidth="5" markerHeight="5" refX="2" refY="2" orient="auto">
            <circle cx="2" cy="2" r="2" fill="context-stroke" />
        </marker>

        <marker id="bullet2" markerWidth="5" markerHeight="5" refX="2" refY="2" orient="auto">
            <circle cx="2" cy="2" r="2" fill="context-stroke" />
        </marker>

        <marker id="marker" markerWidth="5" markerHeight="5" refX="0" refY="2" orient="auto">
            <line x1="0" y1="0" x2="0" y2="4" class="marker" />
        </marker>
    </defs>
    `;
}

function svgTraceChart(chart: ChartData): string {
    const code = chartDataToString(chart);
    const link = document.location.href;

    const svg = [
        `<!-- trace-chart: Generated from Trace-Chart (${link}) [${ __APP_VERSION__ }]`,
        code,
        '-->',
    ];

    return svg.join('\n');
}
