/**
 * Runs on the files you're committing (git hook: .husky/pre-commit).
 * Each file is formatted and linted by one task, so those never run on it at once; the
 * translation and secret checks only read files.
 */
export default {
	'*.{js,ts,svelte}': ['prettier --write', 'eslint --fix --no-warn-ignored --max-warnings=0'],
	'*.{json,md,yml,yaml,css,html}': 'prettier --write',
	// Any change to a language file: every language must still have every sentence.
	'packages/core/src/messages/dict/*.ts': () => 'node packages/core/scripts/check-translations.ts',
	// Never commit a real key or password by accident.
	'*': 'node scripts/hooks/no-secrets.js'
};
