export type FileData = {
    name: string;
    path: string;
    type: FileType;
    size: number;
    lastModified: number;
    created:number;
}

export enum FileType {
    File = 'file',
    Folder = 'folder',
}   