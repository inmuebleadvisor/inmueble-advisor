
import assert from 'assert';
import { cleanNum, cleanPhone, cleanStr, cleanEmail } from './lib/utils/string.utils.js';
import * as adapters from './lib/adapters/index.js';

console.log('🧪 Verifying Utils Consolidation...');

// Test cleanNum
assert.strictEqual(cleanNum('$1,234.56'), 1234.56, 'cleanNum failed currency');
assert.strictEqual(cleanNum('  500 '), 500, 'cleanNum failed whitespace');
assert.strictEqual(cleanNum('NotANumber'), undefined, 'cleanNum failed NaN');

// Test cleanPhone
assert.strictEqual(cleanPhone('(555) 123-4567'), '5551234567', 'cleanPhone failed fmt');

console.log('✅ Utils Verification Passed.');

console.log('🔍 Verifying Adapters Import...');
if (typeof adapters.adaptDesarrollo !== 'function') throw new Error('Adapter export missing');
console.log('✅ Adapters Import Passed.');

console.log('🔍 Verifying Services Syntax...');
try {
    await import('./lib/services/stats.service.js');
    console.log('✅ stats.service.js syntax ok');
    await import('./lib/services/import.service.js');
    console.log('✅ import.service.js syntax ok');
} catch (e) {
    console.error('❌ Service syntax error:', e);
    process.exit(1);
}

console.log('\n✨ All Audit Fixes Verified Successfully.');
