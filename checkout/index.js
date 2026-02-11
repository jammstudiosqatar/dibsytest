window.function = function (webhookUrl, amount, currency, description, redirectUrl, buttonText, buttonColor) {
  
  // 1. Get values from Glide inputs
  webhookUrl = webhookUrl.value ?? "";
  amount = amount.value ?? 0;
  currency = currency.value ?? "QAR";
  description = description.value ?? "Order";
  redirectUrl = redirectUrl.value ?? "";
  let btnText = buttonText.value ?? "Pay Now";
  let btnColor = buttonColor.value ?? "#000000";

  // 2. Validate essential fields
  if (webhookUrl === "") return "Data URI: Missing Webhook URL";

  // 3. Construct the HTML for the secure button
  // This HTML will run inside the Web Embed component
  let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    #pay-btn {
      background-color: ${btnColor};
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: opacity 0.2s;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    #pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner { display: none; margin-left: 10px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; width: 14px; height: 14px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <button id="pay-btn" onclick="initiateCheckout()">
    <span id="btn-text">${btnText}</span>
    <div class="spinner" id="spinner"></div>
  </button>

  <script>
    async function initiateCheckout() {
      var btn = document.getElementById('pay-btn');
      var spinner = document.getElementById('spinner');
      var btnText = document.getElementById('btn-text');

      // UI Loading State
      btn.disabled = true;
      spinner.style.display = 'block';
      btnText.innerText = "Securing Payment...";

      try {
        // Call Make.com Webhook
        const response = await fetch('${webhookUrl}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: ${amount},
            currency: '${currency}',
            description: '${description}',
            redirectUrl: '${redirectUrl}'
          })
        });

        if (response.ok) {
          const checkoutUrl = await response.text();
          
          if (checkoutUrl.startsWith('http')) {
            // Redirect to Dibsy
            window.top.location.href = checkoutUrl.trim(); 
          } else {
            alert('Error: Invalid URL returned');
            resetBtn();
          }
        } else {
          alert('Payment Gateway Error');
          resetBtn();
        }
      } catch (error) {
        console.error(error);
        alert('Connection failed. Please try again.');
        resetBtn();
      }
    }

    function resetBtn() {
      var btn = document.getElementById('pay-btn');
      var spinner = document.getElementById('spinner');
      var btnText = document.getElementById('btn-text');
      btn.disabled = false;
      spinner.style.display = 'none';
      btnText.innerText = "${btnText}";
    }
  </script>
</body>
</html>
  `;

  // 4. Return the code as a Data URI
  return "data:text/html;charset=utf-8," + encodeURIComponent(html);
}
