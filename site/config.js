// Where the "Cloud version coming soon" email form posts.
// /api/waitlist is the Vercel function in api/waitlist.js, which adds the email to a Loops list.
// It only exists when the site runs on Vercel (see README.md). Empty = the form says the list isn't open yet.
window.SITE_CONFIG = {
  waitlistEndpoint: '/api/waitlist',
};
