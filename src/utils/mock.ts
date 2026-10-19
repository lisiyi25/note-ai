/** 模拟网络延迟 */
export function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 包装 Mock 成功响应 */
export async function mockSuccess<T>(data: T, ms = 400): Promise<{ code: number; message: string; data: T }> {
  await delay(ms)
  return { code: 0, message: 'ok', data }
}
