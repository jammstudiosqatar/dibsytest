window.function = function (webhookUrl, amount, currency, description, redirectUrl, buttonText, buttonColor) {
  // When Glide is still wiring up the column, inputs can be undefined
  if (webhookUrl === undefined) {
    return "data:text/html;charset=utf-8," + encodeURIComponent("<div style='font-family:sans-serif;padding:10px;'>Loading configuration…</div>");
  }

  // Extract values safely
  var webhook = webhookUrl.value ?? "";
  var amt = Number((amount && amount.value) ? amount.value : 0);
  var curr = (currency && currency.value) ? currency.value : "QAR";
  var desc = (description && description.value) ? description.value : "Order";
  var redirect = (redirectUrl && redirectUrl.value) ? redirectUrl.value : "";
  var btnTxt = (buttonText && buttonText.value) ? buttonText.value : "Pay Now";
  var btnClr = (buttonColor && buttonColor.value) ? buttonColor.value : "#000000";

  if (!webhook) {
    return "data:text/html;charset=utf-8," + encodeURIComponent("<div style='font-family:sans-serif; padding:10px;'>⚠️ Please set Webhook URL</div>");
  }

  // Escape values for safe injection into JS
  var safeDesc = JSON.stringify(desc);
  var safeCurr = JSON.stringify(curr);
  var safeRedirect = JSON.stringify(redirect);

  var html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: transparent; }
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
      -webkit-appearance: none;
    }
    #pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner { display: none; margin-left: 10px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; width: 14px; height: 14px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .error-msg { color: red; font-size: 12px; margin-top: 6px; text-align: center; display: none; }
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

        if (!response.ok) throw new Error("Gateway Error: " + response.status);

        const checkoutUrl = await response.text();
        const cleanUrl = checkoutUrl.replace(/^["']|["']$/g, '').trim();

        if (cleanUrl.startsWith('http')) {
          window.top.location.href = cleanUrl;
        } else {
          throw new Error("Invalid URL received");
        }

      } catch (error) {
        console.error(error);
        btn.disabled = false;
        spinner.style.display = 'none';
        btnText.innerText = "${btnTxt}";
        errLog.innerText = "Connection failed. Try again.";
        errLog.style.display = 'block';
      }
    }
  </script>
</body>
</html>
  `;

  return "data:text/html;charset=utf-8," + encodeURIComponent(html);
};
