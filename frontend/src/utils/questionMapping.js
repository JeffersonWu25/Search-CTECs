/*
Question mapping utility for CTEC survey questions
Maps survey question keys to their full question text and display order
*/

export const QUESTION_MAPPING = {
  'rating_of_instruction': {
    order: 1,
    fullQuestion: '1. Provide an overall rating of the instruction.',
    shortLabel: 'Rating of Instruction'
  },
  'rating_of_course': {
    order: 2,
    fullQuestion: '2. Provide an overall rating of the course.',
    shortLabel: 'Rating of Course'
  },
  'estimated_learning': {
    order: 3,
    fullQuestion: '3. Estimate how much you learned in the course.',
    shortLabel: 'Estimated Learning'
  },
  'intellectual_challenge': {
    order: 4,
    fullQuestion: '4. Rate the effectiveness of the course in challenging you intellectually.',
    shortLabel: 'Intellectual Challenge'
  },
  'stimulating_instructor': {
    order: 5,
    fullQuestion: '5. Rate the effectiveness of the instructor in stimulating your interest in the subject.',
    shortLabel: 'Stimulating Instructor'
  },
  'time_survey': {
    order: 6,
    fullQuestion: '6. Estimate the average number of hours per week you spent on this course outside of class and lab time.',
    shortLabel: 'Hours per Week'
  },
  'school_name': {
    order: 7,
    fullQuestion: '7. What is the name of your school?',
    shortLabel: 'School Name'
  },
  'class_year': {
    order: 8,
    fullQuestion: '8. Your Class (e.g., Freshman, Sophomore, etc.)',
    shortLabel: 'Class Standing'
  },
  'reason_for_taking_course': {
    order: 9,
    fullQuestion: '9. What is your reason for taking the course? (mark all that apply)',
    shortLabel: 'Reason for Taking'
  },
  'prior_interest': {
    order: 10,
    fullQuestion: '10. What was your interest in this subject before taking the course?',
    shortLabel: 'Interest Before Course'
  }
}

/**
 * Gets the full question text for a survey question key
 * @param {string} questionKey - The survey question key
 * @returns {string} The full question text
 */
export const getFullQuestion = (questionKey) => {
  return QUESTION_MAPPING[questionKey]?.fullQuestion || questionKey
}

/**
 * Gets the short label for a survey question key
 * @param {string} questionKey - The survey question key
 * @returns {string} The short label
 */
export const getShortLabel = (questionKey) => {
  return QUESTION_MAPPING[questionKey]?.shortLabel || questionKey
}

/**
 * Gets the display order for a survey question key
 * @param {string} questionKey - The survey question key
 * @returns {number} The display order (1-10)
 */
export const getQuestionOrder = (questionKey) => {
  return QUESTION_MAPPING[questionKey]?.order || 999
}

/**
 * Sorts survey responses by their display order
 * @param {Array} surveyResponses - Array of survey response objects
 * @returns {Array} Sorted array of survey responses
 */
export const sortSurveyResponsesByOrder = (surveyResponses) => {
  if (!surveyResponses || !Array.isArray(surveyResponses)) {
    return []
  }
  
  return [...surveyResponses].sort((a, b) => {
    const orderA = getQuestionOrder(a.survey_question)
    const orderB = getQuestionOrder(b.survey_question)
    return orderA - orderB
  })
}
