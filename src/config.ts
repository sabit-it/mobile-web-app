const isWeb = typeof document !== 'undefined';
// Web browser → localhost; Android emulator → 10.0.2.2; physical device → machine IP
export const API_BASE_URL = isWeb ? 'http://localhost:8000' : 'http://10.0.2.2:8000';
