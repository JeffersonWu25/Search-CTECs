/*
Utility functions for calculating average and mode course ratings from survey response distributions
*/

/*
Calculates the weighted average rating from a distribution object
@param {Object} distribution - Object with rating keys and count values
@returns {number} Weighted average rating (0 if no valid data)
*/
export const calculateAverageRating = (distribution) => {
  if (!distribution || typeof distribution !== 'object') return 0
  
  let totalResponses = 0
  let weightedSum = 0
  
  Object.entries(distribution).forEach(([rating, count]) => {
    const numericRating = parseFloat(rating)
    if (!isNaN(numericRating) && count > 0) {
      totalResponses += count
      weightedSum += numericRating * count
    }
  })
  
  return totalResponses > 0 ? weightedSum / totalResponses : 0
}

/**
 * Calculates the mode (most frequent) rating from a distribution object
 * @param {Object} distribution - Object with rating keys and count values
 * @returns {string} "3 or fewer", "4-7", "8-11", "12-15", "16-19", "20 or more"
 */
export const calculateMode = (distribution) => {
  if (!distribution || typeof distribution !== 'object') return "-"
  
  let modeKey = ""
  let maxCount = 0
  
  // Find the rating key with the highest frequency
  Object.entries(distribution).forEach(([rating, count]) => {
    const numericCount = parseInt(count)
    
    if (!isNaN(numericCount) && numericCount > maxCount) {
      maxCount = numericCount
      modeKey = rating
    }
  })
  
  return modeKey
}

/**
 * Gets the appropriate color class for a rating value or time range
 * @param {number|string} rating - Rating value (4=bad, 6=good) or time range string
 * @returns {string} CSS class name for rating color
 */
export const getRatingColorClass = (rating) => {
  // Handle empty or invalid values
  if (!rating || rating === 0 || rating === '') return ''
  
  // Handle time range strings (for difficulty/hours per week)
  if (typeof rating === 'string') {
    switch (rating) {
      case '3 or fewer':
        return 'rating-excellent' // Very light workload
      case '4 - 7':
        return 'rating-good' // Light workload
      case '8 - 11':
        return 'rating-average' // Average workload
      case '12 - 15':
        return 'rating-poor' // Heavy workload
      case '16 - 19':
        return 'rating-very-poor' // Very heavy workload
      case '20 or more':
        return 'rating-very-poor' // Extremely heavy workload
      default:
        return ''
    }
  }
  
  // Handle numeric ratings (4=bad, 6=good)
  if (rating >= 5.5) return 'rating-excellent'
  if (rating >= 5.0) return 'rating-good'
  if (rating >= 4.5) return 'rating-average'
  if (rating >= 4.0) return 'rating-poor'
  return 'rating-very-poor'
}

/**
 * Processes survey responses and extracts rating data
 * @param {Array} surveyResponses - Array of survey response objects
 * @returns {Dictionary} dictionary with rating_of_instruction, rating_of_course, estimated_learning, intellectual_challenge, stimulating_instructor, and time_survey
 */
export const processSurveyResponses = (surveyResponses) => {
  if (!surveyResponses || surveyResponses.length === 0) {
    return {
      rating_of_instruction: 0,
      rating_of_course: 0,
      estimated_learning: 0,
      intellectual_challenge: 0,
      stimulating_instructor: 0,
      time_survey: 0
    }
  }

  let rating_of_instruction = 0
  let rating_of_course = 0
  let estimated_learning = 0
  let intellectual_challenge = 0
  let stimulating_instructor = 0
  let time_survey = 0

  surveyResponses.forEach(response => {
    switch (response.survey_question) {
      case 'rating_of_instruction':
        rating_of_instruction = calculateAverageRating(response.distribution)
        break
      case 'rating_of_course':
        rating_of_course = calculateAverageRating(response.distribution)
        break
      case 'estimated_learning':
        estimated_learning = calculateAverageRating(response.distribution)
        break
      case 'intellectual_challenge':
        intellectual_challenge = calculateAverageRating(response.distribution)
        break
      case 'stimulating_instructor':
        stimulating_instructor = calculateAverageRating(response.distribution)
        break
      case 'time_survey':
        // get the mode of the distribution for hours per week
        time_survey = calculateMode(response.distribution)
        break
      default:
        break
    }
  })

  return {
    rating_of_instruction: Math.round(rating_of_instruction * 10) / 10, // Round to 1 decimal
    rating_of_course: Math.round(rating_of_course * 10) / 10,
    estimated_learning: Math.round(estimated_learning * 10) / 10,
    intellectual_challenge: Math.round(intellectual_challenge * 10) / 10,
    stimulating_instructor: Math.round(stimulating_instructor * 10) / 10,
    time_survey: time_survey
  }
}

/**
 * Calculates average ratings for a professor across all their course offerings
 * @param {Object} professorData - Professor data object with course_offerings array
 * @returns {Object} Object with average ratings for all metrics
 */
export const calculateProfessorAverages = (professorData) => {
  // Early return for invalid data
  if (!professorData?.course_offerings?.length) {
    return {
      rating_of_instruction: 0,
      rating_of_course: 0,
      estimated_learning: 0,
      intellectual_challenge: 0,
      stimulating_instructor: 0,
      time_survey: 0
    }
  }

  // Define rating types for cleaner iteration
  const RATING_TYPES = [
    'rating_of_instruction',
    'rating_of_course', 
    'estimated_learning',
    'intellectual_challenge',
    'stimulating_instructor'
  ]

  // Initialize accumulators
  const numericAccumulators = RATING_TYPES.reduce((acc, type) => {
    acc[type] = { total: 0, count: 0 }
    return acc
  }, {})

  const timeSurveyCounts = {}

  // Process each course offering efficiently
  for (const offering of professorData.course_offerings) {
    if (!offering.survey_responses?.length) continue

    const offeringRatings = processSurveyResponses(offering.survey_responses)

    // Accumulate numeric ratings
    for (const ratingType of RATING_TYPES) {
      const value = offeringRatings[ratingType]
      if (value > 0) {
        numericAccumulators[ratingType].total += value
        numericAccumulators[ratingType].count++
      }
    }

    // Handle time_survey separately (mode calculation)
    const timeValue = offeringRatings.time_survey
    if (timeValue && timeValue !== 0) {
      timeSurveyCounts[timeValue] = (timeSurveyCounts[timeValue] || 0) + 1
    }
  }

  // Calculate final averages efficiently
  const averages = RATING_TYPES.reduce((acc, type) => {
    const { total, count } = numericAccumulators[type]
    acc[type] = count > 0 ? Math.round((total / count) * 10) / 10 : 0
    return acc
  }, {})

  // Add time_survey mode
  averages.time_survey = calculateMode(timeSurveyCounts) || 0

  return averages
}