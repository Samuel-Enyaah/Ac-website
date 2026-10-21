import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import Admin from "../src/models/Admin.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { ADMIN_COOKIE } from "../src/utils/adminAuth.js";
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
test("admin guard rejects missing, invalid and expired cookies", async () => {
  process.env.JWT_SECRET = "isolated-test-secret-never-production";
  for (const token of [undefined, "invalid", jwt.sign({ sub: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET, { expiresIn: -1 })]) {
    const res = response(); await requireAdmin({ cookies: { [ADMIN_COOKIE]: token } }, res, () => assert.fail("guard allowed invalid token")); assert.equal(res.code, 401);
  }
});
test("admin guard checks active account and attaches authenticated admin", async (t) => {
  process.env.JWT_SECRET = "isolated-test-secret-never-production";
  const token = jwt.sign({ sub: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
  for (const admin of [null, { active: false }, { active: true, _id: "admin" }]) {
    const mock = t.mock.method(Admin, "findById", async () => admin);
    const req = { cookies: { [ADMIN_COOKIE]: token } }; const res = response(); let passed = false;
    await requireAdmin(req, res, (error) => { assert.equal(error, undefined); passed = true; });
    assert.equal(passed, Boolean(admin?.active)); if (passed) assert.equal(req.admin, admin); else assert.equal(res.code, 401);
    mock.mock.restore();
  }
});
