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

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/** Accepts one parameter: dataToFilterBy, an object sent from the route.
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
 *  filterCols: `"name" ILIKE $1 AND "num_employees">=$2 AND "num_employees"<=$3`,
 *  values: ['%SONS%', 500, 800]
 *  }
 *
 */

function sqlForFilteringCriteria(dataToFilterBy) {
  const name = dataToFilterBy.nameLike;
  const minEmployees = dataToFilterBy.minEmployees;
  const maxEmployees = dataToFilterBy.maxEmployees;
  const filterCols = [];
  const values = [];
  console.log("MIN EMPLOYEES", minEmployees)

  if (minEmployees > maxEmployees) {
    throw new BadRequestError("minEmployees must be less than maxEmployees");
  }

  if (name) {
    filterCols.push(`"name" ILIKE `);
    values.push(`%${name}%`);
  }

  if (minEmployees) {
    filterCols.push(`"num_employees">=`);
    values.push(minEmployees);
  }

  if (maxEmployees) {
    filterCols.push(`"num_employees"<=`);
    values.push(maxEmployees);
  }

  const filteredQuery = filterCols
    .map((col, idx) => col + `$${idx + 1}`)
    .join(" AND ");

  return {
    filterCols: filteredQuery,
    values: [...values],
  };
}

// function sqlForFilteringCriteria(dataToFilterBy) {
//   const name = dataToFilterBy.nameLike || "";
//   const minEmployees = dataToFilterBy.minEmployees || 0;
//   const maxEmployees = dataToFilterBy.maxEmployees || 1000000000;

//   if (isNaN(Number(minEmployees)) || isNaN(Number(maxEmployees))) {
//     throw new BadRequestError(
//       "MinEmployees and MaxEmployees must be type integer"
//     );
//   } else if (minEmployees > maxEmployees) {
//     throw new BadRequestError("minEmployees must be less than maxEmployees");
//   }

//   return {
//     filterCols: `"name" ILIKE $1 AND "num_employees">=$2 AND "num_employees"<=$3`,
//     values: [`%${name}%`, minEmployees, maxEmployees],
//   };
// }

// SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
// FROM companies
// WHERE name ILIKE '%SONS' AND num_employees >= 500 AND num_employees <= 800;

module.exports = { sqlForPartialUpdate, sqlForFilteringCriteria };
