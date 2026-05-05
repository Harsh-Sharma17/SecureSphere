// 🔐 Logout function (GLOBAL - accessible from HTML)
async function logout() {
    await db.auth.signOut();
    window.location.href = "index";
}

// 🚀 Load Dashboard
async function loadDashboard() {
    const list = document.querySelector("ul");

    try {
        // 🔐 Get logged-in user
        const { data: userData, error } = await db.auth.getUser();

        if (error || !userData.user) {
            window.location.href = "login";
            return;
        }

        const user = userData.user;

        // 📥 Fetch files
        const { data, error: dbError } = await db
            .from("files")
            .select("*")
            .eq("user_id", user.id);

        if (dbError) {
            console.error("DB ERROR:", dbError);
            list.innerHTML = "<li>Error loading files</li>";
            return;
        }

        list.innerHTML = "";

        if (!data || data.length === 0) {
            list.innerHTML = "<li>No files uploaded yet</li>";
            return;
        }

        data.forEach(file => {
            const li = document.createElement("li");

            const status = file.is_private ? "Private 🔒" : "Public 🌐";

            li.innerText = `${file.file_name} - ${status}`;

            list.appendChild(li);
        });

    } catch (err) {
        console.error("Unexpected Error:", err);
        list.innerHTML = "<li>Something went wrong</li>";
    }
}

// Run after page loads
document.addEventListener("DOMContentLoaded", loadDashboard);