// Where the "Cloud version coming soon" email form posts.
// Leave it empty until a form service is chosen: the form then only says it isn't open yet.
// Any service that accepts a JSON POST with an `email` field works (Formspree, Buttondown, a Google Apps Script…).
window.SITE_CONFIG = {
  waitlistEndpoint: '',
};
