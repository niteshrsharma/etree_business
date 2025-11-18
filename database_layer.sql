-- Active: 1758304756916@@127.0.0.1@5432@lms
-- Using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "Roles" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(50) NOT NULL UNIQUE,
    "Description" TEXT,
    "RegistrationAllowed" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ
);

INSERT INTO "Roles" ("Name", "Description")
VALUES
    ('Super User', 'Has full system access'),
    ('Student', 'Can access enrolled courses'),
    ('Tech Lead & Trainer', 'Manages courses and teaches content');

CREATE TRIGGER trg_roles_set_timestamps
BEFORE INSERT OR UPDATE ON "Roles"
FOR EACH ROW
EXECUTE FUNCTION set_timestamps();


CREATE TABLE "Users" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "FullName" VARCHAR(200) NOT NULL,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "Password" VARCHAR(255) NOT NULL,  -- store hashed passwords
    "RoleId" INT REFERENCES "Roles"("Id"),
    "ProfilePicture" VARCHAR(255) DEFAULT NULL,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ
);
INSERT INTO "Users" ("FullName", "Email", "Password", "RoleId")
VALUES (
    'Nitesh Sharma',
    'nitesh.r.sharma999@gmail.com',
    'hashed_password_here',
    (SELECT "Id" FROM "Roles" WHERE "Name" = 'Super User')
);

CREATE TRIGGER trg_users_set_timestamps
BEFORE INSERT OR UPDATE ON "Users"
FOR EACH ROW
EXECUTE FUNCTION set_timestamps();

CREATE TABLE "Otps" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "Code" VARCHAR(10) NOT NULL,
    "IsUsed" BOOLEAN DEFAULT FALSE,
    "ExpiresAt" TIMESTAMPTZ NOT NULL,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- need to crate it in the backend
CREATE TABLE "RequiredFieldsForUsers" (
    "Id" SERIAL PRIMARY KEY,
    "RoleId" INT NOT NULL REFERENCES "Roles"("Id") ON DELETE CASCADE,        
    "FieldName" VARCHAR(100) NOT NULL,               
    "FieldType" VARCHAR(50) NOT NULL CHECK ("FieldType" IN ('text', 'mcq', 'msq', 'date', 'number', 'document')),
    "IsRequired" BOOLEAN NOT NULL DEFAULT true,      
    "FilledByRoleId" INT NOT NULL REFERENCES "Roles"("Id"),
    "EditableByRoleId" INT REFERENCES "Roles"("Id"),    
    "Options" JSONB,                                    
    "Validation" JSONB,                                
    "DisplayOrder" INT,                                
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ
);

CREATE TRIGGER trg_required_fields_set_timestamps
BEFORE INSERT OR UPDATE ON "RequiredFieldsForUsers"
FOR EACH ROW
EXECUTE FUNCTION set_timestamps();

--create backend for this
CREATE TABLE "UsersFieldData" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" UUID NOT NULL REFERENCES "Users"("Id"),
    "RequiredFieldId" INT NOT NULL REFERENCES "RequiredFieldsForUsers"("Id"),
    "Value" JSONB NOT NULL,                   -- store text, number, date, or selected options
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ
);
CREATE TRIGGER trg_required_fields_data_set_timestamps
BEFORE INSERT OR UPDATE ON "UsersFieldData"
FOR EACH ROW
EXECUTE FUNCTION set_timestamps();

CREATE OR REPLACE FUNCTION set_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT operation
    IF TG_OP = 'INSERT' THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = TG_TABLE_NAME AND column_name = 'CreatedAt'
        ) THEN
            NEW."CreatedAt" = COALESCE(NEW."CreatedAt", NOW());
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = TG_TABLE_NAME AND column_name = 'UpdatedAt'
        ) THEN
            NEW."UpdatedAt" = COALESCE(NEW."UpdatedAt", NOW());
        END IF;

    -- UPDATE operation
    ELSIF TG_OP = 'UPDATE' THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = TG_TABLE_NAME AND column_name = 'UpdatedAt'
        ) THEN
            NEW."UpdatedAt" = NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- this one looks og need to implement it for our own use:

-- CREATE TABLE country_data (
--     id SERIAL PRIMARY KEY,
--     country TEXT,
--     data JSONB
-- );

-- INSERT INTO country_data (country, data) VALUES
-- ('India', '{
--     "Tamil Nadu": ["Chennai", "Coimbatore"],
--     "Kerala": ["Kochi"]
-- }');
