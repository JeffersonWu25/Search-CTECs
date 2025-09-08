"""
This file is used to upload the data from the CTEC PDF to the database.
"""

import os
import glob
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

def create_or_update_instructor_summary(instructor_id: str, course_ai_summary: str) -> str:
    """
    Create an ai summary for an instructor or update the existing one.

    Args:
        instructor_id: The database ID of the instructor.
        course_ai_summary: The AI summary of a specific course offering.

    Returns:
        str: The generated instructor summary.
    """
    all_summaries = []

    try:
        response = supabase.table("course_offerings").select(
            "ai_summary"
        ).eq("instructor_id", instructor_id).execute()
        if response.data:
            for summary in response.data:
                # Filter out None/empty summaries
                if summary["ai_summary"] and summary["ai_summary"].strip():
                    all_summaries.append(summary["ai_summary"])
    except Exception as e:
        print(f"Error getting course offerings for instructor {instructor_id}: {e}")
        raise

    # Add the new course summary if it's not None/empty
    if course_ai_summary and course_ai_summary.strip():
        all_summaries.append(course_ai_summary)

    # Handle the case where there are no reviews
    if not all_summaries:
        instructor_summary = "No reviews provided."
    else:
        # Join all summaries into a single string
        reviews_text = "\n\n".join(all_summaries)

        query = f"""
        You will write a plain-text summary of an instructor's teaching style
        based off of aggregated reviews of all of their course offerings.
        These reviews may contain both course-level and instructor-level remarks.

        BEFORE YOU WRITE:
        - Consider only statements about the instructor themselves, not the course.

        TASK:
        - If there are no reviews, return exactly: "No reviews provided."
        - Otherwise, write a clear, concise summary that must be no longer than 125 words.
        - everything should be in one paragraph.

        CONTENT TO PRESENT:
        - only talk about information that explicilty pertains to the instructor not the course.
        - Things that the instructor does well
        - Things that students disliked about the instructor
        - Focus on these instructor traits when present: clarity/organization, engagement/enthusiasm, 
          approachability/support & responsiveness, feedback quality & grading transparency, pacing choices, 
          inclusivity/class environment, use of examples/demos, TA/mentor coordination.


        RULES:
        - Use only information explicitly found in the reviews.
        - Do not speculate or add details not present.
        - Keep the style neutral, professional, and helpful for students deciding on the course.
        - Output should be plain text, no bullet points.

        Here are the reviews:
        {reviews_text}
        """

        response = model.generate_content(query)
        instructor_summary = response.text

    supabase.table("instructors").update(
        {"ai_instructor_summary": instructor_summary}
    ).eq("id", instructor_id).execute()
    return instructor_summary

def upload_ctec(pdf_path: str) -> Dict[str, Any]:
    """
    Main function to parse one CTEC PDF and upload all data to Supabase.
    Returns IDs of created records.

    Args:
        pdf_path: The path to the PDF file.

    Returns:
        the database ID of the course offering. 
    """
    print(f"\n{'='*60}")
    print(f"PROCESSING: {pdf_path}")
    print(f"{'='*60}")

    try:
        # Extract data from PDF
        print("📄 Extracting data from PDF...")
        extracted_data = extract_all_info(pdf_path)

        if not extracted_data:
            raise ValueError(f"No data extracted from {pdf_path}")

        # Print extracted data (excluding comments)
        print("✅ Data extracted successfully!")
        print(f"   Course: {extracted_data['code']} - {extracted_data['title']}")
        print(f"   Instructor: {extracted_data['instructor']}")
        print(f"   Term: {extracted_data['quarter']} {extracted_data['year']}")
        print(f"   Section: {extracted_data['section']}")
        print(f"   Response Count: {extracted_data['response_count']}")
        print(f"   Comments: {len(extracted_data['comments'])} comments")

        # Print survey response summary
        print("   Survey Responses:")
        for question, distribution in extracted_data["survey_responses"].items():
            if isinstance(distribution, dict) and distribution:
                total_responses = sum(distribution.values())
                print(f"     {question}: {total_responses} total responses")
            else:
                print(f"     {question}: {len(distribution) if isinstance(distribution, dict) else 'N/A'} responses")

        # Generate AI summary of the comments
        print("🤖 Generating AI summary...")
        ai_summary = generate_ai_summary(extracted_data["comments"])

        # Create records in correct order (following foreign key relationships)
        print("💾 Uploading to database...")
        course_id = get_or_insert_course(extracted_data["code"], extracted_data["title"], extracted_data["school"])
        instructor_id = get_or_insert_instructor(extracted_data["instructor"])

        # Update the AI summary of the instructor based on all of their course offerings
        create_or_update_instructor_summary(instructor_id, ai_summary)

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

        print("✅ Successfully uploaded to database!")
        print(f"   Course ID: {course_id}")
        print(f"   Instructor ID: {instructor_id}")
        print(f"   Offering ID: {offering_id}")

        return {
            "course_id": course_id,
            "instructor_id": instructor_id,
            "offering_id": offering_id,
            "success": True
        }

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return {
            "success": False,
            "error": str(e),
            "file": pdf_path
        }

def process_multiple_ctecs(pdf_paths: list) -> Dict[str, Any]:
    """
    Process multiple CTEC PDFs and provide comprehensive reporting.
    
    Args:
        pdf_paths: List of PDF file paths to process
        
    Returns:
        Dictionary with success/failure summary
    """
    print(f"\n🚀 STARTING BATCH PROCESSING OF {len(pdf_paths)} CTEC FILES")
    print(f"{'='*80}")

    successful_uploads = []
    failed_uploads = []

    for i, pdf_path in enumerate(pdf_paths, 1):
        print(f"\n📁 File {i}/{len(pdf_paths)}")
        result = upload_ctec(pdf_path)

        if result.get("success", False):
            successful_uploads.append({
                "file": pdf_path,
                "course_id": result.get("course_id"),
                "instructor_id": result.get("instructor_id"),
                "offering_id": result.get("offering_id")
            })
        else:
            failed_uploads.append({
                "file": pdf_path,
                "error": result.get("error", "Unknown error")
            })

    # Print final summary
    print(f"\n{'='*80}")
    print("📊 BATCH PROCESSING SUMMARY")
    print(f"{'='*80}")
    print(f"✅ Successful uploads: {len(successful_uploads)}")
    print(f"❌ Failed uploads: {len(failed_uploads)}")

    if successful_uploads:
        print("\n🎉 SUCCESSFUL FILES:")
        for upload in successful_uploads:
            print(f"   ✅ {upload['file']} (Offering ID: {upload['offering_id']})")

    if failed_uploads:
        print("\n💥 FAILED FILES:")
        for failure in failed_uploads:
            print(f"   ❌ {failure['file']}: {failure['error']}")

    print(f"\n{'='*80}")
    return {
        "successful": successful_uploads,
        "failed": failed_uploads,
        "total_processed": len(pdf_paths),
        "success_rate": len(successful_uploads) / len(pdf_paths) * 100
    }

if __name__ == "__main__":
    # Get all PDF files from the distros directory
    distros_path = "backend/data/distros/*.pdf"
    pdf_files = glob.glob(distros_path)

    if not pdf_files:
        print("❌ No PDF files found in backend/data/distros/")
    else:
        print(f"📁 Found {len(pdf_files)} PDF files in distros folder")
        results = process_multiple_ctecs(pdf_files)
