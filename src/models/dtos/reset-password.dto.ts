import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ResetPasswordDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    transactionId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    otp: string;

    @ApiProperty()
    @IsNotEmpty()
    password: string;
}
