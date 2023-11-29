document.addEventListener("DOMContentLoaded", function () {
   const signupForm = document.getElementById("signupForm");

   signupForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      console.log("Signup form submitted.");
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      currentUsername = username;

      // Your Sign Up logic goes here
      // For simplicity, let's assume you have a server endpoint /signup
      try {
         const response = await fetch("/signup", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, password }),
         });

         if (response.status === 200) {
            const result = await response.json();
            console.log(result.message);

            // Check for a redirect property in the response
            if (result.redirect) {
               window.location.href = result.redirect;
            } else {
               // Fallback redirect if no specific redirect is provided
               window.location.href = "index.html"; // Adjust the path as needed
            }
         } else {
            alert("Sign Up failed. Please try again.");
         }
      } catch (error) {
         console.error("Error during Sign Up:", error);
         alert("An error occurred during Sign Up. Please try again later.");
      }
   });
});
