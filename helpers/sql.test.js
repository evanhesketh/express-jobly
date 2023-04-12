const { sqlForPartialUpdate, sqlForFilteringCriteria } = require("./sql");
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

describe("Creates SQL filter for filtered search", function () {
  test("works", function () {
    const dataToUpdate = {
      nameLike: "sons",
      minEmployees: 500,
      maxEmployees: 800,
    };
    expect(sqlForFilteringCriteria(dataToUpdate)).toEqual({
      filterCols: `"name" ILIKE $1 AND "num_employees">=$2 AND "num_employees"<=$3`,
      values: ["%sons%", 500, 800],
    });
  });
  test("fails when minEmployees parameter is greater than maxEmployees parameters", function () {
    const dataToUpdate = {
      nameLike: "Sons",
      minEmployees: 800,
      maxEmployees: 500,
    };

    try {
      sqlForFilteringCriteria(dataToUpdate);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
  test("works when parameters are missing", function () {
    const dataToUpdate = {
      minEmployees: 500
    };
    expect(sqlForFilteringCriteria(dataToUpdate)).toEqual({
      filterCols: `"name" ILIKE $1 AND "num_employees">=$2 AND "num_employees"<=$3`,
      values: ["%%", 500, 1000000000000]
    });
  });
});
