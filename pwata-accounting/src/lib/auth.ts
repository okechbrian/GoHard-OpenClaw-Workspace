import sqlite from "@/lib/db";
import { randomUUID } from "crypto";

// Initialize users table with default accounts
export function initUsers() {
  // Check if users exist
  const count = sqlite.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  if (count.count > 0) return;

  // Create default users (passwords: gohard123 / pwata2024)
  // In production, use proper bcrypt hashing
  const users = [
    { id: randomUUID(), name: "GoHard", email: "gohard@pwata.com", password_hash: "gohard123", role: "admin" },
    { id: randomUUID(), name: "Wife", email: "wife@pwata.com", password_hash: "pwata2024", role: "user" },
  ];

  const stmt = sqlite.prepare("INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)");
  for (const user of users) {
    stmt.run(user.id, user.name, user.email, user.password_hash, user.role);
  }
}

export function authenticateUser(email: string, password: string) {
  const user = sqlite.prepare("SELECT id, name, email, role FROM users WHERE email = ? AND password_hash = ?").get(email, password);
  return user || null;
}

// Auto-init on import
initUsers();
