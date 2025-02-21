// export const visitorInsightsData = {
//   'loyal customers': [320, 300, 240, 190, 200, 220, 300, 310, 300, 260, 180, 150],
//   'new customers': [250, 220, 180, 120, 180, 280, 350, 310, 300, 290, 200, 148],
//   'unique customers': [280, 340, 310, 280, 220, 180, 250, 300, 305, 310, 250, 200],
// };
export const visitorInsightsData = await fetch(`${import.meta.env.VITE_API_URL}/api/visitors`, {
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
  },
});
