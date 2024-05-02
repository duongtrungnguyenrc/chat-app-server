import { Module } from "@nestjs/common";
import { MongooseInteractionModule } from "./mongoose-interaction.module";
import { ChatService } from "@/services";
import { ChatGateway } from "@/gateway";
import { ChatController } from "@/controllers/chat.controller";
import { UserModule } from "./user.module";

@Module({
    imports: [MongooseInteractionModule, UserModule],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway],
    exports: [ChatService],
})
export class ChatModule {}
