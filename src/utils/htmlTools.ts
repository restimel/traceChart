export function toClassName(category: string): string {
    return category.replace(/[^\w]+/g, '-');
}

export function htmlSafe(text: string) {
    return text.replace(/[&<>"'`\u00A0-\u9999]/g, (char) => {
        const code = char.charCodeAt(0);

        return `&#${code};`;
    });
}
