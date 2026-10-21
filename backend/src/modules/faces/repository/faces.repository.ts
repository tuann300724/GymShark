export interface FaceEmbeddingRow {
  id: string;
  memberId: string;
  embedding: string | null;
  imageData: string | null;
  consentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FacesRepository {
  findActive(memberId: string): Promise<FaceEmbeddingRow[]>;
  findById(id: string): Promise<FaceEmbeddingRow | null>;
  deleteByMember(memberId: string): Promise<number>;
  countByMember(memberId: string): Promise<number>;
}
