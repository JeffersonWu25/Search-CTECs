"""
This file is used to test the extract.py file.
"""
import os
from pathlib import Path
from extract import extract_text_from_pdf, clean_text, extract_course_info

def test_extract_text_from_pdf():
    """Test PDF text extraction"""
    # Test valid PDFs
    text1 = extract_text_from_pdf('data/test.pdf')
    assert text1 != "", "test.pdf should not be empty"
    assert "Student Report for" in text1, "test.pdf should contain expected content"

    text2 = extract_text_from_pdf('data/test2.pdf')
    assert text2 != "", "test2.pdf should not be empty"
    assert "Student Report for" in text2, "test2.pdf should contain expected content"

    # Test nonexistent file
    text3 = extract_text_from_pdf('nonexistent.pdf')
    assert text3 == "", "nonexistent file should return empty string"

    print("extract_text_from_pdf tests passed!")

def test_clean_text():
    """Test text cleaning"""
    # Test basic cleaning
    dirty_text = "Line 1\n  Line 2  \nLine 3\n\n"
    clean = clean_text(dirty_text)
    assert clean == "Line 1 Line 2 Line 3", "clean_text should join lines with single spaces"

    # Test empty string
    empty_text = clean_text("")
    assert empty_text == "", "clean_text should handle empty string"

    print("clean_text tests passed!")

def test_extract_course_info():
    """Test course info extraction"""
    # Test Data Structures course
    ds_text = clean_text(extract_text_from_pdf('data/test.pdf'))
    ds_info = extract_course_info(ds_text)
    assert ds_info is not None, "Should successfully extract course info from test.pdf"
    assert ds_info['course_title'] == 'Data Structures & Algorithms', "Wrong course title"
    assert ds_info['course_code'] == 'COMP_SCI_214-0', "Wrong course code"
    assert ds_info['instructor'] == 'Vincent St-Amour', "Wrong instructor"

    # Test History course
    hist_text = clean_text(extract_text_from_pdf('data/test2.pdf'))
    hist_info = extract_course_info(hist_text)
    assert hist_info is not None, "Should successfully extract course info from test2.pdf"
    assert hist_info['course_title'] == 'Global History II', "Wrong course title"
    assert hist_info['course_code'] == 'HISTORY_250-2', "Wrong course code"
    assert hist_info['instructor'] == 'Robin Bates', "Wrong instructor"

    print("extract_course_info tests passed!")

def test_extract_quarter_and_term():
    """Test quarter and term extraction"""
    text = "Course and Teacher Evaluations CTEC Spring 2024"
    quarter, year = extract_quarter_and_term(text)
    assert quarter == "Spring" and year == "2024"
    
    # Test with actual PDF
    hist_text = clean_text(extract_text_from_pdf('data/test2.pdf'))
    quarter, year = extract_quarter_and_term(hist_text)
    assert quarter == "Spring" and year == "2024"
    
    # Test invalid
    quarter, year = extract_quarter_and_term("invalid text")
    assert quarter is None and year is None
    
    print("extract_quarter_and_term tests passed!")

if __name__ == "__main__":
    # Change to the backend directory to make paths work
    os.chdir(Path(__file__).parent.parent)
    
    print("Running tests...")
    test_extract_text_from_pdf()
    test_clean_text()
    test_extract_course_info()
    test_extract_quarter_and_term()
    print("All tests passed!")
