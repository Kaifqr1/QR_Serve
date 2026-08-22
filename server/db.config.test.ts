import { describe, expect, it } from "vitest";
import { createDatabasePoolOptions } from "./db";

describe("TiDB database pool configuration", () => {
  it("enforces modern TLS and low pool limits for a TiDB public endpoint", () => {
    const config = createDatabasePoolOptions("mysql://user:password@gateway01ap-northeast-1.prod.aws.tidbcloud.com:4000/qrserve?ssl=ignored");

    expect(config).toMatchObject({
      host: "gateway01ap-northeast-1.prod.aws.tidbcloud.com",
      port: 4000,
      user: "user",
      password: "password",
      database: "qrserve",
      connectionLimit: 1,
      maxIdle: 1,
      enableKeepAlive: true,
      ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    });
  });

  it("rejects a connection string without a database name", () => {
    expect(() => createDatabasePoolOptions("mysql://user:password@db.example.com:3306")).toThrow("database name");
  });
});
