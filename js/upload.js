document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("uploadForm");
  const statusText = document.getElementById("status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("fileInput");
    const passwordInput = document.getElementById("filePassword");

    const file = fileInput?.files[0];
    const privacy = document.querySelector('input[name="privacy"]:checked')?.value || "private";
    const password = passwordInput?.value || null;

    if (!file) {
      alert("Please select a file");
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("File must be less than 10MB");
      return;
    }

    statusText.innerText = "Uploading... ⏳";

    try {
      // 🔐 Check logged-in user
      const { data: { user } } = await db.auth.getUser();

      const isGuest = !user;

      // ✅ Clean filename
      const cleanFileName = file.name
        .replace(/\s+/g, "_")
        .replace(/[^\w.-]/g, "");

      // 📁 Separate folder
      const filePath = isGuest
        ? `guest/${Date.now()}_${cleanFileName}`
        : `users/${user.id}/${Date.now()}_${cleanFileName}`;

      // 📤 Upload
      const { error: uploadError } = await db.storage
        .from("files")
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        alert(uploadError.message);
        statusText.innerText = "Upload failed ❌";
        return;
      }

      // 🔑 Generate code ONLY for guest
      const accessCode = isGuest
        ? Math.random().toString(36).substring(2, 10)
        : null;

      // 💾 Save metadata
      const { error: dbError } = await db
        .from("files")
        .insert([{
          file_name: cleanFileName,
          file_path: filePath,
          access_code: accessCode,
          is_private: privacy === "private",
          password: password || null,
          size: file.size,
          file_type: file.type || "unknown",
          user_id: user ? user.id : null   // 🔥 IMPORTANT
        }]);

      if (dbError) {
        console.error(dbError);

        await db.storage.from("files").remove([filePath]);

        alert("Database error: " + dbError.message);
        statusText.innerText = "Error ❌";
        return;
      }

      // ✅ Success message
      if (isGuest) {
        statusText.innerText = `Upload successful ✅ Code: ${accessCode}`;
      } else {
        statusText.innerText = `Upload successful ✅ (Saved in your account)`;
      }

      form.reset();

    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
      statusText.innerText = "Error ❌";
    }
  });

});