interface Tree {
    path: string;
    name: string;
    size: number;
    type: string;
    extension?: string;
    children: (Tree | null)[];
}
export declare function createTree(path: string, options?: {
    normalizePath?: boolean;
    exclude?: RegExp | RegExp[];
    extensions?: RegExp;
}, onEachFile?: (item: Tree, path: string) => void): Promise<Tree | null>;
export {};
