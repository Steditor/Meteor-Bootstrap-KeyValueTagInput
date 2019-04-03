import { Blaze } from "meteor/blaze";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { Tracker } from "meteor/tracker";
import { escapeRegexChars } from "../helpers/strings";

import { KeyValueSuggestion } from "../keyValueTypes/KeyValueDatatypes";
import { KeyValueEntry } from "../keyValueTypes/KeyValueEntry";
import { KeyValueType } from "../keyValueTypes/KeyValueType";

import { createEntriesFromTypes, KeyValueEntryConstructionData } from "../keyValueTypes/constructionHelpers";
import {
    KeyValueEntriesChangedEvent,
    KeyValueInputMultipleTypesData,
    KeyValueInputTemplateData,
} from "./keyValueInputInterfaces";

function KeyValueInputTemplateData(): KeyValueInputTemplateData {
    return Template.currentData() as KeyValueInputTemplateData;
}

interface KeyValueEntryData {
    index?: number;
    entry: KeyValueEntry<any>;
    default?: boolean;
}

type KeyValueSuggestions = (KeyValueSuggestion[] & { header?: string }) | null;

interface KeyValueInputTemplate extends Blaze.TemplateInstance {
    entries: ReactiveVar<Array<KeyValueEntry<any>>>;
    partialEntry: ReactiveVar<KeyValueEntry<any> | null>;
    defaultEntries: ReactiveVar<Array<KeyValueEntry<any>>>;
    suggestions: ReactiveVar<KeyValueSuggestions>;

    textInput: JQuery;
    element: HTMLDivElement;

    data: KeyValueInputTemplateData;
}

function KeyValueInputTemplate(): KeyValueInputTemplate {
    return Template.instance() as KeyValueInputTemplate;
}

Template.keyValueInput.onCreated(function(this: KeyValueInputTemplate) {
    this.autorun(() => {
        const data = KeyValueInputTemplateData();
        data.kind = data.kind || "multiple";
    });

    this.entries = new ReactiveVar(createEntries(this.data.entries, this));
    this.partialEntry = new ReactiveVar(null);
    resetPartialEntry(this);
    this.defaultEntries = new ReactiveVar([]);
    this.autorun(() => createDefaultEntries(this));
    this.suggestions = new ReactiveVar(null);
    this.autorun(() => buildSuggestions(this));
});

Template.keyValueInput.onRendered(function(this: KeyValueInputTemplate) {
    this.textInput = this.$(".key-value-text-input");
    this.element = this.$(".key-value-input")[0];
});

Template.keyValueInput.helpers({
    isSingle(): boolean {
        return KeyValueInputTemplate().data.kind === "single";
    },
    defaultEntries(): Array<KeyValueEntry<any>> {
        return KeyValueInputTemplate().defaultEntries.get();
    },
    entries(): Array<KeyValueEntry<any>> {
        return KeyValueInputTemplate().entries.get();
    },
    partialEntry(): KeyValueEntry<any> | null {
        return KeyValueInputTemplate().partialEntry.get();
    },
    availableTypes(): string {
        const data = KeyValueInputTemplateData();
        return data.kind === "multiple" ? data.types.map((t) => t.label).join(": / ") + ":" : "";
    },
    suggestions(): KeyValueSuggestion[] | null {
        return KeyValueInputTemplate().suggestions.get();
    },
});

Template.keyValueInput.events({
    "click .key-value-input"(event: MouseEvent, templateInstance: KeyValueInputTemplate) {
        moveFocus(event, templateInstance, "text-input");
    },

    "input .key-value-input, focus .key-value-input"(event: Event, templateInstance: KeyValueInputTemplate) {
        buildSuggestions(templateInstance);
    },

    "keydown .key-value-text-input"(event: KeyboardEvent, templateInstance: KeyValueInputTemplate) {
        const key = event.key;
        const target = event.target as HTMLInputElement;

        if (key === ":") {
            if (addPartialEntry(templateInstance.textInput.val() as string, templateInstance)) {
                event.preventDefault();
                templateInstance.textInput.val("");
                buildSuggestions(templateInstance);
            }
        } else if (key === "Enter" || key === "Tab") {
            if (templateInstance.textInput.val() !== "" ||
                (templateInstance.partialEntry.get() && templateInstance.data.kind !== "single")) {
                event.preventDefault();
                if (completeEntry(templateInstance.textInput.val() as string, templateInstance)) {
                    templateInstance.textInput.val("");
                    buildSuggestions(templateInstance);
                }
            }
        } else if (key === "Backspace" && target.selectionStart === 0 && target.selectionEnd === 0) {
            const prependText = editLastEntry(templateInstance);
            templateInstance.textInput.val(prependText + templateInstance.textInput.val());
            target.setSelectionRange(prependText.length, prependText.length);
            buildSuggestions(templateInstance);
            event.preventDefault();
        } else if (key === "Escape") {
            templateInstance.suggestions.set(null);
        }
    },
    "keyup .key-value-text-input"(event: KeyboardEvent, templateInstance: KeyValueInputTemplate) {
        const key = event.key;
        const target = event.target as HTMLInputElement;

        if (key === " ") {
            const inputValue = templateInstance.textInput.val() as string;
            const cursorPos = target.selectionStart!;
            const value = inputValue.trim();

            if (cursorPos === inputValue.length) {
                if (!value.startsWith("\"") || value.match(/^"(?:\\.|[^\\])*"$/)) {
                    if (completeEntry(value, templateInstance)) {
                        templateInstance.textInput.val("");
                        buildSuggestions(templateInstance);
                    }
                }
            } else if (!value.startsWith("\"")) {
                // shift cursor due to trimmed whitespace and escaped characters in front of the cursor position
                const shiftCursor = inputValue.length - inputValue.trimLeft().length + 1
                    + (inputValue.substring(0, cursorPos).match(/["\\]/g) || []).length;
                // escape \ and "
                templateInstance.textInput.val(`"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`);
                target.setSelectionRange(cursorPos + shiftCursor, cursorPos + shiftCursor);
                buildSuggestions(templateInstance);
            }
        } else if (key === "ArrowDown" || (key === "ArrowLeft" && target.selectionEnd === 0)) {
            event.preventDefault();
            moveFocus(event, templateInstance, key);
        }
    },

    "click .key-value-suggestion"(event: MouseEvent, templateInstance: KeyValueInputTemplate) {
        event.preventDefault();
        if ((!templateInstance.partialEntry.get() && addPartialEntry(this.suggestion.value, templateInstance))
            || (completeEntry(this.suggestion.value, templateInstance))) {
            templateInstance.textInput.val("");
            buildSuggestions(templateInstance);
        }
    },
    "keydown .key-value-suggestion"(event: KeyboardEvent, templateInstance: KeyValueInputTemplate) {
        const key = event.key;
        const target = event.currentTarget as HTMLElement;

        if ([ "ArrowUp", "ArrowDown", "Home", "End" ].includes(key)) {
            event.preventDefault();
            event.stopPropagation();
            moveFocus(event, templateInstance, key as ("ArrowUp" | "ArrowDown" | "Home" | "End"));
        } else if ([ "Enter", ":", " " ].includes(key)) {
            event.preventDefault();
            templateInstance.$(target).click();
        } else if (key.length === 1 || [ "Backspace", "Delete", "ArrowLeft", "ArrowRight" ].includes(key)) {
            moveFocus(event, templateInstance, "text-input");
        }
    },

    "keydown .key-value-entry"(event: KeyboardEvent, templateInstance: KeyValueInputTemplate) {
        const key = event.key;
        if ([ "ArrowLeft", "ArrowRight" ].includes(key)) {
            moveFocus(event, templateInstance, key as ("ArrowLeft" | "ArrowRight"));
        }
    },
    "keyup .key-value-entry"(this: KeyValueEntryData, event: KeyboardEvent, templateInstance: KeyValueInputTemplate) {
        const key = event.key;
        if (key === "Backspace" || key === "Delete") {
            event.preventDefault();
            if (!this.entry.isPartial) {
                removeEntry(this.entry, templateInstance);
                moveFocus(event, templateInstance, this.index!); // index should always be set for non-partial entries
            } else if (templateInstance.data.kind !== "single") { // single type always needs a partial entry
                templateInstance.partialEntry.set(null);
                moveFocus(event, templateInstance, "ArrowRight");
            }
        }
    },
    "click .key-value-entry"(event: MouseEvent) {
        event.stopPropagation();
        (event.currentTarget as HTMLElement).focus();
    },
    "click .key-value-entry .fa-times"(
        this: KeyValueEntryData, event: MouseEvent, templateInstance: KeyValueInputTemplate) {
        event.stopPropagation();
        removeEntry(this.entry, templateInstance);
        moveFocus(event, templateInstance, "text-input");
    },
    "click .fa-times.remove-all"(event: MouseEvent, templateInstance: KeyValueInputTemplate) {
        event.stopPropagation();
        removeAllEntries(templateInstance);
        moveFocus(event, templateInstance, "text-input");
    },
    "clearEntries"(event: CustomEvent, templateInstance: KeyValueInputTemplate) {
        removeAllEntries(templateInstance);
    },
});

function moveFocus(event: Event, templateInstance: KeyValueInputTemplate,
                   to: "text-input" | "ArrowLeft" | "ArrowRight" | "ArrowDown" | "ArrowUp" | "End" | "Home" | number) {
    // Set focus
    if (to === "text-input") {
        templateInstance.textInput[0].focus();
        return;
    } else if (typeof to === "number") { // entry
        Tracker.afterFlush(() => {
            const siblings = templateInstance.$(".key-value-entry, .key-value-text-input");
            if (siblings[to + templateInstance.defaultEntries.get().length]) {
                siblings[to + templateInstance.defaultEntries.get().length].focus();
            }
        });
        return;
    }

    // Move Focus
    let target;
    const currentTarget = event.currentTarget as HTMLElement;
    if (to === "ArrowDown") { // suggestion or text input
        if (currentTarget.classList.contains("key-value-suggestion")) {
            target = templateInstance.$(currentTarget).next(".key-value-suggestion");
        } else {
            target = templateInstance.$(".key-value-suggestion");
        }
    } else if (to === "ArrowUp") { // suggestion
        target = templateInstance.$(currentTarget).prev(".key-value-suggestion");
        if (!target[0]) {
            target = templateInstance.textInput;
        }
    } else if (to === "End") { // suggestion
        target = templateInstance.$(".key-value-suggestion").filter(":last");
    } else if (to === "Home") { // suggestion
        target = templateInstance.$(".key-value-suggestion");
    } else if (to === "ArrowRight") { // entry
        target = templateInstance.$(currentTarget).next(".key-value-entry");
        if (!target[0]) {
            target = templateInstance.textInput;
        }
    } else if (to === "ArrowLeft") { // entry or text input
        if (currentTarget.classList.contains("key-value-entry")) {
            target = templateInstance.$(currentTarget).prev(".key-value-entry");
        } else {
            target = templateInstance.$(".key-value-entry").filter(":last");
        }
    }
    if (target[0]) {
        target[0].focus();
    }
}

function resetPartialEntry(templateInstance: KeyValueInputTemplate) {
    if (templateInstance.data.kind === "single") {
        templateInstance.partialEntry.set(templateInstance.data.type.createPartialEntry());
    } else {
        templateInstance.partialEntry.set(null);
    }
}

function addPartialEntry(val: string, templateInstance: KeyValueInputTemplate) {
    if (templateInstance.partialEntry.get() || templateInstance.data.kind === "single") {
        return false;
    }

    const typeName = val.trim().toLowerCase();

    for (const type of templateInstance.data.types) {
        const entry = type.tryCreatePartialEntry(typeName);
        if (entry) {
            templateInstance.partialEntry.set(entry);
            return true;
        }
    }
    return false;
}

function getFallbackType(templateInstance: KeyValueInputTemplate): KeyValueType<any> | undefined {
    if (templateInstance.data.kind === "multiple" && templateInstance.data.fallbackType !== undefined) {
        return templateInstance.data.types[templateInstance.data.fallbackType];
    } else {
        return undefined;
    }
}

function completeEntry(val: string, templateInstance: KeyValueInputTemplate) {
    const partialEntry = templateInstance.partialEntry.get();
    const fallbackType = getFallbackType(templateInstance);

    let trimmedValue = val.trim();
    if (trimmedValue.startsWith("\"")) {
        // remove leading and possible trailing ", then replace escaped characters
        trimmedValue = trimmedValue.replace(/^"((?:\\.|[^\\])*?)"?$/g, "$1").replace(/\\(.)/g, "$1").trim();
    }

    let newEntry: KeyValueEntry<any> | undefined;
    if (partialEntry) {
        newEntry = partialEntry;
        if (!newEntry.set(trimmedValue)) {
            return false;
        }
        resetPartialEntry(templateInstance);
    } else {
        if (fallbackType) {
            newEntry = fallbackType.tryCreateFullEntry(trimmedValue);
        }
        if (!newEntry) {
            // if nothing worked out, try to create a partial entry from the input
            return addPartialEntry(trimmedValue, templateInstance);
        }
    }

    const entries = templateInstance.entries.get();
    if (entries.some((e) => e.equals(newEntry!))) {
        return true;
    }
    entries.push(newEntry);

    templateInstance.entries.dep.changed();
    emitChange(templateInstance);
    return true;
}

function createDefaultEntries(templateInstance: KeyValueInputTemplate) {
    templateInstance.defaultEntries.set(
        createEntries(KeyValueInputTemplateData().defaultEntries, templateInstance)
        .map((entry) => { entry.isDefault = true; return entry; }),
    );
}

function createEntries(entries: KeyValueEntryConstructionData[] | undefined, templateInstance: KeyValueInputTemplate)
    : Array<KeyValueEntry<any>> {
    const types = templateInstance.data.kind === "single" ?
        [ templateInstance.data.type ] : templateInstance.data.types;
    return createEntriesFromTypes(entries || [], types);
}

function editLastEntry(templateInstance: KeyValueInputTemplate): string {
    if (templateInstance.data.kind !== "single") { // cannot edit partial entry of single mode input
        const partialEntry = templateInstance.partialEntry.get();
        if (partialEntry) {
            templateInstance.partialEntry.set(null);
            return partialEntry.label;
        }
    }

    const lastEntry = templateInstance.entries.get().splice(-1, 1)[0];
    if (lastEntry) {
        templateInstance.entries.dep.changed();

        const editValue = lastEntry.editText || "";
        lastEntry.set(undefined);
        templateInstance.partialEntry.set(lastEntry);

        emitChange(templateInstance);
        return editValue;
    }

    return "";
}

function removeEntry(entry: KeyValueEntry<any>, templateInstance: KeyValueInputTemplate) {
    const filtered = templateInstance.entries.get().filter((e) => !e.equals(entry));
    templateInstance.entries.set(filtered);
    emitChange(templateInstance);
}

function removeAllEntries(templateInstance: KeyValueInputTemplate) {
    templateInstance.entries.set([]);
    resetPartialEntry(templateInstance);
    templateInstance.textInput.val("");
    emitChange(templateInstance);
}

function emitChange(templateInstance: KeyValueInputTemplate) {
    Tracker.flush();
    if (templateInstance.element) {
        const event: KeyValueEntriesChangedEvent = new CustomEvent(
            "keyValueEntriesChanged",
            { detail: templateInstance.entries.get() },
        );
        Tracker.afterFlush(() => window.setTimeout(
            () => templateInstance.element.dispatchEvent(event),
            100,
        )); // make sure keyValueInput stays responsive; apply changes a little later
    }
}

function buildSuggestions(templateInstance: KeyValueInputTemplate) {
    const partialEntry = templateInstance.partialEntry.get();
    const inputValue = templateInstance.textInput ? (templateInstance.textInput.val() as string).trim() : "";
    let suggestions: KeyValueSuggestions = null;

    if (partialEntry) {
        const entrySuggestions = partialEntry.getSuggestions(inputValue);
        const parsed = partialEntry.parse(inputValue);
        if (parsed !== undefined) {
            entrySuggestions.push({
                display: partialEntry.type.display(parsed),
                value: partialEntry.type.editText(parsed),
                fallback: true,
            });
        }
        if (entrySuggestions && entrySuggestions.length > 0) {
            suggestions = entrySuggestions;
        }
    } else {
        const types = (templateInstance.data as KeyValueInputMultipleTypesData).types;
        if (inputValue === "") {
            suggestions = types.map((t) => ({ display: { text: t.label }, value: t.id }));
        } else {
            const matchingTypes = types
                .map((t) => ({ display: { text: t.label }, match: t.findAlias(inputValue), value: t.id }))
                .filter((o) => o.match);
            if (matchingTypes.length > 0) {
                suggestions = matchingTypes;
            }

            const fallbackType = getFallbackType(templateInstance);
            if (fallbackType) {
                const fallbackSuggestion = {
                    display: { text: fallbackType.label + ": " + inputValue },
                    value: inputValue,
                    fallback: true,
                };
                if (!suggestions) {
                    suggestions = [];
                }
                suggestions.push(fallbackSuggestion);
            }
        }
        if (suggestions) {
            suggestions.header = "Mit <kbd>:</kbd> bestätigen oder aus Liste wählen.";
        }
    }
    highlightMatches(suggestions, inputValue);
    templateInstance.suggestions.set(suggestions);
}

function highlightMatches(suggestions: KeyValueSuggestions, substring: string) {
    if (!suggestions) { return; }

    const escaped = escapeRegexChars(substring);
    for (const suggestion of suggestions) {
        if (suggestion.match) {
            suggestion.matchHtml = suggestion.match.replace(new RegExp(escaped, "ig"), "<b>$&</b>");
        }
    }
}
