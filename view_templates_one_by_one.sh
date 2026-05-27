#!/bin/bash

# View All Resume Templates One by One
# This script opens each generated PDF template sequentially for review

echo "════════════════════════════════════════════════════════"
echo "   REVIEWING ALL RESUME TEMPLATES ONE BY ONE"
echo "════════════════════════════════════════════════════════"
echo ""

# Find the most recent test output directory
LATEST_DIR=$(ls -td all_templates_test_* 2>/dev/null | head -1)

if [ -z "$LATEST_DIR" ]; then
    echo "❌ No template test output found!"
    echo "Please run: ./test_all_templates_final.sh first"
    exit 1
fi

echo "📂 Using directory: $LATEST_DIR"
echo ""

# Array of templates in order
TEMPLATES=(
    "Hiero_Standard.pdf:Hiero Standard - Professional template with clean layout"
    "Hiero_Modern.pdf:Hiero Modern - Contemporary design with bold typography"
    "Professional_CV.pdf:Professional CV - Classic professional format"
    "Modern_Simple.pdf:Modern Simple - Minimalist design with clear sections"
    "Awesome_CV.pdf:Awesome CV - Eye-catching creative layout"
    "AltaCV.pdf:AltaCV - Alternative format with sidebar layout"
    "Deedy_CV.pdf:Deedy CV - Developer-friendly format"
    "Elegant.pdf:Elegant - Sophisticated executive design"
    "Functional.pdf:Functional - Skills-focused format"
    "Awesome_CE.pdf:Awesome Creative - Unique creative styling"
)

TEMPLATE_NUM=1
TOTAL=${#TEMPLATES[@]}

for TEMPLATE_ENTRY in "${TEMPLATES[@]}"; do
    IFS=':' read -r PDF_FILE DESCRIPTION <<< "$TEMPLATE_ENTRY"
    
    PDF_PATH="$LATEST_DIR/$PDF_FILE"
    
    if [ ! -f "$PDF_PATH" ]; then
        echo "⚠️  [$TEMPLATE_NUM/$TOTAL] File not found: $PDF_FILE"
        TEMPLATE_NUM=$((TEMPLATE_NUM + 1))
        continue
    fi
    
    FILE_SIZE=$(ls -lh "$PDF_PATH" | awk '{print $5}')
    
    echo "════════════════════════════════════════════════════════"
    echo "  [$TEMPLATE_NUM/$TOTAL] $DESCRIPTION"
    echo "════════════════════════════════════════════════════════"
    echo "  File: $PDF_FILE"
    echo "  Size: $FILE_SIZE"
    echo "  Path: $PDF_PATH"
    echo ""
    echo "  Opening PDF viewer..."
    echo ""
    
    # Open the PDF
    open "$PDF_PATH"
    
    # Wait for user to review
    if [ $TEMPLATE_NUM -lt $TOTAL ]; then
        echo "  👉 Review the template, then press ENTER to see the next one..."
        read -r
        echo ""
    fi
    
    TEMPLATE_NUM=$((TEMPLATE_NUM + 1))
done

echo "════════════════════════════════════════════════════════"
echo "   ✅ ALL TEMPLATES REVIEWED!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "   Total Templates: $TOTAL"
echo "   Location: $LATEST_DIR"
echo ""
echo "To review again, run: ./view_templates_one_by_one.sh"
echo ""
