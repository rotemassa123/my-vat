import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

// Repository interface
import { 
  IProfileRepository, 
  AccountData, 
  CreateAccountData, 
  UpdateAccountData,
  UserData,
  CreateUserData,
  UpdateUserData,
  EntityData,
  CreateEntityData,
  UpdateEntityData
} from "src/Common/ApplicationCore/Services/IProfileRepository";

// MongoDB schemas
import { Account, AccountDocument } from "src/Common/Infrastructure/DB/schemas/account.schema";
import { User, UserDocument } from "src/Common/Infrastructure/DB/schemas/user.schema";
import { Entity, EntityDocument } from "src/Common/Infrastructure/DB/schemas/entity.schema";

@Injectable()
export class ProfileMongoService implements IProfileRepository {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Entity.name)
    private readonly entityModel: Model<EntityDocument>
  ) {}

  // ==================== ACCOUNT METHODS ====================

  private mapDocumentToAccountData(doc: AccountDocument): AccountData {
    return {
      _id: doc._id.toString(),
      email: doc.email,
      account_type: doc.account_type as 'individual' | 'business',
      status: doc.status as 'active' | 'inactive' | 'suspended',
      company_name: doc.company_name,
      tax_id: doc.tax_id,
      vat_number: doc.vat_number,
      registration_number: doc.registration_number,
      address: doc.address,
      phone: doc.phone,
      website: doc.website,
      vat_settings: doc.vat_settings,
      last_login: doc.last_login,
      created_at: doc['created_at'],
      updated_at: doc['updated_at'],
    };
  }

  async findAccountById(accountId: string): Promise<AccountData | null> {
    const doc = await this.accountModel.findById(accountId).exec();
    return doc ? this.mapDocumentToAccountData(doc) : null;
  }

  async findAccountByEmail(email: string): Promise<AccountData | null> {
    const doc = await this.accountModel.findOne({ email }).exec();
    return doc ? this.mapDocumentToAccountData(doc) : null;
  }

  async createAccount(accountData: CreateAccountData): Promise<AccountData> {
    const account = new this.accountModel({
      ...accountData,
      account_type: accountData.account_type || 'individual',
      status: 'active',
    });
    const savedDoc = await account.save();
    return this.mapDocumentToAccountData(savedDoc);
  }

  async updateAccount(accountId: string, updateData: UpdateAccountData): Promise<boolean> {
    const result = await this.accountModel.updateOne({ _id: accountId }, updateData).exec();
    return result.modifiedCount > 0;
  }

  async deleteAccount(accountId: string): Promise<boolean> {
    const result = await this.accountModel.deleteOne({ _id: accountId }).exec();
    return result.deletedCount > 0;
  }

  async accountExists(accountId: string): Promise<boolean> {
    const account = await this.accountModel.findById(accountId).exec();
    return !!account;
  }

  // ==================== USER METHODS ====================

  private mapDocumentToUserData(doc: UserDocument): UserData {
    return {
      _id: doc._id.toString(),
      userId: doc.userId,
      fullName: doc.fullName,
      email: doc.email,
      hashedPassword: doc.hashedPassword,
      userType: doc.userType,
      accountId: doc.accountId.toString(),
      status: doc.status,
      last_login: doc.last_login,
      profile_image_url: doc.profile_image_url,
      phone: doc.phone,
      created_at: doc['created_at'],
      updated_at: doc['updated_at'],
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

  // ==================== ENTITY METHODS ====================

  private mapDocumentToEntityData(doc: EntityDocument): EntityData {
    return {
      _id: doc._id.toString(),
      accountId: doc.accountId.toString(),
      name: doc.name,
      entity_type: doc.entity_type as 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship',
      registration_number: doc.registration_number,
      incorporation_date: doc.incorporation_date,
      address: doc.address,
      phone: doc.phone,
      email: doc.email,
      vat_settings: doc.vat_settings,
      status: doc.status as 'active' | 'inactive' | 'dissolved',
      description: doc.description,
      created_at: doc['created_at'],
      updated_at: doc['updated_at'],
    };
  }

  async findEntityById(entityId: string): Promise<EntityData | null> {
    const doc = await this.entityModel.findById(entityId).exec();
    return doc ? this.mapDocumentToEntityData(doc) : null;
  }

  async findEntitiesByAccountId(accountId: string): Promise<EntityData[]> {
    const docs = await this.entityModel.find({ accountId }).exec();
    return docs.map(doc => this.mapDocumentToEntityData(doc));
  }

  async createEntity(entityData: CreateEntityData): Promise<EntityData> {
    const entity = new this.entityModel({
      ...entityData,
      status: 'active',
    });
    const savedDoc = await entity.save();
    return this.mapDocumentToEntityData(savedDoc);
  }

  async updateEntity(entityId: string, updateData: UpdateEntityData): Promise<boolean> {
    const result = await this.entityModel.updateOne({ _id: entityId }, updateData).exec();
    return result.modifiedCount > 0;
  }

  async deleteEntity(entityId: string): Promise<boolean> {
    const result = await this.entityModel.deleteOne({ _id: entityId }).exec();
    return result.deletedCount > 0;
  }

  async entityExists(entityId: string): Promise<boolean> {
    const entity = await this.entityModel.findById(entityId).exec();
    return !!entity;
  }
} 