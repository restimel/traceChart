import { getColor } from '@/utils/chart';
import type { Categories, Category, ChartData, Trace } from '@/types';

/*
 * categories:
 * + <id>: <label> {<color>}
 * + <id>: {<color>}
 *
 * trace:
 * + <name> [<category>] // [<event>] <comment>
 * + <name> [<category>] // [<event>]
 * + <name> [<category>] // <comment>
 * + <name> [<category>]
 * + <name> // [<event>] <comment>
 * + <name> // [<event>]
 * + <name> // <comment>
 * + <name>
 * ++ <childName> [<category>]
 * +++ <subChildName> [<category>]
 */

/* {{{ helpers */

function indent(nb = 1): string {
    return new Array(nb).fill('+').join('');
}

function escapeLabel(text: string): string {
    return text.replace(/[\\{}[\]\/:<>]/g, '\\$&');
}

function unescapeLabel(text?: string): string {
    return (text ?? '').replace(/\\(.)/g, '$1');
}

function isValidColor(color: string | undefined): color is string {
    if (!color) {
        return false;
    }

    const validColorRgx = /^#[\da-f]{3,4}$|^#[\da-f]{6}$|^#[\da-f]{8}$|^\w+$/i;

    return validColorRgx.test(color);
}

/* }}} */
/* {{{ string → ChartData */

export function stringToChartData(text: string, categories?: Categories): ChartData {
    const trimmedText = text.trim();
    const drawChart: ChartData = {
        categories: categories ?? new Map(),
        trace: [],
    };

    const sectionRgx = /(?:^|\n)(?<sectionName>\w+:)(?<content>(?:\n\+[^\n]+|\n+(?=\n))+)/g;
    let noSection = true;
    const additionalCategories: string[] = [];

    for (const result of trimmedText.matchAll(sectionRgx)) {
        noSection = false;
        switch (result.groups?.sectionName.toLowerCase()) {
            case 'categories:':
            case 'categorie:':
            case 'category:': {
                const parsedCategories = parseCategories(result.groups.content);
                drawChart.categories = new Map([...drawChart.categories, ...parsedCategories]);
                break;
            }
            case 'traces:':
            case 'trace:':
                const traceAnalyzed = parseTrace(result.groups.content);

                drawChart.trace = traceAnalyzed.trace;
                additionalCategories.push(...traceAnalyzed.categoryUsed);

                break;
            default:
                /* eslint-disable-next-line no-console */
                console.warn('Parsing issue: Section "%s" detected but this section is unknown', result.groups?.sectionName);
        }
    }

    if (noSection) {
        const traceAnalyzed = parseTrace(trimmedText);

        drawChart.trace = traceAnalyzed.trace;
        additionalCategories.push(...traceAnalyzed.categoryUsed);
    }

    /* clean categories */
    drawChart.categories.forEach((info, key, map) => {
        if (additionalCategories.includes(key)) {
            info.used = true;
        } else {
            if (!info.explicit) {
                map.delete(key);
            } else {
                info.used = false;
            }
        }
    });

    if (additionalCategories.length) {
        const categories = drawChart.categories;

        additionalCategories.forEach((category) => {
            if (!categories.has(category)) {
                categories.set(category, {
                    key: category,
                    label: '',
                    color: getColor(categories.size),
                    order: categories.size,
                    explicit: false,
                    used: true,
                });

            }
        });
    }

    return drawChart;

    /*
     * const data = {
     *     categories: new Map([
     *         ['php', {color: '#9D939A', label: 'PHP start page' }],
     *         ['Site', {color: '#006FFF', label: 'Site' }],
     *         ['Cache', {color: '#930000', label: 'Cache' }],
     *         ['Module', {color: '#388E3C', label: 'Module' }],
     *         ['Config', {color: '#673AB7', label: 'Configuration' }],
     *         ['IOP', {color: '#D73AB7', label: 'ICWrapper' }],
     *         ['Session', {color: '#F5AC00', label: 'Session' }],
     *         ['Languages', {color: '#200070', label: 'Languages' }],
     *         ['Cerbere', {color: '#00B0A0', label: 'Cerbere' }],
     *         ['Page', {color: '#E09080', label: 'Page' }],
     *         ['Env', {color: '#A0E000', label: 'Env' }],
     *         ['Auth', {color: '#9090E0', label: 'Auth' }],
     *     ]),
     *     trace: [{
     *         name: '<product>.php',
     *         category: 'php',
     *         subTasks: [{
     *             name: trimmedText,
     *             category: 'php',
     *             event: 'Load Classes',
     *             comment: 'all PHP Classes',
     *         }, {
     *             name: 'Site::render()',
     *             category: 'Site',
     *             subTasks: [{
     *                 name: 'Cache::get()',
     *                 category: 'Cache',
     *             }],
     *         }, {
     *             name: 'test',
     *             category: 'Module',
     *         }],
     *     }],
     * };
     */

    // return data;
}

function parseCategories(code: string): Map<string, Category> {
    const categories = new Map<string, Category>();

    const categoryRgx = /^\s*\+\s*(?<categoryId>(?:[^:\\\n]|\\.)+):\s*(?<label>(?:[^{\\\n]|\\.)+)?\{(?<color>(?:[^}\\\n]|\\.)+)\}/gm;

    for (const result of code.matchAll(categoryRgx)) {
        const categoryId = unescapeLabel(result.groups?.categoryId?.trim());
        const label = unescapeLabel(result.groups?.label?.trim());
        const color = unescapeLabel(result.groups?.color?.trim());

        if (categoryId) {
            categories.set(categoryId, {
                key: categoryId,
                label: label || '',
                color: isValidColor(color) ? color : getColor(categories.size),
                explicit: true,
                order: categories.size,
                used: false,
            });
        }
    }

    return categories;
}

function parseTrace(code: string): {categoryUsed: string[], trace: Trace[]} {
    const traces: Trace[] = [];
    const categories = new Set<string>();
    const stack: Trace[] = [];

    const traceRgx = /^\s*(?<indentation>\++)\s*(?<name>(?:[^\[\/\\\n]|\\.)+)\s*(?:\[(?<category>(?:[^\]\\\n]|\\.)+)])?[ \t]*(?:\/{2,}[ \t]*(?:\[(?<event>(?:[^\]\\\n]|\\.)+)])?(?<comment>[^\n\r]*))?$/gm;

    for (const result of code.matchAll(traceRgx)) {
        const indentation = result.groups?.indentation ?? '+';
        const name = unescapeLabel(result.groups?.name?.trim());
        const category = unescapeLabel(result.groups?.category?.trim());
        const event = unescapeLabel(result.groups?.event?.trim());
        const comment = unescapeLabel(result.groups?.comment?.trim());

        const indentLevel = indentation.length - 1;

        const currentTrace: Trace = {
            name,
            category,
            event,
            comment,
            subTasks: [],
        };

        if (category) {
            categories.add(category);
        }

        if (indentLevel > stack.length) {
            throw new Error(`A line seems to be the grand-child of the precedent line. Please verify the number of "+".\n "${result[0]}"`);
        }

        if (indentLevel < stack.length) {
            stack.splice(indentLevel, Infinity, currentTrace);
        } else {
            stack.push(currentTrace);
        }

        const parent = stack[indentLevel - 1];
        if (parent) {
            parent.subTasks!.push(currentTrace);

            if (!category) {
                currentTrace.category = parent.category;
            }
        } else {
            traces.push(currentTrace);

            if (!category) {
                currentTrace.category = 'main';
                categories.add('main');
            }
        }
    }

    return {
        trace: traces,
        categoryUsed: Array.from(categories),
    };
}

/* }}} */
/* {{{ chartData → string */

export function chartDataToString(chart: ChartData, onlyCode = false): string {
    const contents = [];

    if (!onlyCode) {
        contents.push(categoriesStr(chart));
    }

    contents.push(allTraceStr(chart));

    return contents.join('\n');
}

function categoriesStr(chart: ChartData): string {
    const indentation = indent(1);
    const categoriesStr = Array.from(chart.categories, ([categoryId, data]) => {
        const label = data.label;
        const color = data.color;

        if (!label) {
            return `${indentation} ${escapeLabel(categoryId)}: {${color}}`;
        }

        return `${indentation} ${escapeLabel(categoryId)}: ${escapeLabel(label)}{${color}}`;
    });

    return 'categories:\n' + categoriesStr.join('\n');
}

function allTraceStr(chart: ChartData): string {
    const traces = chart.trace.map((task) => traceStr(task, 1));

    return 'traces:\n' + traces.join('\n');
}

function traceStr(trace: Trace, indentLevel: number): string {
    const indentation = indent(indentLevel);
    const { name, category, event, comment, subTasks } = trace;
    const categoryStr = category ? `[${escapeLabel(category)}]` : '';
    const eventStr =  event ? `[${escapeLabel(event)}]` : '';
    const commentStr =  eventStr || comment ? `// ${eventStr} ${escapeLabel(comment ?? '')}` : '';

    const content = [`${indentation} ${escapeLabel(name)}${categoryStr}${commentStr}`];

    if (subTasks) {
        subTasks.forEach((task) => {
            content.push(traceStr(task, indentLevel + 1));
        });
    }

    return content.join('\n');
}
/* }}} */
/* {{{ extract code from SVg */

export function extractCode(svg: string): string {
    const codeRgx = /<!--\s*trace-chart:[^\n>]*\n(?<code>(?:[^-]|-(?!->))+)\n-->/;

    const result = svg.match(codeRgx);
    const code = result?.groups?.code ?? '';

    return code;
}

/* }}} */
