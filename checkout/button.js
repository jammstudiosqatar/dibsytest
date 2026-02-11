// Function to generate the Dibsy Checkout Button
// Parameters: webhook_url, amount, currency, description, button_text, button_color
var generateCheckout = function(webhook_url, amount, currency, description, button_text, button_color) {

  // Default values if not provided
  var text = button_text || "Pay Now";
  var color = button_color || "#000000";
  var curr = currency || "QAR";

  // We build a complete HTML page as a string
  var html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
        #pay-btn {
          background-color: ${color};
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: opacity 0.2s;
          width: 100%;
        }
        #pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .spinner { display: none; margin-left: 10px; border: 2px solid #f3f3f3; border-top: 2px solid white; border-radius: 50%; width: 12px; height: 12px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <button id="pay-btn" onclick="initiateCheckout()">
        <span id="btn-text">${text}</span>
        <div class="spinner" id="spinner"></div>
      </button>

      <script>
        async function initiateCheckout() {
          var btn = document.getElementById('pay-btn');
          var spinner = document.getElementById('spinner');
          var btnText = document.getElementById('btn-text');

          // UI Loading State
          btn.disabled = true;
          spinner.style.display = 'inline-block';
          btnText.innerText = "Securing Payment...";

          try {
            // 1. Call the Make.com Webhook
            const response = await fetch('${webhook_url}', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: ${amount},
                currency: '${curr}',
                description: '${description}'
              })
            });

            // 2. Get the redirect URL from the response
            if (response.ok) {
              const checkoutUrl = await response.text();
              
              // 3. Redirect the user
              if (checkoutUrl.startsWith('http')) {
                window.top.location.href = checkoutUrl; 
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
          btnText.innerText = "${text}";
        }
      </script>
    </body>
    </html>
  `;

  // Return as Data URI so Glide can render it in an iframe
  return "data:text/html;charset=utf-8," + encodeURIComponent(html);
}

return generateCheckout(webhook_url, amount, currency, description, button_text, button_color);
