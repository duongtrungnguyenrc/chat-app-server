import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import BaseSchema from "./base.schema";
import { User } from "./user.schema";
import mongoose, { Date } from "mongoose";

@Schema()
export class Message extends BaseSchema {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User" })
    sender: User;

    @Prop()
    message: string;

    @Prop({ type: Date, default: new Date() })
    time: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
