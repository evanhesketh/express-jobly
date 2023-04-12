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
  });

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/** Accepts two parameters: dataToFilterBy, an object sent from the route.
 *
 *  Allows us to filter search results by optional filtering criteria from the user.
 *  nameLike: ILIKE - nameLike
 *  minEmployees: >= value
 *  maxEmployees: <= value
 *  if minEmployees value > maxEmployees value, throw badRequestError.
 *
 *  Returns an object with two keys:
 *  - setCols, whose value is a string of the columns that will be filtered
 *    in the database and a parameterized value.
 *  - values, whose value is the desired filtering value for
 *    each corresponding column.
 *
 *  INPUT: sqlForFilteringCriteria(
 *  {nameLike: "Sons", minEmployees: 500,
 *  maxEmployees: 800})
 *
 *  RETURNS: {
 *  setCols: `"name"$1,
 *  }
 *
 */

// function sqlForFilteringCriteria(dataToFilterBy) {

//   return {}
// }

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

// SELECT handle,
// name,
// description,
// num_employees AS "numEmployees",
// logo_url AS "logoUrl"
// FROM companies
// WHERE handle = $1

// // SELECT handle,
// name,
// description,
// num_employees AS "numEmployees",
// logo_url AS "logoUrl"
// FROM companies
// WHERE name ILIKE '%SONS' AND num_employees >= 500 AND num_employees <= 800;

module.exports = { sqlForPartialUpdate };
