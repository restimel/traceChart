import type { ChartData } from '@/types';
import { toClassName } from '@/utils/htmlTools';

export function svgStyle(data: ChartData): string {
    const categoriesClass = Array.from(data.categories, ([name, {color}]) => categoryClass(name, color));

    return `
    <style>
        svg { background: #FFFFFF; }

        .marker {
            stroke: context-stroke;
            stroke-width: 2;
        }

        .timeline {
            stroke: #003300;
            stroke-width: 4;
            stroke-dasharray: 10 2;
            marker-end: url(#arrowhead);
            marker-start: url(#marker);
        }

        ${categoriesClass.join('\n')}

        .start-method {
            fill: none;
            stroke-width: 2;
            stroke-dasharray: 5 4;
            marker-end: url(#arrowhead);
            marker-start: url(#bullet);
        }

        .stop-method {
            fill: none;
            stroke-width: 2;
            stroke-dasharray: 5 4;

            marker-end: url(#arrowhead);
        }

        .period-method {
            stroke-width: 2;
            fill: none;
        }

        .call-method {
            fill: none;
            stroke-width: 2;
            marker-end: url(#arrowhead);
            marker-start: url(#bullet);
        }

        .inner-call {
            stroke-width: 2;
            marker-start: url(#marker);
        }

        .label-method {
            font-family: Arial, sans-serif;
            font-size: 15px;
            font-weight: bold;
            text-anchor: start;
            dominant-baseline: middle;
            stroke: none;
        }

        .label-call {
            font-family: Arial, sans-serif;
            font-size: 14px;
            text-anchor: start;
            dominant-baseline: middle;
            stroke: none;
        }

        .label-info {
            font-family: Arial, sans-serif;
            font-size: 14px;
            text-anchor: middle;
            dominant-baseline: middle;
            stroke: none;
            fill: #009700;
        }

        .details-methods,
        .details-info {
            font-family: Arial, sans-serif;
            font-size: 9.5px;
            text-anchor: middle;
            dominant-baseline: middle;
            stroke: none;
            fill: #979797;
        }

        .details-methods {
            text-anchor: start;
        }

        .info-box {
            stroke: #009700;
            fill: #EDF7E6;
            stroke-width: 2;
        }

        .link-info {
            stroke: #009700;
            stroke-width: 0.5;
            stroke-dasharray: 15 2;
            marker-end: url(#bullet);
        }

        .warning.link-info {
            stroke: #FF0000;
        }
        .warning.details-info {
            fill: #FF0000;
        }

        .legend {
            text-anchor: start;
            dominant-baseline: middle;
            stroke-width: 4;
        }
        .legend text {
            font-family: Arial, sans-serif;
            font-size: 16px;
            fill: black;
            stroke: none;
        }

        .legend-box {
            fill: none;
            stroke: black;
        }

    </style>
    `;
}

function categoryClass(category: string, color: string) {
    const className = toClassName(category);

    return `.${className} {
    stroke: ${color};
    fill: ${color};
}`;
}
