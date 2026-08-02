import { describe, it, expect } from 'vitest';
import { findIconDefinition } from '@fortawesome/fontawesome-svg-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Registers every icon via library.add() as a side effect.
import '../icons/fontawesome.js';

// Regression guard for a recurring bug: icons get used in JSX before being
// registered in src/icons/fontawesome.js, which fails silently (blank space,
// no console error a casual click-through would notice). This has happened
// twice already (circle-exclamation/lock in Stage C, chalkboard-user/
// paper-plane/robot/file-lines found during the Stage E visual audit).
// Rather than trust manual review to catch it a third time, statically scan
// every FontAwesomeIcon usage in src/components and assert it resolves.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsDir = path.resolve(__dirname, '../components');

function collectSourceFiles(dir) {
    let files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(collectSourceFiles(full));
        } else if (/\.jsx?$/.test(entry.name) && !entry.name.includes('.test.')) {
            files.push(full);
        }
    }
    return files;
}

// Covers: icon="name", icon={"name"}, icon: 'name' (data-driven tab/step
// arrays), and the ["far", "name"] prefixed array form. Deliberately does
// NOT resolve dynamic references like icon={tab.icon} or icon={step.icon}
// -- the literal string those point to is always defined elsewhere in the
// same file (the data array itself), which this already scans.
function extractIconRefs(source) {
    const refs = [];
    const simple = /icon=\{?['"]([a-zA-Z0-9-]+)['"]/g;
    const objectProp = /icon:\s*['"]([a-zA-Z0-9-]+)['"]/g;
    const prefixed = /icon=\{\["(fa[a-z]*)",\s*"([a-zA-Z0-9-]+)"\]\}/g;
    let m;
    while ((m = simple.exec(source))) refs.push({ prefix: 'fas', name: m[1] });
    while ((m = objectProp.exec(source))) refs.push({ prefix: 'fas', name: m[1] });
    while ((m = prefixed.exec(source))) refs.push({ prefix: m[1], name: m[2] });
    return refs;
}

describe('FontAwesome icon registry', () => {
    it('has every icon referenced in src/components registered in src/icons/fontawesome.js', () => {
        const files = collectSourceFiles(componentsDir);
        const missing = new Set();

        for (const file of files) {
            const source = fs.readFileSync(file, 'utf8');
            for (const { prefix, name } of extractIconRefs(source)) {
                if (!findIconDefinition({ prefix, iconName: name })) {
                    missing.add(`${prefix}/${name} (in ${path.relative(componentsDir, file)})`);
                }
            }
        }

        expect(Array.from(missing)).toEqual([]);
    });
});
