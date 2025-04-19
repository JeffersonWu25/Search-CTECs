import re
import os
from pypdf import PdfReader

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts text from all pages of a PDF file.

    Args:
        pdf_path: The full path to the PDF file.

    Returns:
        A single string containing the extracted text from all pages,
        or an empty string if the file doesn't exist or text extraction fails.
    """
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found at {pdf_path}")
        return ""

    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:  # Append text only if extraction was successful for the page
                text += extracted + "\n" # Add newline between pages for clarity before cleaning
        return text
    except Exception as e:
        print(f"Error reading or extracting text from {pdf_path}: {e}")
        return ""

def clean_text(text: str) -> str:
    """
    Cleans up extracted text by:
    1. Splitting into lines based on original line breaks.
    2. Stripping leading/trailing whitespace from each line.
    3. Filtering out lines that become empty after stripping.
    4. Joining the remaining lines back into a single string,
       separated by single spaces. This effectively "unwraps" text.

    Args:
        text: The raw text string (potentially multi-line).

    Returns:
        A single string with cleaned text, joined by spaces.
    """
    if not text:
        return ""
    # Split, strip, filter empty lines, and join with spaces
    return ' '.join(line.strip() for line in text.splitlines() if line.strip())

def extract_course_info(text: str):
    """
    Extracts course code, title, and instructor from cleaned
    (single-string, space-separated) PDF text using two regex patterns.

    It searches for the first occurrence of a recognizable pattern within
    the entire text block.

    Args:
        cleaned_pdf_text: The output string from the clean_text function.

    Returns:
        A dictionary containing 'course_title', 'course_code',
        and 'instructor' if a match is found, otherwise returns None.
    """
    # Regex Pattern 1: Matches "TITLE (CODES_STRING) (INSTRUCTOR)" format
    # - No ^/$ anchors to allow matching anywhere within the cleaned text.
    # - (.*?): Non-greedy capture for Title and Codes String.
    # - \s*: Optional whitespace.
    # - ([^)]+): Captures Instructor name inside parentheses.
    pattern1 = re.compile(r"Student Report for (.*?)\((.*?)\)\s*\(([^)]+)\)")

    # Regex Pattern 2: Matches "CODE: TITLE (INSTRUCTOR)" format
    # - No ^/$ anchors.
    # - ([^:]+): Captures Code (anything not a colon).
    # - (.*?): Non-greedy capture for Title.
    # - \s*: Optional whitespace.
    # - ([^)]+): Captures Instructor name inside parentheses.
    pattern2 = re.compile(r"Student Report for ([^:]+):\s*(.*?)\s*\(([^)]+)\)")

    course_info = {}
    if not text:
        print("Warning: Input text for extraction is empty.")
        return None

    # Use re.search to find the first occurrence of either pattern
    match1 = pattern1.search(text)
    match2 = pattern2.search(text)

    selected_match = None
    pattern_used = 0 # 0 = None, 1 = Pattern1, 2 = Pattern2

    # Prioritize the match that appears earlier in the text if both somehow match
    if match1 and match2:
        if match1.start() <= match2.start():
            selected_match = match1
            pattern_used = 1
        else:
            selected_match = match2
            pattern_used = 2
    elif match1:
        selected_match = match1
        pattern_used = 1
    elif match2:
        selected_match = match2
        pattern_used = 2

    # Process the selected match based on which pattern was used
    if selected_match and pattern_used == 1:
        try:
            course_title = selected_match.group(1).strip()
            codes_part = selected_match.group(2).strip()
            instructor = selected_match.group(3).strip()
            # Extract base code: split by comma, take part before colon, remove section number
            codes = [item.split(':')[0].strip() for item in codes_part.split(',') if ':' in item]
            # Remove section numbers (e.g., _1, _2) and take first code
            base_code = codes[0].rsplit('_', 1)[0] if codes else ""

            course_info['course_title'] = course_title
            course_info['course_code'] = base_code
            course_info['instructor'] = instructor
        except IndexError:
            print(f"Error processing groups for Pattern 1 match: {selected_match.groups()}")
            return None

    elif selected_match and pattern_used == 2:
        try:
            course_code = selected_match.group(1).strip()
            course_title = selected_match.group(2).strip()
            instructor = selected_match.group(3).strip()
            # Remove section number if present
            base_code = course_code.rsplit('_', 1)[0]

            course_info['course_title'] = course_title
            course_info['course_code'] = base_code
            course_info['instructor'] = instructor
        except IndexError:
            print(f"Error processing groups for Pattern 2 match: {selected_match.groups()}")
            return None

    else:
        # No known pattern was found in the text
        print("Info: Could not match known 'Student Report for...' patterns within the text.")
        return None # Return None if no pattern matched

    return course_info

def extract_quarter_and_year(text: str):
    """
    Extracts quarter and year from CTEC text.
    Returns tuple of (quarter, year) or (None, None) if not found.
    """
    term_info = {}
    if not text:
        return {}

    match = re.search(r"Course and Teacher Evaluations CTEC (Spring|Fall|Winter|Summer) (\d{4})", text)
    if not match:
        return {}

    term_info['quarter'] = match.group(1)
    term_info['year'] = match.group(2)

    return term_info

def extract_ratings(text: str) -> dict:
    """
    Extracts ratings from CTEC text.
    Returns a dictionary of questions 1-5 and their ratings.
    """
    ratings = {}

    # Find all occurrences of "Mean" followed by a number
    matches = re.finditer(r"Mean\s+(\d+\.?\d*)", text)

    for i, match in enumerate(matches, 1):
        if i > 5:  # We only want the first 5 questions
            break
        mean = match.group(1)
        ratings[f"question_{i}"] = mean

    return ratings

def extract_comments(raw_text: str) -> list:
    """
    Extracts comments from CTEC text.
    Returns a list of comments.
    """
    # Find the comments section
    start = raw_text.find("most important to you.") + len("most important to you.")
    end = raw_text.find("DEMOGRAPHICS", start)
    if end == -1:
        end = len(raw_text)

    # Get the comments section and split into lines
    comment_text = raw_text[start:end].strip()
    lines = [line.strip() for line in comment_text.split('\n') if line.strip()]

    # Filter out unwanted sections and combine lines into comments
    comments = []
    current = []

    for line in lines:
        if "Comments" in line or "Student Report for" in line:
            continue
        if line[0].isupper() and current:
            comments.append(' '.join(current))
            current = [line]
        else:
            current.append(line)

    if current:
        comments.append(' '.join(current))

    return comments
