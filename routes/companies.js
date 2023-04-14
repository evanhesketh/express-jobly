"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdminLoggedIn } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companySearchSchema = require("../schemas/companySearch.json");

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login as admin
 */

router.post("/", ensureAdminLoggedIn, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, companyNewSchema, {
    required: true,
  });
  if (!validator.valid) {
    const errs = validator.errors.map((e) => e.stack);
    throw new BadRequestError(errs);
  }

  const company = await Company.create(req.body);
  return res.status(201).json({ company });
});

/** GET /  =>
 *   Compananies are  {Companies: { handle, name, description, numEmployees, logoUrl, jobs }}
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Validates whether filters are submitted correctly, and converts minEmployees
 * and maxEmployees into numbers to be passed to our filter helper function.
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  if (Object.keys(req.query).length > 0) {
    const filterParams = {};

    for (const key in req.query) {
      if (key === 'minEmployees' || key === 'maxEmployees') {
        if(req.query[key] === '') {
          throw new BadRequestError('Must provide an integer input');
        }
        filterParams[key] = Number(req.query[key]);
      } else {
        filterParams[key] = req.query[key];
      }
    }

    const validator = jsonschema.validate(filterParams, companySearchSchema, {
      required: true,
    });

    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const companies = await Company.findByFilters(filterParams);

    return res.json({ companies });
  }

  const companies = await Company.findAll();

  return res.json({ companies });
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  const company = await Company.get(req.params.handle);
  return res.json({ company });
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login as admin
 */

router.patch("/:handle", ensureAdminLoggedIn, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, companyUpdateSchema, {
    required: true,
  });
  if (!validator.valid) {
    const errs = validator.errors.map((e) => e.stack);
    throw new BadRequestError(errs);
  }

  const company = await Company.update(req.params.handle, req.body);
  return res.json({ company });
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login as admin
 */

router.delete("/:handle", ensureAdminLoggedIn, async function (req, res, next) {
  await Company.remove(req.params.handle);
  return res.json({ deleted: req.params.handle });
});

module.exports = router;
