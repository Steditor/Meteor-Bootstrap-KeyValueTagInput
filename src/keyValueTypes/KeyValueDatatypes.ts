export interface KeyValueTextDisplay {
    text: string;
}

export interface KeyValueHtmlDisplay {
    html: string;
}

export type KeyValueDisplay = KeyValueTextDisplay | KeyValueHtmlDisplay;

export interface KeyValueSuggestion {
    display: KeyValueDisplay;
    match?: string;
    matchHtml?: string;
    value: string;
    extra?: string;
    fallback?: boolean;
}
