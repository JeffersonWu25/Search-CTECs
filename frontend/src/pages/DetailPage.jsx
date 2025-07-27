import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { detailPageInfo } from '../services/detailPage'
import { Layout } from '../components/layout/Layout'
import { RatingDistributionChart } from '../components/common/RatingDistributionChart'

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
                // Pass selectedId to detailPageInfo
                const offeringDetails = await detailPageInfo(selectedId)

                if (!offeringDetails || offeringDetails.length === 0){
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
                <div className="detail-header">
                    <button onClick={() => navigate('/search')} className='back-btn'>
                        Back to Search
                    </button>
                    <h1>{offering.courses?.title || "Unknown Course"}</h1>
                    <p className='course-code'>{offering.courses?.code || 'N/A'}</p>
                </div>

                <div className="detail-content">
          <div className="offering-info">
            <div className="info-section">
              <h3>Course Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Course Title:</strong> {offering.courses?.title || 'N/A'}
                </div>
                <div className="info-item">
                  <strong>Course Code:</strong> {offering.courses?.code || 'N/A'}
                </div>
                <div className="info-item">
                  <strong>Instructor:</strong> {offering.instructors?.name || 'N/A'}
                </div>
                <div className="info-item">
                  <strong>Quarter:</strong> {offering.quarter || 'N/A'}
                </div>
                <div className="info-item">
                  <strong>Year:</strong> {offering.year || 'N/A'}
                </div>
              </div>
            </div>

            {offering.ctec_responses && offering.ctec_responses.length > 0 && (
              <div className="reviews-section">
                <h3>CTEC Reviews ({offering.ctec_responses.length})</h3>
                <div className="reviews-list">
                  {offering.ctec_responses.map((response) => (
                    <div key={response.id} className="review-card">
                      <div className="review-header">
                        <div className="review-rating">
                          <strong>Question:</strong> {response.ctec_questions?.text || 'N/A'}
                          <strong>Overall Rating:</strong> {response.mean_score || 'N/A'}/5
                          
                        </div>
                        <div className="review-date">
                          {response.created_at ? new Date(response.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      
                      {/* Rating Distribution Chart */}
                      {response.distribution && Object.keys(response.distribution).length > 0 && (
                        <RatingDistributionChart distribution={response.distribution} />
                      )}
                      
                      {response.comments && (
                        <div className="review-comments">
                          <strong>Comments:</strong>
                          <p>{response.comments}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!offering.ctec_reviews || offering.ctec_reviews.length === 0) && (
              <div className="no-reviews">
                <h3>No CTEC Reviews</h3>
                <p>No reviews have been submitted for this course offering yet.</p>
              </div>
            )}
          </div>
        </div>
            </div>
        </Layout>
    )
}