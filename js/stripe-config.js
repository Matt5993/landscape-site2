/* ============================================
   Square Payment Configuration
   ============================================
   
   SETUP NOTES:
   
   Currently using SANDBOX (test) credentials.
   When ready to go live:
   1. Go to developer.squareup.com
   2. Switch to "Production" in your app settings
   3. Replace the credentials below with production values
   4. Change environment from 'sandbox' to 'production'
   
   ============================================ */

const SQUARE_CONFIG = {
  // 'sandbox' for testing, 'production' for real payments
  environment: 'sandbox',
  
  // Sandbox credentials (replace with production when ready)
  applicationId: 'sandbox-sq0idb-zsiHV1wt7MQyBtgLvWz6Ug',
  locationId: 'L09SXFVR9SJK6',

  prices: {
    basic: { amount: 9900, label: 'Basic Consultation', display: '$99' },
    standard: { amount: 24900, label: 'Standard Consultation', display: '$249' },
    premium: { amount: 49900, label: 'Premium Advisory (Monthly)', display: '$499/mo' }
  }
};

/**
 * Initialize Square payment button in the confirmation step.
 */
function initStripePayment(tier, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !tier) return;

  const priceInfo = SQUARE_CONFIG.prices[tier];
  if (!priceInfo) return;

  container.innerHTML = `
    <div style="border-top: 2px solid #e0e0e0; padding-top: 24px;">
      <h4 style="margin-bottom: 8px; color: #1a5632;">Payment</h4>
      <p style="color: #616161; margin-bottom: 16px; font-size: 0.95rem;">
        ${priceInfo.label} — <strong>${priceInfo.display}</strong>
      </p>
      <div id="card-container" style="margin-bottom: 16px;"></div>
      <button 
        class="btn btn-primary" 
        id="card-button"
        style="width:100%;justify-content:center;background:#006aff;"
        onclick="handleSquarePayment('${tier}')"
      >
        💳 Pay ${priceInfo.display}
      </button>
      <p style="color: #9e9e9e; font-size: 0.8rem; margin-top: 8px; text-align: center;">
        Secure payment powered by Square
      </p>
    </div>
  `;

  initSquareCard();
}

let squareCard = null;

async function initSquareCard() {
  try {
    const payments = window.Square ? window.Square.payments(
      SQUARE_CONFIG.applicationId,
      SQUARE_CONFIG.locationId
    ) : null;

    if (payments) {
      squareCard = await payments.card();
      await squareCard.attach('#card-container');
    }
  } catch (e) {
    console.log('Square Web SDK not loaded or failed to initialize:', e);
  }
}

async function handleSquarePayment(tier) {
  const priceInfo = SQUARE_CONFIG.prices[tier];
  
  if (!squareCard) {
    // Fallback: redirect to backend payment page
    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tier,
          amount: priceInfo.amount,
          currency: 'USD'
        })
      });
      const data = await response.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      if (data.success) {
        showModal('Payment Successful!', `Your payment of ${priceInfo.display} for ${priceInfo.label} has been processed. Matt will be in touch shortly.`);
        return;
      }
    } catch (e) {
      // Server not running, show friendly message
    }
    showModal(
      'Payment Setup',
      `Your consultation has been booked. Matt will follow up with payment details for the ${priceInfo.label} (${priceInfo.display}) via email.`
    );
    return;
  }

  try {
    const btn = document.getElementById('card-button');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    const result = await squareCard.tokenize();
    if (result.status === 'OK') {
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: result.token,
          amount: priceInfo.amount,
          currency: 'USD',
          tier: tier
        })
      });
      const data = await response.json();
      if (data.success) {
        showModal('Payment Successful!', `Your payment of ${priceInfo.display} for ${priceInfo.label} has been processed. Matt will be in touch shortly.`);
      } else {
        showModal('Payment Issue', 'There was an issue processing your payment. Matt will follow up with alternative payment options.');
      }
    } else {
      showModal('Card Error', 'Please check your card details and try again.');
    }
    btn.disabled = false;
    btn.textContent = `💳 Pay ${priceInfo.display}`;
  } catch (e) {
    showModal('Payment Issue', 'There was an issue processing your payment. Matt will follow up with alternative payment options.');
  }
}
