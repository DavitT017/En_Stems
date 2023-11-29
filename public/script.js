document.addEventListener("DOMContentLoaded", async function () {
	await checkSignInStatus();
	try {

		const audioFileInput = document.getElementById("audioFile");
		const separateButton = document.getElementById("separateButton");
		const outputFormat = document.getElementById("outputFormat");
		const stemSelection = document.getElementById("stemSelection");
		const stemsContainer = document.getElementById("stems");
		const signupButton = document.getElementById("signupButton");
		const signinButton = document.getElementById("signinButton");
		const signoutButton = document.getElementById("signoutButton");

		separateButton.addEventListener("click", async () => {
			const audioFile = audioFileInput.files[0];
			if (!audioFile) {
				alert("Please select an audio file.");
				return;
			}

			console.log("Showing loading screen...");
         	loadingContainer.style.display = "flex";

			const format = outputFormat.value; // Get the selected output format
			const selectedStem = stemSelection.value;

			const formData = new FormData();
			formData.append("audio", audioFile);
			formData.append("format", format);
			formData.append("stem", selectedStem);

			try {
				const response = await fetch("/separate-audio", {
					method: "POST",
					body: formData,
				});

				if (response.status === 200) {
					const result = await response.json();

					stemsContainer.innerHTML = "";

					const stemFolders = {};
					for (const stem of result.stems) {
						const stemName = stem.split('\\').pop().split('/').pop().replace('.wav', '');
						const stemFolder = stem.split('\\').slice(-2, -1)[0].replace('/', '');

						if (!stemFolders[stemFolder] || stemFolders[stemFolder] < stem) {
							stemFolders[stemFolder] = stem;
						}

						const stemContainer = document.createElement("div");
						stemContainer.classList.add("stem-container");

						const stemHeading = document.createElement("h3");
						stemHeading.innerText = stemName;
						stemContainer.appendChild(stemHeading);

						const audioPlayer = document.createElement("audio");
						audioPlayer.controls = true;
						audioPlayer.src = `/play?file=${encodeURIComponent(stem)}`;
						stemContainer.appendChild(audioPlayer);

						const downloadButton = document.createElement("button");
						downloadButton.innerText = `Download ${stemName}`;
						downloadButton.classList.add("download");
						downloadButton.addEventListener("click", async () => {
							const downloadFolder = stemFolders[stemFolder];
							if (downloadFolder) {
								try {
									const downloadResponse = await fetch(`/download?file=${encodeURIComponent(downloadFolder.replace(/\\/g, '/'))}`);
									if (downloadResponse.ok) {
										const blob = await downloadResponse.blob();

										// Create a temporary anchor element to trigger the download
										const downloadLink = document.createElement('a');
										downloadLink.href = window.URL.createObjectURL(blob);
										downloadLink.download = `${stemName}.wav`;

										// Trigger the click event on the anchor element
										document.body.appendChild(downloadLink);
										downloadLink.click();
										document.body.removeChild(downloadLink);
									} else {
										console.error('Error during download:', downloadResponse.statusText);
									}
								} catch (error) {
									console.error('Error during download:', error.message);
								}
							} else {
								console.error('Error: Unable to determine download folder.');
							}
						});
						stemContainer.appendChild(downloadButton);

						stemsContainer.appendChild(stemContainer);
					}
				} else {
					alert("Audio separation failed. Please try again.");
				}
			} catch (error) {
				console.error("Error during audio separation:", error);
				alert("An error occurred during audio separation. Please try again later.");
			} finally {
				console.log("Hiding loading screen...");
            	loadingContainer.style.display = "none";
			}


			await checkSignInStatus();
		});

		signupButton.addEventListener("click", function () {
			// Redirect to the Sign Up page
			window.location.href = "../signup.html";
		});

		signinButton.addEventListener("click", function () {
			// Redirect to the Sign In page
			window.location.href = "../signin.html";
		});

	} catch (error) {
		console.error("Error checking sign-in status:", error.message);
	}
	// Define the checkSignInStatus function
	async function checkSignInStatus() {
		try {
			const response = await fetch("/checkSignIn");
			if (response.status === 200) {
				const result = await response.json();
				const header = document.querySelector('.header');

				// Update header based on sign-in status
				if (result.username) {
					// User is signed in, display a simple greeting
					header.innerHTML = `<div>
          <h1>Hello ${result.username}</h1>
          <button id="signoutButton">Sign Out</button>
          </div>`;
				} else {
					// User is signed out, display the original header structure
					header.innerHTML = `
            <h1>Be Our Member!</h1>
            <div class="user-actions">
              <button id="signupButton" href="signup.html">Sign Up</button>
              <button id="signinButton" href="signin.html">Sign In</button>
			  <button style="display: none;" id="signoutButton">Sign Out</button>
            </div>
          `;
				}
			} else {
				console.error("Error checking sign-in status:", response.statusText);
			}
		} catch (error) {
			console.error("Error checking sign-in status:", error.message);
		}
	}
	signoutButton.addEventListener("click", async function () {
		console.log("Signout button clicked");
		try {
			const response = await fetch("/signout", {
				method: "POST", // Change this line
			});
			if (response.status === 200) {
				// Reload the page
				window.location.reload();
			} else {
				console.error("Error during sign-out:", response.statusText);
			}
		} catch (error) {
			console.error("Error during sign-out:", error.message);
		}
	});
});
