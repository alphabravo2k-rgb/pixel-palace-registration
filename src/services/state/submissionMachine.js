export const SUBMISSION_STATES = {
  IDLE: 'IDLE',
  SUBMITTING: 'SUBMITTING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
};

export const submissionReducer = (state, action) => {
  switch (action.type) {
    case 'START': return { status: SUBMISSION_STATES.SUBMITTING, error: null };
    case 'SUCCESS': return { status: SUBMISSION_STATES.SUCCESS, error: null };
    case 'ERROR': return { status: SUBMISSION_STATES.ERROR, error: action.payload };
    case 'RESET': return { status: SUBMISSION_STATES.IDLE, error: null };
    default: return state;
  }
};
