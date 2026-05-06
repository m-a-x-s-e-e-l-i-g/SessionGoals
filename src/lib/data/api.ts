type ActionResponse<T> = { ok: true; data: T } | { ok: false; error: string };

export async function runDataAction<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/data', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  const body = (await response.json()) as ActionResponse<T>;
  if (!response.ok || !body.ok) {
    throw new Error(body.ok ? 'Request failed' : body.error);
  }

  return body.data;
}
