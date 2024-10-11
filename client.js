document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded and parsed.");

  // Find the form element by its id
  const form = document.getElementById("wf-form-Plan-Suggestion-Form");
  if (!form) {
    console.error("Form not found.");
    return;
  }

  console.log("Form found. Ready to add event listeners.");

  // Listen for form submission events
  form.addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent default form submission behavior
    console.log("Form submission started.");

    // Get form data
    const formData = new FormData(form);
    const jsonData = {};

    // Iterate over form data
    formData.forEach((value, key) => {
      console.log(`Processing field: ${key}, value: ${value}`);

      // Check if it's a select field and skip if it has a disabled selected value
      const selectElement = form.querySelector(`select[name="${key}"]`);
      if (selectElement && selectElement.options[selectElement.selectedIndex].disabled) {
        console.log(`Field ${key} is a disabled select option, skipping.`);
        jsonData[key] = ""; // Mark as skipped
      } else {
        // Only add radio/checkboxes if they are checked and non-empty values
        const inputElement = form.querySelector(`[name="${key}"]`);
        if (inputElement && (inputElement.type === "radio" || inputElement.type === "checkbox")) {
          if (inputElement.checked) {
            console.log(`Field ${key} is a checked ${inputElement.type}, adding to jsonData.`);
            jsonData[key] = value;
          } else {
            console.log(`Field ${key} is an unchecked ${inputElement.type}, skipping.`);
          }
        } else if (value.trim() !== "") {
          console.log(`Field ${key} has a non-empty value, adding to jsonData.`);
          jsonData[key] = value; // Only add non-empty fields
        } else {
          console.log(`Field ${key} is empty, marking as skipped.`);
          jsonData[key] = ""; // Mark empty fields as skipped
        }
      }
    });

    // Include additional data to capture drop-off point
    const lastStep = document.querySelector('.current[data-form="custom-progress-indicator"]');
    jsonData["last_step"] = lastStep ? lastStep.textContent : "Unknown";
    console.log(`Last step captured: ${jsonData["last_step"]}`);

    // Send the data via a POST request to Cloudflare Worker
    fetch("https://h-form.designxdevelop.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    })
      .then((response) => {
        console.log("Fetch response received:", response);
        return response.json();
      })
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error during fetch:", error);
      });

    console.log("Form data processing complete.");
  });

  // Listen for exit intents (i.e., user attempts to leave page)
  window.addEventListener("beforeunload", function (e) {
    console.log("Exit intent detected.");

    const formData = new FormData(form);
    const jsonData = {};

    formData.forEach((value, key) => {
      const selectElement = form.querySelector(`select[name="${key}"]`);
      if (selectElement && selectElement.options[selectElement.selectedIndex].disabled) {
        jsonData[key] = ""; // Mark as skipped
      } else {
        const inputElement = form.querySelector(`[name="${key}"]`);
        if (inputElement && (inputElement.type === "radio" || inputElement.type === "checkbox")) {
          if (inputElement.checked) {
            jsonData[key] = value;
          }
        } else if (value.trim() !== "") {
          jsonData[key] = value; // Only add non-empty fields
        } else {
          jsonData[key] = ""; // Mark empty fields as skipped
        }
      }
    });

    // Capture last step before exit
    const lastStep = document.querySelector('.current[data-form="custom-progress-indicator"]');
    jsonData["last_step"] = lastStep ? lastStep.textContent : "Unknown";
    console.log("Exit intent form data:", jsonData);

    // Send data to Cloudflare Worker
    fetch("https://h-form.designxdevelop.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    })
      .then((response) => {
        console.log("Fetch response from exit intent:", response);
      })
      .catch((error) => {
        console.error("Error during exit intent fetch:", error);
      });

    // Optional: Allow page to unload after the data is sent
    return null;
  });

  console.log("Event listeners added successfully.");
});
