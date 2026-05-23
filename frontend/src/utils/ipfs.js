/**
 * Convierte una URI ipfs:// a una URL pública accesible via gateway Pinata.
 * Si ya es http(s) o null/undefined, la devuelve sin tocar.
 */
export function resolveImageUri(uri) {
  if (!uri) return null;
  if (uri.startsWith('ipfs://')) {
    return 'https://gateway.pinata.cloud/ipfs/' + uri.slice(7);
  }
  return uri;
}
