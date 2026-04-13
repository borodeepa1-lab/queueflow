import React from "react";
import { QRCodeCanvas } from "qrcode.react";

function QRCodeDisplay() {
  const url = "http://localhost:3000/register";

  return (
    <div className="qr-box">
      <h3>Scan to Register</h3>
      <QRCodeCanvas value={url} size={150} />
      <p>{url}</p>
    </div>
  );
}

export default QRCodeDisplay;