const defaultColors = [
    '#FF6F00',
    '#006FFF',
    '#388E3C',
    '#FF4343',
    '#673AB7',
    '#D73AB7',
    '#6F0808',
    '#F5BC00',
    '#200070',
    '#00B0A0',
    '#E09080',
    '#A0E000',
    '#9090E0',
    '#9D939A',
];

export function getColor(index: number, previousColor?: string) {
    const defaultColor = defaultColors[index % defaultColors.length];

    if (previousColor) {
        // TODO
    }

    return defaultColor;
}
