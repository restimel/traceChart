import type { Categories } from '@/types';
import { ref } from 'vue';

type ErrorOrigin = 'uploadFile' | 'code' | 'legend';

type AppError = {
    origin: ErrorOrigin | undefined;
    message: string;
} | null;

export const error = ref<AppError>(null);
export const code = ref<string>('');
export const legend = ref<Categories>(new Map());

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
