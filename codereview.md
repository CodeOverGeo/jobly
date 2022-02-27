1- sqlForPartialUpdate:

helpers/sql.js
Helper function for partially updating databases in a sql query
Helps build the correct columns and values needed to pass into a sql query.
---> models/job.js
Takes in data collected by user input, maps key value pairs into column name and index and object with column names and index.

2- Add filtering for getting companies:

routes/companies.js
checks for minEmployees/maxEmployees and parses into Integers
check for correct parameters in the models/company findAll function
build sql query based and passed in values, then execute

3- Change Authorization
middleware/auth.js
Create 2 auth routes, one for admin (ensureAdmin) and one for admin OR self (ensureSelfUserOrAdmin)
User must be logged in and be an admin or self depending on the request being made.
Add to approiate routes

4- Jobs
models/job & routes/jobs
Adding jobs routes and models was simalar to companies models, although had to use pull 2 sql queries to ensure we were retrieving the company handle as appropriate.

5- Application

models/user.js
Query the job and user from the appropriate database.
Insert the application using the jobId and the username into the database.

routes.user.js
pull the jobId and parse to an integer
return the applied object in json.

Question:

ENUM for [interested, applied, accepted, rejected] while making it immutable? Better to create fields with dates attached?

interested - date_field can be null (if null it hasn't happened yet)

instead of

ENUM state [interested, applied, accepted, rejected]

Stete - applied
