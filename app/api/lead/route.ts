export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  try {
    const upstream = await fetch(new URL('/api/lead', process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:8000'), {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') ?? 'application/json',
        ...(request.headers.has('referer') ? { Referer: request.headers.get('referer')! } : {}),
      },
      body: request.body,
      duplex: 'half',
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    } as RequestInit);
    const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    const requestId = upstream.headers.get('x-request-id');
    if (requestId) headers.set('X-Request-ID', requestId);
    return new Response(await upstream.text(), { status: upstream.status, headers });
  } catch {
    return Response.json(
      { ok: false, error: 'Сервис временно недоступен. Повторите отправку через минуту.' },
      { status: 503 },
    );
  }
}
