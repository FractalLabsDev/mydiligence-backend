export function wrap(data: any, message?: string) {
  return { success: true, data, message };
}

export function wrapMessage(message: string) {
  return { success: true, data: null, message };
}

export function wrapErrorMessage(message: string) {
  return { success: false, data: null, message };
}
