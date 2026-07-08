📝 `NOTE` Use this template repo to initialize the contents of your group's capstone repo project. As you work on your assignment over the course of the week, update the appropriate repo deliverables. All project planning should be included in the planning directory. (🚫 Remove this paragraph before submitting your assignment.)

# SITE Capstone Project

SITE Course Year: **2026**

Cohort: **Salesforce**

Team Member Names:**Ariane Doris Umuhire, Ardelia Putridaryana, Zainab Adeola**

Mentors Names: **Sankar Rao, Bhogi, Bhavna Hirani, Mayank Dwivedi**

Project Code Repository Links

* [Frontend Repo Link]()
* [Backend Repo Link]()

## Project Overview

Add a quick summary of what your project theme and objectives are. 

Deployment Website: **Add Link to Deployed Project**

### Open-source libraries used

- Add any links to open-source libraries used in your project.

## Local Database Setup

Each teammate runs their own PostgreSQL database locally. GitHub only shares the code, not the data.

1. **Install Postgres.app** — download from https://postgresapp.com, move it to Applications, open it, and click "Initialize".

2. **Add the tools to your terminal** (so `createdb`/`psql` work). Run once, then restart your terminal:
   ```bash
   echo 'export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Create the database:**
   ```bash
   createdb side_hustle
   ```

4. **Create the tables:**
   ```bash
   psql side_hustle -f backend/schema.sql
   ```

5. **Add your connection string** to `backend/.env` (replace `YOUR_MAC_USERNAME` with your computer's username — run `whoami` if unsure):
   ```
   DATABASE_URL=postgresql://YOUR_MAC_USERNAME@localhost:5432/side_hustle
   ```

### Troubleshooting

- **`createdb: command not found`** → You skipped step 2. The tools aren't on your PATH.
- **`role "your_name" does not exist`** → Your Postgres has no user matching your Mac username. Create one:
  ```bash
  psql -U postgres -d postgres -c "CREATE ROLE your_name WITH LOGIN CREATEDB SUPERUSER;"
  ```
  (Replace `your_name` with your Mac username from `whoami`.)
