export type DBUser = { email: string; name?: string; avatar?: string; password?: string };

export async function saveUserToDatabase(user: DBUser) {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  return res.ok;
}

export async function getUserFromDatabase(email: string): Promise<DBUser | null> {
  const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.user ?? null;
}

export async function addScanRecord(payload: {
  email: string;
  productName?: string;
  identifiedName: string;
  status?: string;
  confidence?: number;
  image?: string;
}) {
  await fetch("/api/scans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

