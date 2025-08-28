import { getColor } from './chart';
import type { Categories, Category, ChartData, Trace, Version } from '../types';
import { setCodeError } from '../store/Store';
import { compareVersion, currentVersion, parseVersion } from './appTools';

/*
 * categories:
 * + <id>: <label> {<color>}
 * + <id>: {<color>}
 *
 * traces:
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

type ParserOptions = {
    categories?: Categories;
    version?: Version;
    parseFromConsole?: boolean;
}

type SectionOptions = {
    offset: number;
    version: Version;
    parseFromConsole: boolean;
};

export function stringToChartData(text: string, options?: ParserOptions): ChartData {
    const categories = options?.categories;
    const version = options?.version ?? currentVersion;
    const parseFromConsole = options?.parseFromConsole ?? false;
    const trimmedText = text.trim();
    const drawChart: ChartData = {
        categories: new Map([...(categories ?? [])]),
        trace: [],
    };

    const orderRemoved: number[] = [];
    drawChart.categories.forEach((value, key) => {
        if (value.origin === 'codeCategory') {
            orderRemoved.push(value.order);
            drawChart.categories.delete(key);
        }
    });
    if (orderRemoved.length) {
        drawChart.categories.forEach((value) => {
            const currentOrder = value.order;
            const offset = orderRemoved.reduce((offset, oldOrder) => {
                if (oldOrder < currentOrder) {
                    return offset + 1;
                }
                return offset;
            }, 0);
            value.order = value.order - offset;
        });
    }

    let sectionRgx: RegExp;

    if (version.major >= 1) {
        /* Section are identified by "<sectionName>:" */
        sectionRgx = /(?:^|\n)(?<sectionName>\s*\w+:\s*)(?<content>(?:\n\+[^\n]+|\n(?![ \t]*\w+:)[^\n]*)+)/g;
    } else {
        /* Section are identified by "<sectionName>:" */
        sectionRgx = /(?:^|\n)(?<sectionName>\s*\w+:\s*)(?<content>(?:\n\+[^\n]+|\n(?![ \t]*\w+:)[^\n]*)+)/g;
    }

    let noSection = true;
    const additionalCategories: string[] = [];
    let lastPosition = 0;

    for (const result of trimmedText.matchAll(sectionRgx)) {
        if (!result?.groups) {
            continue;
        }

        if (lastPosition !== result.index) {
            const section = trimmedText.slice(lastPosition, result.index).trim();

            if (section) {
                setCodeError(section, text, 'This part is ignored. Maybe you should add `traces:` before.', 'info', { index: lastPosition });
            }
        }
        lastPosition = result.index + result[0].length;

        noSection = false;
        const sectionName = result.groups.sectionName;
        const offset = text.indexOf(sectionName, result.index) + sectionName.length;

        switch (sectionName?.toLowerCase().trim()) {
            case 'categories:':
            case 'categorie:':
            case 'category:': {
                const parsedCategories = parseCategories(result.groups.content, { offset, version, parseFromConsole });

                parsedCategories.forEach((category) => {
                    const oldCategory = drawChart.categories.get(category.key);

                    if (!oldCategory || oldCategory.origin !== 'legend') {
                        drawChart.categories.set(category.key, category);
                    }
                });

                break;
            }
            case 'traces:':
            case 'trace:': {
                if (drawChart.trace.length) {
                    setCodeError(result[0].trim(), text, 'Duplicated traces. This part will be ignored', 'error');
                    break;
                }

                const traceAnalyzed = parseTrace(result.groups.content, { offset, version, parseFromConsole });

                drawChart.trace = traceAnalyzed.trace;
                additionalCategories.push(...traceAnalyzed.categoryUsed);

                break;
            }
            default:
                setCodeError(sectionName, text, 'Unknown section', 'warning');
        }
    }

    if (noSection) {
        const traceAnalyzed = parseTrace(trimmedText, {
            offset: text.indexOf(trimmedText),
            version,
            parseFromConsole,
        });

        drawChart.trace = traceAnalyzed.trace;
        additionalCategories.push(...traceAnalyzed.categoryUsed);
    }

    /* clean categories */
    drawChart.categories.forEach((info, key, map) => {
        if (additionalCategories.includes(key)) {
            info.used = true;
        } else {
            if (info.origin === 'codeTrace') {
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
                    origin: 'codeTrace',
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

function parseCategories(code: string, options: SectionOptions): Map<string, Category> {
    const { offset, version, parseFromConsole } = options;
    const categories = new Map<string, Category>();

    let categoryRgx: RegExp;
    if (version.major >= 1) {
        /* + <categoryId>: <label> {<color>} */
        const consoleFileName = parseFromConsole ?
            String.raw`(?:[^+{} ][^ ]+ )?` :
            '';
        const categoryId = String.raw`(?<categoryId>(?:[^:\\\n]|\\.)+)`;
        const label = String.raw`(?<label>(?:[^{\\\n]|\\.)+)?`;
        const color = String.raw`(?<color>(?:[^}\\\n]|\\.)+)`;

        const fullRgx = String.raw`^\s*${consoleFileName}\+\s*${categoryId}:\s*${label}\{${color}\}\s*$`;
        categoryRgx = new RegExp(fullRgx, 'gm');
    } else {
        /* + <categoryId>: <label> {<color>} */
        categoryRgx = /^\s*\+\s*(?<categoryId>(?:[^:\\\n]|\\.)+):\s*(?<label>(?:[^{\\\n]|\\.)+)?\{(?<color>(?:[^}\\\n]|\\.)+)\}/gm;
    }

    let lastPosition = 0;

    function ignoredPattern(end: number) {
        if (lastPosition !== end) {
            const section = code.slice(lastPosition, end).trim();

            if (section !== '') {
                setCodeError(section, code, 'This part is ignored. Expected pattern: "+ <name>: <description> {#<color>}"', 'info', { offset, index: lastPosition });
            }
        }
    }

    for (const result of code.matchAll(categoryRgx)) {
        ignoredPattern(result.index);
        lastPosition = result.index + result[0].length;

        const categoryId = unescapeLabel(result.groups?.categoryId?.trim());
        const label = unescapeLabel(result.groups?.label?.trim());
        const color = unescapeLabel(result.groups?.color?.trim());

        if (!isValidColor(color)) {
            setCodeError(result.groups?.color ?? '#', code, 'Wrong color format (it should be `#RRGGBB` in hexadecimal)', 'error', { offset, index: result.index });
        }

        if (categoryId) {
            categories.set(categoryId, {
                key: categoryId,
                label: label || '',
                color: isValidColor(color) ? color : getColor(categories.size),
                origin: 'codeCategory',
                order: categories.size,
                used: false,
            });
        }
    }

    ignoredPattern(code.length);

    return categories;
}

function parseTrace(code: string, options: SectionOptions): {categoryUsed: string[], trace: Trace[]} {
    const { offset, version, parseFromConsole } = options;
    const traces: Trace[] = [];
    const categories = new Set<string>();
    const stack: Trace[] = [];

    const space = String.raw`[ \t]*`;

    let traceRgx: RegExp;
    if (version.major >= 1) {
        if (version.minor >= 2) {
            /* <indentation> <name> [<category>] // [event] <comment> */
            const consoleFileName = parseFromConsole ?
                String.raw`(?:[^+{} ][^ ]+ )?` :
                '';
            const indentation = String.raw`(?<indentation>(?:[{}]|\++\{?))`;
            const name = String.raw`(?<name>(?:[^\n\[\/\\]|\\.)*)`;
            const category = String.raw`(?<category>(?:[^\]\n\\]|\\.)+)`;
            const event = String.raw`(?<event>(?:[^\n\]\\]|\\.)+)`;
            const comment = String.raw`(?<comment>[^\n\r]*)`;

            const fullRgx = String.raw`^${space}${consoleFileName}${indentation}${space}${name}${space}(?:\[${category}])?${space}(?:\/{2,}${space}(?:\[${event}]${space})?${comment})?$`;

            traceRgx = new RegExp(fullRgx, 'gm');
        } else {
            /* <indentation> <name> [<category>] // [event] <comment> */
            traceRgx = /^\s*(?<indentation>\++)\s*(?<name>(?:[^\[\/\\\n]|\\.)+)\s*(?:\[(?<category>(?:[^\]\\\n]|\\.)+)])?[ \t]*(?:\/{2,}[ \t]*(?:\[(?<event>(?:[^\]\\\n]|\\.)+)])?(?<comment>[^\n\r]*))?$/gm;
        }
    } else {
        /* <+> <name> [<category>] // [event] <comment> */
        traceRgx = /^\s*(?<indentation>\++)\s*(?<name>(?:[^\[\/\\\n]|\\.)+)\s*(?:\[(?<category>(?:[^\]\\\n]|\\.)+)])?[ \t]*(?:\/{2,}[ \t]*(?:\[(?<event>(?:[^\]\\\n]|\\.)+)])?(?<comment>[^\n\r]*))?$/gm;
    }

    let lastPosition = 0;

    function ignoredPattern(end: number) {
        if (lastPosition !== end) {
            const section = code.slice(lastPosition, end).trim();

            if (section !== '') {
                setCodeError(section, code, 'This part is ignored. . Expected pattern: "+ <name> [<category>] // [<action>] <comment>"', 'info', { offset, index: lastPosition });
            }
        }
    }

    let indentBase = 0;
    const indexStack: number[] = [];
    for (const result of code.matchAll(traceRgx)) {
        ignoredPattern(result.index);
        lastPosition = result.index + result[0].length;

        const indentation = result.groups?.indentation ?? '+';
        const name = unescapeLabel(result.groups?.name?.trim());
        const category = unescapeLabel(result.groups?.category?.trim());
        const event = unescapeLabel(result.groups?.event?.trim());
        const comment = unescapeLabel(result.groups?.comment?.trim());

        let localIndentation: number;
        if (/^\++$/.test(indentation)) {
            localIndentation = indentation.length - 1;
        } else if (indentation === '{') {
            localIndentation = -1;
            indentBase++;
            indexStack.push(1);
        } else if (indentation === '}') {
            const dec = indexStack.pop() ?? 0;
            localIndentation = 0;
            indentBase = Math.max(0, indentBase - dec);

            if (!name && !event && !comment) {
                continue;
            }
        } else {
            /* case '+++{' */
            const inc = indentation.length - 1;
            localIndentation = -1;
            indentBase += inc;
            indexStack.push(inc);
        }

        const indentLevel = indentBase + localIndentation;

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
            setCodeError(indentation, code, 'The line seems to be the grand-child of the precedent line. Please verify the number of "+".', 'error', { section: result[0], offset, contextIndex: result.index });
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

    ignoredPattern(code.length);

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

    /* Trim all lines */
    const contentStr = contents.join('\n').replace(/ +\n/g, '\n');

    return contentStr;
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
    const categoryStr = category ? ` [${escapeLabel(category)}]` : '';
    const eventStr =  event ? `[${escapeLabel(event)}]` : '';
    const commentStr =  eventStr || comment ? ` // ${eventStr} ${escapeLabel(comment ?? '')}` : '';

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

export function extractCode(svg: string): { code: string; warning: string[]; version: Version } {
    const codeRgx = /<!--\s*trace-chart:[^\n>]*?(?:\[(?<version>[\d.]+)\])?\n(?<code>(?:[^-]|-(?!->))+)\n-->/;

    const warning: string[] = [];
    const result = svg.match(codeRgx);
    const code = result?.groups?.code ?? '';
    const versionStr = result?.groups?.version ?? '1.0.0';
    const version = parseVersion(versionStr);

    if (compareVersion(version) === 1) {
        warning.push('This code is newer than this app version. Some syntaxes may be not supported. They can be ignored or create parse error.');
    }

    const codeResult = {
        code,
        warning,
        version,
    };

    return codeResult;
}

/* }}} */
