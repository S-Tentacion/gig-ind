import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

export type Member = { id: number; name: string; contact: string; city: string; profileImages: string[]; kitPurchased: boolean; boostCredits: number; boostExpiresAt: string | null; createdAt: string };
export type PaymentPurpose = "joining" | "kit" | `boost_${number}`;
type PendingPayment = { orderId: string; name: string; contact: string; city: string; amount: number; purpose: PaymentPurpose; status: string };

// Vercel Functions can only write to /tmp. This keeps the POC APIs functional
// after deployment; use Supabase or another managed database for durable data.
const dbPath = process.env.SQLITE_DB_PATH || (process.env.VERCEL ? path.join("/tmp", "gigolo-india.db") : path.join(process.cwd(), "data", "gigolo-india.db"));
const globalForDb = globalThis as unknown as { gigoloDb?: Database.Database };

function ensureMemberColumns(db: Database.Database) {
  const memberColumns = db.prepare("PRAGMA table_info(members)").all() as Array<{ name: string }>;
  if (!memberColumns.some((column) => column.name === "kit_purchased")) {
    db.exec("ALTER TABLE members ADD COLUMN kit_purchased INTEGER NOT NULL DEFAULT 0");
  }
  if (!memberColumns.some((column) => column.name === "boost_expires_at")) {
    db.exec("ALTER TABLE members ADD COLUMN boost_expires_at TEXT");
  }
  if (!memberColumns.some((column) => column.name === "boost_credits")) {
    db.exec("ALTER TABLE members ADD COLUMN boost_credits INTEGER NOT NULL DEFAULT 0");
  }
  if (!memberColumns.some((column) => column.name === "profile_images")) {
    db.exec("ALTER TABLE members ADD COLUMN profile_images TEXT NOT NULL DEFAULT '[]'");
  }
}

function createDatabase() {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath, { timeout: 5000 });
  db.pragma("busy_timeout = 5000");
  db.pragma("journal_mode = WAL");
  db.exec(`CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    profile_images TEXT NOT NULL DEFAULT '[]',
    kit_purchased INTEGER NOT NULL DEFAULT 0,
    boost_credits INTEGER NOT NULL DEFAULT 0,
    boost_expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS payments (
    razorpay_order_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    city TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'created',
    razorpay_payment_id TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TEXT
  )`);
  ensureMemberColumns(db);
  const paymentColumns = db.prepare("PRAGMA table_info(payments)").all() as Array<{ name: string }>;
  if (!paymentColumns.some((column) => column.name === "purpose")) {
    db.exec("ALTER TABLE payments ADD COLUMN purpose TEXT NOT NULL DEFAULT 'joining'");
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_payments_contact_status ON payments(contact, status)");
  db.pragma("optimize");
  return db;
}

function getDb() {
  if (!globalForDb.gigoloDb) globalForDb.gigoloDb = createDatabase();
  ensureMemberColumns(globalForDb.gigoloDb);
  return globalForDb.gigoloDb;
}

export function normaliseContact(contact: string) { return contact.trim().toLowerCase(); }

type MemberRow = Omit<Member, "profileImages"> & { profileImages: string | null };

function toMember(row: MemberRow | undefined) {
  if (!row) return undefined;
  try {
    const profileImages = JSON.parse(row.profileImages ?? "[]");
    return { ...row, profileImages: Array.isArray(profileImages) ? profileImages.filter((image): image is string => typeof image === "string") : [] };
  } catch {
    return { ...row, profileImages: [] };
  }
}

export function createMember({ name, contact, city }: Pick<Member, "name" | "contact" | "city">) {
  const result = getDb().prepare("INSERT INTO members (name, contact, city) VALUES (?, ?, ?)").run(name.trim(), normaliseContact(contact), city.trim());
  const member = getMemberById(Number(result.lastInsertRowid));
  if (!member) throw new Error("MEMBER_CREATION_FAILED");
  return member;
}

export function getMemberByContact(contact: string) {
  const row = getDb().prepare("SELECT id, name, contact, city, profile_images AS profileImages, kit_purchased AS kitPurchased, boost_credits AS boostCredits, boost_expires_at AS boostExpiresAt, created_at AS createdAt FROM members WHERE contact = ?").get(normaliseContact(contact)) as MemberRow | undefined;
  return toMember(row);
}

export function getMemberById(id: number) {
  const row = getDb().prepare("SELECT id, name, contact, city, profile_images AS profileImages, kit_purchased AS kitPurchased, boost_credits AS boostCredits, boost_expires_at AS boostExpiresAt, created_at AS createdAt FROM members WHERE id = ?").get(id) as MemberRow | undefined;
  return toMember(row);
}

export function setMemberProfileImages(id: number, profileImages: string[]) {
  getDb().prepare("UPDATE members SET profile_images = ? WHERE id = ?").run(JSON.stringify(profileImages), id);
  const member = getMemberById(id);
  if (!member) throw new Error("MEMBER_NOT_FOUND");
  return member;
}

export function hasVerifiedPayment(contact: string, paymentId: string) {
  return Boolean(getDb().prepare("SELECT 1 FROM payments WHERE contact = ? AND razorpay_payment_id = ? AND status = 'verified' LIMIT 1").get(normaliseContact(contact), paymentId));
}

export function activateMemberBoost(id: number) {
  const database = getDb();
  const boostExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return database.transaction(() => {
    const result = database.prepare("UPDATE members SET boost_credits = boost_credits - 1, boost_expires_at = ? WHERE id = ? AND boost_credits > 0 AND (boost_expires_at IS NULL OR boost_expires_at <= ?)").run(boostExpiresAt, id, new Date().toISOString());
    if (result.changes !== 1) throw new Error("BOOST_NOT_AVAILABLE");
    const member = getMemberById(id);
    if (!member) throw new Error("MEMBER_NOT_FOUND");
    return member;
  })();
}

export function getRecentSignupEvents(afterId: number) {
  return getDb().prepare("SELECT id, created_at AS createdAt FROM members WHERE id > ? ORDER BY id ASC LIMIT 10").all(afterId) as Array<{ id: number; createdAt: string }>;
}

export function createPendingPayment({ orderId, name, contact, city, amount, purpose }: Omit<PendingPayment, "status">) {
  getDb().prepare("INSERT INTO payments (razorpay_order_id, name, contact, city, amount, currency, purpose) VALUES (?, ?, ?, ?, ?, ?, ?)").run(orderId, name.trim(), normaliseContact(contact), city.trim(), amount, "INR", purpose);
}

export function getPendingPayment(orderId: string) {
  return getDb().prepare("SELECT razorpay_order_id AS orderId, name, contact, city, amount, purpose, status FROM payments WHERE razorpay_order_id = ?").get(orderId) as PendingPayment | undefined;
}

export function finalisePayment({ orderId, paymentId }: { orderId: string; paymentId: string }) {
  const database = getDb();
  const complete = database.transaction(() => {
    const payment = database.prepare("SELECT razorpay_order_id AS orderId, name, contact, city, amount, purpose, status FROM payments WHERE razorpay_order_id = ?").get(orderId) as PendingPayment | undefined;
    if (!payment) throw new Error("PAYMENT_NOT_FOUND");
    if (payment.status === "verified") {
      const existingMember = getMemberByContact(payment.contact);
      if (!existingMember) throw new Error("VERIFIED_MEMBER_NOT_FOUND");
      return existingMember;
    }
    if (payment.purpose === "kit") {
      const existingMember = getMemberByContact(payment.contact);
      if (!existingMember) throw new Error("KIT_MEMBER_NOT_FOUND");
      database.prepare("UPDATE members SET kit_purchased = 1 WHERE id = ?").run(existingMember.id);
      database.prepare("UPDATE payments SET status = 'verified', razorpay_payment_id = ?, verified_at = CURRENT_TIMESTAMP WHERE razorpay_order_id = ?").run(paymentId, orderId);
      const premiumMember = getMemberById(existingMember.id);
      if (!premiumMember) throw new Error("PREMIUM_MEMBER_NOT_FOUND");
      return premiumMember;
    }
    if (payment.purpose.startsWith("boost_")) {
      const existingMember = getMemberByContact(payment.contact);
      if (!existingMember) throw new Error("BOOST_MEMBER_NOT_FOUND");
      const credits = Number(payment.purpose.replace("boost_", ""));
      database.prepare("UPDATE members SET boost_credits = boost_credits + ? WHERE id = ?").run(credits, existingMember.id);
      database.prepare("UPDATE payments SET status = 'verified', razorpay_payment_id = ?, verified_at = CURRENT_TIMESTAMP WHERE razorpay_order_id = ?").run(paymentId, orderId);
      const boostedMember = getMemberById(existingMember.id);
      if (!boostedMember) throw new Error("BOOST_MEMBER_NOT_FOUND");
      return boostedMember;
    }
    const member = createMember({ name: payment.name, contact: payment.contact, city: payment.city });
    database.prepare("UPDATE payments SET status = 'verified', razorpay_payment_id = ?, verified_at = CURRENT_TIMESTAMP WHERE razorpay_order_id = ?").run(paymentId, orderId);
    return member;
  });
  return complete();
}
