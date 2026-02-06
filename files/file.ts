export interface FileFormat {
    get imageDescription(): string;
    set imageDescription(s: string);

    get userComment(): string;
    set userComment(s: string);
    
    toBuffer(): Buffer;
}
