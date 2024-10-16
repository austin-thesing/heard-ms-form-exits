document.addEventListener("DOMContentLoaded", function () {
  // console.log("DOM fully loaded and parsed.");

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
    // console.log("Form submission started.");

    // Get form data
    const formData = new FormData(form);
    const jsonData = {};

    // Iterate over form data
    formData.forEach((value, key) => {
      // console.log(`Processing field: ${key}, value: ${value}`);

      // Check if it's a select field and skip if it has a disabled selected value
      const selectElement = form.querySelector(`select[name="${key}"]`);
      if (selectElement && selectElement.options[selectElement.selectedIndex].disabled) {
        // console.log(`Field ${key} is a disabled select option, skipping.`);
        jsonData[key] = ""; // Mark as skipped
      } else {
        // Only add radio/checkboxes if they are checked and non-empty values
        const inputElement = form.querySelector(`[name="${key}"]`);
        if (inputElement && (inputElement.type === "radio" || inputElement.type === "checkbox")) {
          if (inputElement.checked) {
            // console.log(`Field ${key} is a checked ${inputElement.type}, adding to jsonData.`);
            jsonData[key] = value;
          } else {
            // console.log(`Field ${key} is an unchecked ${inputElement.type}, skipping.`);
          }
        } else if (value.trim() !== "") {
          // console.log(`Field ${key} has a non-empty value, adding to jsonData.`);
          jsonData[key] = value; // Only add non-empty fields
        } else {
          // console.log(`Field ${key} is empty, marking as skipped.`);
          jsonData[key] = ""; // Mark empty fields as skipped
        }
      }
    });

    // Include additional data to capture drop-off point
    const lastStep = document.querySelector('.current[data-form="custom-progress-indicator"]');
    jsonData["last_step"] = lastStep ? lastStep.textContent : "Unknown";
    // console.log(`Last step captured: ${jsonData["last_step"]}`);

    // Send the data via a POST request to Cloudflare Worker
    fetch("https://h-form.designxdevelop.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    })
      .then((response) => {
        // console.log("Fetch response received:", response);
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error during fetch:", error);
      });

    // console.log("Form data processing complete.");
  });

  // console.log("Event listeners added successfully.");

  // Function to capture and send form data
  function captureAndSendFormData() {
    const jsonData = {};

    // Handle all input types
    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      const name = input.name;

      if (input.type === "radio") {
        // For radio buttons, only add the selected value
        if (input.checked) {
          jsonData[name] = input.value;
        } else if (!(name in jsonData)) {
          // If no radio in the group is checked, set an empty string
          jsonData[name] = "";
        }
      } else if (input.type === "select-one") {
        // For select elements
        const selectedOption = input.options[input.selectedIndex];
        jsonData[name] = !selectedOption || selectedOption.disabled ? "" : selectedOption.value;
      } else {
        // For text inputs, textareas, and other input types
        jsonData[name] = input.value.trim();
      }
    });

    // Add date and time of exit with timezone
    const now = new Date();
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZoneName: "short",
    };
    jsonData["exit_datetime"] = now.toLocaleString("en-US", options);

    // Capture last visible step question
    const lastStepQuestions = document.querySelectorAll("._wf-step-question");
    let lastVisibleStepQuestion = "Unknown";
    lastStepQuestions.forEach((question) => {
      if (question.offsetParent !== null) {
        lastVisibleStepQuestion = question.textContent.trim();
      }
    });
    jsonData["last_step"] = lastVisibleStepQuestion;

    // Send data to Cloudflare Worker
    fetch("https://h-form.designxdevelop.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // console.log("Fetch response from data capture:", response);
        return response.text();
      })
      .then((data) => {
        // console.log("Response data from Cloudflare Worker:", data);
      })
      .catch((error) => {
        console.error("Error during data capture fetch:", error);
      });
  }

  // Update the beforeunload event listener to use the new function
  window.addEventListener("beforeunload", function (e) {
    // console.log("Exit intent detected (page unload).");
    captureAndSendFormData();
    return null;
  });
});
