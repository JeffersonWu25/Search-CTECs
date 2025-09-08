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

def get_distribution_for_one_question(text: str, file_identifier: str = "") -> dict:
    """
    Given the raw OCR text for a singular question, 
    extract the distribution, response count, and mean score.

    Args:
        text: the raw OCR text for a singular question

    Returns:
        {distribution: {1: count, 2: count, ..., 6: count}}
        
    Raises:
        ValueError: If OCR validation fails (total mismatch)
    """
    dist_pattern = re.compile(
        r"(?i)([1-6])(?:\s*[-–—]\s*[A-Za-z][A-Za-z\s–—-]*)?\s*\((\d+)\)" # catches 1-Very Low (9) and 1 (9)
    )
    pairs = dist_pattern.findall(text)

    # Build distribution (sparse: only bins we actually saw)
    distribution = {int(k): int(v) for k, v in pairs}

    # check if the extracted total matches the ocr total
    total_pattern = re.compile(r"(?i)(?:total|\[?\s*total\s*\]?)\s*\((\d+)\)", re.IGNORECASE)
    total_match = total_pattern.search(text)

    if total_match:
        ocr_total = int(total_match.group(1))
        calculated_total = sum(distribution.values())

        if ocr_total != calculated_total:
            file_info = f" [{file_identifier}]" if file_identifier else ""
            error_msg = f"OCR validation failed{file_info}: Total mismatch detected! OCR reported total: {ocr_total}, Calculated total: {calculated_total}, Missing values: {ocr_total - calculated_total} responses"
            print(f"⚠️  {error_msg}")
            raise ValueError(error_msg)

    return distribution

def get_distributions_for_first_5_survey_questions(text: str, file_identifier: str = "") -> list:
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
    validation_errors = []

    for question, pattern in survey_questions.items():
        match = re.search(pattern, text, flags=re.S)
        if match:
            block = match.group(0)
            try:
                results[question] = get_distribution_for_one_question(block, file_identifier)
            except ValueError as e:
                validation_errors.append(f"{question}: {str(e)}")

    # If any validation errors occurred, raise an exception
    if validation_errors:
        error_summary = f"OCR validation failed for {len(validation_errors)} questions: " + "; ".join(validation_errors)
        raise ValueError(error_summary)

    return results

def get_ocr_text_from_one_page(page_img: Image.Image) -> str:
    """
    Extracts the OCR text from a full page image using the optimal approach.

    Args:
        page_img: a full page image

    Returns:
        the OCR text from the page
    """
    # Extract red channel (clearest for black text)
    red_channel = page_img.split()[0] if len(page_img.split()) >= 3 else page_img.convert("L")

    # Use PSM 3 (automatic) - the winning combination
    return pytesseract.image_to_string(red_channel, config=r'--oem 3 --psm 3')

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
    try:
        # Convert only pages 2 and 3 to images (0-indexed: pages 1 and 2)
        pages = convert_from_path(pdf_path, dpi=300)
        pages = pages[1:3]

        full_ocr_text = ""

        for i, page_img in enumerate(pages):
            try:
                full_ocr_text += get_ocr_text_from_one_page(page_img)
            except Exception as e:
                raise Exception(f"OCR failed on page {i + 1}: {e}")

        print(f"OCR text: {full_ocr_text}")

        results = get_distributions_for_first_5_survey_questions(full_ocr_text, pdf_path)
        print(f"Results: {results}")
        return results

    except ValueError as e:
        raise ValueError(f"OCR validation failed for {pdf_path}: {e}")
    except Exception as e:
        raise Exception(f"Failed to extract distributions from {pdf_path}: {e}")
