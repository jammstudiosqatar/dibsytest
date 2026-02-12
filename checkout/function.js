window.function = function (
  webhookUrl,
  amount,
  currency,
  description,
  redirectUrl,
  buttonText,
  buttonColor,
  receiptNo,
  saleRowID,
  userID
) {
  const getVal = (p, def) => {
    if (p === null || p === undefined) return def;
    if (typeof p === "object" && "value" in p) return p.value ?? def;
    return p ?? def;
  };

  const webhook = String(getVal(webhookUrl, "")).trim();
  const amt = Number(getVal(amount, 0)) || 0;
  const curr = String(getVal(currency, "QAR")).trim();
  const desc = String(getVal(description, "Order")).trim();
  const redirect = String(getVal(redirectUrl, "")).trim();
  const btnTxt = String(getVal(buttonText, "Pay Now")).trim();
  const btnClr = String(getVal(buttonColor, "#000000")).trim();

  const meta = {
    receiptNo: String(getVal(receiptNo, "")).trim(),
    saleRowID: String(getVal(saleRowID, "")).trim(),
    userID: String(getVal(userID, "")).trim()
  };

  // Always return something so Glide never spins forever
  if (!webhook) {
    return "data:text/html;charset=utf-8," + encodeURIComponent(
      "<div style='font-family:system-ui; padding:12px;'>⚠️ Please set the Make Webhook URL.</div>"
    );
  }

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { margin:0; padding:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:transparent; }
    #wrap { width:100%; padding:10px; box-sizing:border-box; }
    #pay-btn{
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
      justify-content:center;
      align-items:center;
      gap:10px;
    }
    #pay-btn:disabled { opacity:.6; cursor:not-allowed; }
    .spinner{
      width:14px; height:14px;
      border-radius:50%;
      border:2px solid rgba(255,255,255,.35);
      border-top-color:#fff;
      display:none;
      animation:spin 1s linear infinite;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
    #err { margin-top:8px; font-size:12px; color:#b91c1c; text-align:center; display:none; }
  </style>
</head>
<body>
  <div id="wrap">
    <button id="pay-btn" type="button" onclick="go()">
      <span id="txt">${btnTxt}</span>
      <span class="spinner" id="sp"></span>
    </button>
    <div id="err"></div>
  </div>

<script>
  const cfg = ${JSON.stringify({
    webhook,
    amount: amt,
    currency: curr,
    description: desc,
    redirectUrl: redirect,
    metadata: meta
  })};

  async function go(){
    const btn = document.getElementById('pay-btn');
    const sp = document.getElementById('sp');
    const txt = document.getElementById('txt');
    const err = document.getElementById('err');

    err.style.display='none';
    err.textContent='';
    btn.disabled=true;
    sp.style.display='inline-block';
    txt.textContent='Securing payment...';

    try {
      const res = await fetch(cfg.webhook, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          amount: cfg.amount,
          currency: cfg.currency,
          description: cfg.description,
          redirectUrl: cfg.redirectUrl,
          metadata: cfg.metadata
        })
      });

      const text = await res.text();
      if(!res.ok) throw new Error('Gateway error ' + res.status + ' ' + text);

      const checkoutUrl = String(text).replace(/^["']|["']$/g,'').trim();
      if(!checkoutUrl.startsWith('http')) throw new Error('Invalid URL returned: ' + checkoutUrl);

      // Keep same session (full-window nav inside wrapper)
      window.top.location.href = checkoutUrl;

    } catch(e){
      console.error(e);
      btn.disabled=false;
      sp.style.display='none';
      txt.textContent=${JSON.stringify(btnTxt)};
      err.textContent='Connection failed. Please try again.';
      err.style.display='block';
    }
  }
</script>
</body>
</html>`;

  return "data:text/html;charset=utf-8," + encodeURIComponent(html);
};
