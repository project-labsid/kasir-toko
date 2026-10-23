import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePosTotals, formatRupiah, assertTenantMatch } from './pos-calculations';

test('calculatePosTotals returns error for empty cart', () => {
  const result = calculatePosTotals([]);
  assert.equal(result.isValid, false);
  assert.equal(result.error, 'Keranjang belanja kosong');
});

test('calculatePosTotals calculates subtotal, discount, and tax accurately', () => {
  const items = [
    {
      productId: 'p1',
      name: 'Kopi Robusta 250g',
      sku: 'KOP-01',
      unitPrice: 25000,
      costPrice: 18000,
      quantity: 2,
      currentStock: 10
    },
    {
      productId: 'p2',
      name: 'Gula Pasir 1kg',
      sku: 'GUL-01',
      unitPrice: 15000,
      costPrice: 12000,
      quantity: 1,
      currentStock: 50
    }
  ];

  // Subtotal = (25000 * 2) + (15000 * 1) = 65000
  // Discount 10% = 6500
  // Taxable = 58500
  // Tax 11% (PPN) = 6435
  // Total = 64935
  // Amount paid = 70000 -> Change due = 5065
  const result = calculatePosTotals(items, 10, 11, 70000);
  assert.equal(result.isValid, true);
  assert.equal(result.subtotal, 65000);
  assert.equal(result.discountAmount, 6500);
  assert.equal(result.taxableAmount, 58500);
  assert.equal(result.taxAmount, 6435);
  assert.equal(result.totalAmount, 64935);
  assert.equal(result.changeDue, 5065);
});

test('calculatePosTotals rejects when quantity exceeds available stock', () => {
  const items = [
    {
      productId: 'p1',
      name: 'Beras Premium 5kg',
      sku: 'BER-01',
      unitPrice: 75000,
      costPrice: 65000,
      quantity: 5,
      currentStock: 3 // Only 3 in stock
    }
  ];

  const result = calculatePosTotals(items, 0, 0, 400000);
  assert.equal(result.isValid, false);
  assert.match(result.error || '', /tidak mencukupi/);
});

test('assertTenantMatch rejects mismatched organization tenants', () => {
  assert.equal(assertTenantMatch('org-alpha-123', 'org-alpha-123'), true);
  assert.equal(assertTenantMatch('org-alpha-123', 'org-beta-456'), false);
  assert.equal(assertTenantMatch('', 'org-beta-456'), false);
});

test('formatRupiah formats Indonesian currency format', () => {
  const formatted = formatRupiah(50000);
  assert.ok(formatted.includes('50.000') || formatted.includes('50,000') || formatted.includes('Rp'));
});
