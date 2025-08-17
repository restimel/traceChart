import { htmlSafe, toClassName } from '@/utils/htmlTools';
import {
    COMMENT_MARGIN,
    COMMENT_MIDDLE_SIZE,
    EVENT_HEIGHT,
    LEVEL_SIZE,
    MAX_TEXT_SIZE,
    TEXT_MARGIN,
} from './constant';
import type { ChartData, Content, Trace } from '@/types';

type TraceContent = {
    idx: number;
    content: string;
    maxIndentation: number;
};

export function svgContent(data: ChartData): Content {
    let idx = 1;
    let maxIndentation = 0;

    const contents = data.trace.map((task) => {
        const child = addTask(task, idx, 1);

        idx = child.idx;
        maxIndentation = Math.max(maxIndentation, child.maxIndentation);

        return child.content;
    });

    const lastY = (idx + 1) * EVENT_HEIGHT;
    const timelineX = COMMENT_MIDDLE_SIZE * 2 + TEXT_MARGIN + LEVEL_SIZE;
    const timelineY = EVENT_HEIGHT;

    const content = `
    <g class="state-timeline" transform="translate(${timelineX}, ${timelineY})">
        <line x1="0" y1="0" x2="0" y2="${lastY}" class="timeline" />
        ${contents.join('\n')}
    </g>
    `;

    const maxX = timelineX + maxIndentation * LEVEL_SIZE + TEXT_MARGIN + MAX_TEXT_SIZE;
    const maxY = lastY + EVENT_HEIGHT * 2;

    return {
        content: content,
        dimension: [
            [0, 0],
            [maxX, maxY],
        ],
    };
}

function addTask(task: Trace, idx: number, indent: number): TraceContent {
    if (task.subTasks?.length) {
        return addFunction(task, idx, indent);
    }

    return addCall(task, idx, indent);
}

function addCall(task: Trace, idx: number, indent: number): TraceContent {
    const x = LEVEL_SIZE;
    const y = idx * EVENT_HEIGHT;

    const arrowTask = task.name ? `
        <text x="${TEXT_MARGIN}" y="0" class="label-call">${htmlSafe(task.name)}</text>
        <line x1="-${x}" y1="0" x2="0" y2="0" class="call-method" />
    ` : '';

    const content = `
    <g class="call ${toClassName(task.category)}" transform="translate(${x}, ${y})">
        ${addComment(task, indent)}
        ${arrowTask}
    </g>
    `;

    return {
        idx: idx + 1,
        content,
        maxIndentation: indent,
    };
};

function addFunction(task: Trace, idx: number, indent: number): TraceContent {
    const x = LEVEL_SIZE;
    const y = idx * EVENT_HEIGHT;
    let currentIdx = 1;
    let maxIndentation = indent;
    const childIndent = indent + 1;
    const subTasks = task.subTasks ?? [];

    const children = subTasks.map((task) => {
        const child = addTask(task, currentIdx, childIndent);

        currentIdx = child.idx;
        maxIndentation = Math.max(maxIndentation, child.maxIndentation);

        return child.content;
    });

    const lastY = currentIdx * EVENT_HEIGHT;
    const content = [
        `<g class="${toClassName(task.category)}" transform="translate(${x}, ${y})">`,
        addComment(task, indent),
        `    <text x="${TEXT_MARGIN}" y="0" class="label-method">${htmlSafe(task.name)}</text>`,
        `    <line x1="-${LEVEL_SIZE}" y1="0" x2="0" y2="0" class="start-method" />`,
        `    <line x1="0" y1="0" x2="0" y2="${lastY}" class="period-method" />`,
        `    <line x1="0" y1="${lastY}" x2="-${LEVEL_SIZE}" y2="${lastY}" class="stop-method" />`,
        ...children,
        '</g>',
    ];

    return {
        idx: currentIdx + idx + 1,
        content: content.join('\n'),
        maxIndentation: maxIndentation,
    };
}

function addComment(task: Trace, indent: number): string {
    if (!task.event && !task.comment) {
        return '';
    }

    const x = -(indent * LEVEL_SIZE + COMMENT_MARGIN);
    const textX = x - COMMENT_MIDDLE_SIZE;
    const elements = [
        `<line x1="${x}" y1="0" x2="${-LEVEL_SIZE}" y2="0" class="link-info" />`,
    ];

    if (task.event) {
        const boxX = textX - COMMENT_MIDDLE_SIZE;
        elements.push(
            `<rect x="${boxX}" y="-15" width="${2 * COMMENT_MIDDLE_SIZE}" height="30" rx="10" class="info-box" />`,
            `<text x="${textX}" y="0" class="label-info">${task.event}</text>`
        );
    }

    if (task.comment) {
        const textY = task.event ? 25 : 0;
        elements.push(
            `<text x="${textX}" y="${textY}" class="details-info">${task.comment}</text>`
        );
    }

    return elements.join('\n');
}
