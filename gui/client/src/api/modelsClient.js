export async function fetchModels() {
  const res = await fetch("/v1/models");
  if (!res.ok) {
    throw new Error(`Failed to fetch models: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
