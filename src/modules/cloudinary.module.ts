import { Module } from "@nestjs/common";
import { CloudinaryProvider } from "@/providers";
import { CloudinaryService } from "@/services";

@Module({
    providers: [CloudinaryProvider, CloudinaryService],
    exports: [CloudinaryProvider, CloudinaryService],
})
export class CloudinaryModule {}
