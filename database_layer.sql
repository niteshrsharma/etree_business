-- Active: 1758304756916@@127.0.0.1@5432@lms
-- Using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "Roles" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(50) NOT NULL UNIQUE,
    "Description" TEXT,
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
