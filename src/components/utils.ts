import { stripHtml } from "string-strip-html"

export function generateSummary(text: string): string {
    return stripHtml(text).result.substr(0,150)
}