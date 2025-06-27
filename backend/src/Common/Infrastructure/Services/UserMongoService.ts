import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IUserRepository, UserData, CreateUserData, UpdateUserData } from "src/Common/ApplicationCore/Services/IUserRepository";
import { User, UserDocument } from "src/Common/Infrastructure/DB/schemas/user.schema";

@Injectable()
export class UserMongoRepository implements IUserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>
  ) {}

  private mapDocumentToUserData(doc: UserDocument): UserData {
    return {
      userId: doc.userId,
      fullName: doc.fullName,
      password: doc.password,
      userType: doc.userType,
      projects: doc.projects || [],
    };
  }

  async findUserById(userId: number): Promise<UserData | null> {
    const doc = await this.userModel.findOne({ userId }).exec();
    return doc ? this.mapDocumentToUserData(doc) : null;
  }

  async createUser(userData: CreateUserData): Promise<UserData> {
    const user = new this.userModel(userData);
    const savedDoc = await user.save();
    return this.mapDocumentToUserData(savedDoc);
  }

  async updateUser(userId: number, updateData: UpdateUserData): Promise<boolean> {
    const result = await this.userModel.updateOne({ userId }, updateData).exec();
    return result.modifiedCount > 0;
  }

  async deleteUser(userId: number): Promise<boolean> {
    const result = await this.userModel.deleteOne({ userId }).exec();
    return result.deletedCount > 0;
  }

  async userExists(userId: number): Promise<boolean> {
    const user = await this.userModel.findOne({ userId }).exec();
    return !!user;
  }
} 