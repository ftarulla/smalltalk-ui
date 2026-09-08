/**
 * Smalltalk Syntax Highlighter
 * Tokenizes and highlights Smalltalk code according to standard Smalltalk / Cuis lexical rules.
 */

class SmalltalkSyntaxHighlighter {
    /**
     * Highlights code string and returns HTML string with syntax span tags
     * @param {string} code
     * @returns {string} HTML string
     */
    static highlight(code) {
        if (!code) return '';

        let result = '';
        let i = 0;
        const len = code.length;

        const escapeHtml = (str) => {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        while (i < len) {
            const ch = code[i];

            // 1. Comments: "..."
            if (ch === '"') {
                let comment = '"';
                i++;
                while (i < len && code[i] !== '"') {
                    comment += code[i];
                    i++;
                }
                if (i < len && code[i] === '"') {
                    comment += '"';
                    i++;
                }
                result += `<span class="st-comment">${escapeHtml(comment)}</span>`;
                continue;
            }

            // 2. Strings: '...' ('' is escaped quote)
            if (ch === "'") {
                let str = "'";
                i++;
                while (i < len) {
                    if (code[i] === "'") {
                        if (i + 1 < len && code[i + 1] === "'") {
                            str += "''";
                            i += 2;
                        } else {
                            str += "'";
                            i++;
                            break;
                        }
                    } else {
                        str += code[i];
                        i++;
                    }
                }
                result += `<span class="st-string">${escapeHtml(str)}</span>`;
                continue;
            }

            // 3. Characters: $x
            if (ch === '$' && i + 1 < len) {
                const charToken = '$' + code[i + 1];
                i += 2;
                result += `<span class="st-character">${escapeHtml(charToken)}</span>`;
                continue;
            }

            // 4. Symbols: #symbol or #'string symbol'
            if (ch === '#' && i + 1 < len) {
                if (code[i + 1] === "'") {
                    let sym = "#'";
                    i += 2;
                    while (i < len && code[i] !== "'") {
                        sym += code[i];
                        i++;
                    }
                    if (i < len && code[i] === "'") {
                        sym += "'";
                        i++;
                    }
                    result += `<span class="st-symbol">${escapeHtml(sym)}</span>`;
                    continue;
                } else if (/[A-Za-z0-9_:]/.test(code[i + 1])) {
                    let sym = '#';
                    i++;
                    while (i < len && /[A-Za-z0-9_:]/.test(code[i])) {
                        sym += code[i];
                        i++;
                    }
                    result += `<span class="st-symbol">${escapeHtml(sym)}</span>`;
                    continue;
                } else if (/[+\-*/\\~<>=@,%|&?!]/.test(code[i + 1])) {
                    let sym = '#' + code[i + 1];
                    i += 2;
                    result += `<span class="st-symbol">${escapeHtml(sym)}</span>`;
                    continue;
                }
            }

            // 5. Block arguments: :argName
            if (ch === ':' && i + 1 < len && /[A-Za-z_]/.test(code[i + 1])) {
                let blockArg = ':';
                i++;
                while (i < len && /[A-Za-z0-9_]/.test(code[i])) {
                    blockArg += code[i];
                    i++;
                }
                result += `<span class="st-block-arg">${escapeHtml(blockArg)}</span>`;
                continue;
            }

            // 6. Assignments: := or _
            if ((ch === ':' && i + 1 < len && code[i + 1] === '=') || ch === '_') {
                const assign = (ch === ':') ? ':=' : '_';
                i += (ch === ':') ? 2 : 1;
                result += `<span class="st-assignment">${assign}</span>`;
                continue;
            }

            // 7. Returns: ^
            if (ch === '^') {
                i++;
                result += `<span class="st-return">^</span>`;
                continue;
            }

            // 8. Temporaries: | var1 var2 |
            // Handled when reading identifier bars or standalone pipes

            // 9. Numbers: 123, -45, 16rFF, 3.14, etc.
            if (/[0-9]/.test(ch) || ((ch === '-' || ch === '+') && i + 1 < len && /[0-9]/.test(code[i + 1]) && (i === 0 || /[\s(\[{,;]/.test(code[i - 1])))) {
                let num = '';
                if (ch === '-' || ch === '+') {
                    num += ch;
                    i++;
                }
                while (i < len && /[0-9A-Za-z._]/.test(code[i])) {
                    // prevent eating selector in '1 to: 10'
                    if (code[i] === ':' && !/[rR]/.test(num)) break;
                    num += code[i];
                    i++;
                }
                result += `<span class="st-number">${escapeHtml(num)}</span>`;
                continue;
            }

            // 10. Identifiers / Keywords
            if (/[A-Za-z_]/.test(ch)) {
                let word = '';
                while (i < len && /[A-Za-z0-9_:]/.test(code[i])) {
                    word += code[i];
                    if (code[i] === ':') {
                        i++;
                        break;
                    }
                    i++;
                }

                // Check pseudo variables
                if (['self', 'super', 'thisContext', 'true', 'false', 'nil'].includes(word)) {
                    result += `<span class="st-pseudo">${escapeHtml(word)}</span>`;
                } else if (word.endsWith(':')) {
                    // Keyword selector / message part
                    result += `<span class="st-keyword">${escapeHtml(word)}</span>`;
                } else if (/^[A-Z]/.test(word)) {
                    // Global / Class name (Capitalized)
                    result += `<span class="st-class-name">${escapeHtml(word)}</span>`;
                } else {
                    // Local variable / unary selector
                    result += `<span class="st-identifier">${escapeHtml(word)}</span>`;
                }
                continue;
            }

            // 11. Operators / Punctuation
            if (/[+\-*/\\~<>=@,%|&?!]/.test(ch)) {
                let op = '';
                while (i < len && /[+\-*/\\~<>=@,%|&?!]/.test(code[i])) {
                    op += code[i];
                    i++;
                }
                result += `<span class="st-binary-op">${escapeHtml(op)}</span>`;
                continue;
            }

            // 12. Brackets / Blocks
            if (ch === '[' || ch === ']') {
                result += `<span class="st-block-bracket">${escapeHtml(ch)}</span>`;
                i++;
                continue;
            }

            // 13. Parentheses / Braces
            if (ch === '(' || ch === ')' || ch === '{' || ch === '}') {
                result += `<span class="st-paren">${escapeHtml(ch)}</span>`;
                i++;
                continue;
            }

            // Default: Whitespace or other characters
            result += escapeHtml(ch);
            i++;
        }

        return result;
    }
}

window.SmalltalkSyntaxHighlighter = SmalltalkSyntaxHighlighter;
