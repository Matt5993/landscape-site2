/* ============================================
   Membership Page — The Groundwork — JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

      // Toggle clicked
      if (!wasOpen) item.classList.add('open');
    });
  });

  // --- Signup Modal ---
  const modal = document.getElementById('signupModal');
  const modalClose = document.getElementById('modalClose');
  const signupTitle = document.getElementById('signupTitle');
  const signupSubtitle = document.getElementById('signupSubtitle');

  const joinBtn = document.getElementById('joinBtn');
  const joinAnnualBtn = document.getElementById('joinAnnualBtn');

  let selectedPlan = 'monthly';

  function openModal(plan) {
    selectedPlan = plan;
    if (plan === 'annual') {
      signupTitle.textContent = 'Join The Groundwork — Annual';
      signupSubtitle.textContent = '$290/year · 2 months free · Cancel anytime';
    } else {
      signupTitle.textContent = 'Join The Groundwork';
      signupSubtitle.textContent = '$29/month · Cancel anytime';
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (joinBtn) joinBtn.addEventListener('click', () => openModal('monthly'));
  if (joinAnnualBtn) joinAnnualBtn.addEventListener('click', () => openModal('annual'));
  if (modalClose) modalClose.addEventListener('click', closeModal);

  // Close on overlay click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // --- Signup Form ---
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('memberName').value.trim();
      const email = document.getElementById('memberEmail').value.trim();

      if (!name || !email) {
        alert('Please fill in all fields.');
        return;
      }

      // Store signup locally (demo — replace with real Stripe subscription)
      const signup = {
        name,
        email,
        plan: selectedPlan,
        price: selectedPlan === 'annual' ? '$290/year' : '$29/month',
        date: new Date().toISOString(),
        status: 'pending_payment'
      };

      // Save to localStorage for demo
      const members = JSON.parse(localStorage.getItem('lic_members') || '[]');
      members.push(signup);
      localStorage.setItem('lic_members', JSON.stringify(members));

      // Show success
      closeModal();
      showSuccess(name, selectedPlan);
    });
  }

  function showSuccess(name, plan) {
    const price = plan === 'annual' ? '$290/year' : '$29/month';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="text-align:center;">
        <div style="font-size:3rem;margin-bottom:16px;">🌿</div>
        <h3 style="color:var(--green-dark);margin-bottom:12px;">Welcome to The Groundwork!</h3>
        <p style="color:var(--gray-700);margin-bottom:8px;">Thanks, ${name}! Your <strong>${price}</strong> membership is being set up.</p>
        <p style="color:var(--gray-500);font-size:0.9rem;margin-bottom:24px;">You'll receive a welcome email with access details shortly.<br>
        <em>(Stripe integration pending — this is a preview.)</em></p>
        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()" style="margin:0 auto;">Got It</button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // --- Fade-in animations (reuse from main) ---
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

});
