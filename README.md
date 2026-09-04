# Personal English Spaced Repetition App

Static Firebase + Vanilla JS + Bootstrap 5 app.

## Files
- index.html
- style.css
- app.js
- firebase-config.js

## Setup
1. Create a Firebase project.
2. Enable Google Authentication.
3. Create Firestore Database.
4. Replace placeholders in firebase-config.js.
5. Add your Vercel domain to Firebase Authentication > Authorized domains.
6. Deploy this folder to Vercel.

## Firestore Security Rules

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write:
        if request.auth != null
        && request.auth.uid == userId;
    }
  }
}


## Nội dung nền tảng Hóa 9 từ PDF
- `chem9-pdf.js`: kiến thức, công thức và phản ứng được đưa vào Knowledge / Reactions / Formulas / Học & Test.
- Nội dung bám theo `kien_thuc_hoa_9 (1).pdf` và được ưu tiên trước Hóa 11 để hỗ trợ người mất gốc.
