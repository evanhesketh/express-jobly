"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureAdminLoggedIn } = require("../middleware/auth");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login as admin
 **/

router.post("/", ensureAdminLoggedIn, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, userNewSchema, {
    required: true,
  });
  if (!validator.valid) {
    const errs = validator.errors.map((e) => e.stack);
    throw new BadRequestError(errs);
  }

  const user = await User.register(req.body);
  const token = createToken(user);
  return res.status(201).json({ user, token });
});

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login as admin
 **/

router.get("/", ensureAdminLoggedIn, async function (req, res, next) {
  const users = await User.findAll();
  return res.json({ users });
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login as admin or as user being searched
 **/

router.get("/:username", ensureLoggedIn, async function (req, res, next) {
  if (
    res.locals.user.username === req.params.username ||
    res.locals.user.isAdmin === true
  ) {
    const user = await User.get(req.params.username);
    return res.json({ user });
  }

  throw new UnauthorizedError();
});

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login as admin or user being updated
 **/

router.patch("/:username", ensureLoggedIn, async function (req, res, next) {
  if (
    res.locals.user.username === req.params.username ||
    res.locals.user.isAdmin === true
  ) {
    const validator = jsonschema.validate(req.body, userUpdateSchema, {
      required: true,
    });

    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  }

  throw new UnauthorizedError();
});

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login as admin or as user being deleted
 **/

router.delete("/:username", ensureLoggedIn, async function (req, res, next) {
  if (
    res.locals.user.username === req.params.username ||
    res.locals.user.isAdmin === true
  ) {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  }

  throw new UnauthorizedError();
});

/** POST/[username]/jobs/[id]  =>  { applied: jobId }
 *
 * Authorization: LoggedIn
 */

router.post(
  "/:username/jobs/:id",
  ensureLoggedIn,
  async function (req, res, next) {
    if (
      res.locals.user.username === req.params.username ||
      res.locals.user.isAdmin === true
    ) {
      const jobId = await User.applyForJob(req.params.username, req.params.id);
      return res.json({ applied: jobId });
    }
    throw new UnauthorizedError();
  }
);

// /users/:username/jobs/:id

module.exports = router;
