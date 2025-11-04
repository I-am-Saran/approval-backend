# main.py
import os
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, Body, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

# Optional: Supabase (falls back to in-memory if not configured)
SUPABASE_URL = "https://uxhmfriecraetlrpjrep.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aG1mcmllY3JhZXRscnBqcmVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkxMDMxMywiZXhwIjoyMDc3NDg2MzEzfQ.LMSMPnBZ6TOO3o3HjbZ8hEi6O2QfmALQwu6_i3D_HtY"
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception:
        supabase = None

app = FastAPI(title="Approval Workflow API")

# CORS: adjust origins to match your frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://approval-workflow-frontend.onrender.com",
        "https://workflow-lake-xi.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------
# Auth (simple demo token model so FE works as-is)
# --------------------------------------------------------------------
security = HTTPBearer()

class User(BaseModel):
    email: str
    role: str  # L0 | L1 | L2 | L3 | admin

TOKENS: Dict[str, User] = {}

def issue_token(user: User) -> str:
    token = f"tok_{user.role}_{user.email}_{int(datetime.utcnow().timestamp())}"
    TOKENS[token] = user
    return token

def get_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    user = TOKENS.get(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user

EMAIL_ROLE_MAP = {}  # put fixed mappings here if you want

def role_from_email(email: str) -> str:
    if email in EMAIL_ROLE_MAP:
        return EMAIL_ROLE_MAP[email]
    local = (email.split("@")[0] or "").lower()
    if local.startswith("admin"): return "admin"
    if local.startswith("l0"): return "L0"
    if local.startswith("l1"): return "L1"
    if local.startswith("l2"): return "L2"
    if local.startswith("l3"): return "L3"
    return "L1"

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

@app.post("/login", response_model=LoginResponse)
def login(email: str = Form(...), password: str = Form(...)):
    # demo: accept any pwd; infer role from email prefix (or map)
    user = User(email=email, role=role_from_email(email))
    return LoginResponse(access_token=issue_token(user), user=user)

# --------------------------------------------------------------------
# In-memory fallback (if Supabase not present)
# --------------------------------------------------------------------
class MemoryStore:
    def __init__(self):
        self.requests: Dict[int, Dict[str, Any]] = {}
        self.history: List[Dict[str, Any]] = []
        self.workflow_order: List[str] = ["L1", "L2", "L3"]
        self._auto_id = 1

    def get_workflow(self) -> List[str]:
        return list(self.workflow_order)

    def set_workflow(self, order: List[str]) -> List[str]:
        self.workflow_order = list(order)
        return list(self.workflow_order)

    def insert_request(self, rec: Dict[str, Any]) -> Dict[str, Any]:
        rid = self._auto_id
        self._auto_id += 1
        rec["id"] = rid
        self.requests[rid] = rec
        return rec

    def update_request(self, rid: int, updates: Dict[str, Any]) -> Dict[str, Any]:
        if rid not in self.requests:
            raise KeyError("not found")
        self.requests[rid].update(updates)
        return self.requests[rid]

    def get_request(self, rid: int) -> Optional[Dict[str, Any]]:
        return self.requests.get(rid)

    def list_requests(self) -> List[Dict[str, Any]]:
        return list(self.requests.values())

    def add_history(self, h: Dict[str, Any]) -> None:
        self.history.append(dict(h))

MEM = MemoryStore()

def now_iso() -> str:
    return datetime.utcnow().isoformat()

def require_role(user: User, allowed: List[str]):
    if user.role.lower() not in [r.lower() for r in allowed]:
        raise HTTPException(status_code=403, detail="Insufficient permission")

# --------------------------------------------------------------------
# Workflow persistence
# --------------------------------------------------------------------
def load_workflow() -> List[str]:
    if supabase:
        res = supabase.table("workflow_config").select("*").eq("id", 1).execute()
        if res.data:
            return res.data[0].get("workflow_order") or ["L1", "L2", "L3"]
        supabase.table("workflow_config").insert({"id": 1, "workflow_order": ["L1", "L2", "L3"]}).execute()
        return ["L1", "L2", "L3"]
    return MEM.get_workflow()

def save_workflow(order: List[str]) -> List[str]:
    if not order or not all(isinstance(r, str) for r in order):
        raise HTTPException(status_code=400, detail="workflow_order must be a non-empty array of strings")
    if supabase:
        res = supabase.table("workflow_config").upsert({"id": 1, "workflow_order": order}).execute()
        return (res.data[0].get("workflow_order") if res.data else order)
    return MEM.set_workflow(order)

# --------------------------------------------------------------------
# Schemas
# --------------------------------------------------------------------
class CreateRequest(BaseModel):
    title: str
    description: str
    requester_email: str

class ActionBody(BaseModel):
    action: str  # "approve" | "reject"
    comment: Optional[str] = None

# --------------------------------------------------------------------
# Admin: workflow
# --------------------------------------------------------------------
@app.get("/api/workflow")
def get_workflow(user: User = Depends(get_user)):
    return {"workflow_order": load_workflow()}

@app.put("/api/workflow")
def set_workflow(payload: Dict[str, Any] = Body(...), user: User = Depends(get_user)):
    require_role(user, ["admin"])
    order = payload.get("workflow_order")
    return {"workflow_order": save_workflow(order)}

# --------------------------------------------------------------------
# Requests
# --------------------------------------------------------------------
def insert_request(rec: Dict[str, Any]) -> Dict[str, Any]:
    if supabase:
        res = supabase.table("approval_requests").insert(rec).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to insert request")
        return res.data[0]
    return MEM.insert_request(rec)

def update_request(rid: int, updates: Dict[str, Any]) -> Dict[str, Any]:
    if supabase:
        res = supabase.table("approval_requests").update(updates).eq("id", rid).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Request not found")
        return res.data[0]
    try:
        return MEM.update_request(rid, updates)
    except KeyError:
        raise HTTPException(status_code=404, detail="Request not found")

def fetch_request(rid: int) -> Dict[str, Any]:
    if supabase:
        res = supabase.table("approval_requests").select("*").eq("id", rid).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Request not found")
        return res.data
    r = MEM.get_request(rid)
    if not r:
        raise HTTPException(status_code=404, detail="Request not found")
    return r

def list_pending() -> List[Dict[str, Any]]:
    if supabase:
        res = supabase.table("approval_requests").select("*").eq("status", "pending").execute()
        return res.data or []
    return [r for r in MEM.list_requests() if r.get("status") == "pending"]

def add_history(entry: Dict[str, Any]) -> None:
    if supabase:
        supabase.table("approval_history").insert(entry).execute()
    else:
        MEM.add_history(entry)

@app.post("/api/requests")
def create_request(req: CreateRequest, user: User = Depends(get_user)):
    require_role(user, ["L1", "admin"])
    wf = load_workflow()
    # If L1 is first, start approvals at next stage (L2)
    initial_stage = 1 if wf and wf[0].upper() == "L1" else 0
    rec = {
        "title": req.title,
        "description": req.description,
        "requester_email": req.requester_email,
        "status": "pending",
        "current_stage": initial_stage,
        "workflow_snapshot": wf,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    created = insert_request(rec)
    add_history({
        "request_id": created["id"],
        "stage": 0,
        "role": "L1",
        "action": "created",
        "actor_email": user.email,
        "timestamp": now_iso(),
    })
    return created

@app.get("/api/requests/my-requests")
def my_requests(user: User = Depends(get_user)):
    require_role(user, ["L1", "admin"])
    if supabase:
        res = supabase.table("approval_requests").select("*").eq("requester_email", user.email).execute()
        items = res.data or []
    else:
        items = [r for r in MEM.list_requests() if r.get("requester_email") == user.email]
    return sorted(items, key=lambda x: x.get("updated_at") or x.get("created_at") or "", reverse=True)

@app.get("/api/requests/pending/{role}")
def pending_for_role(role: str, user: User = Depends(get_user)):
    role_u = role.upper()
    if user.role.lower() != "admin" and user.role.upper() != role_u:
        raise HTTPException(status_code=403, detail="Cannot view another role's inbox")
    items = list_pending()
    out = []
    for r in items:
        snap = r.get("workflow_snapshot") or []
        idx = r.get("current_stage", 0)
        if 0 <= idx < len(snap) and snap[idx].upper() == role_u:
            out.append(r)
    return sorted(out, key=lambda x: x.get("updated_at") or x.get("created_at") or "")

@app.post("/api/requests/{request_id}/action")
def request_action(request_id: int, body: ActionBody, user: User = Depends(get_user)):
    if body.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")
    rec = fetch_request(request_id)
    if rec["status"] not in ("pending", "changes_requested"):
        raise HTTPException(status_code=400, detail=f"Request is {rec['status']}; no action allowed")

    snap: List[str] = rec.get("workflow_snapshot") or []
    idx: int = rec.get("current_stage", 0)
    current_role = snap[idx].upper() if 0 <= idx < len(snap) else None

    if user.role.lower() != "admin":
        if not current_role or current_role != user.role.upper():
            raise HTTPException(status_code=403, detail=f"Current stage is {current_role}; {user.role} cannot act")

    if body.action == "approve":
        next_idx = idx + 1
        if next_idx >= len(snap):
            updates = {"status": "approved", "current_stage": idx, "updated_at": now_iso()}
        else:
            updates = {"status": "pending", "current_stage": next_idx, "updated_at": now_iso()}
        updated = update_request(request_id, updates)
        add_history({
            "request_id": request_id, "stage": idx, "role": current_role,
            "action": "approved", "actor_email": user.email, "comment": body.comment, "timestamp": now_iso(),
        })
        return updated

    # reject -> go back one stage
    prev_idx = max(0, idx - 1)
    updated = update_request(request_id, {"status": "pending", "current_stage": prev_idx, "updated_at": now_iso()})
    add_history({
        "request_id": request_id, "stage": idx, "role": current_role,
        "action": "rejected", "actor_email": user.email, "comment": body.comment, "timestamp": now_iso(),
    })
    return updated

@app.get("/api/requests/{request_id}")
def view_request(request_id: int, user: User = Depends(get_user)):
    rec = fetch_request(request_id)
    if user.role.upper() == "L1" and rec.get("requester_email") != user.email:
        raise HTTPException(status_code=403, detail="L1 can only view their own requests")
    return rec

# --------------------------------------------------------------------
# L0 dashboard
# --------------------------------------------------------------------
@app.get("/api/dashboard")
def dashboard(user: User = Depends(get_user)):
    require_role(user, ["L0", "L1", "L2", "L3", "admin"])
    if supabase:
        res = supabase.table("approval_requests").select("*").execute()
        items = res.data or []
    else:
        items = MEM.list_requests()

    total = len(items)
    approved = len([r for r in items if r.get("status") == "approved"])
    rejected = len([r for r in items if r.get("status") == "rejected"])
    pending = len([r for r in items if r.get("status") == "pending"])
    changes_requested = len([r for r in items if r.get("status") == "changes_requested"])

    recent = sorted(items, key=lambda x: x.get("updated_at") or x.get("created_at") or "", reverse=True)[:20]
    return {"summary": {"total": total, "approved": approved, "rejected": rejected, "pending": pending, "changes_requested": changes_requested}, "recent": recent}
