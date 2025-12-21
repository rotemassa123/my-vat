import { tool } from '@openai/agents';
import { z } from 'zod';
import * as httpContext from 'express-http-context';
import { UserContext } from '../../../../Common/Infrastructure/types/user-context.type';
import { IProfileRepository } from '../../../../Common/ApplicationCore/Services/IProfileRepository';

/**
 * Tool factory that creates account tools with injected repository
 */
export function createAccountTools(profileRepository: IProfileRepository) {
  const getAccountInfoTool = tool({
    name: 'get_account_info',
    description: 'Get account information including company details, VAT settings, and contact information. Returns the account details for the current context.',
    parameters: z.object({}),
    async execute() {
      try {
        const userContext = httpContext.get('user_context') as UserContext | undefined;
        if (!userContext?.accountId) {
          return {
            error: true,
            message: 'Account ID not found in context',
          };
        }

        const account = await profileRepository.findAccountById(userContext.accountId);
        
        if (!account) {
          return {
            error: true,
            message: 'Account not found',
          };
        }

        return {
          id: account._id,
          email: account.email,
          account_type: account.account_type,
          status: account.status,
          company_name: account.company_name,
          vat_number: account.vat_number,
          tax_id: account.tax_id,
          registration_number: account.registration_number,
          address: account.address,
          phone: account.phone,
          website: account.website,
          vat_settings: account.vat_settings,
          last_login: account.last_login,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch account info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  const getAccountStatisticsTool = tool({
    name: 'get_account_statistics',
    description: 'Get statistics for the account including data aggregated by entity. Optionally filtered by a specific entity ID.',
    parameters: z.object({
      entity_id: z.string().nullable().optional().describe('Optional entity ID to get statistics for a specific entity'),
    }),
    async execute(input) {
      try {
        const userContext = httpContext.get('user_context') as UserContext | undefined;
        if (!userContext?.accountId) {
          return {
            error: true,
            message: 'Account ID not found in context',
          };
        }

        const statistics = await profileRepository.getStatistics(
          userContext.accountId,
          input.entity_id,
        );
        
        if (!statistics) {
          return {
            statistics: [],
            message: 'No statistics found',
          };
        }

        const statsArray = Array.isArray(statistics) ? statistics : [statistics];
        
        return {
          statistics: statsArray.map(stat => ({
            entity_id: stat.entity_id,
            data: stat.data,
            created_at: stat.created_at,
            updated_at: stat.updated_at,
          })),
          count: statsArray.length,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch account statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  return {
    getAccountInfoTool,
    getAccountStatisticsTool,
  };
}

