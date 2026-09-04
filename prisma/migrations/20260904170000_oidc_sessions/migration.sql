CREATE TABLE "bday"."auth_attempt" (
    "state_hash" CHAR(64) NOT NULL,
    "code_verifier" VARCHAR(128) NOT NULL,
    "nonce" VARCHAR(128) NOT NULL,
    "return_to" VARCHAR(500) NOT NULL DEFAULT '/',
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_attempt_pkey" PRIMARY KEY ("state_hash")
);

CREATE INDEX "auth_attempt_expires_at_idx"
ON "bday"."auth_attempt"("expires_at");

CREATE TABLE "bday"."auth_session" (
    "token_hash" CHAR(64) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("token_hash")
);

CREATE INDEX "auth_session_subject_idx"
ON "bday"."auth_session"("subject");
CREATE INDEX "auth_session_expires_at_idx"
ON "bday"."auth_session"("expires_at");

