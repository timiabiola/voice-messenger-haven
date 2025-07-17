-- Add missing RLS policies for unprotected tables
-- This ensures all tables have proper access control

-- 1. voice_message_recipients table
ALTER TABLE voice_message_recipients ENABLE ROW LEVEL SECURITY;

-- Users can view recipients for messages they sent or received
CREATE POLICY "Users can view message recipients" ON voice_message_recipients
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM voice_messages vm
    WHERE vm.id = voice_message_recipients.voice_message_id
    AND (vm.sender_id = auth.uid() OR EXISTS (
      SELECT 1 FROM voice_message_recipients vmr2
      WHERE vmr2.voice_message_id = vm.id
      AND vmr2.recipient_id = auth.uid()
    ))
  )
);

-- Only message senders can insert recipients (handled via safe_recipient_insert function)
-- No direct insert policy needed as we use the RPC function

-- 2. notification_preferences table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences') THEN
    ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
    
    -- Users can only view and update their own preferences
    CREATE POLICY "Users can view own notification preferences" ON notification_preferences
    FOR SELECT USING (user_id = auth.uid());
    
    CREATE POLICY "Users can update own notification preferences" ON notification_preferences
    FOR UPDATE USING (user_id = auth.uid());
    
    CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 3. twilio_message_logs table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'twilio_message_logs') THEN
    ALTER TABLE twilio_message_logs ENABLE ROW LEVEL SECURITY;
    
    -- Only service role can access Twilio logs (for security and privacy)
    CREATE POLICY "Service role can manage twilio logs" ON twilio_message_logs
    FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- 4. twilio_error_mapping table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'twilio_error_mapping') THEN
    ALTER TABLE twilio_error_mapping ENABLE ROW LEVEL SECURITY;
    
    -- Service role only (system configuration)
    CREATE POLICY "Service role can manage error mappings" ON twilio_error_mapping
    FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- 5. delivery_alerts table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_alerts') THEN
    ALTER TABLE delivery_alerts ENABLE ROW LEVEL SECURITY;
    
    -- Users can view alerts for their messages
    CREATE POLICY "Users can view own delivery alerts" ON delivery_alerts
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM voice_messages vm
        WHERE vm.id = delivery_alerts.message_id
        AND (vm.sender_id = auth.uid() OR EXISTS (
          SELECT 1 FROM voice_message_recipients vmr
          WHERE vmr.voice_message_id = vm.id
          AND vmr.recipient_id = auth.uid()
        ))
      )
    );
    
    -- Only service role can create/update alerts
    CREATE POLICY "Service role can manage delivery alerts" ON delivery_alerts
    FOR INSERT USING (auth.role() = 'service_role');
    
    CREATE POLICY "Service role can update delivery alerts" ON delivery_alerts
    FOR UPDATE USING (auth.role() = 'service_role');
  END IF;
END $$;

-- 6. notes table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN
    ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
    
    -- Users can only access their own notes
    CREATE POLICY "Users can view own notes" ON notes
    FOR SELECT USING (user_id = auth.uid());
    
    CREATE POLICY "Users can insert own notes" ON notes
    FOR INSERT WITH CHECK (user_id = auth.uid());
    
    CREATE POLICY "Users can update own notes" ON notes
    FOR UPDATE USING (user_id = auth.uid());
    
    CREATE POLICY "Users can delete own notes" ON notes
    FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- Add comment
COMMENT ON SCHEMA public IS 'All tables now have Row Level Security enabled for proper access control';