#!/bin/bash

# Migration Script for Voice Messenger Haven
# This script applies the database migrations needed to fix recipient access

echo "Voice Messenger Haven - Database Migration Script"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Prompt for database password if not set
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "Please enter your Supabase database password:"
    echo "(You can find this in your Supabase dashboard under Settings > Database)"
    read -s SUPABASE_DB_PASSWORD
    echo ""
fi

# Export the password for the Supabase CLI
export SUPABASE_DB_PASSWORD

echo "Connecting to Supabase database..."
echo ""

# Run the migrations
echo "Applying database migrations..."
supabase db push

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations applied successfully!"
    echo ""
    echo "The following critical migrations should now be applied:"
    echo "- safe_recipient_insert function (for adding message recipients)"
    echo "- is_message_recipient function (for recipient access)"
    echo "- Updated RLS policies (allowing recipients to see messages)"
    echo ""
    echo "Next steps:"
    echo "1. Test sending a message from one user to another"
    echo "2. Verify the recipient can see the message in their inbox"
    echo "3. Check that real-time updates are working"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    echo ""
    echo "Common issues:"
    echo "- Wrong database password"
    echo "- Network connectivity issues"
    echo "- Migrations already applied (check for 'already exists' errors)"
fi

# Clear the password from environment
unset SUPABASE_DB_PASSWORD

echo ""
echo "Database password has been cleared from environment."
echo "Script completed."