import { openDB, type IDBPDatabase } from "idb";

interface QueuedReport {
  id: string;
  payload: Record<string, unknown>;
  status: "pending" | "sent" | "failed";
  attempts: number;
  created_at: string;
}

const DB_NAME = "signal-offline";
const STORE = "reports";

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    },
  });
}

export async function queueReport(payload: Record<string, unknown>): Promise<void> {
  const db = await getDB();
  const id = payload.client_submission_id as string;
  await db.put(STORE, {
    id,
    payload,
    status: "pending",
    attempts: 0,
    created_at: new Date().toISOString(),
  });
}

export async function getPending(): Promise<QueuedReport[]> {
  const db = await getDB();
  const all = await db.getAll(STORE);
  return all.filter((r: QueuedReport) => r.status === "pending");
}

export async function markSent(id: string): Promise<void> {
  const db = await getDB();
  const record = await db.get(STORE, id);
  if (record) {
    record.status = "sent";
    await db.put(STORE, record);
  }
}

export async function markFailed(id: string): Promise<void> {
  const db = await getDB();
  const record = await db.get(STORE, id);
  if (record) {
    record.attempts += 1;
    record.status = record.attempts >= 5 ? "failed" : "pending";
    await db.put(STORE, record);
  }
}

export async function getQueueCount(): Promise<number> {
  const pending = await getPending();
  return pending.length;
}