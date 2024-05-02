import { ApiProperty } from "@nestjs/swagger";
import { IsPhoneNumber } from "class-validator";

export class UpdateProfileDto {
    @ApiProperty()
    name?: string;

    @ApiProperty()
    password?: string;

    @ApiProperty()
    @IsPhoneNumber("VN")
    phone?: string;
}
