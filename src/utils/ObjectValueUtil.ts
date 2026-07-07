export function getObjectValue<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

export function getValueByPath(obj: any, path: string): any {
    if (obj === null || obj === undefined) return undefined
    return path.split('.').reduce<any>((acc, key) => (acc === undefined || acc === null ? undefined : acc[key]), obj)
}