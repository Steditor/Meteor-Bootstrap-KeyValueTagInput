export const compOperators = {
    "<": {
        symbol: "<",
        selector: "$lt",
    },
    ">": {
        symbol: ">",
        selector: "$gt",
    },
    "<=": {
        symbol: "≤",
        selector: "$lte",
    },
    ">=": {
        symbol: "≥",
        selector: "$gte",
    },
    "!=": {
        symbol: "≠",
        selector: "$ne",
    },
    "=": {
        symbol: "=",
        selector: "$eq",
    },
} as const;

export type CompOperator = keyof typeof compOperators;
export type CompOpSymbol = (typeof compOperators)[keyof typeof compOperators]["symbol"];
export type CompOpSelector = (typeof compOperators)[keyof typeof compOperators]["selector"];

export const compOpsAndSymbols: Array<CompOpSymbol | CompOperator> = [ "<", ">", "<=", ">=", "!=", "=", "≤", "≥", "≠" ];

export function compOpToSymbol(op: CompOpSymbol | CompOperator): CompOpSymbol {
    return (compOperators[op as CompOperator] || { symbol: op }).symbol;
}

export function compOpToSelector(op: CompOperator): CompOpSelector {
    return compOperators[op].selector;
}

export const mathOperators = {
    "=": "=",
    "*": "*",
    "/": "÷",
    "+": "+",
    "-": "-",
};
export type MathOperator = keyof typeof mathOperators;
export type MathOpSymbol = (typeof mathOperators)[keyof typeof mathOperators];

export const mathOpsAndSymbols: Array<MathOpSymbol | MathOperator> = [ "=", "*", "/", "+", "-", "÷" ];

export function mathOpToSymbol(op: MathOpSymbol | MathOperator): MathOpSymbol {
    return mathOperators[op as MathOperator] || op;
}
