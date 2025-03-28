#!/bin/bash
set -e

# This script updates landing page links to point to the app domain

# Parse command line arguments
APP_DOMAIN="https://app.examprep.techtreasuretrove.in"
BACKUP_ONLY=false

for arg in "$@"
do
  case $arg in
    --domain=*)
    APP_DOMAIN="${arg#*=}"
    shift
    ;;
    --backup-only)
    BACKUP_ONLY=true
    shift
    ;;
    *)
    # Unknown option
    ;;
  esac
done

echo "====================================================="
echo "Landing Page Link Updater"
echo "====================================================="
echo "App domain: $APP_DOMAIN"
[ "$BACKUP_ONLY" = true ] && echo "Mode: Backup only (no changes will be made)"

# Check if website/index.html exists
if [ ! -f "website/index.html" ]; then
    echo "Error: website/index.html does not exist. Please run this script from the project root directory."
    exit 1
fi

# Create the landing page backup
BACKUP_FILE="website/index.html.bak-$(date +%Y%m%d%H%M%S)"
echo "Creating backup: $BACKUP_FILE"
cp website/index.html "$BACKUP_FILE"

if [ "$BACKUP_ONLY" = true ]; then
    echo "Backup complete. Exiting without making changes (--backup-only flag was used)."
    exit 0
fi

echo "Updating landing page links to point to: $APP_DOMAIN"

# Create a temporary file
TEMP_FILE=$(mktemp)

# Update all links to /app/ to point to the app domain
sed "s|href=\"/app/|href=\"$APP_DOMAIN/|g" website/index.html > "$TEMP_FILE"
sed -i.tmp "s|action=\"/app/|action=\"$APP_DOMAIN/|g" "$TEMP_FILE"

# Use awk to add the login redirect script - this handles multiline content better than sed
awk -v domain="$APP_DOMAIN" '
    /<\/body>/ {
        print "<script>";
        print "  // Handle login links";
        print "  document.addEventListener('\''DOMContentLoaded'\'', function() {";
        print "    const loginLinks = document.querySelectorAll('\''a[href=\"/login\"]'\'');";
        print "    loginLinks.forEach(link => {";
        print "      link.setAttribute('\''href'\'', '\''" domain "/login'\'');";
        print "    });";
        print "  });";
        print "</script>";
    }
    { print }
' "$TEMP_FILE" > "$TEMP_FILE.new"

mv "$TEMP_FILE.new" "$TEMP_FILE"

# Check if the changes were successfully made
if grep -q "$APP_DOMAIN" "$TEMP_FILE"; then
    # Copy the temp file back
    cp "$TEMP_FILE" website/index.html
    echo "Update successful! Landing page links have been updated to point to $APP_DOMAIN"
else
    echo "Warning: No changes were detected. The file might not have had any links to update."
    echo "Original file was not modified. Check the backup file for confirmation."
fi

# Clean up
rm -f "$TEMP_FILE" "$TEMP_FILE.tmp"

echo "====================================================="
echo "A backup of the original file has been created as $BACKUP_FILE"
echo "To revert changes: cp $BACKUP_FILE website/index.html"
echo "=====================================================" 