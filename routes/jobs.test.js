"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds,
  u1Token,
  u3Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "badJob",
    salary: 40000,
    equity: 0.1,
    companyHandle: "c1",
  };

  test("works if user is admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(201);
  });

  test("unauth if user is not admin", async function () {
    const resp = await request(app)
      .post("/jobs/")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs/")
      .send({
        title: "newJob",
        companyHandle: "newCompany",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs/")
      .send({
        ...newJob,
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs/");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: jobIds.jobId1,
          title: "j1",
          salary: 100000,
          equity: "0.98",
          companyHandle: "c1",
        },
        {
          id: jobIds.jobId2,
          title: "j2",
          salary: 150000,
          equity: "0.95",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("gets jobs with filter criteria passed in query string", async function () {
    const resp = await request(app).get("/jobs").query({
      hasEquity: true,
      title: "j2",
      minSalary: 120000,
    });

    expect(resp.body).toEqual({
      jobs: [
        {
          id: jobIds.jobId2,
          title: "j2",
          salary: 150000,
          equity: "0.95",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("gets companies with partial filter criteria", async function () {
    const resp = await request(app).get("/jobs/").query({
      title: "j2",
    });

    expect(resp.body).toEqual({
      jobs: [
        {
          id: jobIds.jobId2,
          title: "j2",
          salary: 150000,
          equity: "0.95",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("fails when equity is not a boolean", async function () {
    const resp = await request(app).get("/jobs/").query({
      title: "j2",
      hasEquity: 0.42,
    });
    expect(resp.statusCode).toEqual(400);
  });

  test("fails when minSalary is not a number", async function () {
    const resp = await request(app).get("/jobs/").query({
      title: "j2",
      hasEquity: 0.42,
      minSalary: "failure",
    });
    expect(resp.statusCode).toEqual(400);
  });

  test("returns errors for invalid query parameters", async function () {
    const resp = await request(app).get("/jobs/").query({
      notValid: "failure",
    });

    expect(resp.body).toEqual({
      error: {
        message: [
          'instance is not allowed to have the additional property "notValid"',
        ],
        status: 400,
      },
    });
  });
  //TODO: IS THIS NECESSARY HERE????
  // test("fails: test next() handler", async function () {
  //   // there's no normal failure event which will cause this route to fail ---
  //   // thus making it hard to test that the error-handler works with it. This
  //   // should cause an error, all right :)
  //   await db.query("DROP TABLE companies CASCADE");
  //   const resp = await request(app)
  //     .get("/jobs")
  //     .set("authorization", `Bearer ${u1Token}`);
  //   expect(resp.statusCode).toEqual(500);
  // });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobIds.jobId1}`);
    expect(resp.body).toEqual({
      job: {
        id: jobIds.jobId1,
        title: "j1",
        salary: 100000,
        equity: "0.98",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds.jobId1}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.body).toEqual({
      job: {
        id: jobIds.jobId1,
        title: "j1-new",
        salary: 100000,
        equity: "0.98",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for non-admin user", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds.jobId1}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/${jobIds.jobId1}`).send({
      title: "j1-new",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on company_handle change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds.jobId1}`)
      .send({
        companyHandle: "j1-new",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds.jobId1}`)
      .send({
        id: 45,
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds.jobId1}`)
      .send({
        equity: 98,
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobIds.jobId1}`)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.body).toEqual({ deleted: `${jobIds.jobId1}` });
  });

  test("unauth for non-admin user", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobIds.jobId1}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/${jobIds.jobId1}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
