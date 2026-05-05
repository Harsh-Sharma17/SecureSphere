document.addEventListener("DOMContentLoaded", async () => {

    const params = new URLSearchParams(window.location.search);
    const fileId = params.get("id");

    const container = document.getElementById("fileContainer");

    if (!fileId) {
        container.innerHTML = "Invalid link ❌";
        return;
    }

    // 📥 Get file from DB
    const { data: file, error } = await db
        .from("files")
        .select("*")
        .eq("id", fileId)
        .single();

    if (error || !file) {
        container.innerHTML = "File not found ❌";
        return;
    }

    // 🔐 PASSWORD CHECK
    if (file.password) {
        const input = prompt("Enter password:");

        if (input !== file.password) {
            container.innerHTML = "Wrong password ❌";
            return;
        }
    }

    // 🔗 Get URL
    const { data: urlData } = db.storage
        .from("files")
        .getPublicUrl(file.file_path);

    const url = urlData.publicUrl;

    // 🧱 Wrapper
    const wrapper = document.createElement("div");

    // 👁 Preview
    if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
        wrapper.innerHTML += `<img src="${url}" width="300">`;

    } else if (url.match(/\.pdf$/i)) {
        wrapper.innerHTML += `<iframe src="${url}" width="500" height="400"></iframe>`;
    } else {
        wrapper.innerHTML += `<p>Preview not available</p>`;
    }

    // ⬇ DOWNLOAD BUTTON
    const downloadBtn = document.createElement("button");
    downloadBtn.innerText = "⬇ Download File";

    downloadBtn.onclick = () => {

        const confirmDownload = confirm("Do you want to download this file?");
        if (!confirmDownload) return;

        // 🔥 Force download (important)
        fetch(url)
            .then(res => res.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = file.file_name;

                document.body.appendChild(a);
                a.click();

                a.remove();
                URL.revokeObjectURL(blobUrl);
            })
            .catch(() => alert("Download failed ❌"));
    };

    wrapper.appendChild(downloadBtn);

    // render
    container.innerHTML = "";
    container.appendChild(wrapper);
});