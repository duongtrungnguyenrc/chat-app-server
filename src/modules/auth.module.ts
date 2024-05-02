import { AuthController } from "@/controllers";
import { AuthService } from "@/services";
import { Module } from "@nestjs/common";
import { UserModule } from "./user.module";
import { GoogleAuthProvider } from "@/providers/google-auth.provider";

@Module({
    imports: [UserModule],
    controllers: [AuthController],
    providers: [AuthService, GoogleAuthProvider],
})
export class AuthModule {}
