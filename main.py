from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import PyPDF2
import io

app = FastAPI()

# Allow frontend on 5500 to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://127.0.0.1:5500"] for stricter CORS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Function to extract text from PDF
def extract_text_from_pdf(file_content: bytes):
    reader = PyPDF2.PdfReader(io.BytesIO(file_content))
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text
    return text

# Endpoint to match and rank multiple resumes
@app.post("/match")
async def match_resumes(
    job_description: str = Form(...),
    resumes: List[UploadFile] = File(...)
):
    resume_texts = []
    file_names = []

    for resume in resumes:
        # Only allow PDFs
        if not resume.filename.lower().endswith(".pdf"):
            return {"error": f"Unsupported file format: {resume.filename}. Only PDF allowed."}

        content = await resume.read()
        text = extract_text_from_pdf(content)
        resume_texts.append(text)
        file_names.append(resume.filename)

    # Create TF-IDF vectors
    documents = [job_description] + resume_texts
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(documents)

    # Compute similarity with job description (first document)
    scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

    # Build ranked list
    results = []
    for i in range(len(scores)):
        results.append({
            "filename": file_names[i],
            "score": round(scores[i] * 100, 2)
        })

    # Sort descending by score
    ranked_results = sorted(results, key=lambda x: x["score"], reverse=True)

    return {"ranked_resumes": ranked_results}