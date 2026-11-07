// HTTP smoke test against a running server.
// Usage: BASE_URL=http://localhost:3000 node scripts/smoke-test.mjs
// Run it against a local/test server only: it registers a user and places an order.
// Optional: ADMIN_EMAIL / ADMIN_PASSWORD (the server's seed admin) enable the
// admin checks (order cancellation restocks inventory).
import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
let cookie = "";
let passed = 0;

async function call(method, path, body, { auth = true } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth && cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json, headers: response.headers };
}

async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

const email = `smoke-${Date.now()}@example.test`;

await test("GET /api/products returns a catalog", async () => {
  const { status, json, headers } = await call("GET", "/api/products");
  assert.equal(status, 200);
  assert.ok(json.products.length > 0);
  assert.equal(headers.get("x-content-type-options"), "nosniff");
});

await test("anonymous /api/auth/me returns null user", async () => {
  const { status, json } = await call("GET", "/api/auth/me", undefined, { auth: false });
  assert.equal(status, 200);
  assert.equal(json.user, null);
});

await test("malformed JSON is rejected with 400", async () => {
  const { status } = await call("POST", "/api/auth/login", "{not json", { auth: false });
  assert.equal(status, 400);
});

await test("login with unknown email returns 401", async () => {
  const { status } = await call("POST", "/api/auth/login", { email: "nobody@example.test", password: "x" }, { auth: false });
  assert.equal(status, 401);
});

await test("register creates a USER session", async () => {
  const { status, json } = await call("POST", "/api/auth/register", { name: "Smoke Tester", email, password: "smoke-pass-123" });
  assert.equal(status, 201);
  assert.equal(json.user.role, "USER");
  assert.ok(cookie.startsWith("santhosh_store_session="));
});

await test("duplicate registration returns 409", async () => {
  const { status } = await call("POST", "/api/auth/register", { name: "Smoke Tester", email, password: "smoke-pass-123" }, { auth: false });
  assert.equal(status, 409);
});

await test("login with wrong password returns 401", async () => {
  const { status } = await call("POST", "/api/auth/login", { email, password: "wrong-password" }, { auth: false });
  assert.equal(status, 401);
});

await test("login with correct password succeeds", async () => {
  const { status, json } = await call("POST", "/api/auth/login", { email, password: "smoke-pass-123" });
  assert.equal(status, 200);
  assert.equal(json.user.email, email);
});

await test("USER cannot create products (403)", async () => {
  const { status } = await call("POST", "/api/products", {
    name: "Hack", description: "should never be created", category: "X", price: 100, inventory: 1,
  });
  assert.equal(status, 403);
});

await test("USER cannot change order status (403)", async () => {
  const { status } = await call("PATCH", "/api/orders/anything", { status: "DELIVERED" });
  assert.equal(status, 403);
});

let product;
await test("placing an order computes totals server-side", async () => {
  ({ json: { products: [product] } } = await call("GET", "/api/products"));
  const { status, json } = await call("POST", "/api/orders", {
    items: [{ productId: product.id, quantity: 1 }, { productId: product.id, quantity: 1 }],
  });
  assert.equal(status, 201);
  assert.equal(json.order.subtotal, product.price * 2);
  assert.equal(json.order.items.length, 1);
  assert.equal(json.order.total, json.order.subtotal + json.order.shippingFee);
});

await test("ordering more than stock returns 409", async () => {
  const { status, json } = await call("POST", "/api/orders", { items: [{ productId: product.id, quantity: 50 }] });
  assert.equal(status, 409);
  assert.match(json.error, /Insufficient inventory/);
});

await test("unknown product returns 409", async () => {
  const { status } = await call("POST", "/api/orders", { items: [{ productId: "does-not-exist", quantity: 1 }] });
  assert.equal(status, 409);
});

await test("GET /api/orders lists only own orders", async () => {
  const { status, json } = await call("GET", "/api/orders");
  assert.equal(status, 200);
  assert.ok(json.orders.length >= 1);
  assert.ok(json.orders.every((order) => order.user?.email === email || order.userId === json.orders[0].userId));
});

await test("password change rejects a wrong current password", async () => {
  const { status } = await call("POST", "/api/auth/password", { currentPassword: "nope-nope", newPassword: "another-pass-456" });
  assert.equal(status, 400);
});

await test("password change works and the new password logs in", async () => {
  const { status } = await call("POST", "/api/auth/password", { currentPassword: "smoke-pass-123", newPassword: "another-pass-456" });
  assert.equal(status, 200);
  const old = await call("POST", "/api/auth/login", { email, password: "smoke-pass-123" }, { auth: false });
  assert.equal(old.status, 401);
  const fresh = await call("POST", "/api/auth/login", { email, password: "another-pass-456" });
  assert.equal(fresh.status, 200);
});

if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const shopperCookie = cookie;
  await test("admin cancelling an order restocks inventory and is final", async () => {
    const stockOf = async () =>
      (await call("GET", "/api/products")).json.products.find((p) => p.id === product.id).inventory;
    const before = await stockOf();
    const { json: placed } = await call("POST", "/api/orders", { items: [{ productId: product.id, quantity: 2 }] });
    assert.equal(await stockOf(), before - 2);

    const admin = await call("POST", "/api/auth/login", { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    assert.equal(admin.status, 200);
    assert.equal(admin.json.user.role, "ADMIN");

    const cancelled = await call("PATCH", `/api/orders/${placed.order.id}`, { status: "CANCELLED" });
    assert.equal(cancelled.status, 200);
    assert.equal(await stockOf(), before);

    const reopen = await call("PATCH", `/api/orders/${placed.order.id}`, { status: "PAID" });
    assert.equal(reopen.status, 409);
  });
  cookie = shopperCookie;
}

await test("logout clears the session", async () => {
  const { status } = await call("POST", "/api/auth/logout");
  assert.equal(status, 200);
  cookie = "";
  const { status: ordersStatus } = await call("GET", "/api/orders");
  assert.equal(ordersStatus, 401);
});

await test("forged JWT is rejected", async () => {
  cookie = "santhosh_store_session=eyJhbGciOiJub25lIn0.eyJpZCI6IngiLCJyb2xlIjoiQURNSU4ifQ.";
  const { json } = await call("GET", "/api/auth/me");
  assert.equal(json.user, null);
  const { status } = await call("POST", "/api/products", {
    name: "Hack", description: "should never be created", category: "X", price: 100, inventory: 1,
  });
  assert.equal(status, 403);
});

await test("repeated failed logins are rate limited (429)", async () => {
  const statuses = [];
  for (let attempt = 0; attempt < 10; attempt += 1) {
    statuses.push((await call("POST", "/api/auth/login", { email, password: "wrong-password" }, { auth: false })).status);
  }
  assert.ok(statuses.includes(429), `expected a 429, got ${statuses.join(",")}`);
});

console.log(`\n${passed} smoke checks passed against ${BASE_URL}`);
