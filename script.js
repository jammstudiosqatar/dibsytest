// Function to get query parameters from the URL
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    amount: params.get("amount"), // Payment amount (e.g., 10000 for $100.00)
    currency: params.get("currency"), // Currency (e.g., USD)
    description: params.get("description"), // Payment description
    userID: params.get("userID"), // Optional user identifier
    customerID: params.get("customerID"), // Customer ID
    checkoutID: params.get("checkoutID"), // Checkout ID
    redirectUrl: params.get("redirectUrl"), // Redirect URL after payment processing
    payMethodID: params.get("payMethodID"), // Payment method ID
    membershipID: params.get("membershipID"),
    customerName: params.get("customerName"),
  };
}

// New function to update the payment summary dynamically
function updatePaymentSummary() {
  const paymentDetails = getQueryParams(); // Use the function to extract parameters

  // Populate the description
  const descriptionElement = document.getElementById("payment-description");
  if (paymentDetails.description) {
    descriptionElement.textContent = paymentDetails.description;
  } else {
    descriptionElement.textContent = "No description provided";
  }

  // Populate the amount
  const amountElement = document.getElementById("payment-amount");
  if (paymentDetails.amount && paymentDetails.currency) {
    amountElement.textContent = `Amount: ${paymentDetails.amount} ${paymentDetails.currency}`;
  } else {
    amountElement.textContent = "No amount provided";
  }
}

// Extract payment details from the URL
const paymentDetails = getQueryParams();
console.log("Payment Details:", paymentDetails);

// Call the function to update the payment summary
updatePaymentSummary();

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

const dibsy = Dibsy("pk_live_Cb1IChUrXLsKSJI51aq1nBhkTENev15SZfqU", {
  locale: "en_US",
});
var cardNumber = dibsy.createComponent("cardNumber", options);
cardNumber.mount("#card-number");

var expiryDate = dibsy.createComponent("expiryDate", options);
expiryDate.mount("#expiry-date");

var verificationCode = dibsy.createComponent("verificationCode", options);
verificationCode.mount("#verification-code");

var cardNumberError = document.getElementById("card-number-error");
cardNumber.addEventListener("change", function (event) {
  cardNumberError.textContent = event.error && event.touched ? event.error : "";
});

var expiryDateError = document.getElementById("expiry-date-error");
expiryDate.addEventListener("change", function (event) {
  expiryDateError.textContent =
    event.error && event.touched ? event.error : "";
});

var verificationCodeError = document.getElementById("verification-code-error");
verificationCode.addEventListener("change", function (event) {
  verificationCodeError.textContent =
    event.error && event.touched ? event.error : "";
});

/**
 * Submit handler
 */
var form = document.getElementById("payForm");
var formError = document.getElementById("form-error");
var submitButton = document.getElementById("submit-button");

form.addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent default form submission
  disableForm(); // Disable the form while processing
  formError.textContent = ""; // Reset any previous errors

  // Get a payment token
  dibsy.cardToken().then(function (result) {
    const token = result.token; // Dibsy token
    const error = result.error;

    if (error) {
      enableForm(); // Re-enable the form on error
      formError.textContent = error.message;
      return;
    }

    console.log("Token:", token);

    // Prepare the payload for Make.com webhook
    const payload = {
      token: token, // Dibsy token
      amount: paymentDetails.amount, // Payment amount
      currency: paymentDetails.currency, // Payment currency
      description: paymentDetails.description, // Payment description
      userID: paymentDetails.userID, // User ID
      customerID: paymentDetails.customerID,
      checkoutID: paymentDetails.checkoutID,
      redirectUrl: paymentDetails.redirectUrl,
      payMethodID: paymentDetails.payMethodID,
      membershipID: paymentDetails.membershipID,
      customerName: paymentDetails.customerName,
    };

    // Send the payload to Make.com webhook
    fetch("https://hook.eu1.make.com/zuq5j7v25yoeqgx5snkevxyax1mp1wsa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json()) // Parse JSON response
      .then((data) => {
        console.log("Make.com Response:", data);

        // Check if the `checkout_url` is present
        if (data && data.checkout_url) {
          console.log("Redirecting to checkout URL:", data.checkout_url);

          // Redirect the user to the checkout page
          window.location.href = data.checkout_url;

          // After checkout, handle the result dynamically
          window.addEventListener("message", (event) => {
            if (event.origin === "https://dibsy.com") {
              const paymentStatus = event.data; // E.g., success or failure
              console.log("Payment Status:", paymentStatus);

              // Update the UI based on payment status
              if (paymentStatus === "success") {
                document.body.innerHTML = "<h1>Payment Successful</h1>";
              } else {
                document.body.innerHTML = "<h1>Payment Failed</h1>";
              }
            }
          });
        } else {
          console.error("Checkout URL not found in the response.");
          formError.textContent = "Unable to process payment. Please try again later.";
          enableForm(); // Re-enable the form on error
        }
      })
      .catch((error) => {
        console.error("Error processing payment:", error);
        formError.textContent = "An error occurred while processing the payment.";
        enableForm(); // Re-enable the form on error
      });
  });
});

function disableForm() {
  submitButton.disabled = true;
}

function enableForm() {
  submitButton.disabled = false;
}
