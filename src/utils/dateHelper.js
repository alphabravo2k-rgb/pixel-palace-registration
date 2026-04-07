export const getTimeStatus = (targetDateString) => {
  if (!targetDateString || targetDateString === "TBD") return null;
  
  const target = new Date(targetDateString).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) return { expired: true, text: "EXPIRED" };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return { expired: false, text: `${days} DAY${days > 1 ? 'S' : ''}` };
  }
  return { expired: false, text: `${hours} HOUR${hours > 1 ? 'S' : ''}` };
};
