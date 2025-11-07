import axios, { type AxiosInstance } from 'axios';

// Job types
export type JobType = 
  | 'google_drive_discover'
  | 'upload_to_cloud'
  | 'summarize_invoices'
  | 'check_claimability';

// Job configuration
interface JobConfig {
  name: string;
  envVar: string;
}

const JOB_CONFIGS: Record<JobType, JobConfig> = {
  google_drive_discover: {
    name: 'Google Drive Discover',
    envVar: 'VITE_JOB_GOOGLE_DRIVE_DISCOVER_URL',
  },
  upload_to_cloud: {
    name: 'Upload to Cloud from Google Drive',
    envVar: 'VITE_JOB_UPLOAD_TO_CLOUD_URL',
  },
  summarize_invoices: {
    name: 'Summarize Invoices',
    envVar: 'VITE_JOB_SUMMARIZE_INVOICES_URL',
  },
  check_claimability: {
    name: 'Check Claimability',
    envVar: 'VITE_JOB_CHECK_CLAIMABILITY_URL',
  },
};

// Create axios instance with 3-minute timeout (180000ms)
const createJobClient = (baseURL: string): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout: 180000, // 3 minutes
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export interface TriggerJobParams {
  accountId: string;
  entityId: string;
}

export interface TriggerJobResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Trigger a job for a specific account and entity
 */
export const triggerJob = async (
  jobType: JobType,
  params: TriggerJobParams
): Promise<TriggerJobResponse> => {
  const config = JOB_CONFIGS[jobType];
  const jobUrl = import.meta.env[config.envVar];

  if (!jobUrl) {
    throw new Error(
      `Job URL not configured. Please set ${config.envVar} in your .env file.`
    );
  }

  try {
    const client = createJobClient(jobUrl);
    const response = await client.post<TriggerJobResponse>('', {
      account_id: params.accountId,
      entity_id: params.entityId,
    });

    return {
      success: true,
      message: response.data.message || `${config.name} job triggered successfully`,
      data: response.data,
    };
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      throw new Error(
        `Request timeout: ${config.name} job took longer than 3 minutes to respond.`
      );
    }

    if (error.response) {
      throw new Error(
        error.response.data?.message ||
        `Failed to trigger ${config.name} job: ${error.response.statusText}`
      );
    }

    if (error.request) {
      throw new Error(
        `Network error: Unable to reach ${config.name} job endpoint.`
      );
    }

    throw new Error(
      `Failed to trigger ${config.name} job: ${error.message}`
    );
  }
};

/**
 * Get job configuration
 */
export const getJobConfig = (jobType: JobType): JobConfig => {
  return JOB_CONFIGS[jobType];
};

/**
 * Get all job types
 */
export const getAllJobTypes = (): JobType[] => {
  return Object.keys(JOB_CONFIGS) as JobType[];
};

