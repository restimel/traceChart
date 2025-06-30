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
    /* true, means that it has been explicitly added by user (or from file) */
    explicit: boolean;
    /* true, means that it has been explicitly used in the code */
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
