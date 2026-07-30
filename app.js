(() => {
  const form = document.getElementById("qr-form");
  const linkInput = document.getElementById("link-input");
  const nameInput = document.getElementById("name-input");
  const canvas = document.getElementById("qr-canvas");
  const previewFrame = document.getElementById("preview-frame");
  const previewHint = document.getElementById("preview-hint");
  const downloadBtn = document.getElementById("download-btn");

  let objectUrl = null;

  function normalizeLink(raw) {
    const value = raw.trim();
    if (!value) return "";
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) return value;
    return `https://${value}`;
  }

  function isValidLink(link) {
    try {
      const url = new URL(link);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function fitFont(ctx, text, maxWidth, startSize) {
    let size = startSize;
    ctx.font = `700 ${size}px Fraunces, Georgia, serif`;
    while (size > 16 && ctx.measureText(text).width > maxWidth) {
      size -= 1;
      ctx.font = `700 ${size}px Fraunces, Georgia, serif`;
    }
    return size;
  }

  function composeLabeledQr(qrCanvas, name) {
    const paddingX = 28;
    const paddingTop = 28;
    const paddingBottom = 20;
    const gap = 18;
    const qrSize = qrCanvas.width;

    const measure = document.createElement("canvas").getContext("2d");
    const fontSize = fitFont(measure, name, qrSize - paddingX * 2, Math.max(28, Math.round(qrSize / 11)));
    measure.font = `700 ${fontSize}px Fraunces, Georgia, serif`;
    const metrics = measure.measureText(name);
    const textHeight =
      (metrics.actualBoundingBoxAscent || fontSize * 0.8) +
      (metrics.actualBoundingBoxDescent || fontSize * 0.2);

    const out = document.createElement("canvas");
    out.width = qrSize + paddingX * 2;
    out.height = paddingTop + textHeight + gap + qrSize + paddingBottom;
    const ctx = out.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);

    ctx.fillStyle = "#13261f";
    ctx.font = `700 ${fontSize}px Fraunces, Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(name, out.width / 2, paddingTop);

    ctx.drawImage(qrCanvas, paddingX, paddingTop + textHeight + gap);

    return out;
  }

  async function renderQr(link, name) {
    if (typeof QRCode === "undefined" || typeof QRCode.toCanvas !== "function") {
      throw new Error("QR library failed to load. Refresh the page and try again.");
    }

    const temp = document.createElement("canvas");
    await QRCode.toCanvas(temp, link, {
      width: 320,
      margin: 2,
      color: {
        dark: "#13261f",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });

    const finalCanvas = name ? composeLabeledQr(temp, name) : temp;
    const ctx = canvas.getContext("2d");
    canvas.width = finalCanvas.width;
    canvas.height = finalCanvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(finalCanvas, 0, 0);

    canvas.hidden = false;
    previewFrame.classList.remove("is-empty");
    previewFrame.classList.remove("has-code");
    // Retrigger pop animation
    void previewFrame.offsetWidth;
    previewFrame.classList.add("has-code");

    previewHint.textContent = name
      ? `Ready — “${name}” labeled above the code.`
      : "Ready — download your QR code.";

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = canvas.toDataURL("image/png");
    downloadBtn.disabled = false;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const link = normalizeLink(linkInput.value);
    const name = nameInput.value.trim();

    if (!isValidLink(link)) {
      linkInput.classList.add("is-invalid");
      previewHint.textContent = "Enter a valid link (for example https://example.com).";
      downloadBtn.disabled = true;
      return;
    }

    linkInput.classList.remove("is-invalid");
    linkInput.value = link;

    try {
      downloadBtn.disabled = true;
      previewHint.textContent = "Generating…";
      await renderQr(link, name);
    } catch (error) {
      console.error(error);
      previewHint.textContent =
        error instanceof Error && error.message
          ? error.message
          : "Could not generate that QR code. Please try again.";
      downloadBtn.disabled = true;
    }
  });

  downloadBtn.addEventListener("click", () => {
    if (!objectUrl) return;
    const anchor = document.createElement("a");
    const safeName = (nameInput.value.trim() || "qring")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    anchor.href = objectUrl;
    anchor.download = `${safeName || "qring"}-qr.png`;
    anchor.click();
  });

  linkInput.addEventListener("input", () => {
    linkInput.classList.remove("is-invalid");
  });
})();
