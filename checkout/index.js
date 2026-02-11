window.function = function (webhookUrl, amount, currency, description, redirectUrl, buttonText, buttonColor) {

  // SAFETY CHECK: If the user hasn't connected columns yet, stop here to prevent crashing.
  if (webhookUrl === undefined) return undefined;

  // 1. Get values safely (handling undefined/null inputs)
  var webhook = webhookUrl.value ?? "";
  var amt = (amount && amount.value) ? amount.value : 0;
  var curr = (currency && currency.value) ? currency.value : "QAR";
  var desc = (description && description.value) ? description.value : "Order";
  var redirect = (redirectUrl && redirectUrl.value) ? redirectUrl.value : "";
  var btnTxt = (buttonText && buttonText.value) ? buttonText.value : "Pay Now";
  var btnClr = (buttonColor && buttonColor.value) ? buttonColor.value : "#000000";

  // 2. If the Webhook URL is missing, return a placeholder button or empty string
  if (webhook === "") {
    // Optional: Return a disabled button saying "Setup Required"
    return "data:text/html;charset=utf-8," + encodeURIComponent("<div>Please connect Webhook URL</div>");
  }

  // 3. Construct the HTML
  var html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: transparent; }
    #pay-btn {
      background-color: ${btnClr};
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
      text-decoration: none;
    }
    #pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner { display: none; margin-left: 10px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; width: 14px; height: 14px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <button id="pay-btn" onclick="initiateCheckout()">
    <span id="btn-text">${btnTxt}</span>
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
        const response = await fetch('${webhook}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: ${amt},
            currency: '${curr}',
            description: '${desc}',
            redirectUrl: '${redirect}'
          })
        });

        if (response.ok) {
          const checkoutUrl = await response.text();
          // Remove quotes if they exist in the response
          const cleanUrl = checkoutUrl.replace(/^["']|["']$/g, '').trim();
          
          if (cleanUrl.startsWith('http')) {
            window.top.location.href = cleanUrl; 
          } else {
            console.error("Invalid URL:", cleanUrl);
            alert('Error: Gateway returned invalid URL');
            resetBtn();
          }
        } else {
          alert('Payment Gateway Error: ' + response.status);
          resetBtn();
        }
      } catch (error) {
        console.error(error);
        alert('Connection failed.');
        resetBtn();
      }
    }

    function resetBtn() {
      var btn = document.getElementById('pay-btn');
      var spinner = document.getElementById('spinner');
      var btnText = document.getElementById('btn-text');
      btn.disabled = false;
      spinner.style.display = 'none';
      btnText.innerText = "${btnTxt}";
    }
  </script>
</body>
</html>
  `;

  return "data:text/html;charset=utf-8," + encodeURIComponent(html);
}
