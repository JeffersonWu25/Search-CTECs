# CTEC Search – Northwestern Course Evaluation Explorer

CTEC Search is a web platform that helps Northwestern University students explore and compare course reviews (CTECs) to make more informed course selections. Users can search by course, professor, or degree requirement, and view historical data including ratings, workload, and demographics.

---

## 🔧 Tech Stack

### 🖥️ Frontend
- **React** – For building a dynamic and responsive UI
- **TailwindCSS** – Utility-first CSS framework for clean, fast styling
- **React Router** – For page navigation (e.g., homepage, course detail)
- **Recharts** – Lightweight React charting library for visualizing course data

### 🌐 Backend / Database
- **Supabase**
  - PostgreSQL database for storing CTEC data
  - Built-in RESTful API for fetching data
  - Authentication (optional for user features)

### 📦 Data Parsing (ETL)
- **Python** – For parsing and cleaning CTEC data
- **PyPDF2** – PDF text extractor to parse course reviews from university-issued PDFs
- Output: Structured JSON or CSV, uploaded into Supabase

### ☁️ Hosting
- **Frontend**: [Vercel](https://vercel.com) – Continuous deployment for React apps
- **Backend/DB**: Hosted on [Supabase](https://supabase.com)

---

## 🚀 Features

- 🔍 Search by course title, code, or instructor
- 📊 View course and instructor ratings, workload, and demographic data
- 🎯 Filter by quarter, requirement type, or school (WCAS, McCormick, etc.)
- 📈 Visualize trends using charts (Recharts)
- 🗂 Clickable course cards leading to detailed CTEC breakdowns

---

## 🛠️ Getting Started

### 1. Clone the Repo
```bash
git clone https://github.com/your-username/ctec-search.git
cd Search-CTEC
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend (Supabase)
- Create a [Supabase](https://supabase.com) project
- Set up tables using the schema (see `/backend/schema.sql`)
- Store your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in a `.env` file in `/frontend`

### 4. Data Parsing
```bash
cd backend
pip install -r requirements.txt
python parse_ctecs.py  # Parses PDFs and outputs JSON
```

---

## 📁 Folder Structure

```
.
├── frontend/           # React frontend (Vercel-hosted)
│   ├── components/
│   ├── pages/
│   ├── styles/
├── backend/            # Python data parser and Supabase scripts
│   ├── parse_ctecs.py
│   ├── schema.sql
│   └── data/
└── README.md
```

---

## 🧠 Future Improvements
- Add keyword search from student comments (NLP sentiment/tags)
- User accounts for saving favorite courses
- Instructor comparison view
- Dark mode toggle

---