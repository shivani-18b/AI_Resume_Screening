async function analyze() {

    const jobDescription = document.getElementById("jobDescription").value;
    const resumeFiles = document.getElementById("resume").files;
    const resultDiv = document.getElementById("result");
    const dashboard = document.getElementById("dashboard");

    resultDiv.innerHTML = "";
    dashboard.style.display = "none";

    // Validation
    if (!jobDescription.trim()) {
        resultDiv.innerHTML = "<p style='color:red;'>Please enter a Job Description.</p>";
        return;
    }

    if (resumeFiles.length === 0) {
        resultDiv.innerHTML = "<p style='color:red;'>Please upload at least one PDF resume.</p>";
        return;
    }

    let formData = new FormData();
    formData.append("job_description", jobDescription);

    for (let i = 0; i < resumeFiles.length; i++) {
        formData.append("resumes", resumeFiles[i]);
    }

    try {
        resultDiv.innerHTML = "<p style='color:#00ffff;'>⚡ Analyzing resumes...</p>";

        const response = await fetch("https://ai-resume-screening-phst.onrender.com", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Backend error: " + response.status);
        }

        const data = await response.json();

        if (!data.ranked_resumes || data.ranked_resumes.length === 0) {
            resultDiv.innerHTML = "<p style='color:orange;'>No results found.</p>";
            return;
        }

        // Show dashboard
        dashboard.style.display = "block";
        resultDiv.innerHTML = "";

        // Sort highest first (extra safety)
        data.ranked_resumes.sort((a, b) => b.score - a.score);

        data.ranked_resumes.forEach((resume, index) => {

            const card = document.createElement("div");
            card.classList.add("rank-card");


            card.innerHTML = `
                <div class="rank-left">
                    <div class="rank-number">#${index + 1}</div>
                    <div class="resume-name">${resume.filename}</div>
                </div>
                <div class="score">${resume.score.toFixed(2)}%</div>
            `;

            resultDiv.appendChild(card);
        });

    } catch (error) {
        console.error("Fetch error:", error);
        resultDiv.innerHTML = "<p style='color:red;'>Failed to connect to backend.</p>";
    }
}
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("resume");
const fileList = document.getElementById("fileList");

// Prevent default drag behavior
["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    uploadArea.addEventListener(eventName, e => e.preventDefault());
    uploadArea.addEventListener(eventName, e => e.stopPropagation());
});

// Highlight on drag
uploadArea.addEventListener("dragover", () => {
    uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
});

// Handle drop
uploadArea.addEventListener("drop", (e) => {
    uploadArea.classList.remove("dragover");

    const files = e.dataTransfer.files;
    fileInput.files = files;

    displayFileNames(files);
});

// Show selected file names
fileInput.addEventListener("change", () => {
    displayFileNames(fileInput.files);
});

function displayFileNames(files) {
    if (files.length === 0) {
        fileList.innerHTML = "";
        return;
    }

    const text = files.length === 1 
        ? "1 file selected" 
        : `${files.length} files selected`;

    fileList.innerHTML = `📂 ${text}`;

}
