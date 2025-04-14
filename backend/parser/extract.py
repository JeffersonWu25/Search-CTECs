from pypdf import PdfReader
from pathlib import Path

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from a PDF file
    """
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

print(extract_text_from_pdf("backend/data/test.pdf"))
