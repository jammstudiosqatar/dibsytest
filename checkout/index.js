window.function = function (webhookUrl, amount, currency, description, redirectUrl, buttonText, buttonColor) {

  // 1. Defensively handle missing inputs (avoid returning undefined which causes spinner)
  if (webhookUrl === undefined) {
    // This state happens when the column is first created or manifest is loading
    return "data:text/html;charset=utf-8," + encodeURIComponent("<div>Loading configuration...</div>");
  }

  // 2. Get values safely
  var webhook = webhookUrl.value ?? "";
  var amt = (amount && amount.value) ? amount.value : 0;
  var curr = (currency && currency.value) ? currency.value : "QAR";
  var desc = (description && description.value) ? description.value : "Order";
  var redirect = (redirectUrl && redirectUrl.value) ? redirectUrl.value : "";
  var btnTxt = (buttonText && buttonText.value) ? buttonText.value : "Pay Now";
  var btnClr = (buttonColor && buttonColor.value) ? buttonColor.value : "#000000";

  // 3. Validation
  if (webhook === "") {
    return "data:text/html;charset=utf-8," + encodeURIComponent("<div style='font-family:sans-serif; padding:10px;'>⚠️ Please set Webhook URL</div>");
  }

  // 4. Safe Data Insertion
  // We use JSON.stringify to safely escape quotes/special characters for the generated JS
  // values that will be inserted into the HTML string.
  var safeDesc = JSON.stringify(desc);
  var safeCurr = JSON.stringify(curr);
  var safeRedirect = JSON.stringify(redirect);

  // 5. Construct the HTML
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
      -webkit-appearance: none;
    }
    #pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner { display: none; margin-left: 10px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; width: 14px; height: 14px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .error-msg { color: red; font-size: 12px; margin-top: 5px; text-align: center; display: none; }
  </style>
</head>
<body>
  <div style="width:100%">
    <button id="pay-btn" onclick="initiateCheckout()">
      <span id="btn-text">${btnTxt}</span>
      <div class="spinner" id="spinner"></div>
    </button>
    <div id="error-log" class="error-msg"></div>
  </div>

  <script>
    async function initiateCheckout() {
      var btn = document.getElementById('pay-btn');
      var spinner = document.getElementById('spinner');
      var btnText = document.getElementById('btn-text');
      var errLog = document.getElementById('error-log');

      // Reset
      errLog.style.display = 'none';
      btn.disabled = true;
      spinner.style.display = 'block';
      btnText.innerText = "Securing Payment...";

      try {
        const response = await fetch('${webhook}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: ${amt},
            currency: ${safeCurr},
            description: ${safeDesc},
            redirectUrl: ${safeRedirect}
          })
        });

        if (response.ok) {
          const checkoutUrl = await response.text();
          // Clean URL
          const cleanUrl = checkoutUrl.replace(/^["']|["']$/g, '').trim();
          
          if (cleanUrl.startsWith('http')) {
            window.top.location.href = cleanUrl; 
          } else {
            throw new Error("Invalid URL received from Payment Gateway");
          }
        } else {
          throw new Error("Gateway Error: " + response.status);
        }
      } catch (error) {
        console.error(error);
        btn.disabled = false;
        spinner.style.display = 'none';
        btnText.innerText = "${btnTxt}";
        errLog.innerText = "Connection Failed. Try again.";
        errLog.style.display = 'block';
      }
    }
  </script>
</body>
</html>
  `;

  return "data:text/html;charset=utf-8," + encodeURIComponent(html);
}
