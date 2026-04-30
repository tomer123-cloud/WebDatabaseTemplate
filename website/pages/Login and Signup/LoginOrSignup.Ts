const loginButton = document.getElementById("LoginButton") as HTMLButtonElement//Finds the button in HTML and saves it in ts
loginButton.addEventListener("click", () => {//Tells TypeScript: “this is a button”
  window.location.href = "Login.html";//Go to another page (Login.html)
});
