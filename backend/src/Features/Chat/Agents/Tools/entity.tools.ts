import { tool } from '@openai/agents';
import { z } from 'zod';
import { IProfileRepository } from '../../../../Common/ApplicationCore/Services/IProfileRepository';

/**
 * Tool factory that creates entity tools with injected repository
 */
export function createEntityTools(profileRepository: IProfileRepository) {
  const getEntitiesTool = tool({
    name: 'get_entities',
    description: 'Get all entities for the current account. Returns a list of entities with their details including VAT settings, addresses, and status.',
    parameters: z.object({}),
    async execute() {
      try {
        const entities = await profileRepository.getEntitiesForAccount();
        
        return {
          entities: entities.map(entity => ({
            id: entity._id,
            name: entity.name,
            entity_type: entity.entity_type,
            status: entity.status,
            vat_number: entity.vat_settings?.vat_number,
            tax_id: entity.vat_settings?.tax_id,
            vat_rate: entity.vat_settings?.vat_rate,
            currency: entity.vat_settings?.currency,
            filing_frequency: entity.vat_settings?.filing_frequency,
            address: entity.address,
            phone: entity.phone,
            email: entity.email,
            registration_number: entity.registration_number,
          })),
          count: entities.length,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch entities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  const getEntityByIdTool = tool({
    name: 'get_entity_by_id',
    description: 'Get a single entity by its ID. Returns detailed entity information including VAT settings and address.',
    parameters: z.object({
      entity_id: z.string().describe('The ID of the entity to retrieve'),
    }),
    async execute(input) {
      try {
        const entity = await profileRepository.findEntityById(input.entity_id);
        
        if (!entity) {
          return {
            error: true,
            message: `Entity with ID ${input.entity_id} not found`,
          };
        }

        return {
          id: entity._id,
          name: entity.name,
          entity_type: entity.entity_type,
          status: entity.status,
          vat_number: entity.vat_settings?.vat_number,
          tax_id: entity.vat_settings?.tax_id,
          vat_rate: entity.vat_settings?.vat_rate,
          currency: entity.vat_settings?.currency,
          filing_frequency: entity.vat_settings?.filing_frequency,
          address: entity.address,
          phone: entity.phone,
          email: entity.email,
          registration_number: entity.registration_number,
          incorporation_date: entity.incorporation_date,
          description: entity.description,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch entity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  return {
    getEntitiesTool,
    getEntityByIdTool,
  };
}

