const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("Creates SQL for partial update", function () {
  test("works", function () {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = { firstName: "first_name", age: "age" };

    expect(sqlForPartialUpdate(dataToUpdate, jsToSql)).toEqual({
      setCols: `"first_name"=$1, "age"=$2`,
      values: ["Aliya", 32],
    });
  });

  test("fails when no data to update provided", function () {
    const dataToUpdate = {};
    const jsToSql = { firstName: "first_name", age: "age" };

    try {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// function sqlForFiltertingCriteria(dataToFilterBy, jsToSql) {

//   return {}
// }
