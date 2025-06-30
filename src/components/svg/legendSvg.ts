import { htmlSafe, toClassName } from '@/utils/htmlTools';
import {
    LEGEND_ITEM_HEIGHT,
    LEGEND_ITEM_MAX_SIZE,
    LEGEND_LINE_SIZE,
    LEGEND_MARGIN,
    TEXT_MARGIN,
} from '@/components/svg/constant';
import type { Box, ChartData, Content } from '@/types';

export function svgLegend(data: ChartData, contentBox: Box): Content {
    const maxX = LEGEND_LINE_SIZE + TEXT_MARGIN + LEGEND_ITEM_MAX_SIZE + 2 * LEGEND_MARGIN;
    const maxY = LEGEND_ITEM_HEIGHT * data.categories.size + 2 * LEGEND_MARGIN;

    const x = contentBox[1][0] + LEGEND_MARGIN;
    const y = contentBox[0][1] + LEGEND_MARGIN; // TODO center

    const categoryList = Array.from(data.categories.values()).sort((a, b) => a.order - b.order);
    const legendList = categoryList.map(({label, key}, idx) => {
        const className = toClassName(key);

        return `
        <g class="${className}" transform="translate(0, ${idx * LEGEND_ITEM_HEIGHT})">
            <line x1="0" y1="0" x2="${LEGEND_LINE_SIZE}" y2="0" />
            <text x="${LEGEND_LINE_SIZE + TEXT_MARGIN}" y="0" class="label-legend">${htmlSafe(label || key)}</text>
        </g>
        `;
    });

    const content = `
    <g class="legend" transform="translate(${x}, ${y})">
        <rect x="-${LEGEND_MARGIN}" y="-${LEGEND_MARGIN}" width="${maxX}" height="${maxY}" class="legend-box" />

        ${legendList.join('')}
    </g>
    `;

    const legendBox: Box = [
        [x, y],
        [x + maxX, y + maxY],
    ];

    return {
        content,
        dimension: legendBox,
    };
}
