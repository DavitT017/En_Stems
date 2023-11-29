document.addEventListener("DOMContentLoaded", function () {
   const signinForm = document.getElementById("signinForm");

   signinForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      console.log("Signin form submitted.");

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      currentUsername = username;

      // Your Sign In logic goes here
      // For simplicity, let's assume you have a server endpoint /signin
      try {
         const response = await fetch("/signin", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
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
            alert("Sign In failed. Please check your username and password.");
         }
      } catch (error) {
         console.error("Error during Sign In:", error);
         alert("An error occurred during Sign In. Please try again later.");
      }
   });
});
