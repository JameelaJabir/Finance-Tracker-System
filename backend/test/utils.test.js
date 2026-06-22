import { expect } from "chai";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";

describe("Auth Helper - hashPassword", () => {
  it("should return a hashed string different from the original", async () => {
    const hash = await hashPassword("mySecret123");
    expect(hash).to.be.a("string");
    expect(hash).to.not.equal("mySecret123");
  });

  it("should produce a bcrypt hash (starts with $2b$)", async () => {
    const hash = await hashPassword("mySecret123");
    expect(hash).to.match(/^\$2[ab]\$/);
  });

  it("should produce different hashes for the same input (salt randomness)", async () => {
    const hash1 = await hashPassword("samePassword");
    const hash2 = await hashPassword("samePassword");
    expect(hash1).to.not.equal(hash2);
  });
});

describe("Auth Helper - comparePassword", () => {
  let storedHash;

  before(async () => {
    storedHash = await hashPassword("correctPassword");
  });

  it("should return true when password matches the hash", async () => {
    const result = await comparePassword("correctPassword", storedHash);
    expect(result).to.be.true;
  });

  it("should return false when password does not match the hash", async () => {
    const result = await comparePassword("wrongPassword", storedHash);
    expect(result).to.be.false;
  });

  it("should return false for an empty string against a valid hash", async () => {
    const result = await comparePassword("", storedHash);
    expect(result).to.be.false;
  });

  it("should handle passwords with special characters", async () => {
    const special = "P@$$w0rd!#%^&*()";
    const hash = await hashPassword(special);
    const result = await comparePassword(special, hash);
    expect(result).to.be.true;
  });
});

describe("Budget Status Logic", () => {
  const getBudgetStatus = (currentSpending, budgetAmount, threshold = 80) => {
    const pct = (currentSpending / budgetAmount) * 100;
    if (pct >= 100) return "exceeded";
    if (pct >= threshold) return "warning";
    return "safe";
  };

  it('should return "safe" when spending is below threshold', () => {
    expect(getBudgetStatus(50, 500, 80)).to.equal("safe");
  });

  it('should return "warning" when spending reaches the threshold', () => {
    expect(getBudgetStatus(400, 500, 80)).to.equal("warning");
  });

  it('should return "exceeded" when spending equals the budget amount', () => {
    expect(getBudgetStatus(500, 500, 80)).to.equal("exceeded");
  });

  it('should return "exceeded" when spending exceeds the budget amount', () => {
    expect(getBudgetStatus(600, 500, 80)).to.equal("exceeded");
  });

  it("should respect a custom notification threshold", () => {
    expect(getBudgetStatus(60, 100, 50)).to.equal("warning");
    expect(getBudgetStatus(40, 100, 50)).to.equal("safe");
  });
});

describe("Goal Progress Calculation", () => {
  const getProgress = (savedAmount, targetAmount) => {
    if (targetAmount <= 0) return 0;
    return Math.min(Math.round((savedAmount / targetAmount) * 100), 100);
  };

  it("should return 0% when nothing has been saved", () => {
    expect(getProgress(0, 1000)).to.equal(0);
  });

  it("should return 50% when half the target is saved", () => {
    expect(getProgress(500, 1000)).to.equal(50);
  });

  it("should return 100% when target is exactly met", () => {
    expect(getProgress(1000, 1000)).to.equal(100);
  });

  it("should cap at 100% even when savings exceed the target", () => {
    expect(getProgress(1500, 1000)).to.equal(100);
  });

  it("should return 0 for a zero target amount", () => {
    expect(getProgress(500, 0)).to.equal(0);
  });
});
