"""
This file is used to upload the data from the CTEC PDF to the database.
"""

import os
from typing import Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client
from extract import extract_all_info

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_or_insert_course(code: str, title: str, school: str = None) -> str:
    """
    Returns the ID of an existing course by code.
    If not found, inserts the course and returns the new ID.
    """

    # Check for existing course
    response = supabase.table("courses").select("id").eq("code", code).limit(1).execute()
    if response.data:
        return response.data[0]["id"]

    # Insert new course
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
    Find or insert an instructor and return their ID.
    """

    response = supabase.table("instructors").select("id").eq("name", name).limit(1).execute()
    if response.data:
        return response.data[0]["id"]

    insert_response = supabase.table("instructors").insert({"name": name}).execute()

    if not insert_response.data:
        raise RuntimeError("Instructor insert failed or returned no data")

    return insert_response.data[0]["id"]

def get_question_id(question_number: int) -> str:
    """
    Get the ID of a question by its number (1-5).
    Raises an error if not found.
    """
    response = supabase.table("ctec_questions").select("id").eq("display_order", question_number).limit(1).execute()

    if not response.data:
        raise ValueError(f"Question with display_order {question_number} not found in database")

    return response.data[0]["id"]

def create_course_offering(course_id: str, instructor_id: str, quarter: str, year: int, audience_size: int, response_count: int) -> int:
    """
    Create a course offering and return its ID.
    Links a course with an instructor for a specific term.
    """
    offering_data = {
        "course_id": course_id,
        "instructor_id": instructor_id,
        "quarter": quarter,
        "year": year,
        "audience_size": audience_size,
        "response_count": response_count
    }

    print("🚀 Upserting into course_offerings:", offering_data)
    response = supabase.table("course_offerings").upsert(
        offering_data,
        on_conflict="course_id, instructor_id, quarter, year"
    ).execute()

    if not response.data:
        raise ValueError("Course offering upsert failed or returned no data")

    print("✅ Raw response:", response.data)
    return response.data[0]["id"]

def create_ctec_responses(course_offering_id: str, question_id: str, mean_score: float, distribution: Dict[str, Any]) -> int:
    """
    Create CTEC responses and return their ID.
    """
    full_response_data = {
        "course_offering_id": course_offering_id,
        "question_id": question_id,
        "mean_score": mean_score,
        "distribution": distribution
    }

    print("🚀 Upserting into ctec_responses:", full_response_data)
    response = supabase.table("ctec_responses").upsert(
        full_response_data,
        on_conflict="course_offering_id, question_id"
    ).execute()

    if not response.data:
        raise ValueError("CTEC response upsert failed or returned no data")

    print("✅ Raw response:", response.data)
    return response.data[0]["id"]

def upload_ctec(pdf_path: str) -> Dict[str, Any]:
    """
    Main function to process a CTEC PDF and upload all data to Supabase.
    Returns IDs of created records.
    """
    try:
        # Extract data from PDF
        extracted_data = extract_all_info(pdf_path)

        if not extracted_data:
            raise ValueError(f"No data extracted from {pdf_path}")

        # Create records in correct order (following foreign key relationships)
        course_id = get_or_insert_course(extracted_data["code"], extracted_data["title"], None)
        instructor_id = get_or_insert_instructor(extracted_data["instructor"])

        offering_id = create_course_offering(course_id, instructor_id, extracted_data["quarter"],
                                             extracted_data["year"], extracted_data["audience_size"],
                                             extracted_data["response_count"])

        # Upload main CTEC responses (questions 1-5)
        distributions = extracted_data.get("distributions", {})
        print(f"📊 Extracted distributions: {distributions}")
        
        for question_key, rating in extracted_data["ratings"].items():
            # Extract question number from the question key (e.g., "question_1" -> 1)
            question_num = int(question_key.split("_")[1])

            # Get the question ID from the database
            question_id = get_question_id(question_num)

            # Get the distribution for this question, or empty dict if not found
            question_distribution = distributions.get(question_num, {})

            create_ctec_responses(offering_id, question_id, rating, question_distribution)

        # Upload time survey data (question 6)
        time_survey = extracted_data.get("time_survey", {})
        if time_survey and "time_survey" in time_survey:
            print(f"⏰ Time survey data: {time_survey}")
            time_survey_question_id = get_question_id(6)  # display_order 6
            # For time survey, we'll use the distribution data directly
            create_ctec_responses(offering_id, time_survey_question_id, 0.0, time_survey["time_survey"])

        # Upload demographics data
        demographics = extracted_data.get("demographics", {})
        if demographics:
            print(f"📈 Demographics data: {demographics}")
            
            # Upload department/school data (question 7)
            if "school_name" in demographics:
                department_question_id = get_question_id(7)  # display_order 7
                create_ctec_responses(offering_id, department_question_id, 0.0, demographics["school_name"])
            
            # Upload class year data (question 8)
            if "class_year" in demographics:
                class_year_question_id = get_question_id(8)  # display_order 8
                create_ctec_responses(offering_id, class_year_question_id, 0.0, demographics["class_year"])
            
            # Upload distribution requirement data (question 9)
            if "distribution_requirement" in demographics:
                requirement_question_id = get_question_id(9)  # display_order 9
                create_ctec_responses(offering_id, requirement_question_id, 0.0, demographics["distribution_requirement"])
            
            # Upload prior interest data (question 10)
            if "prior_interest" in demographics:
                interest_question_id = get_question_id(10)  # display_order 10
                create_ctec_responses(offering_id, interest_question_id, 0.0, demographics["prior_interest"])

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
        result = upload_ctec("backend/data/test.pdf")
        print("Successfully uploaded CTEC!")
        print("Created records:", result)
    except Exception as e:
        print(f"Failed to upload CTEC: {e}")
