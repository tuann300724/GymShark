export interface UsersRepository {
  list(query?: any): Promise<any[]>;
  findOne(id: string): Promise<any | null>;
}
