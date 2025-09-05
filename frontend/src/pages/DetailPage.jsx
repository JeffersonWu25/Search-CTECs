import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { RatingDistributionChart } from '../components/common/RatingDistributionChart'
import { 
  processSurveyResponses, 
  getRatingColorClass 
} from '../utils/ratingCalculations'

const API_BASE_URL = 'http://localhost:8000'

export function DetailPage() {
    const { selectedId } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [ offering, setOffering ] = useState(null)
    const [ loading, setLoading ] = useState(true)
    const [ error, setError ] = useState(null)

    const handleBackToSearch = () => {
        // Check if we have search state in URL parameters
        const searchState = searchParams.get('searchState')
        
        if (searchState) {
            try {
                const state = JSON.parse(decodeURIComponent(searchState))
                // Navigate back to search with preserved state
                const params = new URLSearchParams()
                
                // Restore courses
                if (state.selectedCourses && state.selectedCourses.length > 0) {
                    const course = state.selectedCourses[0] // Assuming single course selection
                    params.set('selectedType', 'course')
                    params.set('selectedId', course.id)
                    params.set('selectedTitle', course.title)
                    if (course.code) params.set('selectedCode', course.code)
                }
                
                // Restore instructors
                if (state.selectedInstructors && state.selectedInstructors.length > 0) {
                    const instructor = state.selectedInstructors[0] // Assuming single instructor selection
                    params.set('selectedType', 'instructor')
                    params.set('selectedId', instructor.id)
                    params.set('selectedTitle', instructor.name)
                }
                
                // Restore requirements
                if (state.selectedRequirements && state.selectedRequirements.length > 0) {
                    params.set('requirements', encodeURIComponent(JSON.stringify(state.selectedRequirements)))
                }
                
                navigate(`/search?${params.toString()}`)
            } catch (e) {
                console.warn('Failed to parse search state:', e)
                navigate('/search')
            }
        } else {
            // Fallback to regular back navigation
            navigate(-1)
        }
    }

    useEffect(() => {
        const fetchOfferingDetails = async() => {
            if (!selectedId) {
                setError('No offering ID provided')
                setLoading(false)
                return
            }

            try{
                // Use backend API endpoint
                const response = await fetch(`${API_BASE_URL}/offerings/${selectedId}`)
                
                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Offering not found')
                    } else {
                        setError('Failed to load offering details')
                    }
                    return
                }

                const offeringDetails = await response.json()

                if (!offeringDetails){
                    setError('No offering details found')
                } else {
                    setOffering(offeringDetails)
                }
            } catch (err) {
                console.log('Error fetching offering details: ', err)
                setError('Failed to load offering details')
            } finally {
                setLoading(false)
            }
        }

        fetchOfferingDetails()
    }, [selectedId])

    if (loading) {
        return (
            <Layout>
                <div className="detail-page">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading offering details...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (error || !offering) {
        return (
            <Layout>
                <div className="detail-page">
                    <div className="error-state">
                        <h2>Error</h2>
                        <p>{error || 'Offering not found'}</p>
                        <button onClick={handleBackToSearch} className='back-btn'>
                            Back to Search
                        </button>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="detail-page">
                {/* Header Section */}
                <div className="detail-header">
                    <div className="header-navigation">
                        <button onClick={handleBackToSearch} className='back-btn'>
                            <svg className="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                            Back to Search
                        </button>
                    </div>
                    
                    <div className="header-content">
                        <div className="course-title-section">
                            <h1 className="course-title">{offering.course?.title || "Unknown Course"}</h1>
                            <div className="course-meta">
                                <span className="course-code">{offering.course?.code || 'N/A'}</span>
                                <span className="course-instructor">with {offering.instructor?.name || 'N/A'}</span>
                            </div>
                        </div>
                        
                        <div className="header-badges">
                            <div className="badge-group">
                                <span className="badge school-badge">
                                    <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                    </svg>
                                    {offering.course?.school || 'N/A'}
                                </span>
                                <span className="badge term-badge">
                                    <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                    {offering.quarter} {offering.year}
                                </span>
                                <span className="badge section-badge">
                                    <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                    Section {offering.section}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="detail-content">
                    {/* Left Column - Course Info & Requirements */}
                    <div className="left-column">
                        {/* Course Information Card */}
                        <div className="info-card">
                            <h3>📚 Course Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Instructor</span>
                                    <span className="info-value">{offering.instructor?.name || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">School</span>
                                    <span className="info-value">{offering.course?.school || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Term</span>
                                    <span className="info-value">{offering.quarter} {offering.year}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Section</span>
                                    <span className="info-value">{offering.section || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Requirements Card */}
                        {offering.course?.requirements && offering.course.requirements.length > 0 && (
                            <div className="info-card">
                                <h3>🎯 Requirements Fulfilled</h3>
                                <div className="requirements-list">
                                    {offering.course.requirements.map((req) => (
                                        <div key={req.id} className="requirement-item">
                                            <span className="requirement-icon">✓</span>
                                            <span className="requirement-name">{req.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI Summary Card */}
                        {offering.ai_summary && (
                            <div className="info-card">
                                <h3>🤖 AI Summary</h3>
                                <div className="ai-summary-content">
                                    <p>{offering.ai_summary}</p>
                                </div>
                            </div>
                        )}

                        {/* Comments Card */}
                        {offering.comments && offering.comments.length > 0 && (
                            <div className="info-card">
                                <h3>💬 Student Comments</h3>
                                <div className="comments-list">
                                    {offering.comments.map((comment, index) => (
                                        <div key={comment.id || index} className="comment-item">
                                            <div className="comment-content">
                                                {comment.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Column - Survey Responses */}
                    <div className="right-column">

                        {/* Rating Summary Card */}
                        {offering.survey_responses && offering.survey_responses.length > 0 && (
                            <div className="rating-summary-card">
                                <h3>📈 Rating Summary</h3>
                                <div className="rating-summary-grid">
                                    {(() => {
                                        const ratings = processSurveyResponses(offering.survey_responses)
                                        return (
                                            <>
                                                <div className="summary-rating">
                                                    <div className="summary-rating-label">Overall Rating</div>
                                                    <div className={`summary-rating-score ${getRatingColorClass(ratings.rating_of_course)}`}>
                                                        {ratings.rating_of_course > 0 ? `${ratings.rating_of_course}/6` : '—'}
                                                    </div>
                                                </div>
                                                <div className="summary-rating">
                                                    <div className="summary-rating-label">Rating of Instruction</div>
                                                    <div className={`summary-rating-score ${getRatingColorClass(ratings.rating_of_instruction)}`}>
                                                        {ratings.rating_of_instruction > 0 ? `${ratings.rating_of_instruction}/6` : '—'}
                                                    </div>
                                                </div>
                                                <div className="summary-rating">
                                                    <div className="summary-rating-label">Estimated Learning</div>
                                                    <div className={`summary-rating-score ${getRatingColorClass(ratings.estimated_learning)}`}>
                                                        {ratings.estimated_learning > 0 ? `${ratings.estimated_learning}/6` : '—'}
                                                    </div>
                                                </div>
                                                <div className="summary-rating">
                                                    <div className="summary-rating-label">Intellectual Challenge</div>
                                                    <div className={`summary-rating-score ${getRatingColorClass(ratings.intellectual_challenge)}`}>
                                                        {ratings.intellectual_challenge > 0 ? `${ratings.intellectual_challenge}/6` : '—'}
                                                    </div>
                                                </div>
                                                <div className="summary-rating">
                                                    <div className="summary-rating-label">Stimulating Instructor</div>
                                                    <div className={`summary-rating-score ${getRatingColorClass(ratings.stimulating_instructor)}`}>
                                                        {ratings.stimulating_instructor > 0 ? `${ratings.stimulating_instructor}/6` : '—'}
                                                    </div>
                                                </div>
                                                <div className="summary-rating">
                                                    <div className="summary-rating-label">Hours/Week</div>
                                                    <div className={`summary-rating-score ${getRatingColorClass(ratings.time_survey)}`}>
                                                        {ratings.time_survey || '—'}
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Survey Responses Card */}
                        {offering.survey_responses && offering.survey_responses.length > 0 ? (
                            <div className="reviews-section">
                                <div className="section-header">
                                    <h3>📊 CTEC Survey Results</h3>
                                    <span className="response-count">{offering.survey_responses.length} questions</span>
                                </div>
                                <div className="reviews-list">
                                    {offering.survey_responses.map((response) => (
                                        <div key={response.id} className="review-card">
                                            <div className="review-header">
                                                <h4 className="question-title">
                                                    {response.survey_question?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                                                </h4>
                                            </div>
                                            
                                            {/* Rating Distribution Chart */}
                                            {response.distribution && Object.keys(response.distribution).length > 0 && (
                                                <RatingDistributionChart distribution={response.distribution} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="no-reviews">
                                <div className="empty-state">
                                    <h3>📊 No Survey Data</h3>
                                    <p>No CTEC survey responses are available for this course offering.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    )
}