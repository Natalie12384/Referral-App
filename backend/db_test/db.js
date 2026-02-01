//import write_data from "./helper_functions.mjs";
const columnMap = {
  practitioner: {
    ahpra_no: "AHPRA No.",
    first_name: "First Name",
    last_name: "Last Name",
    salutation: "Salutation",
    speciality: "Speciality"
  },
  practice: {
    practice_name: "Practice Name",
    street_no: "Street no.",
    street_name: "Street Name",
    street_type: "Street Type",
    suburb: "Suburb",
    post_code: "Post Code"
  },
  contact: {
    practitioner_phone_no: "Practice Ph.",
    practitioner_email: "Email address"
  }
};

function write_data(reader, db){
    //read xlsx
const file = reader.readFile('./Sample_Data.xlsx')
let data = []

const sheets = file.SheetNames

for(let i = 0; i < sheets.length; i++)
{
   const temp = reader.utils.sheet_to_json(
        file.Sheets[file.SheetNames[i]])
   temp.forEach((res) => {
      data.push(res)
   })
}
console.log(data)
const insertPractitioner = db.prepare(`
  INSERT OR IGNORE INTO practitioner
  ( ahpra_no, salutation, first_name, last_name,  speciality )
  VALUES ( ?, ?, ?, ?, ?)
`);

const insertPractice = db.prepare(`
  INSERT OR IGNORE INTO practice
  (practice_name, street_no, street_name, street_type, suburb, post_code)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const getPracticeId = db.prepare(`
  SELECT practice_id FROM practice
  WHERE practice_name = ? AND street_no = ? AND street_name = ?
`);


const insertContact = db.prepare(`
  INSERT INTO contact_details
  (ahpra_no, practice_id, practitioner_email, practitioner_phone_no)
  VALUES (?, ?, ?, ?)
`);
const insertAll = db.transaction((rows) => {
  for (const row of rows) {

    // --- Practitioner ---
    insertPractitioner.run(
      row[columnMap.practitioner.ahpra_no],
      row[columnMap.practitioner.salutation],
      row[columnMap.practitioner.first_name],
      row[columnMap.practitioner.last_name],
      row[columnMap.practitioner.speciality]
    );

    // --- Practice ---
    insertPractice.run(
      row[columnMap.practice.practice_name],
      row[columnMap.practice.street_no],
      row[columnMap.practice.street_name],
      row[columnMap.practice.street_type],
      row[columnMap.practice.suburb],
      row[columnMap.practice.post_code]
    );

    const practice = getPracticeId.get(
      row[columnMap.practice.practice_name],
      row[columnMap.practice.street_no],
      row[columnMap.practice.street_name]
    );

    const practitioner = row[columnMap.practitioner.ahpra_no];

    if (!practitioner)continue;
    if (!practice) continue;

    // --- Contact details ---
    insertContact.run(
      practitioner,
      practice.practice_id,
      row[columnMap.contact.practitioner_email],
      row[columnMap.contact.practitioner_phone_no]
    );
  }
});
insertAll(data);
};
// db/db.js
const Database = require("better-sqlite3");
const reader = require("xlsx");
const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "app.db");
const SCHEMA_FILE = path.join(__dirname, "referral_schema.sql");


// Create/connect to SQLite DB file (auto-creates app.db if missing)
const db = new Database(DB_FILE);

// Apply schema once at startup
const schema = fs.readFileSync(SCHEMA_FILE, "utf8");
db.exec(schema);
db.pragma("foreign_keys = ON");
module.exports = db;

//populate wih sample data
write_data(reader, db);




