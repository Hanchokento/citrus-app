export async function readTextFromR2(bucket: R2Bucket, key: string): Promise<string> {
  const object = await bucket.get(key);

  if (!object) {
    throw new Error(`R2 object not found: ${key}`);
  }

  return await object.text();
}
