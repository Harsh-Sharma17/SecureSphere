document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("sharedList");

    try {
        // 🔐 Get logged-in user
        const { data: userData, error: userError } = await db.auth.getUser();

        if (userError || !userData?.user) {
            window.location.href = "login.html";
            return;
        }

        const currentUser = userData.user;

        // ✅ ONLY FETCH USER'S OWN FILES
        const { data, error } = await db
            .from("files")
            .select("*")
            .eq("user_id", currentUser.id);

        if (error) {
            console.error("DB ERROR:", error);
            container.innerHTML = "<p>Error loading files</p>";
            return;
        }

        if (!data || data.length === 0) {
            container.innerHTML = "<p>No files found</p>";
            return;
        }

        container.innerHTML = "";

        data.forEach(file => {

            if (!file.file_path) return;

            const card = document.createElement("div");
            card.classList.add("file-card");

            // 📛 File name
            const name = document.createElement("span");
            name.classList.add("file-name");
            name.innerText = `${file.file_name} ${file.is_private ? "🔒" : "🌐"}`;

            // 🔗 File URL
            const { data: urlData } = db.storage
                .from("files")
                .getPublicUrl(file.file_path);

            const fileUrl = urlData.publicUrl;

            const isPublic = !file.is_private;

            // 🔘 Buttons
            const btnGroup = document.createElement("div");
            btnGroup.classList.add("btn-group");

            const viewBtn = document.createElement("button");
            viewBtn.textContent = "👁";

            const downloadBtn = document.createElement("button");
            downloadBtn.textContent = "⬇";

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "🗑";

            let shareBtn = null;

            // 🔗 SHARE ONLY IF PUBLIC
            if (isPublic) {
                shareBtn = document.createElement("button");
                shareBtn.textContent = "🔗";
            }

            btnGroup.append(viewBtn, downloadBtn);

            if (shareBtn) btnGroup.appendChild(shareBtn);
            btnGroup.appendChild(deleteBtn);

            // 🖼 Preview
            const preview = document.createElement("div");
            preview.classList.add("preview");

            // ================= EVENTS =================

            // 👁 VIEW
            viewBtn.addEventListener("click", async () => {
                const allowed = await verifyPassword(file);
                if (!allowed) return;

                viewFile(preview, fileUrl);
            });

            // ⬇ DOWNLOAD
            downloadBtn.addEventListener("click", async () => {
                const allowed = await verifyPassword(file);
                if (!allowed) return;

                downloadFile(fileUrl, file.file_name);
            });

            // 🔗 SHARE
            if (shareBtn) {
                shareBtn.addEventListener("click", async () => {
                    const allowed = await verifyPassword(file);
                    if (!allowed) return;

                    const link = `${window.location.origin}/view.html?id=${file.id}`;
                    copyShareLink(link);
                });
            }

            // 🗑 DELETE
            deleteBtn.addEventListener("click", async () => {

                const confirmDelete = confirm("Delete this file?");
                if (!confirmDelete) return;

                try {
                    await db.storage.from("files").remove([file.file_path]);
                    await db.from("files").delete().eq("id", file.id);

                    card.remove();
                    alert("File deleted ✅");

                } catch (err) {
                    console.error(err);
                    alert("Delete failed ❌");
                }
            });

            card.append(name, btnGroup, preview);
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Unexpected error:", err);
        container.innerHTML = "<p>Something went wrong</p>";
    }
});


// 🔐 PASSWORD CHECK
async function verifyPassword(file) {
    if (!file.password) return true;

    const input = prompt("Enter password:");

    if (!input) return false;

    if (input === file.password) {
        return true;
    } else {
        alert("Wrong password ❌");
        return false;
    }
}


// 👁 VIEW FILE
function viewFile(preview, url) {

    preview.innerHTML = "";

    const cleanUrl = url.split("?")[0].toLowerCase();

    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "✖";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.float = "right";
    closeBtn.style.color = "red";

    closeBtn.onclick = () => preview.innerHTML = "";

    preview.appendChild(closeBtn);

    if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg") || cleanUrl.endsWith(".png") || cleanUrl.endsWith(".gif")) {

        const img = document.createElement("img");
        img.src = url;
        img.style.width = "250px";

        preview.appendChild(img);

    } else if (cleanUrl.endsWith(".pdf")) {

        const iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.width = "400";
        iframe.height = "300";

        preview.appendChild(iframe);

    } else {
        preview.innerHTML += "<p>Preview not supported</p>";
    }
}


// ⬇ DOWNLOAD
function downloadFile(url, name) {

    const confirmDownload = confirm("Download this file?");
    if (!confirmDownload) return;

    fetch(url)
        .then(res => res.blob())
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = name;

            document.body.appendChild(a);
            a.click();

            a.remove();
            URL.revokeObjectURL(blobUrl);
        })
        .catch(() => alert("Download failed ❌"));
}


// 🔗 COPY LINK
function copyShareLink(link) {
    navigator.clipboard.writeText(link)
        .then(() => alert("Link copied 🔗"))
        .catch(() => alert("Copy failed"));
}