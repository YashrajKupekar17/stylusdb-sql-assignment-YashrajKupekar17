/*
Creating a Query Parser which can parse SQL `SELECT` Queries only.




// */


function checkAggregateWithoutGroupBy(query, groupByFields) {

    const aggregateFunctionRegex = /(\bCOUNT\b|\bAVG\b|\bSUM\b|\bMIN\b|\bMAX\b)\s*\(\s*(\*|\w+)\s*\)/i;
    
    return aggregateFunctionRegex.test(query) && !groupByFields;
}










function parseSelectQuery(query) {
    try {
      // Trim the query
      query = query.trim();
  
      // Check for DISTINCT keyword
      const isDistinct = query.toUpperCase().startsWith('SELECT DISTINCT');
      query = query.replace(/^SELECT DISTINCT\s/, 'SELECT '); // Remove 'SELECT DISTINCT'
  
      // Capture and remove LIMIT clause
      const limitMatch = query.match(/\sLIMIT\s(\d+)/i);
      let limit = null;
      if (limitMatch) {
        limit = parseInt(limitMatch[1], 10);
        query = query.replace(limitMatch[0], ''); // Remove LIMIT clause
      }
  
      // Capture and remove ORDER BY clause
      const orderByMatch = query.match(/\sORDER BY\s(.+)/i);
      let orderByFields = null;
      if (orderByMatch) {
        orderByFields = orderByMatch[1].split(',').map(field => {
          const [fieldName, order] = field.trim().split(/\s+/);
          return { fieldName, order: order ? order.toUpperCase() : 'ASC' };
        });
        query = query.replace(orderByMatch[0], ''); // Remove ORDER BY clause
      }
  
      // Capture and remove GROUP BY clause
      const groupByMatch = query.match(/\sGROUP BY\s(.+)/i);
      let groupByFields = null;
      if (groupByMatch) {
        groupByFields = groupByMatch[1].split(',').map(field => field.trim());
        query = query.replace(groupByMatch[0], ''); // Remove GROUP BY clause
      }
  
      // Extract WHERE clause (if exists)
      const whereSplit = query.split(/\sWHERE\s/i);
      const queryWithoutWhere = whereSplit[0].trim(); // Everything before WHERE
      const whereClause = whereSplit.length > 1 ? whereSplit[1].trim() : null;
  
      // Extract JOIN information (if exists)
      const joinSplit = queryWithoutWhere.split(/\s(INNER|LEFT|RIGHT) JOIN\s/i);
      const selectPart = joinSplit[0].trim(); // Everything before JOIN clause
      const { joinType, joinTable, joinCondition } = parseJoinClause(queryWithoutWhere);
  
      // Parse SELECT part
      const selectMatch = selectPart.match(/^SELECT\s(.+?)\sFROM\s(.+)/i);
      if (!selectMatch) {
        throw new Error('Invalid SELECT format');
      }
      const [, fields, table] = selectMatch;
  
      // Parse WHERE clause (if exists)
      let whereClauses = [];
      if (whereClause) {
        whereClauses = parseWhereClause(whereClause);
      }
  
      // Check for aggregate functions without GROUP BY
      const hasAggregateWithoutGroupBy = checkAggregateWithoutGroupBy(query, groupByFields);
  
      return {
        fields: fields.split(',').map(field => field.trim()),
        table: table.trim(),
        whereClauses,
        joinType,
        joinTable,
        joinCondition,
        groupByFields,
        orderByFields,
        hasAggregateWithoutGroupBy,
        limit,
        isDistinct,
      };
    } catch (error) {
      throw new Error(`Query parsing error: ${error.message}`);
    }
  }
  






// function checkAggregateWithoutGroupBy(query, groupByFields) {
//     const aggregateFunctionRegex = /(\bCOUNT\b|\bAVG\b|\bSUM\b|\bMIN\b|\bMAX\b)\s*\(\s*(\*|\w+)\s*\)/i;
    
//     return aggregateFunctionRegex.test(query) && !groupByFields;
// }


function parseWhereClause(whereString) {
    
    const conditionRegex = /(.*?)(=|!=|>=|<=|>|<)(.*)/;


    return whereString.split(/ AND | OR /i).map(conditionString => {
        if (conditionString.includes(' LIKE ')) {


            const [field, pattern] = conditionString.split(/\sLIKE\s/i);
            return { field: field.trim(), operator: 'LIKE', value: pattern.trim().replace(/^'(.*)'$/, '$1') };
        } else {
            const match = conditionString.match(conditionRegex);
            if (match) {
                const [, field, operator, value] = match;

                return { field: field.trim(), operator, value: value.trim() };

            }
            throw new Error('Invalid WHERE clause format');

        }
    });
}

function parseJoinClause(query) {
    const joinRegex = /\s(INNER|LEFT|RIGHT) JOIN\s(.+?)\sON\s([\w.]+)\s*=\s*([\w.]+)/i;
    const joinMatch = query.match(joinRegex);

    if (joinMatch) {
        return {
            joinType: joinMatch[1].trim(),
            joinTable: joinMatch[2].trim(),
            joinCondition: {
                left: joinMatch[3].trim(),
                right: joinMatch[4].trim()
            }
        };
    }

    return {
        joinType: null,
        joinTable: null,
        joinCondition: null
    };
}

function parseDeleteQuery(query) {
    const deleteRegex = /DELETE FROM (\w+)( WHERE (.*))?/i;
    const match = query.match(deleteRegex);

    if (!match) {
        throw new Error("Invalid DELETE syntax.");
    }

    const [, table, , whereString] = match;
    let whereClauses = [];
    if (whereString) {
        whereClauses = parseWhereClause(whereString);
    }

    return {
        type: 'DELETE',
        table: table.trim(),
        whereClauses
    };
}
function parseInsertQuery(query) {
    const insertRegex = /INSERT INTO (\w+)\s\((.+)\)\sVALUES\s\((.+)\)/i;

    const match = query.match(insertRegex);

    if (!match) {
        throw new Error("Invalid INSERT INTO syntax.");

    }

    const [, table, columns, values] = match;

    return {
        type: 'INSERT',
        table: table.trim(),
        columns: columns.split(',').map(column => column.trim()),
        values: values.split(',').map(value => value.trim())
    };
}




module.exports = { parseSelectQuery, parseJoinClause, parseInsertQuery, parseDeleteQuery };




// function hasAggregateWithoutGroupBy(query, groupByFields) {
//     // Check for common aggregate functions (COUNT, AVG, SUM, MIN, MAX)
//     const hasAggregate = query.match(/\b(COUNT|AVG|SUM|MIN|MAX)\s*\(\s*(\*|\w+)\s*\)/i);
//     // Return true if aggregate is found and no groupBy is present
//     return hasAggregate && !groupByFields;
//   }
  
//   function splitConditions(whereString) {
//     // Split conditions based on AND or OR (case-insensitive)
//     return whereString.split(/ AND | OR /i);
//   }
  
//   function parseCondition(conditionString) {
//     if (conditionString.includes(' LIKE ')) {
//       // Extract field and value for LIKE operator
//       const [field, pattern] = conditionString.split(/\sLIKE\s/i);
//       return { field: field.trim(), operator: 'LIKE', value: pattern.trim().replace(/^'(.*)'$/, '$1') };
//     } else {
//       // Extract field, operator, and value using a regex
//       const match = conditionString.match(/(.*?)(=|!=|>=|<=|>|<)(.*)/);
//       if (match) {
//         const [, field, operator, value] = match;
//         return { field: field.trim(), operator, value: value.trim() };
//       }
//       throw new Error('Invalid WHERE clause format');
//     }
//   }
  
//   function parseWhereClause(whereString) {
//     // Split conditions and parse each one
//     return splitConditions(whereString).map(parseCondition);
//   }
  
//   function parseJoinClause(query) {
//     const joinRegex = /\s(INNER|LEFT|RIGHT) JOIN\s(.+?)\sON\s([\w.]+)\s*=\s*([\w.]+)/i;
//     const joinMatch = query.match(joinRegex);
  
//     if (joinMatch) {
//       return {
//         joinType: joinMatch[1].trim(),
//         joinTable: joinMatch[2].trim(),
//         joinCondition: { left: joinMatch[3].trim(), right: joinMatch[4].trim() }
//       };
//     }
  
//     return { joinType: null, joinTable: null, joinCondition: null };
//   }
  
//   function parseInsertQuery(query) {
//     const insertRegex = /INSERT INTO (\w+)\s\((.+)\)\sVALUES\s\((.+)\)/i;
//     const match = query.match(insertRegex);
  
//     if (!match) {
//       throw new Error("Invalid INSERT INTO syntax.");
//     }
  
//     const [, table, columns, values] = match;
//     return {
//       type: 'INSERT',
//       table: table.trim(),
//       columns: columns.split(',').map(column => column.trim()),
//       values: values.split(',').map(value => value.trim())
//     };
//   }
  
//   function parseDeleteQuery(query) {
//     const deleteRegex = /DELETE FROM (\w+)( WHERE (.*))?/i;
//     const match = query.match(deleteRegex);
  
//     if (!match) {
//       throw new Error("Invalid DELETE syntax.");
//     }
  
//     const [, table, , whereString] = match;
//     let whereClauses = [];
//     if (whereString) {
//       whereClauses = parseWhereClause(whereString);
//     }
  
//     return {
//       type: 'DELETE',
//       table: table.trim(),
//       whereClauses
//     };
//   }
  
  
//   module.exports = { parseSelectQuery, parseJoinClause, parseInsertQuery, parseDeleteQuery };
  



