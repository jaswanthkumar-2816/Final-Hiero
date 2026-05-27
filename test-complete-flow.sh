#!/bin/bash

# Complete Resume Builder Flow Test Script
# Tests every single step and shows detailed results

BASE_URL="http://localhost:5003"
TOKEN=""
GENERATED_FILE=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Functions
log_step() {
    local step=$1
    local title=$2
    local status=$3
    
    case $status in
        "success") echo -e "${step}. ✅ ${GREEN}${title}${NC}" ;;
        "error") echo -e "${step}. ❌ ${RED}${title}${NC}" ;;
        "loading") echo -e "${step}. ⏳ ${CYAN}${title}${NC}" ;;
        *) echo -e "${step}. ℹ️ ${BLUE}${title}${NC}" ;;
    esac
}

log_detail() {
    local message=$1
    local indent=${2:-2}
    printf "%*s• %s\n" $indent "" "$message"
}

# Test Authentication
test_authentication() {
    log_step 1 "Testing Authentication" "loading"
    
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{}' \
        "${BASE_URL}/api/auth/demo")
    
    if echo "$response" | grep -q '"success":true'; then
        TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        local user_name=$(echo "$response" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        local user_email=$(echo "$response" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
        
        log_step 1 "Authentication Successful" "success"
        log_detail "Token: ${TOKEN:0:30}..."
        log_detail "User: $user_name ($user_email)"
        return 0
    else
        log_step 1 "Authentication Failed" "error"
        log_detail "Response: $response"
        return 1
    fi
}

# Test individual step
test_step() {
    local step_name=$1
    local step_number=$2
    local data=$3
    
    log_step $step_number "Testing $(echo ${step_name:0:1} | tr a-z A-Z)${step_name:1} Step" "loading"
    
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "$data" \
        "${BASE_URL}/api/resume/${step_name}")
    
    if echo "$response" | grep -q '"success":true'; then
        local message=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        log_step $step_number "$(echo ${step_name:0:1} | tr a-z A-Z)${step_name:1} Step Successful" "success"
        log_detail "Message: $message"
        
        # Show submitted data details
        case $step_name in
            "basic")
                log_detail "Data submitted:"
                log_detail "  Name: Complete Test User" 4
                log_detail "  Email: complete.test@example.com" 4
                log_detail "  Phone: +1-555-0123" 4
                ;;
            "education")
                log_detail "Data submitted:"
                log_detail "  2 education entries" 4
                log_detail "    1. Master of Science in Computer Science from Stanford University (2023)" 6
                log_detail "    2. Bachelor of Science in Software Engineering from University of California (2021)" 6
                ;;
            "projects")
                log_detail "Data submitted:"
                log_detail "  2 project entries" 4
                log_detail "    1. AI-Powered Resume Builder (2023)" 6
                log_detail "    2. E-commerce Platform (2022)" 6
                ;;
            "skills")
                log_detail "Data submitted:"
                log_detail "  Technical: JavaScript, Python, React, Node.js, AWS, Docker, MongoDB, PostgreSQL" 4
                log_detail "  Management: Team Leadership, Project Management, Agile Methodology" 4
                ;;
            "certifications")
                log_detail "Data submitted:"
                log_detail "  2 certifications" 4
                log_detail "    1. AWS Solutions Architect from Amazon Web Services (2023)" 6
                log_detail "    2. Certified ScrumMaster from Scrum Alliance (2022)" 6
                ;;
            "achievements")
                log_detail "Data submitted:"
                log_detail "  2 achievements" 4
                log_detail "    1. Best Innovation Award (2023)" 6
                log_detail "    2. Team Excellence Award (2022)" 6
                ;;
            "hobbies")
                log_detail "Data submitted:"
                log_detail "  Hobbies: Coding, Photography, Hiking, Chess, Reading Technology Blogs" 4
                ;;
            "personal_details")
                log_detail "Data submitted:"
                log_detail "  DOB: 1995-05-15" 4
                log_detail "  Gender: Male" 4
                log_detail "  Address: 123 Tech Street, Silicon Valley, CA 94000" 4
                ;;
            "references")
                log_detail "Data submitted:"
                log_detail "  2 references" 4
                log_detail "    1. Dr. Sarah Johnson (Professor and Thesis Advisor)" 6
                log_detail "    2. Michael Chen (Former Manager at TechCorp)" 6
                ;;
        esac
        
        return 0
    else
        log_step $step_number "$(echo ${step_name:0:1} | tr a-z A-Z)${step_name:1} Step Failed" "error"
        log_detail "Response: $response"
        return 1
    fi
}

# Test Resume Generation
test_resume_generation() {
    log_step 11 "Testing Resume Generation" "loading"
    
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        "${BASE_URL}/api/resume/generate-fast")
    
    if echo "$response" | grep -q '"success":true'; then
        local message=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        GENERATED_FILE=$(echo "$response" | grep -o '"file":"[^"]*"' | cut -d'"' -f4)
        local download_url=$(echo "$response" | grep -o '"downloadUrl":"[^"]*"' | cut -d'"' -f4)
        
        log_step 11 "Resume Generation Successful" "success"
        log_detail "Message: $message"
        log_detail "File: $GENERATED_FILE"
        log_detail "Download URL: $download_url"
        return 0
    else
        log_step 11 "Resume Generation Failed" "error"
        log_detail "Response: $response"
        return 1
    fi
}

# Test Resume Download
test_resume_download() {
    log_step 12 "Testing Resume Download" "loading"
    
    local download_url="${BASE_URL}/api/resume/download?file=${GENERATED_FILE}"
    local local_filename="downloaded_${GENERATED_FILE}"
    
    # Download the file
    curl -s -o "$local_filename" "$download_url"
    local curl_exit_code=$?
    
    if [ $curl_exit_code -eq 0 ] && [ -f "$local_filename" ]; then
        local file_size=$(stat -f%z "$local_filename" 2>/dev/null || stat -c%s "$local_filename" 2>/dev/null)
        
        log_step 12 "Resume Download Successful" "success"
        log_detail "Downloaded file: $local_filename"
        log_detail "File size: $file_size bytes"
        
        # Check if it's a valid PDF
        if file "$local_filename" | grep -q "PDF"; then
            log_detail "✓ Valid PDF file confirmed"
        else
            log_detail "⚠ File may not be a valid PDF"
        fi
        
        # Get more details about the download
        local content_type=$(curl -s -I "$download_url" | grep -i "content-type" | cut -d' ' -f2- | tr -d '\r\n')
        local content_disposition=$(curl -s -I "$download_url" | grep -i "content-disposition" | cut -d' ' -f2- | tr -d '\r\n')
        
        log_detail "Content-Type: $content_type"
        log_detail "Content-Disposition: $content_disposition"
        
        return 0
    else
        log_step 12 "Resume Download Failed" "error"
        log_detail "Curl exit code: $curl_exit_code"
        return 1
    fi
}

# Test Template System
test_templates() {
    log_step 13 "Testing Template System" "loading"
    
    local response=$(curl -s -X GET \
        "${BASE_URL}/api/resume/templates")
    
    if echo "$response" | grep -q '"success":true'; then
        local template_name=$(echo "$response" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        local template_category=$(echo "$response" | grep -o '"category":"[^"]*"' | cut -d'"' -f4)
        local template_description=$(echo "$response" | grep -o '"description":"[^"]*"' | cut -d'"' -f4)
        
        log_step 13 "Template System Working" "success"
        log_detail "Template: $template_name"
        log_detail "Category: $template_category"
        log_detail "Description: $template_description"
        return 0
    else
        log_step 13 "Template System Failed" "error"
        log_detail "Response: $response"
        return 1
    fi
}

# Main test function
run_complete_test() {
    echo
    echo "================================================================================"
    echo -e "${BOLD}🚀 COMPLETE RESUME BUILDER FLOW TEST${NC}"
    echo -e "${CYAN}Testing every single step from authentication to download${NC}"
    echo "================================================================================"
    
    local passed=0
    local failed=0
    
    # Test 1: Authentication
    if test_authentication; then
        ((passed++))
    else
        ((failed++))
        echo
        echo -e "${RED}❌ Cannot continue without authentication. Exiting.${NC}"
        return
    fi
    
    echo
    
    # Test all data submission steps
    declare -A test_data
    
    # Basic info
    test_data[basic]='{"full_name":"Complete Test User","contact_info":{"email":"complete.test@example.com","phone":"+1-555-0123","website":"https://linkedin.com/in/completetest"},"career_summary":"Experienced software developer with 5+ years of expertise"}'
    
    # Education
    test_data[education]='{"education":[{"institution":"Stanford University","degree":"Master of Science in Computer Science","year":"2023","gpa":"3.9"},{"institution":"University of California","degree":"Bachelor of Science in Software Engineering","year":"2021","gpa":"3.7"}]}'
    
    # Projects
    test_data[projects]='{"projects":[{"title":"AI-Powered Resume Builder","description":"Built a full-stack application using React, Node.js, and machine learning algorithms","duration":"6 months","year":"2023"},{"title":"E-commerce Platform","description":"Developed a scalable e-commerce solution with microservices architecture","duration":"8 months","year":"2022"}]}'
    
    # Skills
    test_data[skills]='{"skills":{"technical":["JavaScript","Python","React","Node.js","AWS","Docker","MongoDB","PostgreSQL"],"management":["Team Leadership","Project Management","Agile Methodology","Cross-functional Collaboration"]}}'
    
    # Certifications
    test_data[certifications]='{"certifications":[{"name":"AWS Solutions Architect","issuer":"Amazon Web Services","year":"2023"},{"name":"Certified ScrumMaster","issuer":"Scrum Alliance","year":"2022"}]}'
    
    # Achievements
    test_data[achievements]='{"achievements":[{"title":"Best Innovation Award","description":"Recognized for developing cutting-edge AI solutions","year":"2023"},{"title":"Team Excellence Award","description":"Led a team of 8 developers to deliver project 2 months ahead of schedule","year":"2022"}]}'
    
    # Hobbies
    test_data[hobbies]='{"hobbies":["Coding","Photography","Hiking","Chess","Reading Technology Blogs"]}'
    
    # Personal details
    test_data[personal_details]='{"personal_details":{"dob":"1995-05-15","gender":"Male","address":"123 Tech Street, Silicon Valley, CA 94000"}}'
    
    # References
    test_data[references]='{"references":[{"name":"Dr. Sarah Johnson","contact":"sarah.johnson@stanford.edu","relationship":"Professor and Thesis Advisor"},{"name":"Michael Chen","contact":"m.chen@techcorp.com","relationship":"Former Manager at TechCorp"}]}'
    
    # Test all steps
    local step_number=2
    for step in basic education projects skills certifications achievements hobbies personal_details references; do
        if test_step "$step" $step_number "${test_data[$step]}"; then
            ((passed++))
        else
            ((failed++))
        fi
        echo
        ((step_number++))
    done
    
    # Test resume generation
    if test_resume_generation; then
        ((passed++))
        echo
        
        # Test download
        if test_resume_download; then
            ((passed++))
        else
            ((failed++))
        fi
    else
        ((failed++))
    fi
    
    echo
    
    # Test template system
    if test_templates; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # Final summary
    echo
    echo "================================================================================"
    echo -e "${BOLD}📊 TEST SUMMARY${NC}"
    echo "================================================================================"
    echo -e "${GREEN}✅ Passed: $passed tests${NC}"
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}❌ Failed: $failed tests${NC}"
    else
        echo -e "${RED}❌ Failed: $failed tests${NC}"
    fi
    
    local total=$((passed + failed))
    local success_rate=$((passed * 100 / total))
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}📈 Success Rate: ${success_rate}%${NC}"
        echo
        echo -e "${GREEN}🎉 ALL TESTS PASSED! Resume Builder is working perfectly!${NC}"
    else
        echo -e "${YELLOW}📈 Success Rate: ${success_rate}%${NC}"
        echo
        echo -e "${YELLOW}⚠️  $failed test(s) failed. Please check the issues above.${NC}"
    fi
    
    echo "================================================================================"
}

# Run the test
run_complete_test
