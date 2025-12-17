# Decision: Build Script Script Injection Method

## Context
During the implementation of the score system, the string literal `$` (dollar sign) was introduced into the game's source code (`src/game/state.js`). The build script (`build.js`) used `String.prototype.replace(pattern, replacement)` to inject the source code into the HTML template.

This caused a critical build failure where the injected JavaScript was mangled. Specifically, the sequence `$'` (dollar sign followed by a single quote) in the source code was interpreted by the `replace` method as a special replacement pattern meaning "insert the portion of the string that follows the matched substring". This resulted in the rest of the HTML template (closing script and body tags) being inserted into the middle of the game code, breaking the script block.

## Decision
We have modified `build.js` to use a **replacer function** instead of a replacement string.

**Old (Unsafe):**
```javascript
html = html.replace('// %%SCRIPTS%%', fullScript);
```

**New (Safe):**
```javascript
html = html.replace('// %%SCRIPTS%%', () => fullScript);
```

## Consequences
- **Positive:** The build process is now robust against any special characters (like `$`) appearing in the source code. Developers do not need to escape dollar signs or avoid regex-like patterns in string literals.
- **Negative:** None. This is the standard, safe way to perform literal string replacement in JavaScript.

## Verification
- verified that `node build.js` correctly generates `dist/tablequest.html`.
- verified that `dist/tablequest.html` starts with the correct script headers and ends with a valid `</script>` tag.
