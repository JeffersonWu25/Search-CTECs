"""
Extracts rating distributions from CTEC PDFs for the following questions:
1. Rating of Instruction
2. Rating of Course
3. Estimated Learning
4. Intellectual Challenge
5. Stimulating Instructor
"""

import re
from PIL import Image
import pytesseract
from pdf2image import convert_from_path

def get_distribution_for_one_question(text: str) -> dict:
    """
    Given the raw OCR text for a singular question, 
    extract the distribution, response count, and mean score.

    Args:
        text: the raw OCR text for a singular question

    Returns:
        {distribution: {1: count, 2: count, ..., 6: count}}
    """
    dist_pattern = re.compile(
        r"(?i)([1-6])(?:\s*[-–—]\s*[A-Za-z][A-Za-z\s–—-]*)?\s*\((\d+)\)" # catches 1-Very Low (9) and 1 (9)
    )
    pairs = dist_pattern.findall(text)

    # Build distribution (sparse: only bins we actually saw)
    distribution = {int(k): int(v) for k, v in pairs}

    return distribution

def get_distributions_for_first_5_survey_questions(text: str) -> list:
    """
    Extract distributions for the first 5 survey questions from the text.
    Returns a list of dictionaries, one per question.

    Args:
        text: the raw OCR text for first 5 survey questions

    Returns:
        {
            rating_of_instruction: {distribution: {}},
            rating_of_course: {distribution: {}},
            estimated_learning: {distribution: {}},
            intellectual_challange: {distribution: {}},
            stimulating_instructor: {distribution: {}},
        }
    """

    survey_questions = {
        "rating_of_instruction": r"1\.\s*Provide an overall rating of the instruction.*?(?=2\.\s*Provide)",
        "rating_of_course": r"2\.\s*Provide an overall rating of the course.*?(?=3\.\s*Estimate)",
        "estimated_learning": r"3\.\s*Estimate how much you learned in the course.*?(?=4\.\s*Rate)",
        "intellectual_challenge": r"4\.\s*Rate the effectiveness of the course in challenging you intellectually.*?(?=5\.\s*Rate)",
        "stimulating_instructor": r"5\.\s*Rate the effectiveness of the instructor in stimulating your interest in the subject.*"
    }

    results = {}
    for question, pattern in survey_questions.items():
        match = re.search(pattern, text, flags=re.S)
        if match:
            block = match.group(0)
            results[question] = get_distribution_for_one_question(block)

    return results

def get_ocr_text_from_one_page(page_img: Image.Image) -> str:
    """
    Extracts the OCR text from a full page image.

    Args:
        page_img: a full page image

    Returns:
        the OCR text from the page
    """
    # Convert to grayscale for better OCR
    gray_page = page_img.convert("L")
    return pytesseract.image_to_string(gray_page)

def extract_distributions_from_pdf(pdf_path: str) -> dict:
    """
    Extracts distributions from every page of a multi-page CTEC PDF.

    Args:
        pdf_path: path to the CTEC PDF file

    Returns:
        {
            "rating_of_instruction": {distribution: {}},
            "rating_of_course": {distribution: {}},
            "estimated_learning": {distribution: {}},
            "intellectual_challenge": {distribution: {}},
            "stimulating_instructor": {distribution: {}},
        }
    """
    # Convert only pages 2 and 3 to images (0-indexed: pages 1 and 2)
    pages = convert_from_path(pdf_path, dpi=300)
    pages = pages[1:3]

    full_ocr_text = ""

    for i, page_img in enumerate(pages):
        print(f"\nProcessing Page {i + 1}")
        try:
            full_ocr_text += get_ocr_text_from_one_page(page_img)
        except Exception as e:
            print(f"Failed on page {i + 1}: {e}")

    return get_distributions_for_first_5_survey_questions(full_ocr_text)
