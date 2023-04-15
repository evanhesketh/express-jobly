const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

let jobIds = {};

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");

  await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

  await db.query(
    `
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
    [
      await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
    ]
  );
  const results = await db.query(
    `
  INSERT INTO jobs(title,
                    salary,
                    equity,
                    company_handle)
  VALUES ('j1', 100000, 0.98, 'c1'),
          ('j2', 150000, 0.95, 'c2')
          RETURNING id`
  );

  // jobIds.push(results.rows[0].id);
  // jobIds.push(results.rows[1].id);
  jobIds["jobId1"] = results.rows[0].id;
  jobIds["jobId2"] = results.rows[1].id;

  await db.query(
    `INSERT INTO applications(username, job_id)
        VALUES ('u1', ${jobIds.jobId1} )`
  );

}

// async function createTestJobs() {
//   const results = console.log(results, "RESULTSSSS");
//   return results.rows;
// }

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  // jobIds.length = 0;
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds,
};
