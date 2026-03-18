from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .config import settings
from .database import engine, Base
from .deps import get_db
from .crud import jobs as crud_jobs
from .schemas import Job, JobCreate, JobUpdate
from . import models

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.API_TITLE, version=settings.API_VERSION)


@app.get("/")
def read_root():
    return {"message": "JobKaka API"}


@app.get("/jobs/", response_model=list[Job])
def read_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    jobs = crud_jobs.get_jobs(db, skip=skip, limit=limit)
    return jobs


@app.get("/jobs/search/{title}", response_model=list[Job])
def search_jobs(title: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    jobs = crud_jobs.get_jobs_by_title(db, title=title, skip=skip, limit=limit)
    return jobs


@app.get("/jobs/{job_id}", response_model=Job)
def read_job(job_id: int, db: Session = Depends(get_db)):
    db_job = crud_jobs.get_job(db, job_id=job_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job


@app.post("/jobs/", response_model=Job)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    return crud_jobs.create_job(db=db, job=job)


@app.put("/jobs/{job_id}", response_model=Job)
def update_job(job_id: int, job: JobUpdate, db: Session = Depends(get_db)):
    db_job = crud_jobs.update_job(db=db, job_id=job_id, job=job)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job


@app.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    db_job = crud_jobs.delete_job(db=db, job_id=job_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted"}
