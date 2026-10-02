export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 20px', lineHeight: 1.6 }}>
      <h1>Privacy Policy — CODS OMS</h1>
      <p>CODS OMS is an internal order-management tool used by CODS Clothing Co. staff only.</p>
      <p>
        When a team member connects their Google account, this app accesses only the files and
        folders it creates in their Google Drive (via the drive.file scope) and their email
        address, to organize order files and identify the signed-in user. It does not access any
        other files in their Drive, and does not share this data with third parties.
      </p>
      <p>
        Order and customer data entered into this app (names, phone numbers, addresses, order
        details) is stored securely and used solely to operate CODS Clothing Co.&apos;s order
        management.
      </p>
      <p>Questions: contact mediaexecutor@gmail.com.</p>
    </div>
  );
}
