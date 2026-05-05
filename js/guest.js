document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector("form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fileInput = document.querySelector("input[type='file']");
        const file = fileInput?.files[0];

        if (!file) {
            alert("Select a file");
            return;
        }

        // 🔒 File size validation (10MB)
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            alert("File must be less than 10MB");
            return;
        }

        try {
            // 🔑 Generate access code (better uniqueness)
            const code = crypto.randomUUID().slice(0, 8);

            // ✅ Clean filename
            const cleanFileName = file.name
                .replace(/\s+/g, "_")
                .replace(/[^\w.-]/g, "");

            // 📁 File path
            const filePath = `guest/${Date.now()}_${cleanFileName}`;

            // 📤 Upload file to storage
            const { error: uploadError } = await db.storage
                .from("files")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false
                });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                alert("Upload failed ❌");
                return;
            }

            // 💾 Save metadata in DB
            const { error: dbError } = await db
                .from("files")
                .insert([{
                    user_id: null,              // ✅ guest
                    file_name: cleanFileName,
                    file_path: filePath,

                    access_code: code,          // 🔥 MAIN FIX
                    is_private: false,
                    password: null,             // keep null for guest

                    size: file.size,
                    file_type: file.type || "unknown",
                    created_at: new Date()
                }]);

            if (dbError) {
                console.error("DB error:", dbError);

                // 🔥 rollback if DB fails
                await db.storage.from("files").remove([filePath]);

                alert("Database error ❌");
                return;
            }

            console.log("🔥 NEW GUEST JS LOADED");
            // ✅ Success
            alert(`Upload successful!\nAccess code: ${code}`);
            form.reset();

        } catch (err) {
            console.error("Unexpected error:", err);
            alert("Something went wrong ❌");
        }
    });

});