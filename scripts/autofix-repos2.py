#!/usr/bin/env python3
import os, glob
BASE = r"E:\FILE HỌC TẬP ĐH LẠC HỒNG\Đồ Án Tốt Nghiệp\Web gym\backend\src\modules"
REPOS = [
    ("members/repository/typeorm-members.repository.ts", "Member", "MembersRepository", "members.repository"),
    ("branches/repository/typeorm-branches.repository.ts", "Branch", "BranchesRepository", "branches.repository"),
    ("payments/repository/typeorm-payments.repository.ts", "Payment", "PaymentsRepository", "payments.repository"),
    ("invoices/repository/typeorm-invoices.repository.ts", "Invoice", "InvoicesRepository", "invoices.repository"),
    ("audit-logs/repository/typeorm-audit-logs.repository.ts", "AuditLog", "AuditLogsRepository", "audit-logs.repository"),
    ("equipment/repository/typeorm-equipment.repository.ts", "Equipment", "EquipmentRepository", "equipment.repository"),
    ("foods/repository/typeorm-foods.repository.ts", "Food", "FoodsRepository", "foods.repository"),
    ("promotions/repository/typeorm-promotions.repository.ts", "Promotion", "PromotionsRepository", "promotions.repository"),
    ("membership-packages/repository/typeorm-membership-packages.repository.ts", "MembershipPackage", "MembershipPackagesRepository", "membership-packages.repository"),
]

TPL = """import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { {Ent} } from '../../database/entities/{file}';
import { {If} } from './{repoif}';

@Injectable()
export class {Repo} implements {If} {
  private repo: Repository<{Ent}>;
  constructor(private readonly dataSource: DataSource) { this.repo = this.dataSource.getRepository({Ent}); }
  async create(input: any): Promise<any> { const e = this.repo.create(input as any); return await this.repo.save(e); }
  async findOne(id: string): Promise<any> { return await this.repo.findOne({ where: { id } }); }
  async findMany(where?: any, opts?: any): Promise<any[]> { return await this.repo.find({ where: where || {}, take: (opts?.take || 50) as any, skip: (opts?.skip || 0) as any, order: { createdAt: 'DESC' } }); }
  async count(where?: any): Promise<number> { return await this.repo.count({ where: where || {} }); }
  async update(id: string, data: any): Promise<any> { await this.repo.update(id, data as any); return await this.repo.findOne({ where: { id } }); }
  async delete(id: string): Promise<void> { await this.repo.delete(id); }
}
"""

for f, ent, repo_name, iface_file in REPOS:
    path = os.path.join(BASE, f)
    if not os.path.exists(path):
        print("SKIP", f)
        continue
    content = TPL.replace("{Ent}", ent).replace("{Repo}", repo_name).replace("{If}", iface_file)
    # Derive entity import file name from entity class (approximate)
    import_file = ent.lower().replace("-", "") + ".entity"
    content = content.replace("{file}", import_file)
    content = content.replace("{repoif}", iface_file)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)
    print("FIXED", f)
print("Done")
