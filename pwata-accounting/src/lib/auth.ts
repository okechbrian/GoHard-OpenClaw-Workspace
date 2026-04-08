// Simple in-memory authentication for Vercel deployment
// In production, replace with proper database solution

const users = [
  { id: "1", name: "GoHard", email: "gohard@pwata.com", password: "gohard123", role: "admin" },
  { id: "2", name: "Wife", email: "wife@pwata.com", password: "pwata2024", role: "user" }
];

export function authenticateUser(email: string, password: string) {
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return null;
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Keep the init function for local development with SQLite
export function initUsers() {
  // This will only work locally with SQLite
  try {
    const sqlite = require("@/lib/db");
    const { randomUUID } = require("crypto");
    
    const count = sqlite.prepare("SELECT COUNT(*) as count FROM users").get() as any;
    if (count.count > 0) return;

    const stmt = sqlite.prepare("INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)");
    for (const user of users) {
      stmt.run(randomUUID(), user.name, user.email, user.password, user.role);
    }
  } catch (error) {
    // SQLite not available (Vercel environment)
    console.log("SQLite not available, using in-memory auth");
  }
}

// Auto-init on import (for local development)
if (typeof window === 'undefined') {
  initUsers();
}
