"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
      `INSERT INTO jobs(
          title,
          salary,
          equity,
          company_handle)
            VALUES
              ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];
    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */
  static async findAll() {
    const jobsRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`
    );
    return jobsRes.rows;
  }

  /**
   * Accepts object {title: "j1", "minSalary": 120000, "hasEquity": true}
   *
   * Finds jobs with filtering criteria.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   *
   */
  static async findByFilters(filters) {
    const { filterCols, values } = this._sqlForFilteringJobs(filters);
    const querySql = `SELECT id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"
        FROM jobs
        WHERE ${filterCols}
        ORDER BY title`;

    const result = await db.query(querySql, values);
    const jobs = result.rows;

    return jobs;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/
  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });
    const idVarIdx = "$" + (values.length + 1);
    let result;
    try {
        querySql = `
        UPDATE jobs
        SET ${setCols}
          WHERE id = ${idVarIdx}
          RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;

        result = await db.query(querySql, [...values, id]);
    } catch(err) {
      throw new BadRequestError('Company handle does not exist')
    }

    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }

  static _sqlForFilteringJobs(dataToFilterBy) {
    const title = dataToFilterBy.title;
    const equity = dataToFilterBy.hasEquity;
    const minSalary = dataToFilterBy.minSalary;
    const filterCols = [];
    const values = [];

    if (title) {
      filterCols.push(`"title" ILIKE `);
      values.push(`%${title}%`);
    }

    if (equity === true || equity === false) {
      console.log("YOU MADE IT!");
      if (equity === true) {
        filterCols.push(`"equity">=`);
        values.push(0);
      } else {
        filterCols.push(`"equity"=`);
        values.push(0);
      }
    }

    if (minSalary) {
      filterCols.push(`"salary">=`);
      values.push(minSalary);
    }

    const filteredQuery = filterCols
      .map((col, idx) => col + `$${idx + 1}`)
      .join(" AND ");
    console.log(filteredQuery, values, "QUERY and Values");
    return {
      filterCols: filteredQuery,
      values: values,
    };
  }
}
module.exports = Job;
