/**
 * Created by Duong Trung Nguyen on 2024/1/24.
 */

import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CloudinaryResponse,
  CreateUserDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from '@/models/dtos';
import * as bcrypt from 'bcrypt';
import { BaseResponseModel } from '@/models';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { RequestHandlerUtils } from '@/utils';
import { CloudinaryService } from './cloudinary.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '@/models/schemas';
import { Model } from 'mongoose';
import { EmailAlreadyExistsException } from '@/exceptions';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';
import { OTP_LENGTH } from '@/commons';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly cloudinaryService: CloudinaryService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getUserFromRequest(
    request: Request,
    excludes: string[] = [],
  ): Promise<User> {
    const authToken: string = RequestHandlerUtils.getAuthToken(request);
    const decodedToken: User = this.jwtService.decode(authToken);
    return await this.userModel
      .findOne({
        _id: decodedToken?.id,
      })
      .select([...excludes.map((key) => `-${key}`)])
      .exec();
  }

  async getUserbyId(id?: string, excludes: string[] = []): Promise<User> {
    return await this.userModel
      .findOne({
        _id: id,
      })
      .select([...excludes.map((key) => `-${key}`)])
      .lean();
  }

  async getTopAuthors(limit?: number) {
    try {
      const authors: User[] = (
        await this.userModel.aggregate([
          {
            $lookup: {
              from: 'topics',
              localField: '_id',
              foreignField: 'author',
              as: 'topics',
            },
          },
          {
            $addFields: {
              topicCount: { $size: '$topics' },
            },
          },
          {
            $sort: { topicCount: -1 },
          },
          {
            $limit: limit ?? 10,
          },
        ])
      ).map((author) => {
        delete author.topics;
        return author;
      });
      return new BaseResponseModel('Successfully to get top authors', authors);
    } catch (error) {
      throw error;
    }
  }

  async createUser(newUser: CreateUserDto): Promise<BaseResponseModel> {
    const { password, ...userInfo } = newUser;
    const existingUser: User | null = await this.findUserByEmail(
      userInfo.email,
    );

    try {
      if (existingUser) {
        throw new EmailAlreadyExistsException();
      }

      const hashedPassword: string = await bcrypt.hash(password, 10);

      const createdUser: User = (
        await this.userModel.create({
          password: hashedPassword,
          ...userInfo,
        })
      )?.toObject();

      delete createdUser.password;

      this.mailerService.sendMail({
        to: createdUser.email,
        subject: 'Welcome to Lexa',
        template: 'register',
        context: { user: userInfo.name },
      });

      return new BaseResponseModel(
        'Successfully to created new user!',
        createdUser,
      );
    } catch (error) {
      throw new BadRequestException(new BaseResponseModel(error.message));
    }
  }

  async findUserByEmail(
    email: string,
    includePassword: boolean = false,
    exclude?: string[],
  ): Promise<User> {
    return await this.userModel
      .findOne({
        email: email,
      })
      .select([
        includePassword ? '+password' : '',
        ...(exclude?.map((key) => `-${key}`) ?? ''),
      ])
      .exec();
  }

  async getUserProfile(request: Request, id?: string) {
    try {
      const user: User | null = id
        ? await this.getUserbyId(id)
        : await this.getUserFromRequest(request, ['records']);

      if (!user) throw new UnauthorizedException('User not found!');

      return new BaseResponseModel('Successfully to get user profile!', {
        _id: user._id,
        avatar: user.avatar,
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    } catch (error) {
      throw error;
    }
  }

  async updateAvatar(
    imageFile: Express.Multer.File,
    request: Request,
  ): Promise<BaseResponseModel> {
    const user: User | null = await this.getUserFromRequest(request);

    try {
      const uploadedImage: CloudinaryResponse =
        await this.cloudinaryService.uploadFile(imageFile);

      await this.userModel.updateOne(
        { id: user._id },
        {
          avatar: uploadedImage.secure_url,
        },
      );

      const updatedUser: User = await this.userModel.findOne({ _id: user._id });
      delete updatedUser.password;

      return new BaseResponseModel(
        'Successfully to update avatar!',
        updatedUser,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to update profile: ' + error,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updateProfile(
    newProfile: UpdateProfileDto,
    request: Request,
  ): Promise<BaseResponseModel> {
    const user: User | null = await this.getUserFromRequest(request);

    try {
      const updatedResult = await this.userModel.updateOne(
        { id: user._id },
        {
          name: newProfile.name ?? user.name,
          password:
            (await bcrypt.hash(newProfile.password, 10)) ?? user.password,
          phone: newProfile.phone ?? user.phone,
        },
      );
      return new BaseResponseModel(
        'Successfully to update profile',
        updatedResult,
      );
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async createResetPasswordTransaction(userId: string) {
    try {
      const user: User = await this.getUserbyId(userId);

      if (!user) throw new BadRequestException('Invalid user!');

      const transactionId = uuidv4();
      const transactionOTP = this.generateOTP();
      this.cacheManager.set(
        transactionId,
        { transactionOTP, userId },
        15 * 60 * 1000,
      );

      this.mailerService.sendMail({
        to: user.email,
        subject: 'Account Recovery OTP for Lexa Vocabulary Learning App',
        template: 'forgot-password',
        context: { user: user.name, otp: transactionOTP },
      });

      return new BaseResponseModel(
        'Successfully to create forgot password transaction!',
        {
          userId,
          transactionId,
        },
      );
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  private generateOTP() {
    return Array.from({ length: OTP_LENGTH }, () =>
      Math.floor(Math.random() * 10),
    ).join('');
  }

  async resetPassword(payload: ResetPasswordDto) {
    try {
      const cachedTransaction = await this.cacheManager.get(
        payload.transactionId,
      );

      if (!cachedTransaction) {
        throw new BadRequestException('Invalid transaction!');
      }

      const userId = cachedTransaction['userId'];
      const transactionOtp = cachedTransaction['transactionOTP'];

      if (payload.otp !== transactionOtp)
        throw new BadRequestException('Invalid OTP!');

      await this.userModel.updateOne(
        { _id: userId },
        {
          password: await bcrypt.hash(payload.password, 10),
        },
      );

      this.cacheManager.del(payload.transactionId);

      return new BaseResponseModel('Reset password successful!');
    } catch (error) {
      throw error;
    }
  }
}
