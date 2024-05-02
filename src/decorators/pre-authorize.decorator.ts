import { EUserRole } from "@/models/enums";
import { SetMetadata } from "@nestjs/common";

export const HasRole = (...roles: EUserRole[]) => SetMetadata("roles", roles);
