import type { Comparison, Version } from '@/types';

export function parseVersion(strVersion: string): Version {
    if (!strVersion) {
        return {
            major: 1,
            minor: 0,
            build: 0,
            _value: '1.0.0',
        };
    }

    const splitVersion = strVersion.split('.');

    const parsedVersion = {
        major: +splitVersion[0] || 0,
        minor: +splitVersion[1] || 0,
        build: +splitVersion[2] || 0,
        _value: '0.0.0',
    };
    parsedVersion._value = `${parsedVersion.major}.${parsedVersion.minor}.${parsedVersion.build}`;

    return parsedVersion;
}

export let version: string;
try {
    version = __APP_VERSION__;
} catch {
    version = (globalThis as unknown as {__APP_VERSION__: string}).__APP_VERSION__ ?? '0.0.0';
}
export const currentVersion = parseVersion(version);

/**
 * Compare 2 app versions
 *
 * @param refVersion
 * @returns 0 if version are equals; 1 if given version is newer that current version; -1 if given version is older than current version
 */
export function compareVersion(refVersion: Version): Comparison {
    if (refVersion.major !== currentVersion.major) {
        if (refVersion.major < currentVersion.major) {
            return -1;
        }

        return 1;
    }

    if (refVersion.minor !== currentVersion.minor) {
        if (refVersion.minor < currentVersion.minor) {
            return -1;
        }

        return 1;
    }

    if (refVersion.build !== currentVersion.build) {
        if (refVersion.build < currentVersion.build) {
            return -1;
        }

        return 1;
    }

    return 0;
}
