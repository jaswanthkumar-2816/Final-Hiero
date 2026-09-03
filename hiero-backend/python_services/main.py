import os
import sys
import json
import sqlite3
from typing import Optional, List, Dict, Any
from datetime import datetime

# Define database file path
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "jobs.db")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Opportunities table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS opportunities (
            id TEXT PRIMARY KEY,
            company_id TEXT,
            company_name TEXT,
            logo_url TEXT,
            type TEXT,
            title TEXT,
            department TEXT,
            description TEXT,
            required_skills TEXT,
            preferred_skills TEXT,
            eligibility TEXT,
            location TEXT,
            work_mode TEXT,
            employment_type TEXT,
            salary TEXT,
            deadline TEXT,
            status TEXT,
            applicants_count INTEGER DEFAULT 0,
            shortlisted_count INTEGER DEFAULT 0,
            created_at TEXT
        )
    ''')
    
    # Companies table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS companies (
            id TEXT PRIMARY KEY,
            name TEXT,
            logo_url TEXT,
            location TEXT,
            description TEXT,
            website TEXT
        )
    ''')
    
    # Applications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS applications (
            id TEXT PRIMARY KEY,
            opportunity_id TEXT,
            company_name TEXT,
            student_id TEXT,
            student_name TEXT,
            email TEXT,
            status TEXT,
            match_score INTEGER,
            applied_at TEXT,
            resume_url TEXT,
            skills_match TEXT
        )
    ''')
    
    conn.commit()
    
    # Check if empty, seed default opportunity
    cursor.execute("SELECT COUNT(*) FROM opportunities")
    if cursor.fetchone()[0] == 0:
        seed_opportunities = [
            (
                "opp-demo-1",
                "comp-acme-tech",
                "Acme AI Systems",
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
                "internship",
                "Full Stack & AI Engineer Intern",
                "AI & Engineering",
                "Join Acme AI Systems to build scalable generative AI tools and full-stack web applications for enterprise clients.",
                json.dumps(["Python", "React", "TypeScript", "SQL"]),
                json.dumps(["PyTorch", "Docker"]),
                "B.Tech / B.E / M.Tech in CS or related fields",
                "Bangalore, India (Hybrid)",
                "hybrid",
                "Internship",
                "₹35,000 / month",
                "2026-11-30",
                "active",
                14,
                3,
                datetime.now().strftime("%Y-%m-%d")
            ),
            (
                "opp-demo-2",
                "comp-technova",
                "TechNova AI",
                "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=80",
                "full-time",
                "Junior Machine Learning Engineer",
                "Core AI",
                "Work on large language models and real-time recommendation engines for global users.",
                json.dumps(["Python", "PyTorch", "FastAPI", "Docker"]),
                json.dumps(["Kubernetes", "AWS"]),
                "B.Tech/M.Tech graduating batch 2025/2026",
                "Hyderabad, India (Remote)",
                "remote",
                "Full-time",
                "₹12,00,000 / annum",
                "2026-12-15",
                "active",
                28,
                5,
                datetime.now().strftime("%Y-%m-%d")
            )
        ]
        cursor.executemany('''
            INSERT INTO opportunities (
                id, company_id, company_name, logo_url, type, title, department, description,
                required_skills, preferred_skills, eligibility, location, work_mode,
                employment_type, salary, deadline, status, applicants_count, shortlisted_count, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_opportunities)
        
        cursor.execute("INSERT OR IGNORE INTO companies VALUES (?, ?, ?, ?, ?, ?)", (
            "comp-acme-tech", "Acme AI Systems", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
            "Bangalore, India", "Pioneering next-gen AI automation and intelligence engines.", "https://acme.ai"
        ))
        cursor.execute("INSERT OR IGNORE INTO companies VALUES (?, ?, ?, ?, ?, ?)", (
            "comp-technova", "TechNova AI", "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=80",
            "Hyderabad, India", "Building intelligent enterprise web & machine learning platforms.", "https://technova.io"
        ))
        conn.commit()
    
    conn.close()

# Initialize DB at startup
init_db()

# DB Query Helpers
def db_get_opportunities(company_id=None, job_type=None):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    query = "SELECT * FROM opportunities WHERE status = 'active'"
    params = []
    if company_id:
        query += " AND company_id = ?"
        params.append(company_id)
    if job_type:
        query += " AND type = ?"
        params.append(job_type)
    query += " ORDER BY created_at DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    opps = []
    for r in rows:
        d = dict(r)
        d['requiredSkills'] = json.loads(d['required_skills']) if d['required_skills'] else []
        d['preferredSkills'] = json.loads(d['preferred_skills']) if d['preferred_skills'] else []
        d['companyId'] = d['company_id']
        d['companyName'] = d['company_name']
        d['logoUrl'] = d['logo_url']
        d['workMode'] = d['work_mode']
        d['employmentType'] = d['employment_type']
        d['applicantsCount'] = d['applicants_count']
        d['shortlistedCount'] = d['shortlisted_count']
        d['createdAt'] = d['created_at']
        opps.append(d)
        
    cursor.execute("SELECT * FROM companies")
    comps = [dict(c) for c in cursor.fetchall()]
    conn.close()
    return {"success": True, "opportunities": opps, "companies": comps}

def db_add_opportunity(data):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    opp_id = data.get("id") or f"opp-{int(datetime.now().timestamp()*1000)}"
    company_name = data.get("companyName") or data.get("company_name") or "Verified HR Partner"
    company_id = data.get("companyId") or f"comp-{company_name.lower().replace(' ', '-')}"
    logo_url = data.get("logoUrl") or data.get("logo_url") or ""
    job_type = data.get("type") or "internship"
    title = data.get("title") or "Software Engineer Intern"
    department = data.get("department") or "Engineering"
    description = data.get("description") or ""
    
    req_skills = data.get("requiredSkills") or ["Python", "JavaScript"]
    pref_skills = data.get("preferredSkills") or []
    if isinstance(req_skills, list):
        req_skills_str = json.dumps(req_skills)
    else:
        req_skills_str = json.dumps([req_skills])
        
    if isinstance(pref_skills, list):
        pref_skills_str = json.dumps(pref_skills)
    else:
        pref_skills_str = json.dumps([pref_skills])
        
    eligibility = data.get("eligibility") or "B.Tech / BE / MCA"
    location = data.get("location") or "India (Hybrid)"
    work_mode = data.get("workMode") or "hybrid"
    emp_type = data.get("employmentType") or ("Internship" if job_type == "internship" else "Full-time")
    salary = data.get("salary") or "Competitive"
    deadline = data.get("deadline") or "2026-12-31"
    created_at = datetime.now().strftime("%Y-%m-%d")
    
    cursor.execute('''
        INSERT OR REPLACE INTO opportunities (
            id, company_id, company_name, logo_url, type, title, department, description,
            required_skills, preferred_skills, eligibility, location, work_mode,
            employment_type, salary, deadline, status, applicants_count, shortlisted_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, 0, ?)
    ''', (
        opp_id, company_id, company_name, logo_url, job_type, title, department, description,
        req_skills_str, pref_skills_str, eligibility, location, work_mode,
        emp_type, salary, deadline, created_at
    ))
    
    # Save company
    cursor.execute('''
        INSERT OR IGNORE INTO companies (id, name, logo_url, location, description, website)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (company_id, company_name, logo_url, location, f"HR Partner posting on HIERO.", ""))
    
    conn.commit()
    conn.close()
    
    new_opp = {
        "id": opp_id,
        "companyId": company_id,
        "companyName": company_name,
        "logoUrl": logo_url,
        "type": job_type,
        "title": title,
        "department": department,
        "description": description,
        "requiredSkills": req_skills if isinstance(req_skills, list) else [req_skills],
        "preferredSkills": pref_skills if isinstance(pref_skills, list) else [pref_skills],
        "eligibility": eligibility,
        "location": location,
        "workMode": work_mode,
        "employmentType": emp_type,
        "salary": salary,
        "deadline": deadline,
        "status": "active",
        "applicantsCount": 0,
        "createdAt": created_at
    }
    return {"success": True, "opportunity": new_opp}

def db_add_application(data):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    app_id = f"app-{int(datetime.now().timestamp()*1000)}"
    opp_id = data.get("opportunityId") or data.get("jobId") or "opp-demo-1"
    company_name = data.get("companyName") or "Verified HR Partner"
    student_id = data.get("studentId") or "cand-1"
    student_name = data.get("studentName") or "Jaswanth Kumar"
    email = data.get("email") or "candidate@hiero.in"
    match_score = data.get("matchScore") or 92
    applied_at = datetime.now().isoformat()
    resume_url = data.get("resumeUrl") or "/resumes/jaswanth_resume.pdf"
    skills_match = json.dumps(data.get("skillsMatch") or {"matched": ["Python", "React"], "missing": []})
    
    cursor.execute('''
        INSERT INTO applications (
            id, opportunity_id, company_name, student_id, student_name, email, status, match_score, applied_at, resume_url, skills_match
        ) VALUES (?, ?, ?, ?, ?, ?, 'applied', ?, ?, ?, ?)
    ''', (app_id, opp_id, company_name, student_id, student_name, email, match_score, applied_at, resume_url, skills_match))
    
    cursor.execute("UPDATE opportunities SET applicants_count = applicants_count + 1 WHERE id = ?", (opp_id,))
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "application": {
            "id": app_id,
            "opportunityId": opp_id,
            "companyName": company_name,
            "studentName": student_name,
            "status": "applied",
            "matchScore": match_score,
            "appliedAt": applied_at
        }
    }

def db_get_applications():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications ORDER BY applied_at DESC")
    rows = cursor.fetchall()
    apps = [dict(r) for r in rows]
    conn.close()
    return {"success": True, "applications": apps}


# -------------------------------------------------------------
# Try running FastAPI with uvicorn; Fallback to http.server
# -------------------------------------------------------------
try:
    from fastapi import FastAPI, Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    import uvicorn

    app = FastAPI(
        title="HIERO Multi-Portal Unified Python Backend",
        description="Connects Connect Portal (2004), Companies Gateway (2816), and Academia Portal (2410)",
        version="1.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health():
        return {
            "status": "healthy",
            "service": "HIERO Unified Python Backend Engine",
            "portals_connected": ["Connect Portal (2004)", "Companies Gateway (2816)", "Academia Portal (2410)"]
        }

    @app.get("/api/opportunities")
    @app.get("/api/jobs")
    def get_opportunities(companyId: Optional[str] = None, type: Optional[str] = None):
        return db_get_opportunities(company_id=companyId, job_type=type)

    @app.post("/api/opportunities")
    @app.post("/api/jobs")
    async def create_opportunity(request: Request):
        body = await request.json()
        return db_add_opportunity(body)

    @app.post("/api/opportunities/apply")
    @app.post("/api/applications")
    async def apply_opportunity(request: Request):
        body = await request.json()
        return db_add_application(body)

    @app.get("/api/applications")
    def get_applications():
        return db_get_applications()

    if __name__ == "__main__":
        port = int(os.environ.get("PORT", 5050))
        print(f"🚀 [HIERO Python FastAPI Backend] Running on http://localhost:{port}")
        uvicorn.run(app, host="0.0.0.0", port=port)

except ImportError:
    print("⚠️ FastAPI/Uvicorn not found. Launching standard library Python HTTP server...")
    from http.server import HTTPServer, BaseHTTPRequestHandler
    
    class FallbackHTTPHandler(BaseHTTPRequestHandler):
        def _set_cors(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        def do_OPTIONS(self):
            self.send_response(200)
            self._set_cors()
            self.end_headers()

        def do_GET(self):
            url = self.path.split('?')[0]
            if url in ['/api/health']:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._set_cors()
                self.end_headers()
                res = {
                    "status": "healthy",
                    "service": "HIERO Unified Python Backend Engine (HTTP Fallback)",
                    "portals_connected": ["Connect Portal (2004)", "Companies Gateway (2816)", "Academia Portal (2410)"]
                }
                self.wfile.write(json.dumps(res).encode('utf-8'))
            elif url in ['/api/opportunities', '/api/jobs']:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._set_cors()
                self.end_headers()
                res = db_get_opportunities()
                self.wfile.write(json.dumps(res).encode('utf-8'))
            elif url in ['/api/applications']:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._set_cors()
                self.end_headers()
                res = db_get_applications()
                self.wfile.write(json.dumps(res).encode('utf-8'))
            else:
                self.send_response(404)
                self.end_headers()

        def do_POST(self):
            url = self.path.split('?')[0]
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length).decode('utf-8')) if length > 0 else {}
            
            if url in ['/api/opportunities', '/api/jobs']:
                self.send_response(201)
                self.send_header('Content-Type', 'application/json')
                self._set_cors()
                self.end_headers()
                res = db_add_opportunity(body)
                self.wfile.write(json.dumps(res).encode('utf-8'))
            elif url in ['/api/opportunities/apply', '/api/applications']:
                self.send_response(201)
                self.send_header('Content-Type', 'application/json')
                self._set_cors()
                self.end_headers()
                res = db_add_application(body)
                self.wfile.write(json.dumps(res).encode('utf-8'))
            else:
                self.send_response(404)
                self.end_headers()

    if __name__ == '__main__':
        port = int(os.environ.get("PORT", 5050))
        server = HTTPServer(('0.0.0.0', port), FallbackHTTPHandler)
        print(f"🚀 [HIERO Python Standard Backend] Running on http://localhost:{port}")
        server.serve_forever()
