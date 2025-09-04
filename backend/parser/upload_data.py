"""
This file is used to upload the data from the CTEC PDF to the database.
"""

import os
from typing import Dict, Any, List
from dotenv import load_dotenv
from supabase import create_client, Client
from extract import extract_all_info
import google.generativeai as genai

# Load environment variables
load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def get_or_insert_course(code: str, title: str, school: str = None) -> str:
    """
    Returns the ID of an existing course by checking a unique code.
    If not found, inserts the course and returns the new ID.

    Args:
        code: CS2014_0
        title: Introduction to Computer Science
        school: Mccormick School of Engineering

    Returns:
        The database ID of the course.
    """

    # Check if the course already exists in the database by code
    response = supabase.table("courses").select("id").eq("code", code).limit(1).execute()
    if response.data:
        return response.data[0]["id"]

    # Insert new course if it doesn't exist
    new_course = {
        "code": code,
        "title": title,
        "school": school
    }
    insert_response = supabase.table("courses").insert(new_course).execute()

    if not insert_response.data:
        raise RuntimeError("Course insert failed or returned no data")

    return insert_response.data[0]["id"]


def get_or_insert_instructor(name: str) -> int:
    """
    Find or insert an instructor based on their name
    if not found, insert the instructor and return the new ID.

    Args:
        name: "John Doe"

    Returns:
        The database ID of the instructor.
    """

    # Check if the instructor already exists in the database by name
    response = supabase.table("instructors").select("id").eq("name", name).limit(1).execute()
    if response.data:
        return response.data[0]["id"]

    insert_response = supabase.table("instructors").insert({"name": name}).execute()

    if not insert_response.data:
        raise RuntimeError("Instructor insert failed or returned no data")

    return insert_response.data[0]["id"]

def create_course_offering(course_id: str, instructor_id: str, quarter: str, year: int, audience_size: int, response_count: int, section: int, ai_summary: str) -> int:
    """
    Create a course offering and return its ID.
    Links a course with an instructor for a specific term.

    Args:
        course_id: The database ID of the course.
        instructor_id: The database ID of the instructor.
        quarter: The quarter of the course.
        year: The year of the course.
        audience_size: The number of students in the course.
        response_count: The number of responses to the course.
        section: The section of the course.

    Returns:
        The database ID of the course offering.
    """
    offering_data = {
        "course_id": course_id,
        "instructor_id": instructor_id,
        "quarter": quarter,
        "year": year,
        "audience_size": audience_size,
        "response_count": response_count,
        "section": section,
        "ai_summary": ai_summary
    }

    response = supabase.table("course_offerings").upsert(
        offering_data,
        on_conflict="course_id, instructor_id, quarter, year, section"
    ).execute()

    if not response.data:
        raise ValueError("Course offering upsert failed or returned no data")

    return response.data[0]["id"]

def create_survey_responses(course_offering_id: str, survey_question: str, distribution: Dict[str, Any]) -> int:
    """
    Create survey responses and return their ID.

    Args:
        course_offering_id: The database ID of the course offering.
        survey_question: The survey question (e.g. "How would you rate the instructor's teaching?").
        distribution: The distribution of the survey response.
    """
    full_response_data = {
        "course_offering_id": course_offering_id,
        "survey_question": survey_question,
        "distribution": distribution
    }

    response = supabase.table("survey_responses").upsert(
        full_response_data,
        on_conflict="course_offering_id, survey_question"
    ).execute()

    if not response.data:
        raise ValueError("CTEC response upsert failed or returned no data")

    return response.data[0]["id"]

def create_comments(course_offering_id: str, comments: List[str]) -> list[int]:
    """
    upload the comments of a CTEC course offering to the database.

    Args:
        course_offering_id: The database ID of the course offering.
        comments: the list of string comments

    Returns:
        The database ID of the comment.
    """
    comment_ids = []
    for comment in comments:

        comment_data = {
            "course_offering_id": course_offering_id,
            "content": comment
        }

        response = supabase.table("comments").upsert(
            comment_data,
            on_conflict="course_offering_id, content"
        ).execute()

        if not response.data:
            raise ValueError("Comment insert failed or returned no data")

        comment_ids.append(response.data[0]["id"])

    return comment_ids

def generate_ai_summary(comments: List[str]) -> str:
    """
    Generate a summary of the comments using AI.

    Args:
        comments: the list of string comments

    Returns:
        the AI summary of the comments
    """
    query = f"""
    You are summarizing student course evaluation comments.

    TASK:
    - If there are no comments, return exactly: "No comments provided."
    - Otherwise, write a clear, concise summary that must be no longer than 125 words.
    - everything should be in one paragraph.

    CONTENT TO HIGHLIGHT (only if present in the comments):
    - Major assignments and grading policy (include percentages only if explicitly mentioned)
    - What students reported learning from the course and whether the content was useful
    - Course difficulty and workload/time commitment
    - Major likes (what students appreciated)
    - Major dislikes (what students did not like)
    - Instructor teaching quality
    - Any other important information mentioned
    - TLDR recommendation (only if there is a clear consensus in the comments)

    RULES:
    - Use only information explicitly found in the comments.
    - Do not speculate or add details not present.
    - Keep the style neutral, professional, and helpful for students deciding on the course.
    - Output should be plain text, no bullet points.

    Here are the comments:
    {comments}
    """
    response = model.generate_content(query)
    return response.text

def upload_ctec(pdf_path: str) -> Dict[str, Any]:
    """
    Main function to parse one CTEC PDF and upload all data to Supabase.
    Returns IDs of created records.

    Args:
        pdf_path: The path to the PDF file.

    Returns:
        the database ID of the course offering. 
    """
    try:
        # Extract data from PDF
        extracted_data = extract_all_info(pdf_path)

        if not extracted_data:
            raise ValueError(f"No data extracted from {pdf_path}")

        # Generate AI summary of the comments
        ai_summary = generate_ai_summary(extracted_data["comments"])

        # Create records in correct order (following foreign key relationships)
        course_id = get_or_insert_course(extracted_data["code"], extracted_data["title"], extracted_data["school"])
        instructor_id = get_or_insert_instructor(extracted_data["instructor"])

        offering_id = create_course_offering(course_id, instructor_id, extracted_data["quarter"],
                                             extracted_data["year"], extracted_data["audience_size"],
                                             extracted_data["response_count"], extracted_data["section"],
                                             ai_summary)

        # upload survey responses
        for question, distribution in extracted_data["survey_responses"].items():
            create_survey_responses(offering_id, question, distribution)

        # remove previous comments attached to the offering
        supabase.table("comments").delete().eq("course_offering_id", offering_id).execute()

        # upload comments
        create_comments(offering_id, extracted_data["comments"])

        print(f"Successfully uploaded the following CTEC data: {extracted_data}")

    except Exception as e:
        print(f"Error uploading CTEC data: {e}")
        raise

    return {
        "course_id": course_id,
        "instructor_id": instructor_id,
        "offering_id": offering_id
    }

if __name__ == "__main__":
    # Example usage
    try:
        for i in range(2, 11):
            result = upload_ctec(f"backend/data/test{i}.pdf")
            print(f"Successfully uploaded CTEC {i}!")
            print("Created records:", result)
    except Exception as e:
        print(f"Failed to upload CTEC: {e}")
