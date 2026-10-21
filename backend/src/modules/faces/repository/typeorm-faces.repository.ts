import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FacesRepository, FaceEmbeddingRow } from './faces.repository';

@Injectable()
export class TypeOrmFacesRepository implements FacesRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  async findActive(memberId: string): Promise<FaceEmbeddingRow[]> {
    const rows = await this.dataSource.query(
      `EXEC sp_face_embeddings_find_active @memberId=@0`, [memberId],
    );
    return Array.isArray(rows) ? rows.map((r: any) => ({
      id: r.id, memberId: r.memberId,
      embedding: r.embedding ? JSON.parse(r.embedding) : null,
      imageData: r.imageData,
      consentAt: r.consentAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })) : [];
  }

  async findById(id: string): Promise<FaceEmbeddingRow | null> {
    const rows = await this.dataSource.query(
      `EXEC sp_face_embeddings_find_by_id @id=@0`, [id],
    );
    const r = this.first<any>(rows);
    if (!r) return null;
    return {
      id: r.id, memberId: r.memberId,
      embedding: r.embedding ? JSON.parse(r.embedding) : null,
      imageData: r.imageData,
      consentAt: r.consentAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async deleteByMember(memberId: string): Promise<number> {
    const rows = await this.dataSource.query(
      `EXEC sp_face_embeddings_delete @memberId=@0`, [memberId],
    );
    return (this.first<any>(rows)?.deletedCount ?? 0) as number;
  }

  async countByMember(memberId: string): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM dbo.face_embeddings WHERE memberId = @0`, [memberId],
    );
    return (this.first<any>(rows)?.total ?? 0) as number;
  }
}
