async function getFile() {

    const code = document.getElementById("codeInput").value.trim();

    if (!code) {
        alert("Enter access code");
        return;
    }

    try {
        // 🔥 Fetch guest file
        const { data, error } = await db
            .from("files")
            .select("id, file_path")
            .eq("access_code", code)
            .is("user_id", null)
            .maybeSingle();

        if (error || !data) {
            console.error("Fetch error:", error);
            alert("Invalid or unauthorized code ❌");
            return;
        }

        // 🔥 REDIRECT TO VIEW PAGE
        window.location.href = `view.html?id=${data.id}`;

    } catch (err) {
        console.error("Unexpected error:", err);
        alert("Something went wrong ❌");
    }
}


function viewFile(url, type) {

    const preview = document.getElementById("preview");
    preview.innerHTML = "";

    const closeBtn = document.createElement("span");
    closeBtn.innerText = "✖";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.color = "red";
    closeBtn.style.float = "right";
    closeBtn.style.fontSize = "18px";

    closeBtn.onclick = () => preview.innerHTML = "";
    preview.appendChild(closeBtn);

    // ✅ IMAGE
    if (type && type.startsWith("image")) {
        const img = document.createElement("img");
        img.src = url;
        img.style.width = "300px";
        img.style.marginTop = "10px";
        preview.appendChild(img);
    }

    // ✅ PDF
    else if (type === "application/pdf") {
        const iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.width = "100%";
        iframe.height = "400";
        iframe.style.marginTop = "10px";
        preview.appendChild(iframe);
    }

    // ❌ OTHER
    else {
        const msg = document.createElement("p");
        msg.innerText = "Preview not supported";
        msg.style.marginTop = "10px";
        preview.appendChild(msg);
    }
}

function downloadFile(url, name) {

    const confirmDownload = confirm("Download this file?");
    if (!confirmDownload) return;

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error("Download failed");
            return res.blob();
        })
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = name || "file";

            document.body.appendChild(a);
            a.click();

            a.remove();
            URL.revokeObjectURL(blobUrl);
        })
        .catch(err => {
            console.error(err);
            alert("Download failed ❌");
        });
}