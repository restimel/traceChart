/* eslint-disable no-console */

/* Test utilities */
interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration: number;
}

const testResults: TestResult[] = [];

export function runTest(testName: string, testFn: () => void): void {
    const startTime = Date.now();

    try {
        testFn();

        const duration = Date.now() - startTime;

        testResults.push({
            name: testName,
            passed: true,
            duration,
        });

        console.log(`✅ ${testName} (${duration}ms)`);
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        testResults.push({
            name: testName,
            passed: false,
            error: errorMessage,
            duration,
        });

        console.log(`❌ ${testName} (${duration}ms)`);
        console.log(`   Error: ${errorMessage}`);
    }
}

function perfName(testName: string, times: number[], maxTime: number): string {
    if (!times.length) {
        return `${testName} [x≤${maxTime}ms]`;
    }

    const mean = times.reduce((sum, time) => sum + time, 0) / times.length;

    return `${testName} [${mean.toFixed(2)}ms≤${maxTime}ms]`;
}

function perfReport(times: number[]) {
    const length = times.length;

    if (!length) {
        return;
    }

    const mean = times.reduce((sum, time) => sum + time, 0) / length;
    const variance = times.reduce((sum, time) => {
        return sum + (time - mean) ** 2;
    }, 0) / length;
    const std = Math.sqrt(variance);
    const precision = std / Math.sqrt(length);

    console.log(`       Mean: ${mean.toFixed(3)}ms`);
    console.log(`       Standard deviation: ${std.toFixed(3)}`);
    console.log(`       Precision: ${precision.toFixed(3)}`);
    console.log(`       Run ${times.length} times`);
}

export function runPerf<Data, Result>(
    testName: string,
    maxTime: number,
    params: {
        initialization?: () => Data;
        test: (data: Data) => Result;
        verification?: (result: Result) => void;
        repetition?: number;
    }
) {
    const startTime = Date.now();
    const data = params.initialization?.();

    const timeResults: number[] = [];
    const targetRepetition = params.repetition ?? 1;

    try {
        while (timeResults.length < targetRepetition) {
            const perfStartTime = performance.now();
            const result = params.test(data!);
            const perfDuration = performance.now() - perfStartTime;

            params.verification?.(result);

            assertTrue(perfDuration <= maxTime, `should be processed in under ${maxTime}ms, mesured: ${perfDuration.toFixed(2)}ms`);
            timeResults.push(perfDuration);
        }

        const duration = Date.now() - startTime;
        const perfTestName = perfName(testName, timeResults, maxTime);

        testResults.push({
            name: perfTestName,
            passed: true,
            duration,
        });

        console.log(`✅ ${perfTestName} (${duration}ms)`);
        perfReport(timeResults);
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const perfTestName = perfName(testName, timeResults, maxTime);

        testResults.push({
            name: perfTestName,
            passed: false,
            error: errorMessage,
            duration,
        });

        console.log(`❌ ${perfTestName} (${duration}ms)`);
        console.log(`   Error: ${errorMessage}`);
        perfReport(timeResults);
    }
}

export function testFor(groupName: string, tests: () => void) {
    console.log(`${'-'.repeat(60)}\n🎯 ${groupName}\n`);

    tests();
}

function error(expected: string, message?: string) {
    let errMessage: string;

    if (!message) {
        errMessage = expected;
    } else {
        errMessage = `${message} [${expected}]`;
    }

    throw new Error(errMessage);
}

export function assertEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
        error(`Expected "${expected}", got "${actual}"`, message);
    }
}

export function assertContains(actual: string, expected: string, message?: string): void {
    if (!actual.includes(expected)) {
        error(`text "${actual}" should contain "${expected}"`, message);
    }
}


export function assertDeepEqual<T>(actual: T, expected: T, message?: string): void {
    if (!deepEqual(actual, expected)) {
        const actualStr = JSON.stringify(actual, null, 2);
        const expectedStr = JSON.stringify(expected, null, 2);

        error(
            `Objects are not deeply equal:\nExpected:\n${expectedStr}\nActual:\n${actualStr}`,
            message
        );
    }
}

/* Helper function for deep equality comparison */
function deepEqual(obj1: unknown, obj2: unknown): boolean {
    /* Check strict equality first */
    if (obj1 === obj2) {
        return true;
    }

    /* Check if both are objects */
    const isObj1 = typeof obj1 === 'object';
    const isObj2 = typeof obj2 === 'object';

    if (!isObj1 || !isObj2) {
        return false;
    }

    /* Check for null */
    if (!obj1 || !obj2) {
        return false; /* otherwise === should be true */
    }

    /* Handle arrays */
    const isArray1 = Array.isArray(obj1);
    const isArray2 = Array.isArray(obj2);

    if (isArray1 !== isArray2) {
        return false;
    }

    if (isArray1 && isArray2) {
        if (obj1.length !== obj2.length) {
            return false;
        }

        for (let idx = 0; idx < obj1.length; idx++) {
            if (!deepEqual(obj1[idx], obj2[idx])) {
                return false;
            }
        }
        return true;
    }

    /* Handle Maps */
    const isMap1 = obj1 instanceof Map;
    const isMap2 = obj2 instanceof Map;

    if (isMap1 !== isMap2) {
        return false;
    }

    if (isMap1 && isMap2) {
        if (obj1.size !== obj2.size) {
            return false;
        }

        for (const [key, value] of obj1) {
            if (!obj2.has(key) || !deepEqual(value, obj2.get(key))) {
                return false;
            }
        }
        return true;
    }

    /* Handle Sets */
    const isSet1 = obj1 instanceof Set;
    const isSet2 = obj2 instanceof Set;

    if (isSet1 !== isSet2) {
        return false;
    }

    if (isSet1 && isSet2) {
        if (obj1.size !== obj2.size) {
            return false;
        }

        for (const value of obj1) {
            let found = false;
            for (const otherValue of obj2) {
                if (deepEqual(value, otherValue)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        return true;
    }

    /* Handle Dates */
    const isDate1 = obj1 instanceof Date;
    const isDate2 = obj2 instanceof Date;

    if (isDate1 !== isDate2) {
        return false;
    }

    if (isDate1 && isDate2) {
        return obj1.getTime() === obj2.getTime();
    }

    /* Handle RegExp */
    const isRegExp1 = obj1 instanceof RegExp;
    const isRegExp2 = obj2 instanceof RegExp;

    if (isRegExp1 !== isRegExp2) {
        return false;
    }

    if (isRegExp1 && isRegExp2) {
        return obj1.toString() === obj2.toString();
    }

    /* Handle different constructor types */
    if (obj1.constructor !== obj2.constructor) {
        return false;
    }

    /* Handle plain objects */
    const keys1 = Object.keys(obj1 as Record<string, unknown>);
    const keys2 = Object.keys(obj2 as Record<string, unknown>);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        if (!keys2.includes(key)) {
            return false;
        }

        const val1 = (obj1 as Record<string, unknown>)[key];
        const val2 = (obj2 as Record<string, unknown>)[key];

        if (!deepEqual(val1, val2)) {
            return false;
        }
    }

    return true;
}

export function assertArrayEqual<T>(
    actual: T[],
    expected: T[],
    message?: string
): void {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);

    if (actualStr !== expectedStr) {
        error(`Expected ${expectedStr}, got ${actualStr}`, message);
    }
}

export function assertGreaterThan(actual: number, expected: number, message?: string): void {
    if (actual <= expected) {
        error(`Expected ${actual} > ${expected}`, message);
    }
}

export function assertTrue(condition: boolean, message?: string): void {
    if (!condition) {
        error('Condition is false', message);
    }
}

export function assertFalse(condition: boolean, message?: string): void {
    if (!!condition) {
        error('Condition is true', message);
    }
}

/* Summary */

export function printTestSummary(): void {
    const passed = testResults.filter((test) => test.passed).length;
    const failed = testResults.filter((test) => !test.passed).length;
    const totalDuration = testResults.reduce((sum, test) => sum + test.duration, 0);

    console.log('\n' + '='.repeat(60));
    console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
    console.log(`Total duration: ${totalDuration}ms`);

    if (failed > 0) {
        console.log('\nFailed tests:');
        testResults
            .filter((test) => !test.passed)
            .forEach((test) => {
                console.log(`  ❌ ${test.name}: ${test.error}`);
            });
    }

    console.log('='.repeat(60));
}
