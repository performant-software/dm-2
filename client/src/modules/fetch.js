export default async function fetchWithTimeout(resource, options = {}) {
  const { retryDelay = 8000 } = options;
  const timeout = retryDelay + 100;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);

  return response;
}
