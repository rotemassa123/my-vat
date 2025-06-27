import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IAccountRepository, AccountData, CreateAccountData, UpdateAccountData } from "src/Common/ApplicationCore/Services/IAccountRepository";
import { Account, AccountDocument } from "src/Common/Infrastructure/DB/schemas/account.schema";

@Injectable()
export class AccountMongoRepository implements IAccountRepository {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>
  ) {}

  private mapDocumentToAccountData(doc: AccountDocument): AccountData {
    return {
      _id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
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
      password_hash: doc.password_hash,
      google_user_id: doc.google_user_id,
      auth_providers: doc.auth_providers,
      last_login: doc.last_login,
      monthly_upload_limit_mb: doc.monthly_upload_limit_mb,
      current_month_usage_mb: doc.current_month_usage_mb,
      permissions: doc.permissions,
      verified_at: doc.verified_at,
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
      vat_settings: accountData.vat_settings || {
        default_currency: 'USD',
        vat_rate: 20,
        reclaim_threshold: 100,
        auto_process: false,
      },
      auth_providers: accountData.auth_providers || ['email'],
      monthly_upload_limit_mb: accountData.monthly_upload_limit_mb || 10000,
      current_month_usage_mb: 0,
      permissions: accountData.permissions || ['upload', 'process', 'view'],
      status: accountData.status || 'active',
      account_type: accountData.account_type || 'individual',
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
} 