drop table if EXISTS contact_details;
drop table if EXISTS practitioner ;
drop table if EXISTS practice;


create table practitioner (
   first_name TEXT not null,
   last_name TEXT not null,
   salutation TEXT not null,
   speciality TEXT not null,
   ahpra_no INTEGER PRIMARY KEY


);

-- Practice per practitioner
create table practice (
   practice_name      TEXT not null,
   phone_no           INTEGER,
   practice_email     TEXT,
   street_name        TEXT not null,
   street_no          INTEGER not null,
   suburb             TEXT not null,
   street_type        char not null,
   post_code          INTEGER not null,
   practice_id        INTEGER PRIMARY KEY 
);

-- contact details
CREATE TABLE contact_details (
    ahpra_no INTEGER NOT NULL,
    practice_id INTEGER NOT NULL,
    practitioner_email TEXT NOT NULL,
    practitioner_phone_no TEXT NOT NULL,
    FOREIGN KEY (ahpra_no) REFERENCES practitioner(ahpra_no),
    FOREIGN KEY (practice_id) REFERENCES practice(practice_id),
    PRIMARY KEY (ahpra_no, practice_id)
);


