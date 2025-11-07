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

  async getAllAccounts(): Promise<AccountData[]> {
    const docs = await this.accountModel.find().exec();
    return docs.map(doc => this.mapDocumentToAccountData(doc));
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
      fullName: doc.fullName,
      email: doc.email,
      hashedPassword: doc.hashedPassword,
      userType: doc.userType,
      accountId: doc.get('account_id') ? doc.get('account_id').toString() : undefined,
      entityId: doc.get('entity_id') ? doc.get('entity_id').toString() : undefined,
      status: doc.status,
      last_login: doc.last_login,
      profile_image_url: doc.profile_image_url,
      phone: doc.phone,
      created_at: doc['created_at'],
      updated_at: doc['updated_at'],
    };
  }

  async findUserById(userId: string): Promise<UserData | null> {
    const doc = await this.userModel.findById(userId).exec();
    return doc ? this.mapDocumentToUserData(doc) : null;
  }

  async findUserByEmail(email: string): Promise<UserData | null> {
    const doc = await this.userModel.findOne({ email }).exec();
    return doc ? this.mapDocumentToUserData(doc) : null;
  }

  async createUser(userData: CreateUserData): Promise<UserData> {
    // Convert the field names to match MongoDB schema
    const mongoUserData: any = {
      ...userData,
      status: 'pending', // Default status for new users
    };
    
    // Convert accountId to account_id for MongoDB (only if provided)
    if (userData.accountId) {
      mongoUserData.account_id = userData.accountId;
    }
    delete mongoUserData.accountId;
    
    // Convert entityId to entity_id for MongoDB (only if provided)
    if (userData.entityId) {
      mongoUserData.entity_id = userData.entityId;
    }
    delete mongoUserData.entityId;
    
    const user = new this.userModel(mongoUserData);
    const savedDoc = await user.save();
    return this.mapDocumentToUserData(savedDoc);
  }

  async createUsersBatch(usersData: CreateUserData[]): Promise<UserData[]> {
    if (usersData.length === 0) {
      return [];
    }

    const mongoUsersData = usersData.map(userData => {
      const mongoUserData: any = {
        ...userData,
        status: (userData as any).status || 'pending',
      };
      
      if (userData.accountId) {
        mongoUserData.account_id = userData.accountId;
      }
      delete mongoUserData.accountId;
      
      if (userData.entityId) {
        mongoUserData.entity_id = userData.entityId;
      }
      delete mongoUserData.entityId;
      
      return mongoUserData;
    });

    const savedDocs = await this.userModel.insertMany(mongoUsersData);
    return savedDocs.map(doc => this.mapDocumentToUserData(doc as UserDocument));
  }

  async updateUser(userId: string, updateData: UpdateUserData): Promise<boolean> {
    // Handle the plugin-managed fields separately
    const mongoUpdateData: any = { ...updateData };
    
    // Convert accountId to account_id for MongoDB
    if (updateData.accountId !== undefined) {
      if (updateData.accountId) {
        mongoUpdateData.account_id = updateData.accountId;
      } else {
        mongoUpdateData.$unset = { account_id: 1 };
      }
      delete mongoUpdateData.accountId;
    }
    
    // Convert entityId to entity_id for MongoDB
    if (updateData.entityId !== undefined) {
      if (updateData.entityId) {
        mongoUpdateData.entity_id = updateData.entityId;
      } else {
        // Remove entity_id field if setting to undefined
        if (!mongoUpdateData.$unset) mongoUpdateData.$unset = {};
        mongoUpdateData.$unset.entity_id = 1;
      }
      delete mongoUpdateData.entityId;
    }
    
    const result = await this.userModel.updateOne({ _id: userId }, mongoUpdateData).exec();
    return result.modifiedCount > 0;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ _id: userId }).exec();
    return result.deletedCount > 0;
  }

  async userExists(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    return !!user;
  }

  async userExistsByEmail(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email }).exec();
    return !!user;
  }

  // ==================== ENTITY METHODS ====================

  private mapDocumentToEntityData(doc: EntityDocument): EntityData {
    return {
      _id: doc._id.toString(),
      accountId: doc.get('account_id').toString(),
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

  async getEntitiesForAccount(): Promise<EntityData[]> {
    // account_id scoping handled by TenantScopePlugin
    const docs = await this.entityModel.find().exec();
    return docs.map(doc => this.mapDocumentToEntityData(doc));
  }

  async getAllEntities(): Promise<EntityData[]> {
    // Bypass account scope for operators to get all entities
    const docs = await this.entityModel
      .find()
      .setOptions({ disableAccountScope: true })
      .exec();
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
    return !!entity;
  }

  async getUsersForAccount(): Promise<UserData[]> {
    // account_id scoping handled by AccountScopePlugin (if user has account context)
    const docs = await this.userModel.find().exec();
    return docs.map(doc => this.mapDocumentToUserData(doc));
  }
} 
