IT Employee Lifecycle Automation System
README1.txt - How to Run the Code
Author: Stephen Torrijas

SYSTEM REQUIREMENTS

- Node.js 18 or higher (tested on v25.7.0)
- MySQL 8.0 or higher
- Windows Server with Active Directory Domain Services (for AD integration)
- OrangeHRM 5.x running in a local XAMPP web server(for HR sync; direct MySQL DB access required)
- A modern web browser (Chrome, Edge, or Firefox)

FOLDER STRUCTURE

it-lifecycle-system/
  server/          Backend Node.js/Express API (port 4000)
    index.js       Entry point
    app.js         Express app setup
    routes/        API route handlers
    controllers/   Business logic controllers
    services/      Provisioning, deprovisioning, notification services
    connectors/    OrangeHRMConnector.js, ADConnector.js (LDAP)
    scheduler/     poller.js - polls OrangeHRM on a schedule
    models/        Database model classes
    middleware/    JWT authentication middleware
    db/            schema.sql - full MySQL schema
    config/        Database connection config
    .env.example   Template for environment variables

  client/          Frontend React application (port 3000)
    src/
      pages/       One file per page (Dashboard, Employees, Tasks, etc.)
      components/  Shared UI components (Layout, etc.)
      api/         Axios API client with JWT attachment

STEP 1: INSTALL XAMPP AND SET UP ORANGEHRM

OrangeHRM runs as a web application hosted on XAMPP's Apache + MySQL stack.

1. Download and install XAMPP from https://www.apachefriends.org
   (tested with XAMPP 8.x on Windows)
2. Open the XAMPP Control Panel and start Apache and MySQL.
3. Download OrangeHRM 5.x from https://www.orangehrm.com/download
4. Extract OrangeHRM into XAMPP's web root:
     C:\xampp\htdocs\orangehrm\
5. Open a browser and go to http://localhost/orangehrm to run the
   OrangeHRM installer. Follow the setup wizard:
   - Database host: localhost
   - Database name: orangehrm
   - Database user: root (no password by default in XAMPP)
6. Complete the OrangeHRM setup and log in to confirm it is running.

Note: The lifecycle system connects directly to OrangeHRM's MySQL
database (not its web API from the cloud version), so XAMPP's MySQL must be reachable from
the backend server. The default XAMPP MySQL port is 3306.

STEP 2: SET UP THE LIFECYCLE SYSTEM DATABASE

1. Using the XAMPP MySQL instance (or a separate MySQL 8.0+ install),
   create the application database and schema:
     mysql -u root < server/db/schema.sql
   This creates the `it_lifecycle` database and all 12 tables.

STEP 3: CONFIGURE ENVIRONMENT VARIABLES

1. Copy the example file:
     cp server/.env.example server/.env
2. Edit server/.env and fill in the following values:

     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=yourpassword
     DB_NAME=it_lifecycle

     ORANGEHRM_DB_HOST=localhost
     ORANGEHRM_DB_USER=root
     ORANGEHRM_DB_PASS=
     ORANGEHRM_DB_NAME=orangehrm
   (These point to XAMPP's MySQL where OrangeHRM is installed.
    Default XAMPP root has no password, so leave ORANGEHRM_DB_PASS blank.)

     AD_URL=ldap://DC01.yourdomain.net
     AD_BASE_DN=DC=yourdomain,DC=net
     AD_USER=CN=Administrator,CN=Users,DC=yourdomain,DC=net
     AD_PASSWORD=youradpassword
     AD_TARGET_OU=OU=ITLifecycle,DC=yourdomain,DC=net

     JWT_SECRET=change-this-to-a-random-secret-string

STEP 4: INSTALL DEPENDENCIES AND START THE BACKEND

1. Open a terminal and navigate to the server directory:
     cd it-lifecycle-system/server
2. Install dependencies:
     npm install
3. Start the backend:
     node index.js
   The API will start on http://localhost:4000
   The OrangeHRM poller starts automatically on boot.

   To run in the background on Windows:
     start /B node index.js > server.log 2>&1

STEP 5: INSTALL DEPENDENCIES AND START THE FRONTEND

1. Open a second terminal and navigate to the client directory:
     cd it-lifecycle-system/client
2. Install dependencies:
     npm install
3. Start the frontend:
     npm start
   The React app will open automatically at http://localhost:3000
   (Use BROWSER=none npm start to suppress auto-open)

STEP 6: LOG IN

Default credentials:
  Username: admin
  Password: admin123

(Defined in server/controllers/authController.js)

NOTES

- The backend must be running before the frontend can fetch data.
- The poller runs on the interval configured in the system_config table
  (default: 5 minutes). It can also be triggered manually via the
  "Sync Now" button on the Dashboard.
- All automated AD and provisioning activity is logged to the Audit Log
  page in the UI and to the `audit_logs` table in MySQL.
- If Active Directory is not configured, the system will still run but
  AD operations will fail and log errors to the audit log.
