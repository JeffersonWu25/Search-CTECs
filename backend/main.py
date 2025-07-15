# backend/api/main.py

import os
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

app = FastAPI(title="CTEC API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Data Models (Pydantic) ---

class Course(BaseModel):
    course_id: str
    course_name: str
    department: Optional[str] = None

class Instructor(BaseModel):
    instructor_id: int
    instructor_name: str

class Report(BaseModel):
    report_id: int
    course: Course
    instructor: Instructor
    term: Optional[str] = None
    year: Optional[int] = None

class Rating(BaseModel):
    rating_id: int
    question_number: int
    mean: float
    response_count: int

class Comment(BaseModel):
    comment_id: int
    comment_text: str

class FullReport(BaseModel):
    report: Report
    ratings: List[Rating]
    comments: List[Comment]

# --- API Endpoints ---

@app.get("/reports", response_model=List[Report])
async def get_reports(
    skip: int = Query(0, description="Offset for pagination"),
    limit: int = Query(10, description="Maximum number of reports to return")
):
    """
    Returns a list of all reports (paginated).
    """
    try:
        response = supabase.from_('reports').select('''
            report_id,
            courses (course_id, course_name, department),
            instructors (instructor_id, instructor_name),
            term,
            year
        ''').range(skip, skip + limit - 1).execute()
        if response.data:
            reports = []
            for row in response.data:
                reports.append(Report(
                    report=Report(
                        report_id=row['report_id'],
                        course=Course(**row['courses']),
                        instructor=Instructor(**row['instructors']),
                        term=row['term'],
                        year=row['year']
                    ),
                    course=Course(**row['courses']),
                    instructor=Instructor(**row['instructors']),
                    term=row['term'],
                    year=row['year']
                ))
            return reports
        else:
            raise HTTPException(status_code=404, detail="No reports found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reports/{report_id}", response_model=FullReport)
async def get_report(report_id: int):
    """
    Returns the details of a specific report.
    """
    try:
        report_response = supabase.from_('reports').select('''
            report_id,
            courses (course_id, course_name, department),
            instructors (instructor_id, instructor_name),
            term,
            year
        ''').eq('report_id', report_id).execute()
        ratings_response = supabase.from_('ratings').select('*').eq('report_id', report_id).execute()
        comments_response = supabase.from_('comments').select('*').eq('report_id', report_id).execute()

        if report_response.data:
            report_data = report_response.data[0]
            report = Report(
                report=Report(
                    report_id=report_data['report_id'],
                    course=Course(**report_data['courses']),
                    instructor=Instructor(**report_data['instructors']),
                    term=report_data['term'],
                    year=report_data['year']
                ),
                course=Course(**report_data['courses']),
                instructor=Instructor(**report_data['instructors']),
                term=report_data['term'],
                year=report_data['year']
            )
            ratings = [Rating(**rating) for rating in ratings_response.data]
            comments = [Comment(**comment) for comment in comments_response.data]
            return FullReport(report=report, ratings=ratings, comments=comments)
        else:
            raise HTTPException(status_code=404, detail="Report not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search", response_model=List[Report])
async def search_reports(
    query: str = Query(..., min_length=3, description="Search query (course name, instructor, etc.)"),
    skip: int = Query(0, description="Offset for pagination"),
    limit: int = Query(10, description="Maximum number of reports to return")
):
    """
    Searches for reports based on a query string (paginated).
    """
    try:
        # Simple search (adjust as needed for more advanced search)
        response = supabase.from_('reports').select('''
            report_id,
            courses (course_id, course_name, department),
            instructors (instructor_id, instructor_name),
            term,
            year
        ''').ilike('courses.course_name', f'%{query}%').ilike('instructors.instructor_name', f'%{query}%').range(skip, skip + limit - 1).execute()

        if response.data:
            reports = [
                Report(
                    report=Report(
                        report_id=row['report_id'],
                        course=Course(**row['courses']),
                        instructor=Instructor(**row['instructors']),
                        term=row['term'],
                        year=row['year']
                    ),
                    course=Course(**row['courses']),
                    instructor=Instructor(**row['instructors']),
                    term=row['term'],
                    year=row['year']
                )
                for row in response.data
            ]
            return reports
        else:
            raise HTTPException(status_code=404, detail="No matching reports found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ctecs/upload")
async def upload_ctec(file: UploadFile) -> Dict[str, Any]:
    """
    Upload and process a CTEC PDF file.
    Returns the created records' IDs and basic info.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        # Create temp directory if it doesn't exist
        os.makedirs("temp", exist_ok=True)
        
        # Save uploaded file temporarily
        temp_path = f"temp/{file.filename}"
        try:
            # Save uploaded file
            content = await file.read()
            with open(temp_path, "wb") as f:
                f.write(content)
            
            # Process and upload the PDF
            from backend.parser.upload_data import upload_ctec as process_ctec
            result = process_ctec(temp_path)
            
            return {
                "status": "success",
                "data": result
            }
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/courses")
async def get_courses() -> Dict[str, Any]:
    """
    Get all courses with their CTEC reviews.
    """
    try:
        response = supabase.table("courses").select("*, course_offerings(*, ctec_reviews(*, ctec_responses(*)))").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/courses/{course_code}")
async def get_course(course_code: str) -> Dict[str, Any]:
    """
    Get a specific course by its code with CTEC reviews.
    """
    try:
        response = supabase.table("courses").select(
            "*, course_offerings(*, ctec_reviews(*, ctec_responses(*)))"
        ).eq("code", course_code).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Course not found")
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)