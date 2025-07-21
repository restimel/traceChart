import type { Diagnostic } from '@codemirror/lint';

export type Color = string;

export type SvgData = {
    code: string;
    svg: string;
    timestamp: number;
};

export type FileUploadEvent = {
    file: File;
    content: string;
};

export type Category = {
    key: string;
    label: string;
    color: Color;
    order: number;
    /**
     * Indicate the origin of this category
     * - file: It comes from the loaded file
     * - codeCategory: It comes from the code typing "category:"
     * - codeTrace: It comes from the code parsing (it is used in traces)
     * - legend: It has been added by user from GUI
     */
    origin: 'file' | 'codeCategory' | 'codeTrace' | 'legend';
    /** true, means that it has been explicitly used in the code */
    used: boolean;
};

export type Categories = Map<string, Category>;

export type Trace = {
    name: string;
    category: string;
    event?: string;
    comment?: string;
    subTasks?: Trace[];
};

export type ChartData = {
    categories: Categories;
    trace: Trace[];
};

/** [x, y] */
export type Point = [number, number];

/** [corner top left, corner bottom right] */
export type Box = [Point, Point]

export type Content = {
    content: string;
    dimension: Box;
};

type BaseCodeError = {
    severity?: Diagnostic['severity'];
    message: string;
};

export type LineCodeError = BaseCodeError & {
    line: number;
    from?: number;
    to?: number;
};

export type ChunkCodeError = BaseCodeError & {
    fromChar: number;
    toChar: number;
};

export type CodeError = LineCodeError | ChunkCodeError;
