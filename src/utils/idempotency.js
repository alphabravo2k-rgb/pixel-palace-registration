export const getOrCreateSubmissionId = () => {
  let id = sessionStorage.getItem('pp_idemp_key');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('pp_idemp_key', id);
  }
  return id;
};

export const clearSubmissionId = () => {
  sessionStorage.removeItem('pp_idemp_key');
};
