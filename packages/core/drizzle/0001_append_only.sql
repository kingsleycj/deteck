-- Append-only facts (decisions.md D-08, PRD "Data integrity").
-- Rows in these tables can never be updated. They can only be deleted by the
-- retention job, which must set `deteck.allow_purge = 'on'` for its own
-- transaction (SET LOCAL), and only for check_event.
CREATE OR REPLACE FUNCTION deteck_block_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
	IF TG_OP = 'DELETE'
		AND TG_TABLE_NAME = 'check_event'
		AND current_setting('deteck.allow_purge', true) = 'on' THEN
		RETURN OLD;
	END IF;
	RAISE EXCEPTION 'Table % is append-only: % is not allowed', TG_TABLE_NAME, TG_OP
		USING ERRCODE = 'restrict_violation';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER pack_append_only BEFORE UPDATE OR DELETE ON pack
	FOR EACH ROW EXECUTE FUNCTION deteck_block_mutation();
--> statement-breakpoint
CREATE TRIGGER custody_event_append_only BEFORE UPDATE OR DELETE ON custody_event
	FOR EACH ROW EXECUTE FUNCTION deteck_block_mutation();
--> statement-breakpoint
CREATE TRIGGER check_event_append_only BEFORE UPDATE OR DELETE ON check_event
	FOR EACH ROW EXECUTE FUNCTION deteck_block_mutation();
--> statement-breakpoint
CREATE TRIGGER audit_log_append_only BEFORE UPDATE OR DELETE ON audit_log
	FOR EACH ROW EXECUTE FUNCTION deteck_block_mutation();
