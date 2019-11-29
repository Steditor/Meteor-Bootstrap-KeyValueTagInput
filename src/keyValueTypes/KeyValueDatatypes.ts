export interface KeyValueTextDisplay {
    text: string;
}

export interface KeyValueHtmlDisplay {
    html: string;
}

export interface KeyValueTemplateDisplay {
    template: string;
    data: object;
}

export type KeyValueDisplay = KeyValueTextDisplay | KeyValueHtmlDisplay | KeyValueTemplateDisplay;

export interface KeyValueSuggestion {
    display: KeyValueDisplay;
    match?: string;
    matchHtml?: string;
    value: string;
    extra?: string;
    fallback?: boolean;
}
