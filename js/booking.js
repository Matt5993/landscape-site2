/* ============================================
   Booking.js — Intake Form, Calendar, Scheduling
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- File upload with preview ---
  const fileUpload = document.getElementById('fileUpload');
  const photoInput = document.getElementById('photoUpload');
  const filePreviews = document.getElementById('filePreviews');
  let uploadedFiles = [];

  if (fileUpload) {
    fileUpload.addEventListener('click', () => photoInput.click());
    fileUpload.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUpload.style.borderColor = 'var(--green-mid)';
      fileUpload.style.background = 'var(--green-pale)';
    });
    fileUpload.addEventListener('dragleave', () => {
      fileUpload.style.borderColor = '';
      fileUpload.style.background = '';
    });
    fileUpload.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUpload.style.borderColor = '';
      fileUpload.style.background = '';
      handleFiles(e.dataTransfer.files);
    });
    photoInput.addEventListener('change', () => handleFiles(photoInput.files));
  }

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024) {
        uploadedFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          const div = document.createElement('div');
          div.className = 'file-preview';
          div.innerHTML = `
            <img src="${e.target.result}" alt="${file.name}">
            <button class="remove-file" title="Remove">&times;</button>
          `;
          div.querySelector('.remove-file').addEventListener('click', () => {
            const idx = uploadedFiles.indexOf(file);
            if (idx > -1) uploadedFiles.splice(idx, 1);
            div.remove();
          });
          filePreviews.appendChild(div);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // --- Multi-step booking flow ---
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const step1ind = document.getElementById('step1indicator');
  const step2ind = document.getElementById('step2indicator');
  const step3ind = document.getElementById('step3indicator');

  let bookingData = {};
  let selectedSlot = null;

  // Step 1 -> Step 2
  document.getElementById('toStep2').addEventListener('click', () => {
    // Validate required fields
    const name = document.getElementById('clientName').value.trim();
    const email = document.getElementById('clientEmail').value.trim();
    const propType = document.getElementById('propertyType').value;
    const needs = document.getElementById('clientNeeds').value.trim();

    if (!name || !email || !propType || !needs) {
      showModal('Missing Information', 'Please fill in all required fields (name, email, property type, and description of needs).');
      return;
    }

    // Collect form data
    const services = [];
    document.querySelectorAll('input[name="services"]:checked').forEach(cb => services.push(cb.value));

    bookingData = {
      name,
      email,
      phone: document.getElementById('clientPhone').value.trim(),
      propertyType: propType,
      propertySize: document.getElementById('propertySize').value.trim(),
      serviceTier: document.getElementById('serviceTier').value,
      services,
      needs,
      photoCount: uploadedFiles.length,
      submittedAt: new Date().toISOString()
    };

    step1.style.display = 'none';
    step2.style.display = 'block';
    step1ind.classList.remove('active');
    step1ind.classList.add('completed');
    step2ind.classList.add('active');
    renderCalendar();
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
  });

  // Step 2 -> Step 1 (back)
  document.getElementById('backToStep1').addEventListener('click', () => {
    step2.style.display = 'none';
    step1.style.display = 'block';
    step2ind.classList.remove('active');
    step1ind.classList.remove('completed');
    step1ind.classList.add('active');
  });

  // Step 2 -> Step 3 (confirm)
  document.getElementById('toStep3').addEventListener('click', () => {
    if (!selectedSlot) return;

    bookingData.appointment = selectedSlot;

    // Save to localStorage
    // TODO: Replace with backend API call
    const bookings = JSON.parse(localStorage.getItem('lic_bookings') || '[]');
    bookings.push(bookingData);
    localStorage.setItem('lic_bookings', JSON.stringify(bookings));

    // Mark slot as booked
    const booked = JSON.parse(localStorage.getItem('lic_booked_slots') || '[]');
    booked.push(selectedSlot.key);
    localStorage.setItem('lic_booked_slots', JSON.stringify(booked));

    // Show confirmation
    step2.style.display = 'none';
    step3.style.display = 'block';
    step2ind.classList.remove('active');
    step2ind.classList.add('completed');
    step3ind.classList.add('active');

    const tierLabels = { basic: 'Basic ($99)', standard: 'Standard ($249)', premium: 'Premium ($499/mo)' };
    document.getElementById('confirmationDetails').innerHTML = `
      <p><span>Name:</span> <strong>${bookingData.name}</strong></p>
      <p><span>Email:</span> <strong>${bookingData.email}</strong></p>
      <p><span>Property:</span> <strong>${bookingData.propertyType}</strong></p>
      <p><span>Service Tier:</span> <strong>${tierLabels[bookingData.serviceTier] || 'Not selected'}</strong></p>
      <p><span>Appointment:</span> <strong>${selectedSlot.display}</strong></p>
    `;

    // Show Stripe payment button if tier selected
    if (bookingData.serviceTier && typeof initStripePayment === 'function') {
      initStripePayment(bookingData.serviceTier, 'stripePayment');
    }

    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
  });

  // --- Calendar system ---
  let currentWeekStart = getMonday(new Date());

  function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calTitle');
    grid.innerHTML = '';

    const bookedSlots = JSON.parse(localStorage.getItem('lic_booked_slots') || '[]');
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const hours = [9, 10, 11, 12, 13, 14, 15, 16]; // 9am - 4pm (1-hour blocks)

    // Update title
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    const opts = { month: 'short', day: 'numeric' };
    title.textContent = `${currentWeekStart.toLocaleDateString('en-US', opts)} – ${weekEnd.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;

    // Day headers
    for (let i = 0; i < 5; i++) {
      const dayDate = new Date(currentWeekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const header = document.createElement('div');
      header.className = 'calendar-day-header';
      header.textContent = `${dayNames[i]} ${dayDate.getDate()}`;
      grid.appendChild(header);
    }

    // Time slots
    hours.forEach(hour => {
      for (let i = 0; i < 5; i++) {
        const slotDate = new Date(currentWeekStart);
        slotDate.setDate(slotDate.getDate() + i);
        slotDate.setHours(hour);

        const key = `${slotDate.toISOString().split('T')[0]}-${hour}`;
        const isPast = slotDate < new Date();
        const isBooked = bookedSlots.includes(key);
        const hourLabel = hour > 12 ? `${hour - 12}:00 PM` : (hour === 12 ? '12:00 PM' : `${hour}:00 AM`);

        const slot = document.createElement('div');
        slot.className = 'time-slot';
        slot.textContent = hourLabel;

        if (isPast || isBooked) {
          slot.classList.add('booked');
        } else {
          slot.addEventListener('click', () => {
            document.querySelectorAll('.time-slot.selected').forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
            const dayStr = slotDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            selectedSlot = {
              key,
              display: `${dayStr} at ${hourLabel}`,
              date: slotDate.toISOString()
            };
            document.getElementById('toStep3').disabled = false;
          });
        }

        grid.appendChild(slot);
      }
    });
  }

  // Calendar navigation
  document.getElementById('calPrev').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    selectedSlot = null;
    document.getElementById('toStep3').disabled = true;
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    selectedSlot = null;
    document.getElementById('toStep3').disabled = true;
    renderCalendar();
  });

});
