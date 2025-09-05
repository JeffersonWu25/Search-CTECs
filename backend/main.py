# backend/api/main.py

import os
from typing import List, Optional, Dict, Any
import uuid
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel

# Load envirobment variables
load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Start app
app = FastAPI(title="CTEC API")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite default port
]

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Data Models (Pydantic) ---
class Requirement(BaseModel):
    id: uuid.UUID
    name: str

class Course(BaseModel):
    id: uuid.UUID
    code: str
    title: str
    school: Optional[str] = None
    requirements: Optional[List[Requirement]] = None

class Instructor(BaseModel):
    id: uuid.UUID
    name: str

class SurveyResponse(BaseModel):
    id: uuid.UUID
    survey_question: str
    distribution: Dict[str, Any]

class Comment(BaseModel):
    id: uuid.UUID
    content: str

class Offering(BaseModel):
    id: uuid.UUID
    course: Course
    instructor: Optional[Instructor] = None # optional for profile
    quarter: str
    year: int
    audience_size: Optional[int] = None
    response_count: Optional[int] = None
    section: int
    survey_responses: List[SurveyResponse]
    comments: Optional[List[Comment]] = None # optional to reduce transfer size
    ai_summary: Optional[str] = None

class InstructorProfile(BaseModel):
    id: uuid.UUID
    name: str
    profile_photo_url: Optional[str] = None
    ai_instructor_summary: Optional[str] = None
    course_offerings: List[Offering]

# --- Helper functions ---

def unwrap_requirements(course_data: dict) -> dict:
    """
    Unwraps nested Supabase course.requirements from
    [{ "requirement": {id, name} }, ...]
    into
    [{id, name}, ...]

    Args:
        course_data: dict returned by Supabase for a course

    Returns:
        The same dict but with 'requirements' flattened
    """
    wrapped = course_data.get("requirements") or []
    flat = [
        r["requirement"]
        for r in wrapped
        if isinstance(r, dict) and r.get("requirement")
    ]
    course_data["requirements"] = flat
    return course_data

# --- API Endpoints ---

@app.get("/")
async def root():
    """
    Root endpoint for API health check and documentation.
    """
    return {
        "message": "CTEC API is running",
        "endpoints": {
            "offerings": "/offerings",
            "search": "/search",
            "offering_detail": "/offerings/{offering_id}",
            "docs": "/docs"
        }
    }

@app.get("/offerings", response_model=List[Offering])
async def get_offerings(
    skip: int = Query(0, description="Offset for pagination"),
    limit: int = Query(10, description="Maximum number of course offerings to return")
):
    """
    Returns a list of all course offerings and their info except comments (paginated).
    Comments are not included to reduce transfer size.

    args:
        skip: int = Query(0, description="Offset for pagination")
        limit: int = Query(10, description="Maximum number of course offerings to return")

    returns:
        List[Offering]: A list of course offerings
    """

    try:
        response = (supabase.from_('course_offerings').select(
            "id,quarter,year,audience_size,response_count,section,"
            "course:courses("
                "id,code,title,school,"
                "requirements:course_requirements("
                    "requirement:requirements(id,name)"
                ")"
            "),"
            "instructor:instructors(id,name),"
            "survey_responses:survey_responses(id,distribution,survey_question)"
        ).range(skip, skip + limit - 1).execute())
        if response.data:
            offerings = []
            for row in response.data:
                course_data = unwrap_requirements(row["course"])
                offerings.append(Offering(
                    id=row['id'],
                    quarter=row['quarter'],
                    year=row['year'],
                    audience_size=row['audience_size'],
                    response_count=row['response_count'],
                    section=row['section'],
                    course=Course(**course_data),
                    instructor=Instructor(**row['instructor']),
                    survey_responses=[SurveyResponse(**sr) for sr in row['survey_responses']],
                ))
            print(offerings)
            return offerings
        else:
            return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.get("/offerings/{offering_id}", response_model=Offering)
async def get_offering(offering_id: str):
    """
    Returns all crutial info for a specific offering.

    args:
        offering_id: int = Path(..., description="The ID of the offering to retrieve")

    returns:
        Offering: The data for that specific course offering
    """
    try:
        response = supabase.from_('course_offerings').select(
            "id,quarter,year,audience_size,response_count,section,ai_summary,"
            "course:courses("
                "id,code,title,school," 
                "requirements:course_requirements("
                    "requirement:requirements(id,name)"
                ")"
            "),"
            "instructor:instructors(id,name),"
            "comments:comments(id,content),"
            "survey_responses:survey_responses(id,distribution,survey_question)"
        ).eq('id', offering_id).execute()

        if response.data:
            offering_data = response.data[0]
            course_data = unwrap_requirements(offering_data['course'])

            offering = Offering(
                id=offering_data['id'],
                quarter=offering_data['quarter'],
                year=offering_data['year'],
                audience_size=offering_data['audience_size'],
                response_count=offering_data['response_count'],
                ai_summary=offering_data['ai_summary'],
                section=offering_data['section'],
                course=Course(**course_data),
                instructor=Instructor(**offering_data['instructor']),
                survey_responses=[SurveyResponse(**response) for response in offering_data['survey_responses']],
                comments=[Comment(**comment) for comment in offering_data['comments']],
            )
            return offering
        else:
            raise HTTPException(status_code=404, detail="Offering not found")
    except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) from e

@app.get("/search", response_model=List[Offering])
async def search_offerings(
    query: str = Query(..., min_length=3, description="Search query (course name, instructor)"),
    skip: int = Query(0, description="Offset for pagination"),
    limit: int = Query(10, description="Maximum number of offerings to return")
):
    """
    Searches for offerings based on a query string and returns list of offerings (paginated).
    comments are not included to reduce transfer size.

    args:
        query: str = Query(..., min_length=3, description="Search query (course name, instructor)")
        skip: int = Query(0, description="Offset for pagination")
        limit: int = Query(10, description="Maximum number of offerings to return")

    returns:
        List[Offering]: A list of course offerings
    """

    try:
        response = (
        supabase
        .from_("course_offerings")
        .select(
            "id,quarter,year,audience_size,response_count,section,"
            "course:courses!inner("
                "id,code,title,school,"
                "requirements:course_requirements("
                    "requirement:requirements(id,name)"
                ")"
            "),"
            "instructor:instructors!inner(id,name),"
            "survey_responses:survey_responses(id,distribution,survey_question)"
        )
        .ilike("courses.title", f"*{query}*")
        .range(skip, skip + limit - 1)
        .execute()
    )

        if response.data:
            print(response.data)
            offerings = []
            for row in response.data:
                course_data = unwrap_requirements(row["course"])
                offerings.append(Offering(
                    id=row['id'],
                    quarter=row['quarter'],
                    year=row['year'],
                    audience_size=row['audience_size'],
                    response_count=row['response_count'],
                    section=row['section'],
                    course=Course(**course_data),
                    instructor=Instructor(**row['instructor']),
                    survey_responses=[SurveyResponse(**sr) for sr in row['survey_responses']],
                ))
            print(offerings)
            print("ERROR:", getattr(response, "error", None))
            return offerings
        else:
            print(f"No matching offerings found for query: {query}")
            return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.get("/instructors/{instructor_id}/profile", response_model=InstructorProfile)
async def get_instructor_profile(instructor_id: str):
    """
    Returns the profile for a specific instructor. including all of their course offerings and that data

    args:
        instructor_id: str that represents the instructor's id

    returns:
        {
            "id": uuid.UUID,
            "name": str,
            "course_offerings": List[Offering]
        }
    """
    try:
        response = supabase.from_('instructors').select(
            "id,name,profile_photo_url, ai_instructor_summary,"
            "course_offerings:course_offerings("
                "id,quarter,year,audience_size,response_count,section,"
                "course:courses("
                    "id,code,title,school,"
                    "requirements:course_requirements("
                        "requirement:requirements(id,name)"
                    ")"
                "),"
                "survey_responses(id,distribution,survey_question),"
                "comments(id,content)"
            ")"
        ).eq('id', instructor_id).execute()
        print(response.data)

        offerings = []

        if response.data:
            for row in response.data[0]['course_offerings']:
                course_data = unwrap_requirements(row["course"])
                offerings.append(Offering(
                    id=row['id'],
                    quarter=row['quarter'],
                    year=row['year'],
                    section=row['section'],
                    course=Course(**course_data),
                    survey_responses=[SurveyResponse(**sr) for sr in row['survey_responses']],
                ))

            instructor = InstructorProfile(
                id=response.data[0]['id'],
                name=response.data[0]['name'],
                profile_photo_url=response.data[0]['profile_photo_url'],
                ai_instructor_summary=response.data[0]['ai_instructor_summary'],
                course_offerings=offerings,
            )
            return instructor
        else:
            raise HTTPException(status_code=404, detail="Instructor not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
