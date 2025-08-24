import js from "@eslint/js"
import prettier from "eslint-plugin-prettier/recommended"
import solid from "eslint-plugin-solid"
import tseslint from "typescript-eslint"

export default tseslint.config(
    {
        ignores: ["dist/", "node_module/", "wailsjs/"],
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    solid.configs["flat/typescript"],
    prettier,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ["*.{json,js,ts}"],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        rules: {
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/consistent-type-definitions": ["error", "type"],
            "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
            "@typescript-eslint/no-misused-promises": "off",
            "@typescript-eslint/no-unsafe-call": "off",
        },
    },
    {
        files: ["*.config.{json,js,ts}"],
        rules: {
            "no-undef": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
        },
    },
)
