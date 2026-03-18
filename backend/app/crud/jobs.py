from sqlalchemy.orm import Session
from .. import models, schemas


def get_job(db: Session, job_id: int):
    return db.query(models.Job).filter(models.Job.id == job_id).first()


def get_jobs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Job).offset(skip).limit(limit).all()


def get_jobs_by_title(db: Session, title: str, skip: int = 0, limit: int = 100):
    return db.query(models.Job).filter(models.Job.title.contains(title)).offset(skip).limit(limit).all()


def create_job(db: Session, job: schemas.JobCreate):
    db_job = models.Job(**job.dict())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


def update_job(db: Session, job_id: int, job: schemas.JobUpdate):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job:
        return None
    
    update_data = job.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_job, field, value)
    
    db.commit()
    db.refresh(db_job)
    return db_job


def delete_job(db: Session, job_id: int):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if db_job:
        db.delete(db_job)
        db.commit()
    return db_job
