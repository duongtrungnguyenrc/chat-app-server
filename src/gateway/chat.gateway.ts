import { CreateMessageDto } from "@/models/dtos";
import { ChatRoom } from "@/models/schemas";
import { ChatService } from "@/services";
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway(3001, { namespace: "chat", cors: "*" })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    private server: Server;
    private rooms: Map<string, { clients: Set<string>; room: ChatRoom }> = new Map();

    constructor(private readonly chatService: ChatService) {}

    afterInit(server: Server) {
        this.server = server;
    }

    handleConnection(client: Socket, ..._args: any[]) {}

    handleDisconnect(client: Socket) {
        this.rooms.forEach((value, key) => {
            if (value.clients.has(client.id)) {
                value.clients.delete(client.id);
                if (value.clients.size === 0) {
                    this.rooms.delete(key);
                }
            }
        });
    }

    @SubscribeMessage("join")
    async onJoinRoom(client: Socket, roomId: string) {
        try {
            const currentRoom = await this.chatService.getRoom(roomId);
            if (!currentRoom) {
                return;
            }

            let roomData = this.rooms.get(roomId);
            if (!roomData) {
                roomData = { clients: new Set(), room: currentRoom };
                this.rooms.set(roomId, roomData);
            }
            roomData.clients.add(client.id);
        } catch (error) {
            this.server.to(client.id).emit("error", error.message);
        }
    }

    @SubscribeMessage("leave")
    handleLeaveRoom(client: Socket, roomId: string) {
        try {
            const roomData = this.rooms.get(roomId);
            if (!roomData) {
                return;
            }
            roomData.clients.delete(client.id);
            if (roomData.clients.size === 0) {
                this.rooms.delete(roomId);
            }
        } catch (error) {
            this.server.to(client.id).emit("error", error.message);
        }
    }

    @SubscribeMessage("send")
    async onMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: string) {
        try {
            const { roomId, userId, message } = JSON.parse(payload);
            const roomData = this.rooms.get(roomId);
            if (!roomData) {
                return;
            }
            const createdMessage = await this.chatService.createMessage(
                new CreateMessageDto(roomId, userId, message),
                roomData.room,
            );
            roomData.clients.forEach((clientId) => {
                if (clientId !== client.id) {
                    this.server.to(clientId).emit("receive", createdMessage);
                } else {
                    this.server.to(clientId).emit("sent", createdMessage);
                }
            });
        } catch (error) {
            this.server.to(client.id).emit("error", error.message);
        }
    }
}
