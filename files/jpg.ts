import * as piexifjs from 'piexifjs';

import { FileFormat } from "./file";

export class JpgFile implements FileFormat {
    private readonly metadata: piexifjs.ExifDict;
    private readonly dataUrl: string;

    constructor(data: Buffer) {
        this.dataUrl = `data:image/jpeg;base64,${data.toString('base64')}`
        this.metadata = piexifjs.load(this.dataUrl);
    }

    public get imageDescription(): string {
        return Buffer.from(this.metadata["0th"][piexifjs.ImageIFD.ImageDescription] || "", 'latin1').toString("utf-8");
    }

    public set imageDescription(s: string) {
        if (s !== "") {
            this.metadata["0th"][piexifjs.ImageIFD.ImageDescription] = Buffer.from(s).toString('latin1');
        } else {
            delete this.metadata["0th"][piexifjs.ImageIFD.ImageDescription];
        }
    }

    public get userComment(): string {
        const value = this.metadata["Exif"][piexifjs.ExifIFD.UserComment];
        if (!value) return "";

        const buffer = Buffer.from(value, 'latin1');
        
        // UserComment normally has 8 byte header
        if (buffer.length >= 8) {
            const header = buffer.slice(0, 8);
            if (header.toString('ascii').startsWith('ASCII\0\0\0')) {
                return buffer.slice(8).toString('utf-8');
            }
            if (header.toString('ascii').startsWith('UNICODE\0')) {
                // Should decode UCS-2 / UTF-16, but simplify for now or assume utf-8 compatible if stuck
                // Often people just write utf8 there too.
                return buffer.slice(8).toString('utf-8').replace(/\0/g, ''); 
            }
            // Handle empty header or other headers
             return buffer.slice(8).toString('utf-8').replace(/\0/g, '');
        }

        return buffer.toString('utf-8').replace(/\0/g, '');
    }

    public set userComment(s: string) {
        if (s !== "") {
            const header = Buffer.from("ASCII\0\0\0", 'ascii');
            const data = Buffer.from(s, 'utf-8');
            const combined = Buffer.concat([header, data]);
            this.metadata["Exif"][piexifjs.ExifIFD.UserComment] = combined.toString('latin1');
        } else {
            delete this.metadata["Exif"][piexifjs.ExifIFD.UserComment];
        }
    }

    public toBuffer(): Buffer {
        const updatedImageDataUrl = piexifjs.insert(piexifjs.dump(this.metadata), this.dataUrl);
        return Buffer.from(updatedImageDataUrl.split(",")[1], 'base64');
    }
}
