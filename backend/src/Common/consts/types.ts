type FileSystemMetadata = {
    size: number;
    updated: string;
};

type DirectoryStructure = {
    [key: string]: FileSystemMetadata | DirectoryStructure;
};
