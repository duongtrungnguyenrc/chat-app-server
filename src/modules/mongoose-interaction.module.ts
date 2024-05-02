import {
    Topic,
    TopicSchema,
    User,
    UserSchema,
    Vocabulary,
    VocabularySchema,
    MultipleChoiceAnswer,
    MultipleChoiceAnswerSchema,
    LearningRecord,
    LearningRecordSchema,
    ChatRoom,
    ChatRoomSchema,
    Message,
    MessageSchema,
    TopicGroup,
    TopicGroupSchema,
    Folder,
    FolderSchema,
} from "@/models/schemas";
import { Post, PostSchema } from "@/models/schemas/post.schema";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Folder.name, schema: FolderSchema },
            { name: TopicGroup.name, schema: TopicGroupSchema },
            { name: Topic.name, schema: TopicSchema },
            { name: User.name, schema: UserSchema },
            { name: Vocabulary.name, schema: VocabularySchema },
            { name: MultipleChoiceAnswer.name, schema: MultipleChoiceAnswerSchema },
            { name: LearningRecord.name, schema: LearningRecordSchema },
            { name: TopicGroup.name, schema: TopicGroupSchema },
            { name: Post.name, schema: PostSchema },
            { name: ChatRoom.name, schema: ChatRoomSchema },
            { name: Message.name, schema: MessageSchema },
        ]),
    ],
    exports: [
        MongooseModule.forFeature([
            { name: Folder.name, schema: FolderSchema },
            { name: TopicGroup.name, schema: TopicGroupSchema },
            { name: Topic.name, schema: TopicSchema },
            { name: User.name, schema: UserSchema },
            { name: Vocabulary.name, schema: VocabularySchema },
            { name: MultipleChoiceAnswer.name, schema: MultipleChoiceAnswerSchema },
            { name: LearningRecord.name, schema: LearningRecordSchema },
            { name: TopicGroup.name, schema: TopicGroupSchema },
            { name: Post.name, schema: PostSchema },
            { name: ChatRoom.name, schema: ChatRoomSchema },
            { name: Message.name, schema: MessageSchema },
        ]),
    ],
})
export class MongooseInteractionModule {}
