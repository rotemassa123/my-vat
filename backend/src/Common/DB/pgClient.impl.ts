import {Injectable} from '@nestjs/common';
import {Pool} from 'pg';
import {readFileSync} from "fs";

@Injectable()
export class PGClient {
  private readonly pool: Pool;

  constructor() {
    const poolConfiguration= {
      user: process.env.DB_USERNAME,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT !== undefined ? parseInt(process.env.DB_PORT) : 5432,
    } as any;

    if (process.env.PG_KEY && process.env.PG_CERT) {
      poolConfiguration.ssl = {
        cert: this.handleSSLEnv(process.env.PG_CERT),
        key: this.handleSSLEnv(process.env.PG_KEY),
      }
    } else if (process.env.PG_SSL_SKIP_VERIFICATION) {
      poolConfiguration.ssl = {
        rejectUnauthorized: false
      }
    }

    this.pool = new Pool(poolConfiguration);
  }

  handleSSLEnv = (value: string): string => {
    if (value.startsWith('----'))
      return value;
    else
      return readFileSync(value).toString();
  }

  async query<T>(text: string, valueSet?: unknown[]): Promise<T> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, valueSet);
      return result.rows.length <= 1 ? result.rows[0] as T : result.rows as T;
    } finally {
      client.release();
    }
  }


  async queriesTranscation(queries: string[], valuesSets: unknown[][]): Promise<void>{
    const client = await this.pool.connect();
    try{
      await client.query('BEGIN');
      for(let i = 0; i < queries.length; i++){
        await client.query(queries[i], valuesSets[i]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }
}
