ALTER TABLE bday.auth_session ADD COLUMN oidc_refresh_token TEXT;
ALTER TABLE bday.auth_session ADD COLUMN oidc_checked_at TIMESTAMPTZ(3);
