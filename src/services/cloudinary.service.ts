/**
 * Created by Duong Trung Nguyen on 2024/1/24.
 */

import { Injectable } from "@nestjs/common";
import { UploadStream, v2 as cloudinary } from "cloudinary";
import { CloudinaryResponse } from "@/models/dtos";
import * as streamifier from "streamifier";

@Injectable()
export class CloudinaryService {
    uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
        return new Promise<CloudinaryResponse>((resolve, reject) => {
            const uploadStream: UploadStream = cloudinary.uploader.upload_stream((error, result) => {
                if (error) return reject(error);
                resolve(result);
            });

            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }
}
