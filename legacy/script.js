
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

const pickButtons = document.querySelectorAll(".pick-btn");
const submitPick = document.getElementById("submitPick");
const predictionMessage = document.getElementById("predictionMessage");

let selectedTeam = null;
let submitted = false;

// Mobile navigation
menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Toggle navigation");
  menuToggle.textContent = isOpen ? "✕" : "☰";
});

// Close the menu after selecting a link
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Toggle navigation");
    menuToggle.textContent = "☰";
  });
});

// Select a prediction
pickButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (submitted) return;

    selectedTeam = button.dataset.team;

    pickButtons.forEach((item) => {
      const isSelected = item === button;

      item.classList.toggle("selected", isSelected);
      item.setAttribute("aria-pressed", String(isSelected));
    });

    submitPick.disabled = false;
    predictionMessage.textContent = `You've selected ${selectedTeam}. Submit your prediction!`;
    predictionMessage.style.color = "#9caec3";
  });

  button.setAttribute("aria-pressed", "false");
});

// Submit the demo prediction
submitPick.addEventListener("click", () => {
  if (!selectedTeam || submitted) return;

  submitted = true;

  predictionMessage.textContent =
    `Your demo prediction is Team ${selectedTeam === "Team A" ? "A" : "B"}! ` +
    "Your selection is complete. No points have been awarded.";

  predictionMessage.style.color = "#40d99a";

  submitPick.textContent = "Prediction Submitted";
  submitPick.disabled = true;

  pickButtons.forEach((button) => {
    button.disabled = true;
  });
});

// Automatically display the current year
document.getElementById("year").textContent = new Date().getFullYear();
