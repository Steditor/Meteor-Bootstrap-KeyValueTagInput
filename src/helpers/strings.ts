export function escapeRegexChars(text: string): string {
    return text.replace(/[.^$*+\-?()[\]{}\\|]/g, "\\$&");
}
