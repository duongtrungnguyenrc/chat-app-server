import { Body, Controller, Get, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { UserService } from "@/services/user.service";
import { CreateUserDto, ResetPasswordDto, UpdateProfileDto } from "@/models/dtos";
import { BaseResponseModel } from "@/models";
import { AuthGuard } from "@/guards";
import { HasRole } from "@/decorators";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("user")
@Controller("user")
@UseGuards(AuthGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post("create")
    async createUser(@Body() newUser: CreateUserDto): Promise<BaseResponseModel> {
        return await this.userService.createUser(newUser);
    }

    @HasRole("ROLE_USER")
    @Get("all")
    async getAllUser(): Promise<BaseResponseModel> {
        return;
    }

    @HasRole("*")
    @Post("update-avatar")
    @UseInterceptors(FileInterceptor("file"))
    async updateAvatar(@UploadedFile() file: Express.Multer.File, @Req() request: Request) {
        return await this.userService.updateAvatar(file, request);
    }

    @HasRole("*")
    @Post("update-pofile")
    async updateProfile(@Body() newProfile: UpdateProfileDto, @Req() request: Request) {
        return await this.userService.updateProfile(newProfile, request);
    }

    @HasRole("*")
    @Get("profile")
    async getAuthenticatedProfile(@Req() request: Request, @Query("id") id?: string) {
        return await this.userService.getUserProfile(request, id);
    }

    @Get("top-author")
    async getTopAuthors(@Query("limit") limit?: number) {
        return await this.userService.getTopAuthors(limit);
    }

    @Get("forgot-password")
    async forgotPassword(@Query("userId") userId: string) {
        return await this.userService.createResetPasswordTransaction(userId);
    }

    @Post("reset-password")
    async resetPassword(@Body() payload: ResetPasswordDto) {
        return await this.userService.resetPassword(payload);
    }
}
