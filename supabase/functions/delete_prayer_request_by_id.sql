-- This function deletes a prayer request by ID
-- It's used as a fallback method when the standard delete operation fails
CREATE OR REPLACE FUNCTION delete_prayer_request_by_id(request_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM prayer_requests WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;
