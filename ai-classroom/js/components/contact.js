/* ============================================================
   contact.js — Contact Form Logic
   ============================================================ */

/**
 * Handle contact form submission.
 * In production, replace the console.log with a real API call
 * e.g. fetch('/api/contact', { method: 'POST', body: formData })
 * @param {Event} e
 */
function submitContact(e) {
  e.preventDefault();

  const name    = document.getElementById('c-name').value.trim();
  const email   = document.getElementById('c-email').value.trim();
  const message = document.getElementById('c-message').value.trim();

  // Basic validation
  if (!name || !email || !message) {
    showFormError('Please fill in all fields before sending.');
    return;
  }

  // Log for now — replace with real API call when backend is ready
  console.log('Contact form submission:', { name, email, message });

  // Show success state
  document.getElementById('contact-form-wrap').style.display = 'none';
  document.getElementById('form-success').style.display = 'block';
}

/** Reset the contact form back to empty state */
function resetContactForm() {
  document.getElementById('contactForm').reset();
  document.getElementById('contact-form-wrap').style.display = '';
  document.getElementById('form-success').style.display = 'none';
}

/** Show an inline error message */
function showFormError(msg) {
  let err = document.getElementById('form-error-msg');
  if (!err) {
    err = document.createElement('p');
    err.id = 'form-error-msg';
    err.className = 'form-error';
    document.getElementById('contactForm').prepend(err);
  }
  err.textContent = msg;
}
