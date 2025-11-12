document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (keep default placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        // Render basic card with a placeholder for participants list we will build as DOM nodes
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants (${details.participants.length}/${details.max_participants}):</strong>
            <div class="participants-list"></div>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Build participants list as DOM nodes so we can attach event handlers to delete buttons
        const participantsContainer = activityCard.querySelector(".participants-list");
        if (details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants";

          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.textContent = p;

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "delete-btn";
            btn.title = "Unregister participant";
            btn.innerHTML = "✖"; // simple cross icon
            btn.dataset.activity = name;
            btn.dataset.email = p;

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });

          participantsContainer.appendChild(ul);
        } else {
          participantsContainer.innerHTML = "<p><em>No participants yet</em></p>";
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Delegate click handler for delete buttons to the activitiesList container
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".delete-btn");
    if (!btn) return;

    const activity = btn.dataset.activity;
    const email = btn.dataset.email;
    if (!activity || !email) return;

    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await resp.json();

      if (resp.ok) {
        // Refresh the activities list to update counts and UI
        await fetchActivities();
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        messageDiv.classList.remove("hidden");

        // Hide message after 3 seconds
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 3000);
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
        messageDiv.classList.remove("hidden");
      }
    } catch (err) {
      console.error("Error unregistering participant:", err);
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        // Ensure the message has the message base class plus success
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities so the participant appears immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
