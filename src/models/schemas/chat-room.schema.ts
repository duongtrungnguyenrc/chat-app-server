import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import BaseSchema from "./base.schema";
import { User } from "./user.schema";
import mongoose from "mongoose";
import { Message } from "./message.schema";

@Schema()
export class ChatRoom extends BaseSchema {
    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] })
    users: User[];

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message", default: [] }] })
    messages: Message[];
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
