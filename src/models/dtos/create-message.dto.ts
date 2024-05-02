export class CreateMessageDto {
    roomId: string;
    userId: string;
    message: string;

    constructor(roomId: string, userId: string, message: string) {
        this.roomId = roomId;
        this.userId = userId;
        this.message = message;
    }
}
