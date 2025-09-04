import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { RatingDistributionChart } from '../components/common/RatingDistributionChart'

const API_BASE_URL = 'http://localhost:8000'

export function DetailPage() {
    const { selectedId } = useParams()
    const navigate = useNavigate()
    const [ offering, setOffering ] = useState(null)
    const [ loading, setLoading ] = useState(true)
    const [ error, setError ] = useState(null)

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
                        <button onClick={() => navigate('/search')} className='back-btn'>
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
                    <button onClick={() => navigate('/search')} className='back-btn'>
                        ← Back to Search
                    </button>
                    <div className="header-content">
                        <h1>{offering.course?.title || "Unknown Course"}</h1>
                        <p className='course-code'>{offering.course?.code || 'N/A'}</p>
                        <div className="header-badges">
                            <span className="badge school-badge">{offering.course?.school || 'N/A'}</span>
                            <span className="badge term-badge">{offering.quarter} {offering.year}</span>
                            <span className="badge section-badge">Section {offering.section}</span>
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