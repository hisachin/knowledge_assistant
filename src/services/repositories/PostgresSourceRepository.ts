import { ISourceRepository, Source } from '@/types';
import { DatabaseConnection } from '@/lib/db/db';

export class PostgresSourceRepository implements ISourceRepository {
  constructor(private db: DatabaseConnection) {}

  async create(source: Source): Promise<Source> {
    const query = `
      INSERT INTO sources (url, title, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, url, title, description, created_at, updated_at
    `;
    
    const params = [
      source.url,
      source.title || null,
      source.description || null,
      source.createdAt || new Date(),
      source.updatedAt || new Date(),
    ];

    const result = await this.db.queryOne<Source>(query, params);
    if (!result) {
      throw new Error('Failed to create source');
    }

    return {
      ...result,
      createdAt: new Date(result.createdAt as string | Date),
      updatedAt: new Date(result.updatedAt as string | Date),
    };
  }

  async findById(id: number): Promise<Source | null> {
    const query = `
      SELECT id, url, title, description, created_at, updated_at
      FROM sources
      WHERE id = $1
    `;
    
    const result = await this.db.queryOne<Source>(query, [id]);
    if (!result) return null;

    return {
      ...result,
      createdAt: new Date(result.createdAt as string | Date),
      updatedAt: new Date(result.updatedAt as string | Date),
    };
  }

  async findByUrl(url: string): Promise<Source | null> {
    const query = `
      SELECT id, url, title, description, created_at, updated_at
      FROM sources
      WHERE url = $1
    `;
    
    const result = await this.db.queryOne<Source>(query, [url]);
    if (!result) return null;

    return {
      ...result,
      createdAt: new Date(result.createdAt as string | Date),
      updatedAt: new Date(result.updatedAt as string | Date),
    };
  }

  async findAll(): Promise<Source[]> {
    const query = `
      SELECT id, url, title, description, created_at, updated_at
      FROM sources
      ORDER BY created_at DESC
    `;
    
    const results = await this.db.query<Source>(query);
    
    return results.map(result => ({
      ...result,
      createdAt: new Date(result.createdAt as string | Date),
      updatedAt: new Date(result.updatedAt as string | Date),
    }));
  }

  async update(id: number, source: Partial<Source>): Promise<Source | null> {
    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (source.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      params.push(source.title);
    }

    if (source.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      params.push(source.description);
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push(`updated_at = $${paramIndex++}`);
    params.push(new Date());
    params.push(id);

    const query = `
      UPDATE sources
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, url, title, description, created_at, updated_at
    `;

    const result = await this.db.queryOne<Source>(query, params);
    if (!result) return null;

    return {
      ...result,
      createdAt: new Date(result.createdAt as string | Date),
      updatedAt: new Date(result.updatedAt as string | Date),
    };
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM sources WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.length > 0;
  }

  async exists(url: string): Promise<boolean> {
    const query = 'SELECT 1 FROM sources WHERE url = $1 LIMIT 1';
    const result = await this.db.query(query, [url]);
    return result.length > 0;
  }
}
