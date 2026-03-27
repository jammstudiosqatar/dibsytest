// Get query parameters from the URL
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    userID: params.get("userID"),
    customerID: params.get("customerID"),
    checkoutID: params.get("checkoutID"),
    payMethodID: params.get("payMethodID"),
    redirectUrl: params.get("redirectUrl"),
    customerName: params.get("customerName"),
  };
}

// Extract and log query data
const setupDetails = getQueryParams();
console.log("Card Setup Details:", setupDetails);

var options = {
  styles: {
    fontSize: "16px",
    color: "rgba(0, 0, 0, 0.8)",
    backgroundColor: "transparent",
    "&.is-invalid": {
      color: "#f42828",
    },
  },
};

// Initialize Dibsy components
const dibsy = Dibsy("pk_test_c28ee081369bedb88409c144b882a23382ce", {
  locale: "en_US",
});
var cardNumber = dibsy.createComponent("cardNumber", options);
cardNumber.mount("#card-number");

var expiryDate = dibsy.createComponent("expiryDate", options);
expiryDate.mount("#expiry-date");

var verificationCode = dibsy.createComponent("verificationCode", options);
verificationCode.mount("#verification-code");

// Attach validation display
cardNumber.addEventListener("change", (event) => {
  document.getElementById("card-number-error").textContent =
    event.error && event.touched ? event.error : "";
});
expiryDate.addEventListener("change", (event) => {
  document.getElementById("expiry-date-error").textContent =
    event.error && event.touched ? event.error : "";
});
verificationCode.addEventListener("change", (event) => {
  document.getElementById("verification-code-error").textContent =
    event.error && event.touched ? event.error : "";
});

// Submit logic
const form = document.getElementById("cardForm");
const formError = document.getElementById("form-error");
const submitButton = document.getElementById("submit-button");

form.addEventListener("submit", function (event) {
  event.preventDefault();
  disableForm();
  formError.textContent = "";

  dibsy.cardToken().then(function (result) {
    const token = result.token;
    const error = result.error;

    if (error) {
      enableForm();
      formError.textContent = error.message;
      return;
    }

    console.log("Token:", token);

    // Prepare payload for Make.com
    const payload = {
      token: token,
      amount: "100", // 1 QAR in minor units
      currency: "QAR",
      action: "verify_card",
      userID: setupDetails.userID,
      customerID: setupDetails.customerID,
      checkoutID: setupDetails.checkoutID,
      payMethodID: setupDetails.payMethodID,
      customerName: setupDetails.customerName,
      redirectUrl: setupDetails.redirectUrl,
    };

    fetch("https://hook.eu1.make.com/0u827q8wznlwcxjn9lexb02as79su5ks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.text())
      .then((text) => {
        console.log("Raw response:", text);

        try {
          const data = JSON.parse(text);
          if (data && data.checkout_url) {
            window.location.href = data.checkout_url;

            window.addEventListener("message", (event) => {
              if (event.origin === "https://dibsy.com") {
                const result = event.data;
                console.log("Card Verification Result:", result);

                if (result === "success") {
                  window.location.href = setupDetails.redirectUrl || "/success.html";
                } else {
                  document.body.innerHTML = "<h1>Card verification failed.</h1>";
                }
              }
            });
          } else {
            throw new Error("checkout_url missing");
          }
        } catch (err) {
          console.warn("Non-JSON response from Make.com:", text);
          document.body.innerHTML =
            "<h1>Card submitted. Please check your email or dashboard for confirmation.</h1>";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        formError.textContent = "An error occurred while processing the card.";
        enableForm();
      });
  });
});

function disableForm() {
  submitButton.disabled = true;
}

function enableForm() {
  submitButton.disabled = false;
}
