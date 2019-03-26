import { escapeRegexChars } from "../helpers/strings";
import { KeyValueDisplay, KeyValueSuggestion, KeyValueType } from "./KeyValueType";

interface RegexKeyValue {
    text: string;
    printRegex?: string;
    regex: string;
    options: string;
}

export default class RegexKeyValueType extends KeyValueType<RegexKeyValue> {
    public static mongoSelectorFor(value: RegexKeyValue) {
        return { $regex: value.regex, $options: value.options };
    }

    public getSuggestions(prefix: string): KeyValueSuggestion[] {
        const display = (val: string) => this.display(this.parseString(val)!);
        return [
            { display: display("abc"), value: "abc", extra: "Einfache Suche" },
            { display: display('"Hallo Welt!"'), value: '"Hallo Welt!"', extra: "\"...\" für Leerzeichen" },
            { display: display("/[a-c0-9]/i"), value: "/[a-c0-9]/i", extra: "RegEx" },
        ];
    }

    public parseString(val: string): RegexKeyValue | undefined {
        const text = val.trim();
        if (text === "") {
            return undefined;
        }

        const match = text.match(/^\/(.*)\/([a-z]*)$/);
        if (match) {
            try {
                // tslint:disable-next-line:no-unused-expression as the expression is used for error checking
                new RegExp(match[1], match[2]);
                return {
                    text,
                    printRegex: jQuery("<div>").text(match[1]).html(), // encode HTML symbols
                    regex: match[1],
                    options: match[2],
                };
            } catch (e) {
                // escape below like non-regex strings
            }
        }

        return {
            text,
            regex: escapeRegexChars(text),
            options: "i", // match case-insensitive by default
        };
    }

    public checkValue(val: any): RegexKeyValue | undefined {
        if (
            typeof val.text === "string"
            && (val.printRegex === undefined || typeof val.printRegex === "string")
            && typeof val.regex === "string"
            && typeof val.options === "string"
        ) {
            return val;
        } else {
            return undefined;
        }
    }

    public display(value: RegexKeyValue): KeyValueDisplay {
        if (value.printRegex) {
            return { html: `<code>/</code>${value.printRegex}<code>/${value.options}</code>` };
        } else {
            return { text: value.text };
        }
    }

    public editText(value: RegexKeyValue): string {
        if (value.text.includes(" ")) {
            return `"${value.text.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
        } else {
            return value.text;
        }
    }
}
