function safeGetClientIp(req) {
  try {
    const xf = req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip']);
    if (xf) return Array.isArray(xf) ? xf[0] : String(xf).split(',')[0].trim();
    return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
  } catch (_) {
    return 'unknown';
  }
}

function logError(req, error, context = 'unknown', extra = {}) {
  const timestamp = new Date().toISOString();
  const method = (req && req.method) || 'UNKNOWN';
  const url = (req && req.url) || 'UNKNOWN';
  const ip = safeGetClientIp(req);

  const base = {
    timestamp,
    level: 'error',
    context,
    request: { method, url, ip },
    error: {
      name: error && error.name,
      message: error && error.message,
      stack: error && error.stack,
    },
  };

  const payload = { ...base, ...({ extra } || {}) };
  try {
    // 문자열화 실패를 피하기 위해 안전 변환
    // 민감 정보는 넣지 않도록 extra 구성 시 주의
    console.error('[API_ERROR]', JSON.stringify(payload));
  } catch (_) {
    console.error('[API_ERROR]', base, extra);
  }
}

module.exports = { logError };

