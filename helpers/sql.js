const { BadRequestError } = require("../expressError");

/** Accepts two parameters: dataToUpdate, an object sent from the route,
 *  and jsToSql, an object mapping camelCase keys to snake_case column names
 *  so that they may be successfully entered into SQL.
 *
 *  Allows us to partially update a record in the database.
 *
 *  Returns an object with two keys:
 *  - setCols, whose value is a string of the columns that will be updated
 *  in the database and a parameterized value.
 *  - values, whose value is the desired updated value for
 *  each corresponding column.
 *
 *  INPUT: sqlForPartialUpdate(
 * {firstName: 'Aliya', age: 32},
 * {firstName: "first_name", age: "age"})
 *
 *  RETURNS: {
 *   setCols: `"first_name"=$1, "age"=$2`,
 *   values: ['Aliya', 32]
 * }
 *  */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  console.log("sqlForPartial", {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  })

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
