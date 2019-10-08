import externalGlobals from "rollup-plugin-external-globals";
import resolve from "rollup-plugin-node-resolve";
import copy from "rollup-plugin-copy"

module.exports = [
    {
        input: "src/main.js",
        external: [
            "meteor/meteor",
            "moment",
        ],
        output: {
            file: "dist/main.js",
            format: "cjs",
        },
        plugins: [
            resolve(),
            externalGlobals({
                "meteor/meteor": "Package.meteor",
            })
        ]
    },{
        input: "src/keyValueInput/keyValueInput.js",
        external: [
            "meteor/blaze",
            "meteor/reactive-var",
            "meteor/templating",
            "meteor/tracker",
            "moment",
        ],
        output: {
            file: "dist/keyValueInput.js",
            format: "cjs",
        },
        plugins: [
            resolve(),
            copy({
                targets: [{
                    src: "src/keyValueInput/keyValueInput.html",
                    dest: "dist",
                }, {
                    src: "src/keyValueInput/keyValueInput.css",
                    dest: "dist",
                } ],
            }),
        ]
    }
];
