window.function = function (
  webhookUrl,
  amount,
  currency,
  description,
  redirectUrl,
  buttonText,
  buttonColor
) {
  const getVal = (p, def) => {
    if (p === null || p === undefined) return def;
    if (typeof p === "object" && "value" in p) return p.value ?? def;
    return p ?? def;
  };

  const webhook = String(getVal(webhookUrl, "")).trim();
  const amtRaw = getVal(amount, 0);
  const amt = Number(amtRaw);
  const curr = String(getVal(currency, "QAR")).trim();
  const desc = String(getVal(description, "Order")).trim();
  let redirect = String(getVal(redirectUrl, "")).trim();
  const btnTxt = String(getVal(buttonText, "Pay Now")).trim();
  const btnClr = String(getVal(buttonColor, "#000000")).trim();

  // If they enter "www.site.com", Dibsy/redirects usually want a full URL
  if (redirect && !/^https?:\/\//i.test(redirect)) redirect = "https://" + redirect;

  // Always return HTML (never undefined) so Glide doesn't spin forever.
  if (!webhook) {
    return (
      "data:text/html;charset=utf-8," +
      encodeURIComponent(
        `<div style="font-family:system-ui;padding:10px">⚠️ Please set <b>Make Webhook URL</b></div>`
      )
    );
  }

  const safeCurr = JSON.stringify(curr);
  const safeDesc = JSON.stringify(desc);
  const safeRedirect = JSON.stringify(redirect);

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; background: transparent; }
    button {
      width:100%;
      background:${btnClr};
      color:#fff;
      padding:12px 16px;
      border:0;
      border-radius:10px;
      font-size:16px;
      font-weight:600;
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:10px;
    }
    button:disabled { opacity:.65; cursor:not-allowed; }
    .spinner {
      width:14px; height:14px;
      border:2px solid rgba(255,255,255,.35);
      border-top-color:#fff;
      border-radius:50%;
      display:none;
      animation:spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .err { color:#b00020; font-size:12px; margin-top:8px; display:none; text-align:center; }
  </style>
</head>
<body>
  <button id="payBtn" type="button" onclick="go()">
    <span id="txt">${btnTxt}</span>
    <span class="spinner" id="sp"></span>
  </button>
  <div class="err" id="err"></div>

<script>
async function go() {
  const btn = document.getElementById('payBtn');
  const txt = document.getElementById('txt');
  const sp  = document.getElementById('sp');
  const err = document.getElementById('err');

  err.style.display = 'none';
  btn.disabled = true;
  sp.style.display = 'inline-block';
  txt.textContent = 'Securing payment…';

  try {
    const res = await fetch(${JSON.stringify(webhook)}, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: ${isFinite(amt) ? amt : 0},
        currency: ${safeCurr},
        description: ${safeDesc},
        redirectUrl: ${safeRedirect}
      })
    });

    const text = await res.text();
    if (!res.ok) throw new Error('Gateway error: ' + res.status + ' ' + text);

    const cleanUrl = String(text).replace(/^["']|["']$/g,'').trim();
    if (!/^https?:\\/\\//i.test(cleanUrl)) throw new Error('Invalid URL returned: ' + cleanUrl);

    // Break out of the iframe and send the user to checkout
    window.top.location.href = cleanUrl;
  } catch (e) {
    console.error(e);
    btn.disabled = false;
    sp.style.display = 'none';
    txt.textContent = ${JSON.stringify(btnTxt)};
    err.textContent = 'Connection failed. Please try again.';
    err.style.display = 'block';
  }
}
</script>
</body>
</html>`;

  return "data:text/html;charset=utf-8," + encodeURIComponent(html);
};
