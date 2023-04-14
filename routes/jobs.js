"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdminLoggedIn } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login as admin
 */

router.post("/", ensureAdminLoggedIn, async function (req, res, next) {
  console.log("HERE!!")
  const validator = jsonschema.validate(req.body, jobNewSchema, {
    required: true,
  });
  if (!validator.valid) {
    const errs = validator.errors.map((e) => e.stack);
    throw new BadRequestError(errs);
  }
  const job = await Job.create(req.body);
  return res.status(201).json({ job });
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity
 *
 * Validates whether filters are submitted correctly, and converts minSalary
 * into a number and converts hasEquity into boolean to be passed to our
 * filter helper function.
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  if (Object.keys(req.query).length > 0) {
    const filterParams = {};
    //TODO: test this without the next code block
    for (const key in req.query) {}
      if ("minSalary" in req.query) {
        if (req.query.minSalary !== "") {
          filterParams.minSalary = Number(req.query.minSalary);
        }
      }

      if ("hasEquity" in req.query) {
        if (req.query.hasEquity.toLowerCase() === "true") {
          filterParams.hasEquity = true;
        } else if (req.query.hasEquity.toLowerCase() === "false") {
          filterParams.hasEquity = false;
        } else {
          filterParams.hasEquity = req.query.hasEquity;
        }
      }

      if ("title" in req.query) {
        filterParams.title = req.query.title;
      }

      console.log(filterParams, "filterParams")

      const validator = jsonschema.validate(filterParams, jobSearchSchema, {
        required: true,
      });

      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const jobs = await Job.findByFilters(filterParams);

      return res.json({ jobs });
    }

    const jobs = await Job.findAll();

    return res.json({ jobs });
  }
);

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: {  title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login as admin
 */

router.patch("/:id", ensureAdminLoggedIn, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, jobUpdateSchema, {
    required: true,
  });
  if (!validator.valid) {
    const errs = validator.errors.map((e) => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.update(req.params.id, req.body);
  return res.json({ job });
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login as admin
 */

router.delete("/:id", ensureAdminLoggedIn, async function (req, res, next) {
  await Job.remove(req.params.id);
  return res.json({ deleted: req.params.id });
});

module.exports = router;
