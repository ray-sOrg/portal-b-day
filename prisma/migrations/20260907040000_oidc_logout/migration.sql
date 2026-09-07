ALTER TABLE "bday"."auth_session" ADD COLUMN "oidc_sid" VARCHAR(255);
CREATE INDEX "auth_session_oidc_sid_idx" ON "bday"."auth_session"("oidc_sid");
