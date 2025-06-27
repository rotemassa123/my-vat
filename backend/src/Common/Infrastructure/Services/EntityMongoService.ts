import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IEntityRepository, EntityData, CreateEntityData, UpdateEntityData } from "src/Common/ApplicationCore/Services/IEntityRepository";
import { Entity, EntityDocument } from "src/Common/Infrastructure/DB/schemas/entity.schema";

@Injectable()
export class EntityMongoRepository implements IEntityRepository {
  constructor(
    @InjectModel(Entity.name)
    private readonly entityModel: Model<EntityDocument>
  ) {}

  private mapDocumentToEntityData(doc: EntityDocument): EntityData {
    return {
      _id: doc._id.toString(),
      accountId: doc.accountId.toString(),
      name: doc.name,
      entity_type: doc.entity_type as 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship',
      legal_name: doc.legal_name,
      registration_number: doc.registration_number,
      incorporation_date: doc.incorporation_date,
      incorporation_country: doc.incorporation_country,
      address: doc.address,
      phone: doc.phone,
      email: doc.email,
      website: doc.website,
      vat_settings: doc.vat_settings,
      status: doc.status as 'active' | 'inactive' | 'dissolved',
      description: doc.description,
      business_activities: doc.business_activities,
      parent_entity_id: doc.parent_entity_id?.toString(),
      is_vat_registered: doc.is_vat_registered,
      vat_registration_date: doc.vat_registration_date,
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
      status: entityData.status || 'active',
      business_activities: entityData.business_activities || [],
      is_vat_registered: entityData.is_vat_registered || false,
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