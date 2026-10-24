import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Evaluate the shipped TypeScript modules, replacing only the HTTP transport boundary.
async function loadModule(path, apiClient) {
  const source = await readFile(new URL(`../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } });
  const context = vm.createContext({ crypto: globalThis.crypto, File: globalThis.File, FormData: globalThis.FormData });
  const module = new vm.SourceTextModule(output.outputText, { context });
  await module.link(async (specifier) => {
    assert.ok(specifier.endsWith("/apiClient"), `Unexpected runtime dependency: ${specifier}`);
    return new vm.SyntheticModule(["apiClient"], function () { this.setExport("apiClient", apiClient); }, { context });
  });
  await module.evaluate();
  return module.namespace;
}
const plain = (value) => JSON.parse(JSON.stringify(value));
const quantity = await loadModule("modules/ownership/quantity.ts");
const retry = await loadModule("services/http/idempotency.ts");

test("decimal quantities retain all digits and three-place normalization", () => {
  const result = quantity.buildReceiptLinkPayload("R1", "099999999999.999", 3, "QUANTITY", [], "99999999999.999");
  assert.equal(result.quantity, "99999999999.999");
  assert.equal(quantity.quantityThousandths("+0000.001"), 1n);
  assert.equal(quantity.buildReceiptLinkPayload("R1", "1.2", 0, "QUANTITY", [], "2").quantity, "1.200");
});

test("invalid, rounded, zero and overflowing write quantities are rejected", () => {
  for (const value of ["0", "-1", "1.0001", "1e2", "NaN", "Infinity", ".1", "100000000000.000"]) {
    assert.throws(() => quantity.buildReceiptLinkPayload("R1", value, 0, "QUANTITY", [], "99999999999.999"), value);
  }
});

test("receipt capacity and unique-item quantity are checked exactly", () => {
  assert.throws(() => quantity.buildReceiptLinkPayload("R1", "0.002", 0, "QUANTITY", [], "0.001"), /remaining/);
  assert.throws(() => quantity.buildReceiptLinkPayload("R1", "2", 0, "UNIQUE", [], "2"), /valid quantity/);
  assert.equal(quantity.buildReceiptLinkPayload("R1", "1", 0, "UNIQUE", [], "1").quantity, "1.000");
});

test("piece selections from different pages become one exact, stable payload", () => {
  const result = quantity.buildReceiptLinkPayload("R1", "ignored", 4, "SERIALIZED", ["P27", "P1", "P26"], "3.000");
  assert.deepEqual(plain(result), { purchase_receipt_line_code: "R1", quantity: "3.000", update_key: 4,
    serialized_item_codes: ["P1", "P26", "P27"] });
  assert.throws(() => quantity.buildReceiptLinkPayload("R1", "1", 4, "SERIALIZED", ["P1", "P1"], "2"), /distinct/);
  assert.throws(() => quantity.buildReceiptLinkPayload("R1", "1", 4, "SERIALIZED", [], "2"), /valid quantity/);
  assert.throws(() => quantity.buildReceiptLinkPayload("R1", "1", 4, "QUANTITY", ["P1"], "2"), /distinct/);
});

test("missing source and invalid versions cannot produce a link payload", () => {
  for (const version of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => quantity.buildReceiptLinkPayload("R1", "1", version, "QUANTITY", [], "1"), /Reload/);
  }
  assert.throws(() => quantity.buildReceiptLinkPayload("", "1", 0, "QUANTITY", [], "1"), /Reload/);
});

test("unchanged retry preserves its key; source, version and quantity changes replace it", () => {
  const state = { current: null };
  const original = { item: "O1", lot: "L1", ...quantity.buildReceiptLinkPayload("R1", "1", 1, "QUANTITY", [], "2") };
  const key = retry.idempotencyKeyForPayload(state, original);
  assert.equal(retry.idempotencyKeyForPayload(state, { ...original }), key);
  for (const change of [{ lot: "L2" }, { update_key: 2 }, { quantity: "2.000" }, { purchase_receipt_line_code: "R2" }]) {
    const changed = retry.idempotencyKeyForPayload(state, { ...original, ...change });
    assert.notEqual(changed, key);
  }
  retry.clearIdempotencyKey(state);
  assert.equal(state.current, null);
});

async function transport() {
  const calls = [];
  const apiClient = {
    get: async (...args) => { calls.push({ method: "GET", args }); return { items: [], total: 0 }; },
    post: async (...args) => { calls.push({ method: "POST", args }); return { update_key: 2 }; },
  };
  const { ownershipService } = await loadModule("modules/ownership/services/ownershipService.ts", apiClient);
  return { service: ownershipService, calls };
}

test("register filters and item detail use current routes and bounded pages", async () => {
  const { service, calls } = await transport();
  await service.list({ search: "gold", holding: "depleted", tracking_mode: "SERIALIZED" }, 2);
  await service.detail("O/1");
  assert.deepEqual(plain(calls), [
    { method: "GET", args: ["/tenant/ownership/items", { params: { search: "gold", holding: "depleted", tracking_mode: "SERIALIZED", page: 2, per_page: 25 } }] },
    { method: "GET", args: ["/tenant/ownership/items/O%2F1"] },
  ]);
});

test("lots and movement history have separate pagination and currency filtering", async () => {
  const { service, calls } = await transport();
  await service.lots("O1", 3, "current", "USD");
  await service.movements("O1", 2);
  assert.deepEqual(plain(calls), [
    { method: "GET", args: ["/tenant/ownership/items/O1/lots", { params: { page: 3, per_page: 10, holding: "current", currency_code: "USD" } }] },
    { method: "GET", args: ["/tenant/ownership/items/O1/movements", { params: { page: 2, per_page: 10 } }] },
  ]);
});

test("receipt and exact-piece candidates reuse the same existing API", async () => {
  const { service, calls } = await transport();
  await service.receiptCandidates("O1", "L/1", 2, "receipt");
  await service.pieceCandidates("O1", "L/1", "R1", 3, "serial");
  assert.deepEqual(plain(calls), [
    { method: "GET", args: ["/tenant/ownership/items/O1/lots/L%2F1/receipt-link-candidates", { params: { page: 2, per_page: 10, search: "receipt" } }] },
    { method: "GET", args: ["/tenant/ownership/items/O1/lots/L%2F1/receipt-link-candidates", { params: { page: 3, per_page: 25, search: "serial", purchase_receipt_line_code: "R1" } }] },
  ]);
});

test("link transport preserves decimal text and the caller's replay key", async () => {
  const { service, calls } = await transport();
  const payload = quantity.buildReceiptLinkPayload("R1", "0.001", 9, "QUANTITY", [], "1");
  await service.linkReceipt("O1", "L1", payload, "original-key");
  await service.linkReceipt("O1", "L1", payload, "original-key");
  assert.deepEqual(plain(calls[0]), { method: "POST", args: ["/tenant/ownership/items/O1/lots/L1/receipt-links", plain(payload), { idempotencyKey: "original-key" }] });
  assert.deepEqual(plain(calls[1]), plain(calls[0]));
});
