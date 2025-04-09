-- This function deletes a prayer request and all related records
CREATE OR REPLACE FUNCTION delete_prayer_request(prayer_request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  -- Delete related prayer interactions
  DELETE FROM prayer_interactions WHERE prayer_request_id = $1;
  
  -- Delete related comments
  DELETE FROM comments WHERE prayer_request_id = $1;
  
  -- Delete the prayer request itself
  DELETE FROM prayer_requests WHERE id = $1;
  
  -- Check if the prayer request was deleted
  IF NOT EXISTS (SELECT 1 FROM prayer_requests WHERE id = $1) THEN
    success := TRUE;
  END IF;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql;
