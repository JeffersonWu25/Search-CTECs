"""
This file is used to test the extract.py file.
"""
import os
from pathlib import Path
from extract import extract_text_from_pdf, clean_text, extract_course_info, extract_quarter_and_year, extract_ratings, extract_comments

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

def test_extract_quarter_and_year():
    """Test quarter and term extraction"""
    text = "Course and Teacher Evaluations CTEC Spring 2024"
    dict_one = extract_quarter_and_year(text)
    assert dict_one['quarter'] == "Spring" and dict_one['year'] == "2024"

    # Test with actual PDF 1
    hist_text = clean_text(extract_text_from_pdf('data/test.pdf'))
    dict_two = extract_quarter_and_year(hist_text)
    assert dict_two['quarter'] == "Fall" and dict_two['year'] == "2024"

    # Test with actual PDF2
    hist_text = clean_text(extract_text_from_pdf('data/test2.pdf'))
    dict_two = extract_quarter_and_year(hist_text)
    assert dict_two['quarter'] == "Spring" and dict_two['year'] == "2024"

    # Test invalid text
    assert not extract_quarter_and_year("invalid text")
    print("extract_quarter_and_term tests passed!")

def test_extract_ratings():
    """Test ratings extraction"""
    # Test with sample text containing ratings
    sample_text = """
    Statistics Value Response Count 83 Mean 4.25
    Statistics Value Response Count 83 Mean 4.39
    Statistics Value Response Count 83 Mean 4.75
    Statistics Value Response Count 82 Mean 4.51
    Statistics Value Response Count 83 Mean 4.01
    """
    ratings = extract_ratings(sample_text)
    assert len(ratings) == 5, "Should extract 5 ratings"
    assert all(f"question_{i}" in ratings for i in range(1, 6)), "Should have questions 1-5"
    assert all(isinstance(float(ratings[f"question_{i}"]), float) for i in range(1, 6)), "All ratings should be numbers"

    # Test with actual PDF
    pdf_text = clean_text(extract_text_from_pdf('data/test.pdf'))
    pdf_ratings = extract_ratings(pdf_text)
    assert len(pdf_ratings) == 5, "Should extract 5 ratings from PDF"
    assert all(f"question_{i}" in pdf_ratings for i in range(1, 6)), "Should have questions 1-5 from PDF"

    print("extract_ratings tests passed!")

def test_extract_comments():
    """Test comments extraction"""
    # Test with sample text containing comments
    sample_text = """
    most important to you.
    This is the first comment
    and its continuation
    This is the second comment
    and its continuation
    Final comment
    DEMOGRAPHICS
    """
    comments = extract_comments(sample_text)
    assert len(comments) == 3, "Should extract 3 comments"
    assert "This is the first comment and its continuation" in comments
    assert "This is the second comment and its continuation" in comments
    assert "Final comment" in comments
    
    # Test filtering unwanted sections
    filter_text = """
    most important to you.
    Comments
    This is the first comment
    and its continuation
    Student Report for
    This is the second comment
    Student Report for hi memememe you
    and its continuation
    This is the third comment
    Comments
    DEMOGRAPHICS
    """
    filtered = extract_comments(filter_text)
    assert len(filtered) == 3
    assert "This is the first comment and its continuation" in filtered
    assert "This is the second comment and its continuation" in filtered
    assert "This is the third comment" in filtered

    # Test with actual PDF
    pdf_comments = extract_comments(extract_text_from_pdf('data/test.pdf'))
    assert isinstance(pdf_comments, list), "Should return a list"
    assert all(isinstance(comment, str) for comment in pdf_comments)

    print("extract_comments tests passed!")

if __name__ == "__main__":
    print("Running tests...")
    test_extract_text_from_pdf()
    test_clean_text()
    test_extract_course_info()
    test_extract_quarter_and_year()
    test_extract_ratings()
    test_extract_comments()
    print("All tests passed!")
