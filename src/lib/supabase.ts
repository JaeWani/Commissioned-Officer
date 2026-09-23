const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type PreparedSubmissionResponse = {
  submissionId: string;
  report: {
    storagePath: string;
    signedUploadUrl: string;
    uploadToken: string;
    templateVersion: string;
  };
  result: {
    name: string;
    primaryType: string;
    aptitudeDescription: string;
    scores: Record<string, number>;
    contentVersion: string;
  };
};

function configuredUrl() {
  if (!supabaseUrl || !publishableKey) {
    throw new Error('Supabase 환경 변수를 설정해 주세요. .env.example을 참고하세요.');
  }
  return supabaseUrl;
}

export async function invokeFunction<T>(name: string, body: unknown): Promise<T> {
  const response = await fetch(`${configuredUrl()}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: publishableKey!,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null) as { error?: string } | T | null;
  if (!response.ok) {
    const error = payload && typeof payload === 'object' && 'error' in payload ? payload.error : undefined;
    throw new Error(error ?? '서버 요청을 완료하지 못했습니다.');
  }
  return payload as T;
}

export async function uploadSignedPdf(signedUploadUrl: string, pdf: Blob) {
  const response = await fetch(signedUploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/pdf' },
    body: pdf,
  });
  if (!response.ok) throw new Error('결과 PDF를 업로드하지 못했습니다.');
}

export async function sha256Hex(blob: Blob) {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}
