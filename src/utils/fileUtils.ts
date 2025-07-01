import { clearError, setError } from '@/store/Store';

export const downloadSvg = (svgContent: string, filename: string = 'generated.svg') => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;

        reader.readAsText(file);
    });
};


export async function processFile(file: File): Promise<string | undefined> {
    clearError('uploadFile');

    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        try {
            const content = await readFileAsText(file);

            return content;
        } catch (error) {
            setError(`Error while reading file: ${error}`, 'uploadFile');
        }
    } else {
        setError('Wrong kind of file. We expect a trace-chart SVG file', 'uploadFile');
    }

    return;
}
