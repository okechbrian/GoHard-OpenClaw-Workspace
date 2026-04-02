import sqlite from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "pwata.db");
const BACKUP_DIR = path.join(process.cwd(), "data", "backups");

// GET: Create backup (returns db file)
export async function GET() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T").join("_").slice(0, 19);
    const backupPath = path.join(BACKUP_DIR, `pwata-backup-${timestamp}.db`);

    // Use SQLite backup for consistency
    sqlite.backup(backupPath);

    const fileBuffer = fs.readFileSync(backupPath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="pwata-backup-${timestamp}.db"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}

// POST: Restore from uploaded backup
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("backup") as File;

    if (!file) {
      return NextResponse.json({ error: "No backup file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate it's a SQLite file
    const header = buffer.slice(0, 16).toString("ascii");
    if (!header.startsWith("SQLite format 3")) {
      return NextResponse.json({ error: "Invalid SQLite file" }, { status: 400 });
    }

    // Backup current db first
    const safetyBackup = DB_PATH + ".pre-restore";
    if (fs.existsSync(DB_PATH)) {
      fs.copyFileSync(DB_PATH, safetyBackup);
    }

    // Write new db
    fs.writeFileSync(DB_PATH, buffer);

    return NextResponse.json({ success: true, message: "Database restored successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}
