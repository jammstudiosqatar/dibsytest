function convert(x) {
  if (x instanceof Date) {
    return x.toISOString();
  } else if (Array.isArray(x)) {
    return x.map(convert);
  } else {
    return x;
  }
}

window.addEventListener("message", async function (event) {
  // Guard: ignore unrelated messages
  if (!event || !event.data || !event.data.key) return;

  const { key, params } = event.data;

  let result;
  let error;

  try {
    // Glide passes params already in the { value: ... } shape
    result = await window.function(...(params || []));
  } catch (e) {
    result = undefined;
    try {
      error = e.toString();
    } catch (err) {
      error = "Exception can't be stringified.";
    }
  }

  const response = { key };

  if (result !== undefined) {
    result = convert(result);
    // Your column returns a string (data URI), so string is correct here
    response.result = { type: "string", value: result };
  }

  if (error !== undefined) {
    response.error = error;
  }

  if (event.source && event.source.postMessage) {
    event.source.postMessage(response, "*");
  }
});
