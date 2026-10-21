#!/usr/bin/env python3
"""Autofix TypeORM repos: replace EXEC sp_* with TypeORM Repository methods."""
import os, re, glob

BASE = "E:\\FILE HỌC TẬP ĐH LẠC HỒNG\\Đồ Án Tốt Nghiệp\\Web gym\\backend\\src\\modules"

# Mapping: repo folder -> entity import path (relative to repo file)
MAP = {
    "users": {"entity": "../../database/entities/user.entity", "repo": "TypeOrmUsersRepository", "if": "auth.repository"},
    "members": {"entity": "../../database/entities/member.entity", "repo": "TypeOrmMembersRepository", "if": "members.repository"},
    "branches": {"entity": "../../database/entities/branch.entity", "repo": "TypeOrmBranchesRepository", "if": "branches.repository"},
    "payments": {"entity": "../../database/entities/payment.entity", "repo": "TypeOrmPaymentsRepository", "if": "payments.repository"},
    "invoices": {"entity": "../../database/entities/invoice.entity", "repo": "TypeOrmInvoicesRepository", "if": "invoices.repository"},
    "audit-logs": {"entity": "../../database/entities/audit-log.entity", "repo": "TypeOrmAuditLogsRepository", "if": "audit-logs.repository"},
    "equipment": {"entity": "../../database/entities/equipment.entity", "repo": "TypeOrmEquipmentRepository", "if": "equipment.repository"},
    "foods": {"entity": "../../database/entities/food.entity", "repo": "TypeOrmFoodsRepository", "if": "foods.repository"},
    "promotions": {"entity": "../../database/entities/promotion.entity", "repo": "TypeOrmPromotionsRepository", "if": "promotions.repository"},
    "membership-packages": {"entity": "../../database/entities/membership-package.entity", "repo": "TypeOrmMembershipPackagesRepository", "if": "membership-packages.repository"},
}

TEMPLATE = '''import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { __ENTITY__ } from '__ENTITY_PATH__';
import { __IFACE__ } from './__REPO_IF__';

@Injectable()
export class __REPO_CLASS__ implements __IFACE__ {
  private repo: Repository<__ENTITY__>;
  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(__ENTITY__);
  }

  async create(input: any): Promise<any> {
    const e = this.repo.create(input as any);
    return await this.repo.save(e);
  }

  async findOne(id: string): Promise<any> {
    return await this.repo.findOne({ where: { id } });
  }

  async findMany(where?: any, opts?: { take?: number; skip?: number }): Promise<any[]> {
    return await this.repo.find({ where: where || {}, take: opts?.take || 50, skip: opts?.skip || 0, order: { createdAt: 'DESC' } });
  }

  async count(where?: any): Promise<number> {
    return await this.repo.count({ where: where || {} });
  }

  async update(id: string, data: any): Promise<any> {
    await this.repo.update(id, data as any);
    return await this.repo.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
'''

entity_names = {
    "user.entity": "User",
    "member.entity": "Member",
    "branch.entity": "Branch",
    "payment.entity": "Payment",
    "invoice.entity": "Invoice",
    "audit-log.entity": "AuditLog",
    "equipment.entity": "Equipment",
    "food.entity": "Food",
    "promotion.entity": "Promotion",
    "membership-package.entity": "MembershipPackage",
}

for folder, info in MAP.items():
    repo_path = os.path.join(BASE, folder, "repository", "typeorm-" + info["repo"].lower().replace("typeorm", "") + ".repository.ts")
    # Try common naming patterns
    candidates = [
        os.path.join(BASE, folder, "repository", info["repo"].lower() + ".repository.ts"),
        os.path.join(BASE, folder, "repository", "typeorm-" + folder.replace("-", "") + ".repository.ts"),
        os.path.join(BASE, folder, "repository", info["repo"].lower() + ".repository.ts"),
    ]
    target = None
    for c in candidates:
        if os.path.exists(c):
            target = c
            break
    if not target:
        # Fallback: any .ts in repo folder with typeorm
        for f in os.listdir(os.path.join(BASE, folder, "repository")):
            if f.endswith(".ts") and "typeorm" in f:
                target = os.path.join(BASE, folder, "repository", f)
                break
    if not target:
        print("SKIP (no file)", folder)
        continue
    
    # Derive entity class from file content or mapping
    ent_key = info["entity"].split("/")[-1]
    ent_class = entity_names.get(ent_key, ent_key.replace(".entity", "").replace("-", "").title())
    
    # Build interface import name from file (guess)
    if info["if"] == "auth.repository":
        iface = "AuthRepository"
    elif info["if"] == "members.repository":
        iface = "MembersRepository"
    elif info["if"] == "branches.repository":
        iface = "BranchesRepository"
    elif info["if"] == "payments.repository":
        iface = "PaymentsRepository"
    elif info["if"] == "invoices.repository":
        iface = "InvoicesRepository"
    elif info["if"] == "audit-logs.repository":
        iface = "AuditLogsRepository"
    elif info["if"] == "equipment.repository":
        iface = "EquipmentRepository"
    elif info["if"] == "foods.repository":
        iface = "FoodsRepository"
    elif info["if"] == "promotions.repository":
        iface = "PromotionsRepository"
    elif info["if"] == "membership-packages.repository":
        iface = "MembershipPackagesRepository"
    else:
        iface = info["repo"]
    
    content = TEMPLATE.replace("__ENTITY__", ent_class).replace("__ENTITY_PATH__", info["entity"]).replace("__IFACE__", iface).replace("__REPO_CLASS__", info["repo"]).replace("__REPO_IF__", info["if"])
    with open(target, "w", encoding="utf-8") as f:
        f.write(content)
    print("FIXED", folder, "->", target)

print("Done. Check compilation with npm run build (backend).")
