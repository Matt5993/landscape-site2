/* ============================================
   Admin.js — Dashboard Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${tab.dataset.panel}`).classList.add('active');
    });
  });

  refreshDashboard();
});

function refreshDashboard() {
  const bookings = JSON.parse(localStorage.getItem('lic_bookings') || '[]');
  const contacts = JSON.parse(localStorage.getItem('lic_contacts') || '[]');
  const bookedSlots = JSON.parse(localStorage.getItem('lic_booked_slots') || '[]');

  // Stats
  document.getElementById('totalBookings').textContent = bookings.length;
  document.getElementById('totalContacts').textContent = contacts.length;
  document.getElementById('upcomingCount').textContent = bookings.filter(b => b.appointment && new Date(b.appointment.date) > new Date()).length;
  document.getElementById('commercialCount').textContent = bookings.filter(b => b.propertyType === 'commercial').length;

  // Bookings list
  const bookingsList = document.getElementById('bookingsList');
  if (bookings.length === 0) {
    bookingsList.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>No consultation requests yet.<br>They\'ll appear here when clients book through the site.</p></div>';
  } else {
    bookingsList.innerHTML = bookings.reverse().map((b, i) => {
      const tierLabels = { basic: 'Basic', standard: 'Standard', premium: 'Premium' };
      const date = new Date(b.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
      return `
        <div class="booking-entry">
          <h4>${b.name} <span class="badge ${b.propertyType === 'commercial' ? 'badge-commercial' : 'badge-residential'}">${b.propertyType}</span></h4>
          <p>📧 ${b.email} ${b.phone ? '· 📞 ' + b.phone : ''}</p>
          <p>📐 ${b.propertySize || 'Not specified'} sq ft · 🏷️ ${tierLabels[b.serviceTier] || 'No tier selected'}</p>
          ${b.appointment ? `<p><span class="badge badge-time">📅 ${b.appointment.display}</span></p>` : ''}
          <p style="margin-top:8px;"><strong>Needs:</strong> ${b.needs}</p>
          <p style="font-size:0.8rem;color:#9e9e9e;margin-top:4px;">Submitted: ${date}</p>
        </div>
      `;
    }).join('');
  }

  // Contacts list
  const contactsList = document.getElementById('contactsList');
  if (contacts.length === 0) {
    contactsList.innerHTML = '<div class="empty-state"><div class="icon">✉️</div><p>No contact messages yet.</p></div>';
  } else {
    contactsList.innerHTML = contacts.reverse().map(c => {
      const date = new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
      return `
        <div class="booking-entry">
          <h4>${c.name}</h4>
          <p>📧 ${c.email}</p>
          <p style="margin-top:6px;">${c.message}</p>
          <p style="font-size:0.8rem;color:#9e9e9e;margin-top:4px;">${date}</p>
        </div>
      `;
    }).join('');
  }

  // Slots list
  const slotsList = document.getElementById('slotsList');
  if (bookedSlots.length === 0) {
    slotsList.innerHTML = '<div class="empty-state"><div class="icon">📅</div><p>No booked slots yet.</p></div>';
  } else {
    slotsList.innerHTML = '<table><thead><tr><th>Date</th><th>Time</th><th>Action</th></tr></thead><tbody>' +
      bookedSlots.map(slot => {
        const [date, hour] = slot.split('-').length === 4 
          ? [slot.substring(0, 10), parseInt(slot.split('-')[3])]
          : [slot.substring(0, 10), parseInt(slot.split('-').pop())];
        const hourLabel = hour > 12 ? `${hour - 12}:00 PM` : (hour === 12 ? '12:00 PM' : `${hour}:00 AM`);
        return `<tr><td>${date}</td><td>${hourLabel}</td><td><button class="btn btn-danger btn-sm" onclick="removeSlot('${slot}')">Remove</button></td></tr>`;
      }).join('') +
      '</tbody></table>';
  }
}

function clearBookings() {
  if (confirm('Clear all booking requests? This cannot be undone.')) {
    localStorage.removeItem('lic_bookings');
    refreshDashboard();
  }
}

function clearContacts() {
  if (confirm('Clear all contact messages? This cannot be undone.')) {
    localStorage.removeItem('lic_contacts');
    refreshDashboard();
  }
}

function clearSlots() {
  if (confirm('Reset all booked time slots? This will make all slots available again.')) {
    localStorage.removeItem('lic_booked_slots');
    refreshDashboard();
  }
}

function removeSlot(slot) {
  const slots = JSON.parse(localStorage.getItem('lic_booked_slots') || '[]');
  const filtered = slots.filter(s => s !== slot);
  localStorage.setItem('lic_booked_slots', JSON.stringify(filtered));
  refreshDashboard();
}
