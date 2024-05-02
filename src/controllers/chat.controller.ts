import { ChatService } from "@/services";
import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("chat")
@Controller("chat")
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Get("rooms")
    async getRoomsByUser(@Req() request: Request) {
        return this.chatService.getUserRooms(request);
    }

    @Get("room")
    async getChatRoom(
        @Req() request: Request,
        @Query("receiver") receiverId: string,
        @Query("page") page: number,
        @Query("limit") limit: number,
    ) {
        return this.chatService.getChatRoom(request, receiverId, page, limit);
    }

    @Get("messages")
    async getMessage(@Query("roomId") roomId: string, @Query("page") page: number, @Query("limit") limit?: number) {
        return this.chatService.getMessages(roomId, page, limit);
    }
}
