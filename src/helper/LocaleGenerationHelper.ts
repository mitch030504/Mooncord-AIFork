import {existsSync, readFileSync, writeFileSync} from 'fs';
import {resolve} from 'path';

const localeDir = '../../locales/'
const args = process.argv.slice(2)
const targetLocaleName = args[0]

if (!targetLocaleName) {
    console.error("missing target locale name argument")
    process.exit(1)
}

const sourceLocaleRaw = readFileSync(resolve(__dirname, `${localeDir}en.json`)).toString()
const sourceLocale = JSON.parse(sourceLocaleRaw) as Record<string, any>
let targetLocale: Record<string, any> = {}

if (existsSync(resolve(__dirname, `${localeDir}${targetLocaleName}.json`))) {
    const targetLocaleRaw = readFileSync(resolve(__dirname, `${localeDir}${targetLocaleName}.json`)).toString()
    targetLocale = JSON.parse(targetLocaleRaw) as Record<string, any>
}

mergeDeep(sourceLocale, targetLocale)

writeFileSync(resolve(__dirname, `${localeDir}${targetLocaleName}.json`), JSON.stringify(sourceLocale, null, 4))

function isObject(item: unknown): item is Record<string, unknown> {
    return (item !== null && item !== undefined && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target: Record<string, any>, ...sources: Record<string, any>[]): Record<string, any> {
    if (!sources.length) {
        return target;
    }
    const source = sources.shift()!;

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, {[key]: {}});
                }
                mergeDeep(target[key] as any, source[key] as any);
            } else {
                Object.assign(target, {[key]: source[key]});
            }
        }
    }

    return mergeDeep(target, ...sources);
}