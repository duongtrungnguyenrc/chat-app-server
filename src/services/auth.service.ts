import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService, TokenExpiredError } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { CreateUserDto, LoginDto } from "@/models/dtos";
import { BaseResponseModel } from "@/models";
import { UserService } from "@/services";
import {
    ACCESS_TOKEN_EXPIRED_TIME,
    APPLICATION_DEEPLINKS,
    GOOGLE_EMAIL_SCOPE,
    GOOGLE_GET_USER_INFO_URL,
    GOOGLE_PROFILE_SCOPE,
    REFRESH_TOKEN_EXPIRED_TIME,
    TOKEN_BLACK_LIST_PREFIX,
} from "@/commons";
import { InvalidPasswordException, ResourceNotFoundException } from "@/exceptions";
import { OAuth2Client } from "google-auth-library";
import { User } from "@/models/schemas";
import { RequestHandlerUtils } from "@/utils";
import { Exception } from "handlebars";
import { v4 as uuidv4 } from "uuid";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private jwtService: JwtService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        @Inject("GOOGLE_AUTH") private readonly oauth2Client: OAuth2Client,
    ) {}

    async validate(emailOrUser: string | LoginDto): Promise<BaseResponseModel> {
        try {
            let email: string;
            let password: string;

            if (typeof emailOrUser === "string") {
                email = emailOrUser;
            } else {
                email = emailOrUser.email;
                password = emailOrUser.password;
            }

            const { password: hashedPassword, ...existingUser } = (
                await this.userService.findUserByEmail(email, true, ["records"])
            )?.toObject();

            if (!existingUser) {
                throw new ResourceNotFoundException("User not found. please check your email or password");
            }

            if (password && !(await bcrypt.compare(password, hashedPassword))) {
                throw new InvalidPasswordException();
            }

            const sessionId = uuidv4();

            const jwtPayload = {
                id: existingUser._id,
                email: existingUser.email,
                name: existingUser.name,
                role: existingUser.role,
                sessionId: sessionId,
            };

            const accessToken: string = this.jwtService.sign(jwtPayload, {
                expiresIn: ACCESS_TOKEN_EXPIRED_TIME,
            });

            const refreshToken: string = this.jwtService.sign(
                { sessionId },
                {
                    expiresIn: REFRESH_TOKEN_EXPIRED_TIME,
                },
            );

            return new BaseResponseModel("Login successfully!", {
                accessToken,
                refreshToken,
                user: existingUser,
            });
        } catch (error) {
            throw new BadRequestException(new BaseResponseModel(error.message));
        }
    }

    async tokenValidate(request: Request, refreshToken: string): Promise<BaseResponseModel> {
        const authToken: string = RequestHandlerUtils.getAuthToken(request);
        const isInBlackList = await this.cacheManager.get(`${TOKEN_BLACK_LIST_PREFIX}${authToken}`);

        if (!refreshToken) throw new BadRequestException("Invalid refresh token!");

        try {
            let accessToken: string = authToken;

            try {
                if (isInBlackList) throw new TokenExpiredError("Token has expired", new Date());
                await this.jwtService.verify(authToken);
            } catch (error) {
                if (error instanceof TokenExpiredError) {
                    accessToken = await this.reValidate(authToken, refreshToken);
                } else {
                    throw new UnauthorizedException(error.message);
                }
            }

            const existingUser: User = await this.userService.getUserFromRequest(request);

            if (!existingUser) {
                throw new UnauthorizedException("Invalid token");
            }

            return new BaseResponseModel("Login successfully!", {
                accessToken,
                refreshToken,
                user: existingUser,
            });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async reValidate(authToken: string, refreshToken: string) {
        try {
            const decodedToken = this.jwtService.verify(refreshToken);
            const { iat, exp, ...payload } = this.jwtService.decode(authToken);

            if (decodedToken["sessionId"] !== payload["sessionId"]) throw new Exception("Tokens session not match!");
            return this.jwtService.sign(payload, {
                expiresIn: ACCESS_TOKEN_EXPIRED_TIME,
            });
        } catch (error) {
            throw error;
        }
    }

    async inValidate(request: Request) {
        const authToken: string = RequestHandlerUtils.getAuthToken(request);
        const decodedToken = await this.jwtService.decode(authToken);

        const currentTime = Math.floor(Date.now() / 1000);
        const tokenValidTime = decodedToken["exp"] - currentTime;

        await this.cacheManager.set(`${TOKEN_BLACK_LIST_PREFIX}${authToken}`, authToken, {
            ttl: tokenValidTime,
        } as any);
        return new BaseResponseModel("Log out successfully");
    }

    googleAuth() {
        const url: string = this.oauth2Client.generateAuthUrl({
            access_type: "online",
            scope: [GOOGLE_EMAIL_SCOPE, GOOGLE_PROFILE_SCOPE],
        });

        return url;
    }

    async getGoogleUserInfo(code: string) {
        let loginResponse = null;
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            const response = await fetch(GOOGLE_GET_USER_INFO_URL, {
                method: "GET",
                headers: {
                    Authorization: `${tokens.token_type} ${tokens.access_token}`,
                },
            });

            const userInfo = await response.json();
            const user: User = await this.userService.findUserByEmail(userInfo.email);

            if (!user) {
                const createdUser: BaseResponseModel = await this.userService.createUser(
                    new CreateUserDto(userInfo.email, "", userInfo.name, "", userInfo.picture),
                );

                const userPayload = {
                    id: createdUser.data?.user.id,
                    email: createdUser.data?.user.email,
                    name: createdUser.data?.user.name,
                    role: createdUser.data?.user.role,
                };

                loginResponse = new BaseResponseModel("Login successfully!", {
                    accessToken: await this.jwtService.signAsync(userPayload),
                    user: createdUser,
                });
            }
            loginResponse = await this.validate(userInfo.email);
            return `${APPLICATION_DEEPLINKS}?payload=${JSON.stringify(loginResponse)}`;
        } catch (error) {
            throw new BadRequestException("Error fetching Google user info: " + error.message);
        }
    }
}
