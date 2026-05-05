document.addEventListener("DOMContentLoaded", async () => {

    if (typeof db === "undefined") {
        alert("Supabase not connected ❌");
        return;
    }

    // ================================
    // 🔐 AUTH + ADMIN CHECK
    // ================================
    const { data: userData } = await db.auth.getUser();

    if (!userData?.user) {
        alert("Please login first");
        window.location.href = "login";
        return;
    }

    const admin = userData.user;

    const { data: userRow } = await db
        .from("users")
        .select("is_admin")
        .eq("id", admin.id)
        .single();

    if (!userRow?.is_admin) {
        alert("Access denied ❌");
        window.location.href = "dashboard";
        return;
    }

    console.log("✅ Admin verified");

    // ================================
    // 📏 FORMAT SIZE
    // ================================
    function formatSize(bytes) {
        if (!bytes) return "0 Bytes";
        if (bytes < 1024) return bytes + " Bytes";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
    }

    // ================================
    // 🔁 TOGGLE STATES
    // ================================
    let showAllUsers = false;
    let showAllFiles = false;
    let showAllGuest = false;
    let showAllLogs = false;

    // ================================
    // 📊 LOAD STATS
    // ================================
    async function loadStats() {
        try {
            // ✅ TOTAL USERS
            const { count: totalUsers } = await db
                .from("users")
                .select("*", { count: "exact", head: true });

            // ✅ TOTAL UPLOADS
            const { count: totalUploads } = await db
                .from("files")
                .select("*", { count: "exact", head: true });

            // ✅ ACTIVE USERS TODAY
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: todayFiles } = await db
                .from("files")
                .select("user_id, created_at")
                .gte("created_at", today.toISOString());

            // 🔥 unique user count
            const activeUsers = new Set(
                (todayFiles || [])
                    .filter(f => f.user_id !== null)
                    .map(f => f.user_id)
            ).size;

            // ✅ UPDATE UI
            document.getElementById("totalUsers").innerText = totalUsers || 0;
            document.getElementById("totalUploads").innerText = totalUploads || 0;
            document.getElementById("activeUsers").innerText = activeUsers;

        } catch (err) {
            console.error("Stats error:", err);
            document.getElementById("activeUsers").innerText = "Error";
        }
    }

    // ================================
    // 👤 LOAD USERS
    // ================================
    async function loadUsers() {
        const { data: users } = await db.from("users").select("*");

        const table = document.getElementById("userTable");
        table.innerHTML = "";

        const visible = showAllUsers ? users : users.slice(0, 2);

        const rows = await Promise.all(visible.map(async (user) => {
            const { data: files } = await db
                .from("files")
                .select("size")
                .eq("user_id", user.id);

            const total = (files || []).reduce((sum, f) => sum + (f.size || 0), 0);

            return `
                <tr>
                    <td>${user.email}</td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    <td>${formatSize(total)}</td>
                    <td><button onclick="deleteUser('${user.id}')">Delete</button></td>
                </tr>
            `;
        }));

        table.innerHTML = rows.join("");

        document.getElementById("toggleUsersBtn").innerText =
            showAllUsers ? "Hide Users" : "View All Users";
    }

    // ================================
    // 📁 LOAD FILES
    // ================================
    async function loadFiles() {
        const { data } = await db
            .from("files")
            .select(`*, users(email)`);

        const table = document.getElementById("fileTable");
        table.innerHTML = "";

        const visible = showAllFiles ? data : data.slice(0, 2);

        for (const file of visible) {

            const owner = file.user_id
                ? (file.users?.email || "Unknown")
                : "Guest";

            let size = file.size;

            // 🔥 FIX: fallback if size missing
            if (!size || size === 0) {
                try {
                    const folder = file.file_path.split("/")[0];

                    const { data: meta } = await db.storage
                        .from("files")
                        .list(folder);

                    const found = meta?.find(f =>
                        file.file_path.includes(f.name)
                    );

                    if (found?.metadata?.size) {
                        size = found.metadata.size;
                    }
                } catch (err) {
                    console.warn("Size fetch failed", err);
                }
            }

            table.innerHTML += `
                <tr>
                    <td>${file.file_name}</td>
                    <td>${owner}</td>
                    <td>${formatSize(size)}</td>
                    <td>${new Date(file.created_at).toLocaleDateString()}</td>
                    <td><button onclick="deleteFile('${file.id}')">Delete</button></td>
                </tr>
            `;
        }

        document.getElementById("toggleFilesBtn").innerText =
            showAllFiles ? "Hide Files" : "View All Files";
    }

    // ================================
    // 👻 LOAD GUEST FILES
    // ================================
    async function loadGuestFiles() {
        const { data } = await db
            .from("files")
            .select("*")
            .is("user_id", null);

        const table = document.getElementById("guestTable");
        table.innerHTML = "";

        const visible = showAllGuest ? data : data.slice(0, 2);

        for (const file of visible) {

            let size = file.size;

            // 🔥 FALLBACK: fetch from storage if missing
            if (!size || size === 0) {
                try {
                    const { data: meta } = await db.storage
                        .from("files")
                        .list(file.file_path.split("/")[0]);

                    const found = meta?.find(f => f.name === file.file_path.split("/")[1]);

                    if (found?.metadata?.size) {
                        size = found.metadata.size;
                    }
                } catch (e) {
                    console.warn("Size fetch failed");
                }
            }

            table.innerHTML += `
                <tr>
                    <td>${file.file_name}</td>
                    <td>${new Date(file.created_at).toLocaleDateString()}</td>
                    <td>${file.expiry_date ? new Date(file.expiry_date).toLocaleDateString() : "-"}</td>
                    <td>${formatSize(size)}</td>
                    <td><button onclick="deleteFile('${file.id}')">Delete</button></td>
                </tr>
            `;
        }

        document.getElementById("toggleGuestBtn").innerText =
            showAllGuest ? "Hide Guest Files" : "View All Guest Files";
    }

    // ================================
    // 🧾 LOAD LOGS
    // ================================
    async function loadLogs() {
        let query = db
            .from("logs")
            .select("*")
            .order("created_at", { ascending: false });

        if (!showAllLogs) query = query.limit(2);

        const { data } = await query;

        const list = document.getElementById("activityLogs");
        list.innerHTML = "";

        data.forEach(log => {
            const li = document.createElement("li");
            li.innerText = `${log.action} - ${new Date(log.created_at).toLocaleString()}`;
            list.appendChild(li);
        });

        document.getElementById("toggleLogsBtn").innerText =
            showAllLogs ? "Show Less" : "View All Logs";
    }

    // ================================
    // 🔘 BUTTON EVENTS
    // ================================
    document.getElementById("toggleUsersBtn")?.addEventListener("click", async () => {
        showAllUsers = !showAllUsers;
        await loadUsers();
    });

    document.getElementById("toggleFilesBtn")?.addEventListener("click", async () => {
        showAllFiles = !showAllFiles;
        await loadFiles();
    });

    document.getElementById("toggleGuestBtn")?.addEventListener("click", async () => {
        showAllGuest = !showAllGuest;
        await loadGuestFiles();
    });

    document.getElementById("toggleLogsBtn")?.addEventListener("click", async () => {
        showAllLogs = !showAllLogs;
        await loadLogs();
    });

    // ================================
    // 🔄 REFRESH
    // ================================
    window.refreshAdmin = async function () {
        await loadStats();
        await loadUsers();
        await loadFiles();
        await loadGuestFiles();
        await loadLogs();
    };

    refreshAdmin();
});


// ================================
// ❌ DELETE USER
// ================================
async function deleteUser(userId) {
    if (!confirm("Delete user permanently?")) return;

    await db.from("files").delete().eq("user_id", userId);
    await db.from("users").delete().eq("id", userId);

    window.refreshAdmin();
}


// ================================
// 🔥 DELETE FILE
// ================================
async function deleteFile(fileId) {
    if (!confirm("Delete file permanently?")) return;

    const { data: file } = await db
        .from("files")
        .select("file_path")
        .eq("id", fileId)
        .single();

    if (file?.file_path) {
        await db.storage.from("files").remove([file.file_path]);
    }

    await db.from("files").delete().eq("id", fileId);

    await db.from("logs").insert({
        action: "Admin deleted file",
        created_at: new Date()
    });

    window.refreshAdmin();
}