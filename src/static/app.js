document.addEventListener("DOMContentLoaded", () => {
  const capabilitiesList = document.getElementById("capabilities-list");
  const messageDiv = document.getElementById("message");
  const modal = document.getElementById("register-modal");
  const modalCapabilityName = document.getElementById("modal-capability-name");
  const selectedCapabilityInput = document.getElementById("selected-capability");
  const registerForm = document.getElementById("register-form");
  const modalCancel = document.getElementById("modal-cancel");
  const modalBackdrop = modal.querySelector(".modal-backdrop");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  function openModal(capabilityName) {
    selectedCapabilityInput.value = capabilityName;
    modalCapabilityName.textContent = capabilityName;
    document.getElementById("email").value = "";
    modal.classList.remove("hidden");
    document.getElementById("email").focus();
  }

  function closeModal() {
    modal.classList.add("hidden");
  }

  modalCancel.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  async function fetchCapabilities() {
    try {
      const response = await fetch("/capabilities");
      const capabilities = await response.json();

      capabilitiesList.innerHTML = "";

      Object.entries(capabilities).forEach(([name, details]) => {
        const card = document.createElement("div");
        card.className = "capability-card";

        const consultantsHTML =
          details.consultants && details.consultants.length > 0
            ? `<ul class="consultants-list">
                ${details.consultants.map((email) =>
                  `<li>
                    <span class="consultant-email">${email}</span>
                    <button class="delete-btn" data-capability="${name}" data-email="${email}" aria-label="Unregister ${email}">❌</button>
                  </li>`
                ).join("")}
              </ul>`
            : `<p class="no-consultants">No consultants registered yet</p>`;

        const verticals = details.industry_verticals
          ? details.industry_verticals.map((v) => `<span class="badge">${v}</span>`).join("")
          : "";

        card.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <div class="capability-meta">
            <span class="badge practice">${details.practice_area}</span>
            ${verticals}
          </div>
          <p><strong>Capacity:</strong> ${details.capacity || 0} hrs/week &nbsp;|&nbsp; <strong>Team:</strong> ${details.consultants ? details.consultants.length : 0} consultants</p>
          <div class="consultants-container">
            <h5>Registered Consultants</h5>
            ${consultantsHTML}
          </div>
          <button class="register-btn" data-capability="${name}">+ Register Expertise</button>
        `;

        capabilitiesList.appendChild(card);
      });

      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", handleUnregister);
      });

      document.querySelectorAll(".register-btn").forEach((btn) => {
        btn.addEventListener("click", () => openModal(btn.dataset.capability));
      });
    } catch (error) {
      capabilitiesList.innerHTML = "<p>Failed to load capabilities. Please try again later.</p>";
      console.error("Error fetching capabilities:", error);
    }
  }

  async function handleUnregister(event) {
    const { capability, email } = event.currentTarget.dataset;
    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(capability)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      showMessage(result.message || result.detail, response.ok ? "success" : "error");
      if (response.ok) fetchCapabilities();
    } catch {
      showMessage("Failed to unregister. Please try again.", "error");
    }
  }

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const capability = selectedCapabilityInput.value;

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(capability)}/register?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();
      showMessage(result.message || result.detail, response.ok ? "success" : "error");
      if (response.ok) {
        closeModal();
        fetchCapabilities();
      }
    } catch {
      showMessage("Failed to register. Please try again.", "error");
    }
  });

  fetchCapabilities();
});
