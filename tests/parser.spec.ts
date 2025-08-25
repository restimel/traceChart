#!/usr/bin/env node

import type { Category, ChartData } from '../src/types/index.ts';
import {
    stringToChartData,
    chartDataToString,
    extractCode,
} from '../src/utils/parser.ts';

import {
    assertContains,
    assertDeepEqual,
    assertEqual,
    assertFalse,
    assertGreaterThan,
    assertTrue,
    runPerf,
    runTest,
    testFor,
} from './tools.ts';

testFor('stringToChartData', () => {

    runTest('Parse empty string', () => {
        const result = stringToChartData('');
        assertDeepEqual(result, {
            categories: new Map(),
            trace: [],
        }, 'The chart should be empty');
    });

    runTest('Parse simple single trace', () => {
        const input = '+ Task 1';
        const result = stringToChartData(input);

        assertEqual(result.trace.length, 1, 'Should have 1 trace');
        assertEqual(result.trace[0].name, 'Task 1', 'Task name should match');
        assertEqual(result.trace[0].category, 'main', 'Default category should be main');
        assertTrue(result.categories.has('main'), 'Should have main category');
        assertEqual(result.trace[0].comment, '', 'Should have no comment');
        assertEqual(result.trace[0].event, '', 'Should have no event');
    });

    runTest('Parse trace with category', () => {
        const input = '+ Task 1 [web]';
        const result = stringToChartData(input);

        assertEqual(result.trace.length, 1, 'Should have 1 trace');
        assertEqual(result.trace[0].name, 'Task 1', 'Task name should match');
        assertEqual(result.trace[0].category, 'web', 'Category should be web');
        assertTrue(result.categories.has('web'), 'Should have web category');
        assertEqual(result.trace[0].comment, '', 'Should have no comment');
        assertEqual(result.trace[0].event, '', 'Should have no event');
    });

    runTest('Parse trace with event and comment', () => {
        const input = '+ Task 1 [web] // [start] Initial task';
        const result = stringToChartData(input);

        const trace = result.trace[0];
        assertEqual(trace.name, 'Task 1', 'Task name should match');
        assertEqual(trace.category, 'web', 'Category should be web');
        assertEqual(trace.event, 'start', 'Event should be start');
        assertEqual(trace.comment, 'Initial task', 'Comment should match');
    });

    runTest('Parse trace with simple comment', () => {
        const input = '+ Task 1 [web] // Some comment';
        const result = stringToChartData(input);

        const trace = result.trace[0];

        assertEqual(trace.name, 'Task 1', 'Task name should match');
        assertEqual(trace.category, 'web', 'Category should be web');
        assertEqual(trace.event, '', 'Event should be undefined');
        assertEqual(trace.comment, 'Some comment', 'Comment should match');
    });

    runTest('Parse trace with only comment', () => {
        const input = '+  // Some comment';
        const result = stringToChartData(input);

        const trace = result.trace[0];
        assertEqual(trace.name, '', 'Should have no name');
        assertEqual(trace.event, '', 'Event should be undefined');
        assertEqual(trace.comment, 'Some comment', 'Comment should match');
    });

    runTest('Parse trace with different spaces', () => {
        const input = '+  Task 1   [web  ]  //  [ cat e gory  ]Some comment';
        const result = stringToChartData(input);

        const trace = result.trace[0];

        assertEqual(trace.name, 'Task 1', 'Task name should match');
        assertEqual(trace.category, 'web', 'Category should be web');
        assertEqual(trace.event, 'cat e gory', 'Event should match');
        assertEqual(trace.comment, 'Some comment', 'Comment should match');
    });

    runTest('Parse trace with special characters', () => {
        const input = String.raw`+  \'Task 1\/\/ \[type\][web\]  ]  //  [ cat \] comment ]  Some \[comment\]`;
        const result = stringToChartData(input);

        const trace = result.trace[0];

        assertEqual(trace.name, '\'Task 1// [type]', 'Task name should match');
        assertEqual(trace.category, 'web]', 'Category should be web');
        assertEqual(trace.event, 'cat ] comment', 'Event should match');
        assertEqual(trace.comment, 'Some [comment]', 'Comment should match');
    });

    runTest('Parse nested traces', () => {
        const input = `+ Parent Task [web]
++ Child Task 1 [db]
++ Child Task 2 [cache]
+++ Grandchild Task [cache]
++ Child Task 3
        `;

        const result = stringToChartData(input);

        assertEqual(result.trace.length, 1, 'Should have 1 root trace');

        const parentTrace = result.trace[0];
        assertEqual(parentTrace.name, 'Parent Task', 'Parent name match');
        assertEqual(parentTrace.subTasks?.length, 3, 'Parent should have 2 children');

        const firstChild = parentTrace.subTasks?.[0];
        assertEqual(firstChild?.name, 'Child Task 1', 'First child name');
        assertEqual(firstChild?.category, 'db', 'First child category');

        const secondChild = parentTrace.subTasks?.[1];
        assertEqual(secondChild?.subTasks?.length, 1, 'Second child should have 1 grandchild');

        const grandchild = secondChild?.subTasks?.[0];
        assertEqual(grandchild?.name, 'Grandchild Task', 'Grandchild name');

        const thirdChild = parentTrace.subTasks?.[2];
        assertEqual(thirdChild?.name, 'Child Task 3', 'Third child name');
        assertEqual(thirdChild?.category, 'web', 'Third child name');

        const categories = result.categories;
        assertEqual(categories.size, 3, 'Should create categories accordingly');
    });

    runTest('Parse multiple root traces', () => {
        const input = `+ Task 1 [web]
+ Task 2 [db]
+ Task 3
+ Task 4 [web]
+ Task 5 [cache]`;

        const result = stringToChartData(input);

        assertEqual(result.trace.length, 5, 'Should have 5 root traces');
        assertEqual(result.trace[0].name, 'Task 1', 'First task name');
        assertEqual(result.trace[1].name, 'Task 2', 'Second task name');
        assertEqual(result.trace[2].name, 'Task 3', 'Third task name');
        assertEqual(result.trace[2].category, 'main', 'Third task category');
        assertEqual(result.trace[3].name, 'Task 4', 'Fourth task name');
        assertEqual(result.trace[4].name, 'Task 5', 'Fifth task name');


        const categories = result.categories;
        assertEqual(categories.size, 4, 'Should create categories accordingly');
    });

    runTest('Parse categories section', () => {
        const input = `categories:
+ web: Web Server {#FF0000}
+ db: Database {#00FF00}
+ cache: Cache Layer {#0000FF}

traces:
+ Task 1 [web]
++ Task 2 [db]
+ Task 3 [new]`;

        const result = stringToChartData(input);

        assertGreaterThan(result.categories.size, 3);

        const webCategory = result.categories.get('web');
        assertTrue(webCategory !== undefined, 'Web category should exist');
        assertEqual(webCategory?.label, 'Web Server', 'Web label');
        assertEqual(webCategory?.color, '#FF0000', 'Web color');
        assertTrue(webCategory!.used, 'Web should be used');
        assertEqual(webCategory!.origin, 'codeCategory', 'Web should come from category');
        assertEqual(webCategory!.order, 0, 'Web should be first');

        const dbCategory = result.categories.get('db');
        assertTrue(dbCategory !== undefined, 'DB category should exist');
        assertEqual(dbCategory?.label, 'Database', 'DB label');
        assertEqual(dbCategory?.color, '#00FF00', 'DB color');
        assertTrue(dbCategory!.used, 'DB should be used');
        assertEqual(dbCategory!.origin, 'codeCategory', 'DB should come from code');
        assertEqual(dbCategory!.order, 1, 'DB should be second');


        const cacheCategory = result.categories.get('cache');
        assertTrue(cacheCategory !== undefined, 'Cache category should exist');
        assertEqual(cacheCategory?.label, 'Cache Layer', 'Cache label');
        assertEqual(cacheCategory?.color, '#0000FF', 'Cache color');
        assertFalse(cacheCategory!.used, 'Cache should not be used');
        assertEqual(cacheCategory!.origin, 'codeCategory', 'Cache should come from code');
        assertEqual(cacheCategory!.order, 2, 'Cache should be Third');

        const newCategory = result.categories.get('new');
        assertTrue(newCategory !== undefined, 'New category should exist');
        assertEqual(newCategory?.label, '', 'New label');
        assertTrue(newCategory!.used, 'New should be used');
        assertEqual(newCategory!.origin, 'codeTrace', 'New should come from code');
        assertEqual(newCategory!.order, 3, 'New should be Fourth');
    });

    runTest('Parse categories without labels', () => {
        const input = `categories:
+ web: {#FF0000}
+ db: {#00FF00}

traces:
+ Task 1 [web]`;

        const result = stringToChartData(input);

        const webCategory = result.categories.get('web');
        assertEqual(webCategory?.label, '', 'Empty label should be empty string');
        assertEqual(webCategory?.color, '#FF0000', 'Color should still work');
    });

    runTest('Parse escaped characters', () => {
        const input = '+ Task \\[with\\] brackets \\{and\\} braces';
        const result = stringToChartData(input);

        assertEqual(result.trace[0].name, 'Task [with] brackets {and} braces',
            'Escaped chars should be unescaped');
    });

    runTest('Should not skipped level', () => {
        const input = `
+ root
+++ child
++ task
`;
        let hasFailed = false;
        try {
            stringToChartData(input);
        } catch (error) {
            hasFailed = true;
            assertContains(error.message, 'A line seems to be the grand-child of the precedent line');
        }

        assertTrue(hasFailed, 'should detect issue in the trace');
    });

    runTest('Inherit category from parent', () => {
        const input = `+ Parent Task [web]
++ Child without category
+++ Grandchild without category`;

        const result = stringToChartData(input);

        const parent = result.trace[0];
        const child = parent.subTasks?.[0];
        const grandchild = child?.subTasks?.[0];

        assertEqual(parent.category, 'web', 'Parent category');
        assertEqual(child?.category, 'web', 'Child inherits category');
        assertEqual(grandchild?.category, 'web', 'Grandchild inherits category');
    });

    runTest('Add defined categories', () => {
        const categories = new Map<string, Category>([
            [ 'web', {
                key: 'web',
                label: 'Web server',
                color: '#CCFFCC',
                order: 0,
                origin: 'file',
                used: false,
            }],
            [ 'old', {
                key: 'old',
                label: 'old category',
                color: '#999999',
                order: 1,
                origin: 'codeCategory',
                used: true,
            }],
            [ 'dns', {
                key: 'dns',
                label: 'Dns server',
                color: '#3300CC',
                order: 2,
                origin: 'legend',
                used: true,
            }],
            [ 'proxy', {
                key: 'proxy',
                label: 'Proxy server',
                color: '#0099CC',
                order: 3,
                origin: 'file',
                used: true,
            }],
        ]);
        const input = `
+ Task 1 [web]
++ Task 2 [db]
+ Task 3 [new]`;

        const result = stringToChartData(input, categories);

        assertEqual(result.categories.size, 5);

        assertDeepEqual(result.categories.get('web'), {
            key: 'web',
            label: 'Web server',
            color: '#CCFFCC',
            order: 0,
            origin: 'file',
            used: true,
        }, 'Web category should be updated');

        assertFalse(result.categories.has('old'), 'Unused category from codeCategory should be removed');

        assertDeepEqual(result.categories.get('dns'), {
            key: 'dns',
            label: 'Dns server',
            color: '#3300CC',
            order: 1,
            origin: 'legend',
            used: false,
        }, 'Dns category should be updated');

        assertDeepEqual(result.categories.get('proxy'), {
            key: 'proxy',
            label: 'Proxy server',
            color: '#0099CC',
            order: 2,
            origin: 'file',
            used: false,
        }, 'Proxy category should be updated');

        assertDeepEqual(result.categories.get('db'), {
            key: 'db',
            label: '',
            color: '#FF4343',
            order: 3,
            origin: 'codeTrace',
            used: true,
        }, 'Db category should be added');

        assertDeepEqual(result.categories.get('new'), {
            key: 'new',
            label: '',
            color: '#673AB7',
            order: 4,
            origin: 'codeTrace',
            used: true,
        }, 'New category should be added');
    });

    runTest('Categories definition priority', () => {
        const categories = new Map<string, Category>([
            [ 'cat1', {
                key: 'cat1',
                label: '',
                color: '#000001',
                order: 0,
                origin: 'file',
                used: true,
            }],
            [ 'cat2', {
                key: 'cat2',
                label: '',
                color: '#000010',
                order: 1,
                origin: 'legend',
                used: true,
            }],
            [ 'cat3', {
                key: 'cat3',
                label: '',
                color: '#000100',
                order: 2,
                origin: 'codeCategory',
                used: true,
            }],
            [ 'cat4', {
                key: 'cat4',
                label: '',
                color: '#001000',
                order: 3,
                origin: 'codeTrace',
                used: true,
            }],
            [ 'cat1b', {
                key: 'cat1b',
                label: '',
                color: '#000002',
                order: 4,
                origin: 'file',
                used: true,
            }],
            [ 'cat2b', {
                key: 'cat2b',
                label: '',
                color: '#000020',
                order: 5,
                origin: 'legend',
                used: true,
            }],
            [ 'cat3b', {
                key: 'cat3b',
                label: '',
                color: '#000200',
                order: 6,
                origin: 'codeCategory',
                used: true,
            }],
            [ 'cat4b', {
                key: 'cat4b',
                label: '',
                color: '#002000',
                order: 7,
                origin: 'codeTrace',
                used: true,
            }],
        ]);
        const input = `categories:
+ cat1: Cat1 {#00000F}
+ cat2: Cat2 {#0000F0}
+ cat3: Cat3 {#000F00}
+ cat4: Cat4 {#00F000}

traces:
+ Cat 1 [cat1b]
++ Cat 2 [cat2b]
+ Cat 3 [cat3b]
+ Cat 4 [cat4b]`;

        const result = stringToChartData(input, categories);

        assertEqual(result.categories.size, 8);

        assertDeepEqual(result.categories.get('cat1'), {
            key: 'cat1',
            label: 'Cat1',
            color: '#00000F',
            order: 0,
            origin: 'codeCategory',
            used: false,
        }, 'category from code is better than from file');

        assertDeepEqual(result.categories.get('cat2'), {
            key: 'cat2',
            label: '',
            color: '#000010',
            order: 1,
            origin: 'legend',
            used: false,
        }, 'category from code is worse than from legend');

        assertDeepEqual(result.categories.get('cat3'), {
            key: 'cat3',
            label: 'Cat3',
            color: '#000F00',
            order: 2,
            origin: 'codeCategory',
            used: false,
        }, 'category from code should be updated');

        assertDeepEqual(result.categories.get('cat4'), {
            key: 'cat4',
            label: 'Cat4',
            color: '#00F000',
            order: 3, // ?
            origin: 'codeCategory',
            used: false,
        }, 'category from code is better than from trace');

        assertDeepEqual(result.categories.get('cat1b'), {
            key: 'cat1b',
            label: '',
            color: '#000002',
            order: 3, // 4
            origin: 'file',
            used: true,
        }, 'category from file is better than from trace');

        assertDeepEqual(result.categories.get('cat2b'), {
            key: 'cat2b',
            label: '',
            color: '#000020',
            order: 4, // 5
            origin: 'legend',
            used: true,
        }, 'category from legend is better than from trace');

        assertDeepEqual(result.categories.get('cat3b'), {
            key: 'cat3b',
            label: '',
            color: '#F5BC00',
            order: 7,
            origin: 'codeTrace',
            used: true,
        }, 'category from undefined category should be removed and redraw as code trace');

        assertDeepEqual(result.categories.get('cat4b'), {
            key: 'cat4b',
            label: '',
            color: '#002000',
            order: 5,
            origin: 'codeTrace',
            used: true,
        }, 'category from trace should keep previous values');
    });
});

testFor('chartDataToString', () => {
    runTest('Serialize simple chart data', () => {
        const input = '+ Task 1 [web] // [start] Comment';
        const chartData = stringToChartData(input);
        const serialized = chartDataToString(chartData);

        assertTrue(serialized.includes('categories:'),
            'Should include categories section');
        assertTrue(serialized.includes('traces:'),
            'Should include traces section');
        assertTrue(serialized.includes('+ Task 1 [web] // [start] Comment'),
            'Should include the task');
    });

    runTest('Serialize with onlyCode flag', () => {
        const input = `
categories:
+ web: {#012345}

traces:
+ Task 1 [web]`;
        const chartData = stringToChartData(input);
        const serialized = chartDataToString(chartData, true);

        assertFalse(serialized.includes('categories:'),
            'Should not include categories section');
        assertTrue(serialized.includes('traces:'),
            'Should include traces section');
    });

    runTest('Round-trip conversion preserves data', () => {
        const originalInput = `category:
+ web: Web Server {#FF0000}
+ db: Database {#00FF00}

trace:
+ HTTP Request [web] // [receive] Incoming
++ Query Database [db] // [query] SELECT
+++ Connection Pool [db]
++ Cache Check [web] // [check ]
+ Send Response [web] // [send] JSON response`;

        const parsed = stringToChartData(originalInput);
        const serialized = chartDataToString(parsed);
        const reparsed = stringToChartData(serialized);

        assertDeepEqual(parsed, reparsed, 'should recreate the same chartData');

        assertTrue(serialized.includes('categories:'), 'Should have rewrite to categories');
        assertFalse(serialized.includes('category:'), 'Should have rewrite category');
        assertTrue(serialized.includes('traces:'), 'Should have rewrite to traces');
        assertFalse(serialized.includes('trace:'), 'Should have rewrite trace');

        const categoriesSection = serialized.split(/categories:([\s\S]+)traces:/)[1];
        const tracesSection = serialized.split(/traces:([\s\S]+)$/)[1];

        const nbCategory = categoriesSection.split('\n+').length - 1;
        const nbTrace = tracesSection.split('\n+').length - 1;

        assertEqual(nbCategory, 2, 'should contain categories');
        assertEqual(nbTrace, 5, 'should contain traces');
    });
});

testFor('extractCode', () => {
    runTest('Extract code from SVG comment', () => {
        const svgContent = `<svg viewBox="0 0 100 100">
<!-- trace-chart: metadata
categories:
+ web: Web Server {#FF0000}

traces:
+ Test Task [web] // [action] Test comment
-->
<rect width="100" height="100" fill="red"/>
</svg>`;

        const extracted = extractCode(svgContent);

        assertTrue(extracted.length > 0, 'Should extract some code');
        assertTrue(extracted.includes('categories:'),
            'Should include categories');
        assertTrue(extracted.includes('traces:'), 'Should include traces');
        assertTrue(extracted.includes('+ Test Task [web]'),
            'Should include the task');
    });

    runTest('Extract code from SVG without trace-chart comment', () => {
        const svgContent = `<svg viewBox="0 0 100 100">
<!-- regular comment -->
<rect width="100" height="100" fill="red"/>
</svg>`;

        const extracted = extractCode(svgContent);
        assertEqual(extracted, '', 'Should return empty string');
    });

    runTest('Extract code handles malformed SVG', () => {
        const malformedSvg = 'not an svg at all';
        const extracted = extractCode(malformedSvg);
        assertEqual(extracted, '', 'Should return empty string for malformed');
    });

    runTest('Extracted code can be parsed', () => {
        const svgContent = `<svg>
<!-- trace-chart: test
categories:
+ api: API {#FF5733}

traces:
+ API Call [api] // [request] HTTP request
++ Process Data [api] // [process] Data processing
-->
</svg>`;

        const extracted = extractCode(svgContent);

        /* Test that extracted code can be successfully parsed */
        const parsed = stringToChartData(extracted);

        assertGreaterThan(parsed.trace.length, 0, 'Extracted code should parse to traces');
        assertGreaterThan(parsed.categories.size, 0, 'Extracted code should have categories');

        assertEqual(parsed.trace[0].name, 'API Call',
            'Extracted trace name should match');
        assertEqual(parsed.trace[0].category, 'api',
            'Extracted trace category should match');
    });

    /* Edge cases and error handling */

    runTest('Handle duplicate traces sections', () => {
        const input = `traces:
+ Task 1 [web]

traces:
+ Task 2 [db]`;

        /* Should handle gracefully and not crash */
        const result = stringToChartData(input);

        /* The second traces section should be ignored */
        assertEqual(result.trace.length, 1,
            'Should only have traces from first section');
        assertEqual(result.trace[0].name, 'Task 1',
            'Should have first task');
    });

    runTest('Handle empty categories and traces sections', () => {
        const input = `categories:

traces:`;

        const result = stringToChartData(input);

        assertEqual(result.trace.length, 0, 'Should have no traces');
        /* Categories might have some default ones, so just check it exists */
        assertTrue(result.categories instanceof Map, 'Categories should be Map');
    });

    /* Performance test with large input */

    const nbCategories = 100;
    const nbTraces = 2000;
    runPerf('Handle large input efficiently', 100, {
        repetition: 10,
        initialization: () => {
            const lines = ['categories:'];

            /* Generate 100 categories */
            for (let idx = 0; idx < nbCategories; idx++) {
                lines.push(`+ cat${idx}: Category ${idx} {#FF${idx.toString()
                    .padStart(4, '0')}}`);
            }

            lines.push('', 'traces:');

            /* Generate 2000 traces with nesting */
            for (let idx = 0; idx < nbTraces; idx++) {
                const categoryIdx = idx % nbCategories;
                lines.push(`+ Task ${idx} [cat${categoryIdx}] // [action${idx}] Comment ${idx}`);
                if (idx % 10 === 0) {
                    lines.push(`++ Subtask ${idx}.1 [cat${categoryIdx}]`);
                    lines.push(`+++ Subsubtask ${idx}.1.1 [cat${categoryIdx}]`);
                }
            }

            const largeInput = lines.join('\n');

            return largeInput;
        },
        test: (largeInput: string) => {
            return stringToChartData(largeInput);
        },
        verification: (result: ChartData) => {
            assertGreaterThan(result.trace.length, nbTraces - 1, 'Should parse most traces');
            assertEqual(result.categories.size, nbCategories, `Should have ${nbCategories} categories`);

        },
    });
});
