import type { Version } from '../src/types/index.ts';
import {
    compareVersion,
    currentVersion,
    parseVersion,
    version,
} from '../src/utils/appTools.ts';

import {
    assertDeepEqual,
    assertEqual,
    assertGreaterThan,
    runTest,
    testFor,
} from './tools.ts';

testFor('version', () => {
    runTest({}, 'should be a string', () => {
        assertEqual(typeof version, 'string', 'should be a string');
        assertGreaterThan(version.split('.').length, 1, 'should contains dot');
    });
});

testFor('currentVersion', () => {
    runTest({}, 'should be an object', () => {
        assertEqual(typeof currentVersion.major, 'number', 'major should be a number');
        assertEqual(typeof currentVersion.minor, 'number', 'minor should be a number');
        assertEqual(typeof currentVersion.build, 'number', 'build should be a number');
        assertEqual(currentVersion._value, version, 'should contain the version string');
    });
});

testFor('parseVersion', () => {
    runTest({}, 'should convert to a Version object', () => {
        const versions: Array<[string, Version]> = [
            ['1.0.0', {
                major: 1,
                minor: 0,
                build: 0,
                _value: '1.0.0',
            }],
            ['42.123.256', {
                major: 42,
                minor: 123,
                build: 256,
                _value: '42.123.256',
            }],
        ];

        versions.forEach(([testVersion, expectedVersion]) => {
            assertDeepEqual(parseVersion(testVersion), expectedVersion);
        });
    });

    runTest({}, 'should generate a default Version', () => {
        const version1 = parseVersion('2.b.c');
        assertDeepEqual(version1, {
            major: 2,
            minor: 0,
            build: 0,
            _value: '2.0.0',
        });

        const version2 = parseVersion('');
        assertDeepEqual(version2, {
            major: 1,
            minor: 0,
            build: 0,
            _value: '1.0.0',
        });
    });
});

testFor('compareVersion', () => {
    runTest({}, 'should compare with current version', () => {
        const version1 = parseVersion('1.0.100');
        assertEqual(compareVersion(version1), -1, `a bigger build version with a smaller minor version should be considered as old version (${version1._value} < ${version})`);

        const version2 = parseVersion('0.1234.100');
        assertEqual(compareVersion(version2), -1, `a bigger minor version with a smaller major version should be considered as old version (${version2._value} < ${version})`);

        const version3 = parseVersion('');
        version3.major = currentVersion.major + 1;
        assertEqual(compareVersion(version3), 1, `a bigger major version should be considered as a newer version (${version3._value} < ${version})`);

        const version4 = parseVersion(version);
        version4.minor = currentVersion.minor + 1;
        version4.build = 0;
        assertEqual(compareVersion(version4), 1, `a bigger minor version should be considered as a newer version (${version4._value} < ${version})`);

        const version5 = parseVersion(version);
        version5.build = currentVersion.build + 1;
        assertEqual(compareVersion(version5), 1, `a bigger minor version should be considered as a newer version (${version5._value} < ${version})`);

        assertEqual(compareVersion(currentVersion), 0, 'should be the same version');
    });
});
