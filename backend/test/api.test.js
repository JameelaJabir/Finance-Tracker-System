import request from "supertest";
import server from ""; // Assuming your Express app is exported as `app`
import { expect } from "chai";

describe("GET /api/users", () => {
  it("should return an array of users", async () => {
    const res = await request(app).get("/api/users");

    // Assert the response status code
    expect(res.status).to.equal(200);
    // Assert the response body is an array
    expect(res.body).to.be.an("array");
  });
});

describe("POST /api/users", () => {
  it("should create a new user and return the user object", async () => {
    const newUser = {
      name: "John Doe",
      email: "johndoe@example.com",
    };

    const res = await request(app).post("/api/users").send(newUser);

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property("_id");
    expect(res.body.name).to.equal(newUser.name);
    expect(res.body.email).to.equal(newUser.email);
  });
});
