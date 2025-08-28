import type { Categories, CodeError } from '@/types';
import { ref } from 'vue';

type ErrorOrigin = 'uploadFile' | 'code' | 'legend';

type AppError = {
    origin: ErrorOrigin | undefined;
    message: string;
} | null;

type Parameters = {
    parseFromConsole: boolean;
}

export const error = ref<AppError>(null);
export const codeErrors = ref<CodeError[]>([]);
export const code = ref<string>('');
export const legend = ref<Categories>(new Map());
export const parameters = ref<Parameters>({
    parseFromConsole: false,
});

function compareLegend(legend1: Categories, legend2: Categories): boolean {
    if (legend1.size !== legend2.size) {
        return false;
    }

    /* .every() does not exist on Map */
    let every = true;
    legend1.forEach((value, key) => {
        if (legend2.get(key) !== value) {
            every = false;
        }
    });

    return every;
}

export function updateLegend(categories?: Categories) {
    if (!categories || compareLegend(categories, legend.value)) {
        return;
    }

    legend.value = categories;
}

export function setError(message: string, origin?: ErrorOrigin) {
    error.value = {
        origin,
        message,
    };
}

export function clearError(origin?: ErrorOrigin) {
    if (!error.value) {
        return;
    }

    if (origin && error.value.origin !== origin) {
        return;
    }

    error.value = null;
}

export function resetCodeErrors() {
    codeErrors.value = [];
}

type Context = {
    section?: string;
    offset?: number;
    contextIndex?: number;
    index?: number;
}

export function setCodeError(codeError: string, fullCode: string, message: string, severity: CodeError['severity'], context?: Context) {

    const offset = (context?.section ? fullCode.indexOf(context.section, context.contextIndex ?? 0) : 0) + (context?.offset ?? 0);
    const innerOffset = (context?.section || fullCode).indexOf(codeError, context?.index ?? 0);

    if (offset < 0 || innerOffset < 0) {
        /* eslint-disable-next-line no-console */
        console.error('Error not found: %s\n\t%s', message, codeError);
        return;
    }

    const fromChar = offset + innerOffset;

    const error: CodeError = {
        fromChar,
        toChar: fromChar + codeError.length,
        severity,
        message,
    };

    codeErrors.value.push(error);
}

export function toggleParseFromConsole(value?: boolean) {
    parameters.value.parseFromConsole = typeof value === 'boolean' ? value : !parameters.value.parseFromConsole;
}
