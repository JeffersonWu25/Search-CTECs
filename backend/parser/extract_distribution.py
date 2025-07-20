import re
from PIL import Image
import pytesseract
from pdf2image import convert_from_path

def parse_text_distribution(text: str) -> dict:
    """
    Parses OCR'd text for regex patterns and returns a distribution like {1: 6, 2: 7, ...}

    Args:
        text: The OCR'd text to parse

    Returns:
        A dictionary of ratings and counts
    """
    patterns = [
        r'(\d+)[^\d]*\((\d+)\)',  # "1-Very Low (9)" or "1 (9)"
    ]

    distribution = {}

    for pattern in patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            rating, count = int(match[0]), int(match[1])
            if 1 <= rating <= 6 and count > 0:
                distribution[rating] = count

    return distribution

def extract_question_distributions(text: str) -> list:
    """
    Extract distributions for individual questions from the text.
    Returns a list of dictionaries, one per question.
    """
    # Split text into sections by question numbers
    question_sections = re.split(r'\n(\d+\.\s)', text)

    distributions = []

    for i in range(1, len(question_sections), 2):  # Skip even indices (question numbers)
        if i + 1 < len(question_sections):
            question_num = question_sections[i].strip().rstrip('.')
            question_text = question_sections[i + 1]

            # Extract distribution for this question
            dist = parse_text_distribution(question_text)
            if dist:
                distributions.append({
                    'question': int(question_num),
                    'distribution': dist
                })

    return distributions

def extract_distribution_from_page(page_img: Image.Image) -> dict:
    """
    Extracts the response distribution from a full page image.
    """
    # Convert to grayscale for better OCR
    gray_page = page_img.convert("L")
    ocr_text = pytesseract.image_to_string(gray_page)
    print("OCR Output:\n", ocr_text)

    # Try to extract individual question distributions
    question_distributions = extract_question_distributions(ocr_text)

    if question_distributions:
        return question_distributions
    else:
        # Fallback to simple distribution parsing
        return parse_text_distribution(ocr_text)

def extract_distributions_from_pdf(pdf_path: str) -> dict:
    """
    Extracts distributions from every page of a multi-page CTEC PDF.

    Args:
        pdf_path (str): path to the CTEC PDF file

    Returns:
        dict: A dictionary mapping question numbers (1-5) to their distributions
              Format: {1: {1: count, 2: count, ...}, 2: {1: count, 2: count, ...}, ...}
    """
    # Convert only pages 2 and 3 to images (0-indexed: pages 1 and 2)
    pages = convert_from_path(pdf_path, dpi=300)
    pages = pages[1:3]

    # Initialize result dictionary for questions 1-5
    all_distributions = {i: {} for i in range(1, 6)}

    for i, page_img in enumerate(pages):
        print(f"\nProcessing Page {i + 1}")
        try:
            result = extract_distribution_from_page(page_img)
            if result is None:
                continue
                
            # Handle both list of dicts and single dict formats
            if isinstance(result, list):
                for item in result:
                    if isinstance(item, dict) and 'question' in item and 'distribution' in item:
                        question_num = item['question']
                        if 1 <= question_num <= 5:
                            all_distributions[question_num] = item['distribution']
            elif isinstance(result, dict):
                # If it's a single distribution dict, try to assign it to the appropriate question
                # This is a fallback for when question parsing fails
                if i == 0:  # First page typically has questions 1-3
                    for q in [1, 2, 3]:
                        if q not in all_distributions or not all_distributions[q]:
                            all_distributions[q] = result
                            break
                elif i == 1:  # Second page typically has questions 4-5
                    for q in [4, 5]:
                        if q not in all_distributions or not all_distributions[q]:
                            all_distributions[q] = result
                            break
                            
            print(f"Page {i + 1} Result: {result}")
        except Exception as e:
            print(f"Failed on page {i + 1}: {e}")
            continue

    return all_distributions

print(extract_distributions_from_pdf("backend/data/test.pdf"))
