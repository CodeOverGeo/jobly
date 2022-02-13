'use strict';

const db = require('../db');
const { NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for jobs */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be {title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   */

  static async create(data) {
    const result = await db.query(
      `INSERT INTO jobs (title, 
                         salary,
                         equity,
                         company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [data.title, data.salary, data.equity, data.companyHandle]
    );
    let job = result.rows[0];

    return job;
  }

  /** Find all jobs
   *
   * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
   */

  static async findAll({ minSalary, hasEquity, title } = {}) {
    // create a base db query string to build upon
    let sqlQuery = `SELECT j.id,
                            j.title,
                            j.salary,
                            j.equity,
                            j.company_handle AS "companyHandle",
                            c.name AS "companyName"
                        
                        FROM jobs j
                            LEFT JOIN companies AS c ON c.handle = j.company_handle`;

    // initialize variables hold values to insert into sql query
    let whereValues = [];
    let filterValues = [];

    // For each search filter, should it exist, push the value into filter values and create
    // the sanitized query search

    if (minSalary !== undefined) {
      filterValues.push(minSalary);
      whereValues.push(`salary >= $${filterValues.length}`);
    }

    if (hasEquity) {
      whereValues.push(`equity > 0`);
    }

    if (title !== undefined) {
      filterValues.push(`%${title}%`);
      whereValues.push(`title ILIKE $${filterValues.length}`);
    }

    // Check if we pushed values into whereValues. If we did, add WHERE statement to query string
    // joining each one with the AND clause needed.

    if (whereValues.length > 0) {
      sqlQuery += ' WHERE ' + whereValues.join(' AND ');
    }

    // Add ORDER BY to end of query string, to order result by company name

    sqlQuery += ' ORDER BY name';

    // Send db query with created query string and values to ensure query is sanitized

    const jobsRes = await db.query(sqlQuery, filterValues);
    return jobsRes.rows;
  }

  /** Given a job id, return data about the job.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *    where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   */

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

    const companiesRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies
         WHERE handle = $1`,
      [job.companyHandle]
    );

    delete job.companyHandle;
    job.company = companiesRes.rows[0];

    return job;
  }

  /** Update job data with "data"
   *
   * This is a "partial update" --- it's fine if date doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   *
   *
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});

    const idVarIdx = '$' + (values.length + 1);

    const querySql = `UPDATE jobs
                        SET ${setCols}
                        WHERE id = ${idVarIdx}
                        RETURNING id,
                                    title,
                                    salary,
                                    equity,
                                    company_handle AS "companyHandle"`;

    const result = await db.query(querySql, [...values, id]);

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found
   *
   */

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
}

module.exports = Job;
