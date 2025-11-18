import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Widget, WidgetDocument } from '../DB/schemas/widget.schema';
import { IWidgetRepository, CreateWidgetData, UpdateWidgetData } from 'src/Common/ApplicationCore/Services/IWidgetRepository';
import { logger } from '../Config/Logger';
import * as httpContext from 'express-http-context';
import { UserContext } from '../types/user-context.type';

@Injectable()
export class WidgetRepository implements IWidgetRepository {
  constructor(
    @InjectModel(Widget.name) private widgetModel: Model<WidgetDocument>,
  ) {}

  async create(data: CreateWidgetData): Promise<WidgetDocument> {
    try {
      const widgetData: any = {
        type: data.type,
        data_config: data.dataConfig,
        display_config: data.displayConfig,
        is_active: true,
      };
      
      if (data.layout) {
        widgetData.layout = data.layout;
      }
      
      // Get context and set fields explicitly since plugins may not be running
      const userContext = httpContext.get('user_context') as UserContext | undefined;
      
      if (!userContext?.accountId || !userContext?.userId) {
        logger.error('Missing required context for widget creation', 'WidgetRepository', {
          hasContext: !!userContext,
          accountId: userContext?.accountId,
          userId: userContext?.userId,
        });
        throw new Error('accountId and userId are required but not available in context');
      }
      
      // // Set fields explicitly since plugins may not be preserving context
      // // TODO: Remove this once plugins are confirmed to be working
      // widgetData.account_id = new Types.ObjectId(userContext.accountId);
      // widgetData.user_id = new Types.ObjectId(userContext.userId);
      // if (userContext.entityId) {
      //   widgetData.entity_id = new Types.ObjectId(userContext.entityId);
      // }
      
      const widget = new this.widgetModel(widgetData);
      return await widget.save();
    } catch (error) {
      logger.error('Error creating widget', 'WidgetRepository', { error, data });
      throw error;
    }
  }

  async findById(id: string): Promise<WidgetDocument | null> {
    try {
      // Plugins automatically filter by account_id, user_id, and entity_id
      return await this.widgetModel.findOne({ _id: id }).exec();
    } catch (error) {
      logger.error('Error finding widget by id', 'WidgetRepository', { error, id });
      throw error;
    }
  }

  async findAll(): Promise<WidgetDocument[]> {
    try {
      // Plugins automatically filter by account_id, user_id, and entity_id
      return await this.widgetModel
        .find({ is_active: true })
        .sort({ created_at: -1 })
        .exec();
    } catch (error) {
      logger.error('Error finding widgets', 'WidgetRepository', { error });
      throw error;
    }
  }

  async update(id: string, data: UpdateWidgetData): Promise<WidgetDocument | null> {
    try {
      const updateData: any = {};
      
      if (data.type !== undefined) {
        updateData.type = data.type;
      }
      if (data.dataConfig !== undefined) {
        updateData.data_config = data.dataConfig;
      }
      if (data.displayConfig !== undefined) {
        updateData.display_config = data.displayConfig;
      }
      if (data.layout !== undefined) {
        updateData.layout = data.layout;
      }
      if (data.isActive !== undefined) {
        updateData.is_active = data.isActive;
      }
      
      updateData.updated_at = new Date();
      
      // Plugins automatically filter by account_id, user_id, and entity_id
      return await this.widgetModel.findOneAndUpdate(
        { _id: id },
        { $set: updateData },
        { new: true }
      ).exec();
    } catch (error) {
      logger.error('Error updating widget', 'WidgetRepository', { error, id });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Plugins automatically filter by account_id, user_id, and entity_id
      const result = await this.widgetModel.findOneAndUpdate(
        { _id: id },
        { $set: { is_active: false, updated_at: new Date() } }
      ).exec();
      return !!result;
    } catch (error) {
      logger.error('Error deleting widget', 'WidgetRepository', { error, id });
      throw error;
    }
  }
}

