import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { EUserRole } from '../enums';
import BaseSchema from './base.schema';
import { Exclude } from 'class-transformer';

@Schema()
export class User extends BaseSchema {
  @Prop({ type: String })
  email: string;

  @Prop({ type: String, default: '', select: false })
  @Exclude()
  password: string;

  @Prop({ type: String, default: '' })
  name: string;

  @Prop({ type: String, default: '' })
  phone: string;

  @Prop({ type: String, default: '' })
  avatar: string;

  @Prop({ enum: Object.values(EUserRole), default: EUserRole.ROLE_USER })
  role: EUserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
