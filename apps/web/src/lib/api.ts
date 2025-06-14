export const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
}

export const apiRequest = async (endpoint: string, options?: RequestInit) => {
  const url = `${getApiUrl()}${endpoint}`
  return fetch(url, options)
}