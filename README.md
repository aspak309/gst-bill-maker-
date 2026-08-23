# GST Bill Maker

## What this version does
- Firebase Authentication: Email/password, Google, Phone OTP.
- Company logo and signature are selected locally and embedded into the generated PDF.
- UPI ID creates a UPI payment QR inside the PDF.
- Account holder, bank, account number, IFSC, phone, email, GSTIN and invoice fields are available.
- Invoice/customer/payment/logo/signature data are NOT written to Firestore or Firebase Storage.
- PDF is generated locally in the browser.

## Firebase console setup
1. Authentication -> Sign-in method: enable Email/Password, Google and Phone.
2. Authentication -> Settings -> Authorized domains: add your production domain.
3. For Phone Auth, Firebase will use reCAPTCHA. Test phone numbers can be configured in Firebase Authentication settings.
4. Do not add Firestore or Storage code if you do not want invoice data stored.

## Google Search Console
The supplied verification meta tag is already in `index.html`. In Search Console, verification still needs to be completed for the exact site/domain.

## Important
Firebase Auth itself stores the authentication account needed for login. This project intentionally does not store invoice/customer/payment documents in Firestore/Storage.
